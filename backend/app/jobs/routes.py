from flask import request, jsonify
from app.jobs import jobs_bp
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from datetime import datetime
from app.models.user import User
from app.models.customer import Customer
from app.models.provider import Provider
from app.models.job import Job
from app.models.offer import Offer
from app.models.booking import Booking
from app.models.saved_job import SavedJob
from app.utils.decorators import customer_required, provider_required


# Customer service request routes
@jobs_bp.route('', methods=['POST'], endpoint='create_request')
@jwt_required()
@customer_required
def create_service_request():
    """Create a new service request"""
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    
    if not user.customer:
        return jsonify({'error': 'Customer profile not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['title', 'description', 'category']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    try:
        # Parse preferred_date if provided
        preferred_date = None
        if data.get('preferred_date'):
            try:
                preferred_date = datetime.fromisoformat(data['preferred_date'].replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                return jsonify({'error': 'Invalid preferred_date format. Use ISO format.'}), 400
        
        job = Job(
            customer_id=user.customer.id,
            title=data['title'],
            description=data['description'],
            category=data['category'],
            offered_price=data.get('offered_price'),
            location_address=data.get('location_address'),
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            preferred_date=preferred_date,
            status='OPEN'  # New status: OPEN
        )
        db.session.add(job)
        db.session.commit()
        
        return jsonify({
            'message': 'Service request created successfully',
            'request': job.to_dict(include_customer=True)
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@jobs_bp.route('', methods=['GET'], endpoint='get_my_requests')
@jwt_required()
@customer_required
def get_my_requests():
    """Get customer's service requests"""
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    
    if not user.customer:
        return jsonify({'error': 'Customer profile not found'}), 404
    
    requests = Job.query.filter_by(customer_id=user.customer.id).order_by(Job.created_at.desc()).all()
    
    requests_data = []
    for req in requests:
        req_data = req.to_dict()
        # Get offers for this request
        offers = Offer.query.filter_by(job_id=req.id).all()
        req_data['offers'] = [offer.to_dict(include_provider=True) for offer in offers]
        req_data['offer_count'] = len(offers)
        requests_data.append(req_data)
    
    return jsonify({
        'requests': requests_data,
        'count': len(requests_data)
    }), 200


@jobs_bp.route('/<int:request_id>', methods=['GET'], endpoint='get_request')
@jwt_required()
def get_request(request_id):
    """Get service request details"""
    job = Job.query.get_or_404(request_id)
    
    # Check authorization
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    
    # Customer can see their own requests, providers can see requests in their category
    if user.role == 'customer':
        if job.customer_id != user.customer.id:
            return jsonify({'error': 'Unauthorized'}), 403
    elif user.role == 'provider':
        if job.category != user.provider.category:
            return jsonify({'error': 'Unauthorized'}), 403
    
    job_data = job.to_dict()
    
    # Get offers
    offers = Offer.query.filter_by(job_id=request_id).all()
    job_data['offers'] = [offer.to_dict(include_provider=True) for offer in offers]
    
    return jsonify(job_data), 200


@jobs_bp.route('/<int:request_id>/offers', methods=['GET'], endpoint='get_offers')
@jwt_required()
@customer_required
def get_offers(request_id):
    """Get offers for a service request"""
    job = Job.query.get_or_404(request_id)
    
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    
    # Check if request belongs to customer
    if job.customer_id != user.customer.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    offers = Offer.query.filter_by(job_id=request_id).order_by(Offer.created_at.desc()).all()
    
    return jsonify({
        'offers': [offer.to_dict(include_provider=True) for offer in offers],
        'count': len(offers)
    }), 200


@jobs_bp.route('/<int:request_id>/accept-offer/<int:offer_id>', methods=['POST'], endpoint='accept_offer')
@jwt_required()
@customer_required
def accept_offer(request_id, offer_id):
    """Accept a provider's offer (creates booking)"""
    job = Job.query.get_or_404(request_id)
    offer = Offer.query.get_or_404(offer_id)
    
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    
    # Check if request belongs to customer
    if job.customer_id != user.customer.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Check if offer belongs to this request
    if offer.job_id != request_id:
        return jsonify({'error': 'Offer does not belong to this request'}), 400
    
    # Check if offer is still pending
    if offer.status != 'pending':
        return jsonify({'error': 'Offer is no longer available'}), 400
    
    try:
        # Update job
        job.provider_id = offer.provider_id
        job.price = offer.price
        job.status = 'accepted'
        
        # Update offer status
        offer.status = 'accepted'
        
        # Reject other offers
        other_offers = Offer.query.filter_by(job_id=request_id, status='pending').filter(Offer.id != offer_id).all()
        for other_offer in other_offers:
            other_offer.status = 'rejected'
        
        # Create booking
        booking = Booking(
            job_id=request_id,
            customer_id=user.customer.id,
            provider_id=offer.provider_id,
            price=offer.price,
            status='confirmed'
        )
        db.session.add(booking)
        db.session.commit()
        
        return jsonify({
            'message': 'Offer accepted, booking created',
            'booking': booking.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# General job routes
@jobs_bp.route('/<int:job_id>', methods=['GET'], endpoint='get_job')
@jwt_required()
def get_job(job_id):
    """Get job details"""
    job = Job.query.get_or_404(job_id)
    
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    
    # Authorization check
    if user.role == 'customer' and job.customer_id != user.customer.id:
        return jsonify({'error': 'Unauthorized'}), 403
    elif user.role == 'provider' and job.provider_id != user.provider.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify(job.to_dict()), 200


@jobs_bp.route('/<int:job_id>/status', methods=['PUT'], endpoint='update_job_status')
@jwt_required()
def update_job_status(job_id):
    """Update job status"""
    job = Job.query.get_or_404(job_id)
    
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    
    data = request.get_json()
    new_status = data.get('status')
    
    if not new_status:
        return jsonify({'error': 'Status is required'}), 400
    
    valid_statuses = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled']
    if new_status not in valid_statuses:
        return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
    
    # Authorization: customer or provider can update status
    if user.role == 'customer' and job.customer_id != user.customer.id:
        return jsonify({'error': 'Unauthorized'}), 403
    elif user.role == 'provider' and job.provider_id != user.provider.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        job.status = new_status
        if new_status == 'completed':
            job.completed_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Job status updated',
            'job': job.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Provider job board routes
@jobs_bp.route('/open', methods=['GET'], endpoint='get_open_jobs')
@jwt_required()
@provider_required
def get_open_jobs():
    """Get all OPEN jobs for provider's job board"""
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    
    if not user.provider:
        return jsonify({'error': 'Provider profile not found'}), 404
    
    provider = user.provider
    
    # Get all OPEN jobs (visible to all providers)
    open_jobs = Job.query.filter_by(status='OPEN').order_by(Job.created_at.desc()).all()
    
    jobs_data = []
    for job in open_jobs:
        job_data = job.to_dict(include_customer=True)
        # Add provider's availability status
        job_data['provider_availability'] = provider.is_available
        # Check if job is saved by this provider
        saved = SavedJob.query.filter_by(
            provider_id=provider.id,
            service_request_id=job.id
        ).first()
        job_data['is_saved'] = saved is not None
        jobs_data.append(job_data)
    
    return jsonify({
        'jobs': jobs_data,
        'count': len(jobs_data),
        'provider_availability': provider.is_available
    }), 200


@jobs_bp.route('/<int:job_id>/accept', methods=['POST'], endpoint='accept_job')
@jwt_required()
@provider_required
def accept_job(job_id):
    """Accept a job (transaction-safe, ensures exclusivity)"""
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    
    if not user.provider:
        return jsonify({'error': 'Provider profile not found'}), 404
    
    provider = user.provider
    
    # Check provider availability
    if not provider.is_available:
        return jsonify({'error': 'You must be available to accept jobs'}), 400
    
    try:
        # Use database lock to ensure atomicity
        # Lock the job row for update
        job = db.session.query(Job).filter_by(id=job_id).with_for_update().first()
        
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        # Check if job is still OPEN
        if job.status != 'OPEN':
            return jsonify({
                'error': 'Job is no longer available',
                'status': job.status
            }), 400
        
        # Check if job already has a provider (double-check)
        if job.provider_id is not None:
            return jsonify({'error': 'Job has already been accepted by another provider'}), 409
        
        # Accept the job atomically
        job.status = 'ACCEPTED'
        job.provider_id = provider.id
        job.price = job.offered_price  # Use offered price as agreed price
        
        # Create booking
        booking = Booking(
            job_id=job.id,
            customer_id=job.customer_id,
            provider_id=provider.id,
            price=job.offered_price or 0.0,
            status='confirmed',
            scheduled_at=job.preferred_date
        )
        db.session.add(booking)
        
        # Remove from saved jobs if it was saved
        SavedJob.query.filter_by(
            provider_id=provider.id,
            service_request_id=job.id
        ).delete()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Job accepted successfully',
            'job': job.to_dict(include_customer=True),
            'booking': booking.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@jobs_bp.route('/<int:job_id>/save', methods=['POST'], endpoint='save_job')
@jwt_required()
@provider_required
def save_job(job_id):
    """Save a job for later"""
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    
    if not user.provider:
        return jsonify({'error': 'Provider profile not found'}), 404
    
    provider = user.provider
    job = Job.query.get_or_404(job_id)
    
    # Check if job is still OPEN (can save even if not available)
    if job.status != 'OPEN':
        return jsonify({
            'error': 'Job is no longer available to save',
            'status': job.status
        }), 400
    
    try:
        # Check if already saved
        existing = SavedJob.query.filter_by(
            provider_id=provider.id,
            service_request_id=job_id
        ).first()
        
        if existing:
            return jsonify({
                'message': 'Job already saved',
                'saved_job': existing.to_dict(include_job=True)
            }), 200
        
        # Create saved job
        saved_job = SavedJob(
            provider_id=provider.id,
            service_request_id=job_id
        )
        db.session.add(saved_job)
        db.session.commit()
        
        return jsonify({
            'message': 'Job saved successfully',
            'saved_job': saved_job.to_dict(include_job=True)
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@jobs_bp.route('/saved', methods=['GET'], endpoint='get_saved_jobs')
@jwt_required()
@provider_required
def get_saved_jobs():
    """Get provider's saved jobs"""
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    
    if not user.provider:
        return jsonify({'error': 'Provider profile not found'}), 404
    
    provider = user.provider
    
    # Get all saved jobs for this provider
    saved_jobs = SavedJob.query.filter_by(
        provider_id=provider.id
    ).order_by(SavedJob.created_at.desc()).all()
    
    saved_jobs_data = []
    for saved_job in saved_jobs:
        job = saved_job.service_request
        job_data = job.to_dict(include_customer=True)
        # Add current status and availability info
        job_data['provider_availability'] = provider.is_available
        job_data['saved_at'] = saved_job.created_at.isoformat() if saved_job.created_at else None
        
        # Determine if Accept button should be disabled
        job_data['can_accept'] = (
            job.status == 'OPEN' and 
            provider.is_available and
            job.provider_id is None
        )
        
        saved_jobs_data.append(job_data)
    
    return jsonify({
        'saved_jobs': saved_jobs_data,
        'count': len(saved_jobs_data),
        'provider_availability': provider.is_available
    }), 200


@jobs_bp.route('/accepted', methods=['GET'], endpoint='get_accepted_jobs')
@jwt_required()
@provider_required
def get_accepted_jobs():
    """Get provider's accepted jobs"""
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    
    if not user.provider:
        return jsonify({'error': 'Provider profile not found'}), 404
    
    provider = user.provider
    
    # Get all jobs accepted by this provider (status = ACCEPTED and provider_id matches)
    accepted_jobs = Job.query.filter_by(
        provider_id=provider.id,
        status='ACCEPTED'
    ).order_by(Job.created_at.desc()).all()
    
    # Also get jobs with status 'in_progress', 'completed' that belong to this provider
    # (these are also considered accepted jobs in different stages)
    other_status_jobs = Job.query.filter_by(
        provider_id=provider.id
    ).filter(Job.status.in_(['in_progress', 'completed'])).order_by(Job.created_at.desc()).all()
    
    # Combine and sort by created_at
    all_accepted_jobs = accepted_jobs + other_status_jobs
    all_accepted_jobs.sort(key=lambda x: x.created_at, reverse=True)
    
    jobs_data = []
    for job in all_accepted_jobs:
        job_data = job.to_dict(include_customer=True)
        
        # Get associated booking if exists
        booking = Booking.query.filter_by(job_id=job.id, provider_id=provider.id).first()
        if booking:
            job_data['booking'] = booking.to_dict()
            job_data['booking_status'] = booking.status
        
        jobs_data.append(job_data)
    
    return jsonify({
        'accepted_jobs': jobs_data,
        'count': len(jobs_data)
    }), 200

