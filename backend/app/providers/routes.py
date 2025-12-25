from flask import request, jsonify
from app.providers import providers_bp
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from app.models.user import User
from app.models.provider import Provider
from app.models.customer import Customer
from app.models.rating import Rating
from app.models.job import Job
from app.models.offer import Offer
from app.models.credit_transaction import CreditTransaction
from app.models.provider_credit_transaction import ProviderCreditTransaction
from app.models.contact_view import ContactView
from app.utils.decorators import provider_required, customer_required, get_user_id_from_jwt
import math


def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula"""
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c


def calculate_credits_per_text(rating):
    """Calculate credits needed per text message based on provider rating"""
    if rating is None or rating == 0.0:
        return 6  # NA counts as 6 credits
    elif rating >= 4.5:
        return 6
    elif rating >= 4.0:
        return 4
    elif rating >= 3.0:
        return 2.5
    else:
        return 1


def calculate_credits_for_call(rating):
    """Calculate credits needed to reveal contact (call) based on provider rating"""
    if rating is None or rating == 0.0:
        return 20  # NA counts as 20 credits
    elif rating >= 4.5:
        return 20
    elif rating >= 4.0:
        return 15
    elif rating >= 3.0:
        return 9
    else:
        return 5


def calculate_provider_credits_for_contact_view(rating):
    """Calculate provider credits earned when customer views contact based on provider rating"""
    if rating is None or rating == 0.0:
        return 12.0  # NA counts as 12.0 credits
    elif rating >= 4.5:
        return 12.0
    elif rating >= 4.0:
        return 9.0
    elif rating >= 3.0:
        return 7.0
    else:
        return 5.0


@providers_bp.route('/search', methods=['GET'])
@jwt_required()
def search_providers():
    """Search providers with filters"""
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    user_role = current_user.get('role')
    
    category = request.args.get('category')
    min_rating = request.args.get('min_rating', type=float)
    max_price = request.args.get('max_price', type=float)
    available_only = request.args.get('available_only', 'false').lower() == 'true'
    verified_only = request.args.get('verified_only', 'false').lower() == 'true'
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    radius = request.args.get('radius', type=float, default=50)  # km
    name = request.args.get('name', '').strip()
    location = request.args.get('location', '').strip()
    
    # Start with all providers (not just verified)
    query = Provider.query
    
    # CRITICAL: For customer-facing queries, only show available providers
    # Providers and admins can see all providers, but customers can only see available ones
    if user_role == 'customer':
        query = query.filter_by(is_available=True)
    elif available_only:
        # If explicitly requested, filter by availability
        query = query.filter_by(is_available=True)
    
    # Only filter by verified if explicitly requested
    if verified_only:
        query = query.filter_by(verified=True)
    
    # Name search (case-insensitive partial match)
    if name:
        query = query.filter(Provider.name.ilike(f'%{name}%'))
    
    # Location search (searches in service_area field)
    if location:
        query = query.filter(Provider.service_area.ilike(f'%{location}%'))
    
    if category:
        query = query.filter_by(category=category)
    if min_rating:
        query = query.filter(Provider.rating_avg >= min_rating)
    if max_price:
        query = query.filter(Provider.hourly_rate <= max_price)
    
    providers = query.all()
    
    # Calculate distance if location provided and add credits_per_text
    if lat and lng:
        providers_with_distance = []
        for provider in providers:
            provider_data = provider.to_dict(include_contact=True)
            provider_data['credits_per_text'] = calculate_credits_per_text(provider.rating_avg)
            providers_with_distance.append(provider_data)
        providers_list = providers_with_distance
    else:
        providers_list = []
        for provider in providers:
            provider_data = provider.to_dict(include_contact=True)
            provider_data['credits_per_text'] = calculate_credits_per_text(provider.rating_avg)
            providers_list.append(provider_data)
    
    return jsonify({
        'providers': providers_list,
        'count': len(providers_list)
    }), 200


@providers_bp.route('/<int:provider_id>', methods=['GET'])
@jwt_required()
def get_provider_details(provider_id):
    """Get provider details with reviews"""
    current_user = get_jwt_identity()
    user_role = current_user.get('role')
    
    provider = Provider.query.get_or_404(provider_id)
    
    # CRITICAL: Customers cannot view details of unavailable providers
    if user_role == 'customer' and not provider.is_available:
        return jsonify({'error': 'Provider is not available'}), 404
    
    # Return public provider profile data
    provider_data = provider.to_dict(include_contact=True)
    
    # Get recent reviews (limit to 10 most recent)
    reviews = Rating.query.filter_by(provider_id=provider_id).order_by(Rating.created_at.desc()).limit(10).all()
    provider_data['reviews'] = [review.to_dict(include_customer_name=True) for review in reviews]
    
    # Get rating statistics
    all_ratings = Rating.query.filter_by(provider_id=provider_id).all()
    rating_stats = {
        'total': len(all_ratings),
        'average': provider.rating_avg,
        'breakdown': {str(i): 0 for i in range(1, 6)}
    }
    for rating in all_ratings:
        rating_stats['breakdown'][str(rating.rating)] += 1
    
    provider_data['rating_stats'] = rating_stats
    
    return jsonify(provider_data), 200


@providers_bp.route('/nearby', methods=['GET'])
@jwt_required()
def get_nearby_providers():
    """Get nearby providers based on lat/lng"""
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    radius = request.args.get('radius', type=float, default=50)  # km
    category = request.args.get('category')
    
    if not lat or not lng:
        return jsonify({'error': 'Latitude and longitude are required'}), 400
    
    query = Provider.query.filter_by(verified=True, is_available=True)
    
    if category:
        query = query.filter_by(category=category)
    
    providers = query.all()
    
    # Calculate distance for each provider
    # Note: In a real app, you'd use geospatial queries or store provider locations
    nearby_providers = []
    for provider in providers:
        # For now, we'll include all providers since we don't have provider locations stored
        # In production, you'd calculate actual distance
        provider_data = provider.to_dict(include_contact=False)
        provider_data['distance_km'] = None  # Would calculate from provider location
        nearby_providers.append(provider_data)
    
    return jsonify({
        'providers': nearby_providers,
        'count': len(nearby_providers)
    }), 200


# Provider-specific routes (for providers managing their own profile)
@providers_bp.route('/profile', methods=['GET'], endpoint='get_my_profile')
@jwt_required()
@provider_required
def get_my_profile():
    """Get provider's own profile"""
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    if not user.provider:
        return jsonify({'error': 'Provider profile not found'}), 404
    
    provider_data = user.provider.to_dict(include_contact=True)
    return jsonify(provider_data), 200


@providers_bp.route('/profile', methods=['PUT'], endpoint='update_my_profile')
@jwt_required()
@provider_required
def update_my_profile():
    """Update provider's own profile"""
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    if not user.provider:
        return jsonify({'error': 'Provider profile not found'}), 404
    
    data = request.get_json()
    provider = user.provider
    
    try:
        if 'name' in data:
            provider.name = data['name']
        if 'phone' in data:
            provider.phone = data['phone']
        if 'description' in data:
            provider.description = data['description']
        if 'service_area' in data:
            provider.service_area = data['service_area']
        if 'hourly_rate' in data:
            provider.hourly_rate = data['hourly_rate']
        if 'category' in data:
            provider.category = data['category']
        
        db.session.commit()
        return jsonify({'message': 'Profile updated', 'profile': provider.to_dict(include_contact=True)}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@providers_bp.route('/availability', methods=['PUT', 'POST'], endpoint='update_availability')
@jwt_required()
@provider_required
def update_availability():
    """Update provider availability status"""
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    if not user.provider:
        return jsonify({'error': 'Provider profile not found'}), 404
    
    data = request.get_json()
    is_available = data.get('is_available', True)
    
    # Ensure boolean type
    if isinstance(is_available, str):
        is_available = is_available.lower() in ('true', '1', 'yes')
    else:
        is_available = bool(is_available)
    
    try:
        user.provider.is_available = is_available
        db.session.commit()
        return jsonify({
            'message': 'Availability updated',
            'is_available': user.provider.is_available
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@providers_bp.route('/stats', methods=['GET'], endpoint='get_stats')
@jwt_required()
@provider_required
def get_stats():
    """Get provider statistics"""
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    if not user.provider:
        return jsonify({'error': 'Provider profile not found'}), 404
    
    provider = user.provider
    
    # Get booking statistics
    total_bookings = Booking.query.filter_by(provider_id=provider.id).count()
    pending_bookings = Booking.query.filter_by(provider_id=provider.id, status='pending').count()
    confirmed_bookings = Booking.query.filter_by(provider_id=provider.id, status='confirmed').count()
    in_progress_bookings = Booking.query.filter_by(provider_id=provider.id, status='in_progress').count()
    completed_bookings = Booking.query.filter_by(provider_id=provider.id, status='completed').count()
    
    stats = {
        'total_bookings': total_bookings,
        'pending': pending_bookings,
        'confirmed': confirmed_bookings,
        'in_progress': in_progress_bookings,
        'completed': completed_bookings,
        'rating_avg': provider.rating_avg,
        'rating_count': provider.rating_count,
        'is_available': provider.is_available,
        'verified': provider.verified
    }
    
    return jsonify(stats), 200


@providers_bp.route('/requests', methods=['GET'], endpoint='get_requests')
@jwt_required()
@provider_required
def get_requests():
    """Get open service requests for provider's category"""
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    if not user.provider:
        return jsonify({'error': 'Provider profile not found'}), 404
    
    provider = user.provider
    category = provider.category
    
    # Get open service requests (jobs without provider_id) in provider's category
    requests = Job.query.filter_by(
        category=category,
        status='pending'
    ).filter(Job.provider_id.is_(None)).order_by(Job.created_at.desc()).all()
    
    # Check which requests already have offers from this provider
    request_ids = [req.id for req in requests]
    existing_offers = Offer.query.filter_by(provider_id=provider.id).filter(Offer.job_id.in_(request_ids)).all()
    offered_job_ids = {offer.job_id for offer in existing_offers}
    
    requests_data = []
    for req in requests:
        req_data = req.to_dict()
        req_data['has_offer'] = req.id in offered_job_ids
        requests_data.append(req_data)
    
    return jsonify({
        'requests': requests_data,
        'count': len(requests_data)
    }), 200


@providers_bp.route('/requests/<int:request_id>/offer', methods=['POST'], endpoint='submit_offer')
@jwt_required()
@provider_required
def submit_offer(request_id):
    """Submit an offer on a service request"""
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    if not user.provider:
        return jsonify({'error': 'Provider profile not found'}), 404
    
    provider = user.provider
    job = Job.query.get_or_404(request_id)
    
    # Check if job is in provider's category
    if job.category != provider.category:
        return jsonify({'error': 'Job category does not match provider category'}), 400
    
    # Check if job is still open
    if job.status != 'pending' or job.provider_id is not None:
        return jsonify({'error': 'Job is no longer available'}), 400
    
    data = request.get_json()
    price = data.get('price')
    message = data.get('message', '')
    eta = data.get('eta', '')
    
    if not price:
        return jsonify({'error': 'Price is required'}), 400
    
    # Check if provider already submitted an offer
    existing_offer = Offer.query.filter_by(job_id=request_id, provider_id=provider.id).first()
    if existing_offer:
        return jsonify({'error': 'Offer already submitted for this request'}), 400
    
    try:
        offer = Offer(
            job_id=request_id,
            provider_id=provider.id,
            price=price,
            message=message,
            eta=eta,
            status='pending'
        )
        db.session.add(offer)
        db.session.commit()
        
        return jsonify({
            'message': 'Offer submitted successfully',
            'offer': offer.to_dict(include_provider=True)
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@providers_bp.route('/<int:provider_id>/reveal-contact', methods=['POST'])
@jwt_required()
@customer_required
def reveal_contact(provider_id):
    """Reveal provider contact number after credit deduction"""
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    if not user.customer:
        return jsonify({'error': 'Customer profile not found'}), 404
    
    provider = Provider.query.get_or_404(provider_id)
    
    # CRITICAL: Customers cannot reveal contact of unavailable providers
    if not provider.is_available:
        return jsonify({'error': 'Provider is not available'}), 403
    
    # Check if provider has a phone number
    if not provider.phone:
        return jsonify({'error': 'Provider contact information not available'}), 404
    
    # Calculate credits needed based on provider rating
    provider_rating = provider.rating_avg
    credits_needed = calculate_credits_for_call(provider_rating)
    
    # Check if customer has enough credits
    if user.customer.credits < credits_needed:
        return jsonify({
            'error': 'Insufficient credits',
            'required': credits_needed,
            'available': user.customer.credits,
            'message': f'You need {credits_needed} credits to reveal contact. You have {user.customer.credits} credits.'
        }), 402  # 402 Payment Required
    
    try:
        # Deduct customer credits
        user.customer.credits -= credits_needed
        
        # Ensure credits never go negative (safety check)
        if user.customer.credits < 0:
            user.customer.credits = 0
        
        # Create customer credit transaction record for auditing
        customer_transaction = CreditTransaction(
            customer_id=user.customer.id,
            transaction_type='deduction',
            amount=-credits_needed,  # Negative for deduction
            description=f'Call reveal for provider {provider.name}',
            provider_id=provider_id
        )
        db.session.add(customer_transaction)
        
        # Calculate and award provider credits
        provider_rating = provider.rating_avg
        provider_credits_awarded = calculate_provider_credits_for_contact_view(provider_rating)
        
        # Award credits to provider
        provider.credits += provider_credits_awarded
        
        # Create provider credit transaction record
        provider_transaction = ProviderCreditTransaction(
            provider_id=provider.id,
            transaction_type='contact_view',
            amount=provider_credits_awarded,
            status='completed',
            method=None,
            description=f'Credits earned from customer contact view'
        )
        db.session.add(provider_transaction)
        
        # Create contact view record
        contact_view = ContactView(
            provider_id=provider.id,
            customer_id=user.customer.id,
            credits_awarded=provider_credits_awarded
        )
        db.session.add(contact_view)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'phone': provider.phone,
            'credits_deducted': credits_needed,
            'remaining_credits': user.customer.credits
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@providers_bp.route('/credits/redeem', methods=['POST'], endpoint='redeem_credits')
@jwt_required()
@provider_required
def redeem_credits():
    """Redeem provider credits (fake bank transaction)"""
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    if not user.provider:
        return jsonify({'error': 'Provider profile not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    if not data.get('amount'):
        return jsonify({'error': 'Amount is required'}), 400
    
    if not data.get('method'):
        return jsonify({'error': 'Payment method is required'}), 400
    
    amount = float(data['amount'])
    method = data['method'].lower()
    
    # Validate amount
    if amount <= 0:
        return jsonify({'error': 'Amount must be greater than 0'}), 400
    
    # Validate method
    if method != 'bank':
        return jsonify({'error': 'Only bank payment method is supported'}), 400
    
    provider = user.provider
    
    # Validate provider has enough credits
    if amount > provider.credits:
        return jsonify({
            'error': 'Insufficient credits',
            'required': amount,
            'available': provider.credits,
            'message': f'You need {amount} credits to redeem. You have {provider.credits} credits.'
        }), 402  # 402 Payment Required
    
    try:
        # Deduct credits atomically
        provider.credits -= amount
        
        # Ensure credits never go negative (safety check)
        if provider.credits < 0:
            provider.credits = 0
        
        # Create provider credit transaction record
        transaction = ProviderCreditTransaction(
            provider_id=provider.id,
            transaction_type='redeem',
            amount=amount,
            status='completed',
            method='bank',
            description='Bank transfer redemption (fake)'
        )
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Credits redeemed successfully',
            'amount_redeemed': amount,
            'credits': provider.credits
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@providers_bp.route('/credits/purchase', methods=['POST'], endpoint='purchase_credits')
@jwt_required()
@provider_required
def purchase_credits():
    """Purchase credits for provider (fake payment)"""
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    if not user.provider:
        return jsonify({'error': 'Provider profile not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    if not data.get('amount'):
        return jsonify({'error': 'Credit amount is required'}), 400
    
    if not data.get('payment_method'):
        return jsonify({'error': 'Payment method is required'}), 400
    
    amount = float(data['amount'])
    payment_method = data['payment_method'].lower()
    
    # Validate amount (must be one of the predefined packages)
    valid_packages = [100, 300, 500]
    if amount not in valid_packages:
        return jsonify({'error': f'Invalid credit amount. Must be one of: {valid_packages}'}), 400
    
    # Validate payment method
    if payment_method != 'bank':
        return jsonify({'error': 'Only Bank payment method is supported'}), 400
    
    try:
        provider = user.provider
        provider.credits += amount
        
        # Create provider credit transaction record
        from app.models.provider_credit_transaction import ProviderCreditTransaction
        transaction = ProviderCreditTransaction(
            provider_id=provider.id,
            transaction_type='credit_purchase',
            amount=amount,
            status='completed',
            method='bank',
            description=f'Credit purchase ({amount} credits)'
        )
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'message': 'Credits purchased successfully',
            'credits': provider.credits,
            'amount_added': amount
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@providers_bp.route('/upcoming-calls', methods=['GET'], endpoint='get_upcoming_calls')
@jwt_required()
@provider_required
def get_upcoming_calls():
    """Get list of customers who viewed provider's contact number"""
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    if not user.provider:
        return jsonify({'error': 'Provider profile not found'}), 404
    
    provider = user.provider
    
    # Get all contact views for this provider, ordered by most recent first
    contact_views = ContactView.query.filter_by(
        provider_id=provider.id
    ).order_by(ContactView.created_at.desc()).all()
    
    # Format response with customer information
    upcoming_calls = []
    for view in contact_views:
        view_data = view.to_dict(include_customer=True)
        upcoming_calls.append(view_data)
    
    return jsonify({
        'upcoming_calls': upcoming_calls,
        'count': len(upcoming_calls)
    }), 200


@providers_bp.route('/customers/<int:customer_id>/profile', methods=['GET'], endpoint='get_customer_profile')
@jwt_required()
@provider_required
def get_customer_profile(customer_id):
    """Get customer profile (read-only) for provider"""
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    if not user.provider:
        return jsonify({'error': 'Provider profile not found'}), 404
    
    # Verify that this customer has viewed provider's contact
    contact_view = ContactView.query.filter_by(
        provider_id=user.provider.id,
        customer_id=customer_id
    ).first()
    
    if not contact_view:
        return jsonify({'error': 'Customer profile not accessible'}), 403
    
    # Get customer information
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({'error': 'Customer not found'}), 404
    
    return jsonify({
        'customer': customer.to_dict()
    }), 200

