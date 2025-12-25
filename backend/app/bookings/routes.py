from flask import request, jsonify
from app.bookings import bookings_bp
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from datetime import datetime
from app.models.user import User
from app.models.booking import Booking
from app.models.job import Job
from app.models.provider import Provider
from app.models.rating import Rating
from app.utils.decorators import customer_required, provider_required, get_user_id_from_jwt


@bookings_bp.route('', methods=['GET'], endpoint='get_bookings')
@jwt_required()
def get_bookings():
    """Get bookings (customer or provider view)"""
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    status_filter = request.args.get('status')
    
    if user.role == 'customer':
        if not user.customer:
            return jsonify({'error': 'Customer profile not found'}), 404
        
        query = Booking.query.filter_by(customer_id=user.customer.id)
        if status_filter:
            query = query.filter_by(status=status_filter)
        bookings = query.order_by(Booking.created_at.desc()).all()
    
    elif user.role == 'provider':
        if not user.provider:
            return jsonify({'error': 'Provider profile not found'}), 404
        
        query = Booking.query.filter_by(provider_id=user.provider.id)
        if status_filter:
            query = query.filter_by(status=status_filter)
        bookings = query.order_by(Booking.created_at.desc()).all()
    
    else:
        return jsonify({'error': 'Unauthorized'}), 403
    
    bookings_data = []
    for booking in bookings:
        booking_data = booking.to_dict()
        # Include job details
        if booking.job:
            job_data = booking.job.to_dict()
            booking_data['job'] = job_data
        # Include provider details for customers
        if user.role == 'customer' and booking.provider:
            booking_data['provider'] = booking.provider.to_dict()
        bookings_data.append(booking_data)
    
    return jsonify({
        'bookings': bookings_data,
        'count': len(bookings_data)
    }), 200


@bookings_bp.route('/<int:booking_id>', methods=['GET'], endpoint='get_booking')
@jwt_required()
def get_booking(booking_id):
    """Get booking details"""
    booking = Booking.query.get_or_404(booking_id)
    
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    # Authorization check
    if user.role == 'customer' and booking.customer_id != user.customer.id:
        return jsonify({'error': 'Unauthorized'}), 403
    elif user.role == 'provider' and booking.provider_id != user.provider.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    booking_data = booking.to_dict()
    if booking.job:
        booking_data['job'] = booking.job.to_dict()
    # Include provider details for customers
    if user.role == 'customer' and booking.provider:
        booking_data['provider'] = booking.provider.to_dict()
    
    return jsonify(booking_data), 200


@bookings_bp.route('/<int:booking_id>/status', methods=['PUT'], endpoint='update_booking_status')
@jwt_required()
def update_booking_status(booking_id):
    """Update booking status"""
    booking = Booking.query.get_or_404(booking_id)
    
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    data = request.get_json()
    new_status = data.get('status')
    
    if not new_status:
        return jsonify({'error': 'Status is required'}), 400
    
    valid_statuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']
    if new_status not in valid_statuses:
        return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
    
    # Authorization: customer or provider can update status
    if user.role == 'customer' and booking.customer_id != user.customer.id:
        return jsonify({'error': 'Unauthorized'}), 403
    elif user.role == 'provider' and booking.provider_id != user.provider.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        booking.status = new_status
        if new_status == 'completed':
            booking.completed_at = datetime.utcnow()
            # Also update job status
            if booking.job:
                booking.job.status = 'completed'
                booking.job.completed_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Booking status updated',
            'booking': booking.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bookings_bp.route('/history', methods=['GET'], endpoint='get_booking_history')
@jwt_required()
@customer_required
def get_booking_history():
    """Get customer's booking history with rating status"""
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    if not user.customer:
        return jsonify({'error': 'Customer profile not found'}), 404
    
    # Get all completed bookings for this customer
    bookings = Booking.query.filter_by(
        customer_id=user.customer.id
    ).filter(Booking.status.in_(['completed', 'cancelled'])).order_by(Booking.completed_at.desc()).all()
    
    bookings_data = []
    for booking in bookings:
        booking_data = booking.to_dict()
        
        # Include job details
        if booking.job:
            job_data = booking.job.to_dict()
            booking_data['job'] = job_data
            
            # Check rating status
            existing_rating = Rating.query.filter_by(job_id=booking.job_id).first()
            booking_data['has_rating'] = existing_rating is not None
            booking_data['can_rate'] = (
                booking.job.status == 'COMPLETED' and 
                existing_rating is None
            )
            booking_data['rating'] = existing_rating.to_dict() if existing_rating else None
        
        # Include provider details
        if booking.provider:
            booking_data['provider'] = booking.provider.to_dict()
        
        bookings_data.append(booking_data)
    
    return jsonify({
        'bookings': bookings_data,
        'count': len(bookings_data)
    }), 200

