from flask import request, jsonify
from app.emergency import emergency_bp
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db, socketio
from datetime import datetime
from app.models.user import User
from app.models.customer import Customer
from app.models.provider import Provider
from app.models.job import Job
from app.models.booking import Booking
from app.models.provider_credit_transaction import ProviderCreditTransaction
from app.models.credit_transaction import CreditTransaction
from app.utils.decorators import customer_required, provider_required


# Customer Emergency Service Routes
@emergency_bp.route('/jobs', methods=['POST'], endpoint='create_emergency_job')
@jwt_required()
@customer_required
def create_emergency_job():
    """Create an emergency job request"""
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    
    if not user.customer:
        return jsonify({'error': 'Customer profile not found'}), 404
    
    data = request.get_json()
    
    # Validate required fields
    if not data.get('category'):
        return jsonify({'error': 'Category is required'}), 400
    if not data.get('description'):
        return jsonify({'error': 'Description is required'}), 400
    if not data.get('offered_price') or data.get('offered_price') <= 0:
        return jsonify({'error': 'Valid offered price is required'}), 400
    
    try:
        # Create emergency job
        job = Job(
            customer_id=user.customer.id,
            title=f"Emergency: {data['category']}",
            description=data['description'],
            category=data['category'],
            status='OPEN',
            is_emergency=True,
            offered_price=data['offered_price'],
            location_address=data.get('location_address'),
            latitude=data.get('latitude'),
            longitude=data.get('longitude')
        )
        db.session.add(job)
        db.session.commit()
        
        # Broadcast to matching providers via WebSocket
        # CRITICAL: Only send to providers who are available AND have emergency active
        matching_providers = Provider.query.filter_by(
            category=data['category'],
            emergency_active=True,
            is_available=True
        ).all()
        
        job_data = job.to_dict(include_customer=True)
        
        # Emit to each matching provider (use user_id for room)
        for provider in matching_providers:
            room = f'provider_{provider.user_id}'
            socketio.emit('emergency_job_created', job_data, room=room)
        
        return jsonify({
            'message': 'Emergency job created successfully',
            'job': job_data
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Provider Emergency Routes
@emergency_bp.route('/toggle', methods=['POST'], endpoint='toggle_emergency')
@jwt_required()
@provider_required
def toggle_emergency():
    """Toggle emergency service activation"""
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    
    if not user.provider:
        return jsonify({'error': 'Provider profile not found'}), 404
    
    provider = user.provider
    data = request.get_json()
    
    # Update emergency_active
    if 'emergency_active' in data:
        provider.emergency_active = bool(data['emergency_active'])
        db.session.commit()
    
    return jsonify({
        'message': 'Emergency service status updated',
        'emergency_active': provider.emergency_active
    }), 200


@emergency_bp.route('/requests', methods=['GET'], endpoint='get_emergency_requests')
@jwt_required()
@provider_required
def get_emergency_requests():
    """Get emergency job requests for provider (only if emergency_active=true and category matches)"""
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    
    if not user.provider:
        return jsonify({'error': 'Provider profile not found'}), 404
    
    provider = user.provider
    
    # Strict visibility rules: only if emergency_active=true
    if not provider.emergency_active:
        return jsonify({
            'requests': [],
            'count': 0,
            'message': 'Emergency service is not active'
        }), 200
    
    # Get OPEN emergency jobs matching provider's category
    emergency_jobs = Job.query.filter_by(
        status='OPEN',
        is_emergency=True,
        category=provider.category
    ).filter(Job.provider_id.is_(None)).order_by(Job.created_at.desc()).all()
    
    requests_data = []
    for job in emergency_jobs:
        job_data = job.to_dict(include_customer=True)
        requests_data.append(job_data)
    
    return jsonify({
        'requests': requests_data,
        'count': len(requests_data)
    }), 200


@emergency_bp.route('/jobs/<int:job_id>/accept', methods=['POST'], endpoint='accept_emergency_job')
@jwt_required()
@provider_required
def accept_emergency_job(job_id):
    """Accept an emergency job (atomic, first-accept-wins)"""
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    
    if not user.provider:
        return jsonify({'error': 'Provider profile not found'}), 404
    
    provider = user.provider
    
    # Check emergency service is active
    if not provider.emergency_active:
        return jsonify({'error': 'Emergency service is not active'}), 400
    
    try:
        # Use database lock to ensure atomicity - lock job, customer, and provider
        job = db.session.query(Job).filter_by(id=job_id).with_for_update().first()
        provider_locked = db.session.query(Provider).filter_by(id=provider.id).with_for_update().first()
        
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        # Get customer and lock for update
        customer_locked = db.session.query(Customer).filter_by(id=job.customer_id).with_for_update().first()
        if not customer_locked:
            return jsonify({'error': 'Customer not found'}), 404
        
        # Verify it's an emergency job
        if not job.is_emergency:
            return jsonify({'error': 'This is not an emergency job'}), 400
        
        # Verify category matches
        if job.category != provider.category:
            return jsonify({'error': 'Job category does not match your category'}), 403
        
        # Check if job is still OPEN
        if job.status != 'OPEN':
            return jsonify({
                'error': 'Job is no longer available',
                'status': job.status
            }), 400
        
        # Check if job already has a provider (double-check)
        if job.provider_id is not None:
            return jsonify({'error': 'Job has already been accepted by another provider'}), 409
        
        # Calculate emergency credit cost (5% of offered price)
        if not job.offered_price or job.offered_price <= 0:
            return jsonify({'error': 'Job has no valid offered price'}), 400
        
        emergency_credit_cost = job.offered_price * 0.05
        
        # Check if customer has sufficient credits (CRITICAL - must check before accepting)
        if customer_locked.credits < emergency_credit_cost:
            return jsonify({
                'error': 'CUSTOMER_INSUFFICIENT_CREDITS',
                'message': f'Customer has insufficient credits. Required: {emergency_credit_cost:.2f}, Available: {customer_locked.credits:.2f}',
                'required_credits': emergency_credit_cost,
                'available_credits': customer_locked.credits
            }), 400
        
        # ATOMIC TRANSACTION: Deduct from customer and add to provider
        # Convert to int for customer credits (customer.credits is Integer)
        emergency_credit_cost_int = int(round(emergency_credit_cost))
        
        # Deduct credits from customer
        customer_locked.credits -= emergency_credit_cost_int
        
        # Ensure customer credits never go negative (safety check)
        if customer_locked.credits < 0:
            customer_locked.credits = 0
        
        # Add credits to provider (same amount)
        provider_locked.credits += emergency_credit_cost
        
        # Accept the job atomically
        job.status = 'ACCEPTED'
        job.provider_id = provider.id
        job.price = job.offered_price
        
        # Create booking
        booking = Booking(
            job_id=job.id,
            customer_id=job.customer_id,
            provider_id=provider.id,
            price=job.offered_price or 0.0,
            status='confirmed'
        )
        db.session.add(booking)
        
        # Create customer credit transaction record (deduction)
        customer_transaction = CreditTransaction(
            customer_id=job.customer_id,
            transaction_type='emergency_service_fee',
            amount=-emergency_credit_cost_int,  # Negative for deduction
            description=f'Emergency service fee (5% of ${job.offered_price:.2f})',
            provider_id=provider.id,
            job_id=job.id
        )
        db.session.add(customer_transaction)
        
        # Create provider credit transaction record (earning)
        provider_transaction = ProviderCreditTransaction(
            provider_id=provider.id,
            job_id=job.id,
            transaction_type='emergency_service_earning',
            amount=emergency_credit_cost,  # Positive for earning
            status='completed',
            description=f'Emergency service earning (5% of ${job.offered_price:.2f})'
        )
        db.session.add(provider_transaction)
        
        db.session.commit()
        
        # Refresh provider and customer to get updated credits
        db.session.refresh(provider_locked)
        db.session.refresh(customer_locked)
        
        # Broadcast to all matching providers that job was accepted
        # CRITICAL: Only notify available providers with emergency active
        matching_providers = Provider.query.filter_by(
            category=job.category,
            emergency_active=True,
            is_available=True
        ).all()
        
        job_data = job.to_dict(include_customer=True)
        
        # Emit to each matching provider (they should remove it from their list)
        for matching_provider in matching_providers:
            room = f'provider_{matching_provider.user_id}'
            socketio.emit('emergency_job_accepted', {
                'job_id': job.id,
                'accepted_by_provider_id': provider.id,
                'job': job_data
            }, room=room)
        
        return jsonify({
            'message': 'Emergency job accepted successfully',
            'job': job_data,
            'booking': booking.to_dict(),
            'emergency_credit_cost': emergency_credit_cost,
            'customer_credits_deducted': emergency_credit_cost,
            'customer_remaining_credits': customer_locked.credits,
            'provider_credits_earned': emergency_credit_cost,
            'provider_remaining_credits': provider_locked.credits
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@emergency_bp.route('/jobs', methods=['GET'], endpoint='get_emergency_jobs')
@jwt_required()
@provider_required
def get_emergency_jobs():
    """Get provider's accepted emergency jobs"""
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    
    if not user.provider:
        return jsonify({'error': 'Provider profile not found'}), 404
    
    provider = user.provider
    
    # Get all emergency jobs accepted by this provider
    emergency_jobs = Job.query.filter_by(
        provider_id=provider.id,
        is_emergency=True
    ).filter(Job.status.in_(['ACCEPTED', 'in_progress', 'completed'])).order_by(Job.created_at.desc()).all()
    
    jobs_data = []
    for job in emergency_jobs:
        job_data = job.to_dict(include_customer=True)
        
        # Get associated booking if exists
        booking = Booking.query.filter_by(job_id=job.id, provider_id=provider.id).first()
        if booking:
            job_data['booking'] = booking.to_dict()
            job_data['booking_status'] = booking.status
        
        # Get credits earned for this emergency job
        earning_transaction = ProviderCreditTransaction.query.filter_by(
            provider_id=provider.id,
            job_id=job.id,
            transaction_type='emergency_service_earning'
        ).first()
        if earning_transaction:
            job_data['credits_earned'] = earning_transaction.amount
        
        jobs_data.append(job_data)
    
    return jsonify({
        'jobs': jobs_data,
        'count': len(jobs_data)
    }), 200
