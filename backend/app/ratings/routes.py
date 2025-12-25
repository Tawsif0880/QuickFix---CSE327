from flask import request, jsonify
from app.ratings import ratings_bp
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from datetime import datetime
from app.models.user import User
from app.models.booking import Booking
from app.models.job import Job
from app.models.rating import Rating
from app.models.provider import Provider
from app.utils.decorators import customer_required, get_user_id_from_jwt


@ratings_bp.route('/bookings/<int:booking_id>', methods=['POST'], endpoint='submit_review')
@jwt_required()
@customer_required
def submit_review(booking_id):
    """Submit a review for a completed booking"""
    booking = Booking.query.get_or_404(booking_id)
    
    current_user = get_jwt_identity()
    user_id = current_user['id'] if isinstance(current_user, dict) else current_user
    user = User.query.get(user_id)
    
    # Check if booking belongs to customer
    if booking.customer_id != user.customer.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Check if booking is completed
    if booking.status != 'completed':
        return jsonify({'error': 'Can only review completed bookings'}), 400
    
    # Check if review already exists
    existing_review = Rating.query.filter_by(booking_id=booking_id).first()
    if existing_review:
        return jsonify({'error': 'Review already submitted for this booking'}), 400
    
    data = request.get_json()
    rating_value = data.get('rating')
    review_text = data.get('review_text', '')
    
    if rating_value is None:
        return jsonify({'error': 'Rating is required'}), 400
    
    if not isinstance(rating_value, int) or rating_value < 0 or rating_value > 5:
        return jsonify({'error': 'Rating must be between 0 and 5'}), 400
    
    try:
        review = Rating(
            booking_id=booking_id,
            job_id=booking.job_id,
            customer_id=user.customer.id,
            provider_id=booking.provider_id,
            rating=rating_value,
            review_text=review_text
        )
        db.session.add(review)
        db.session.commit()
        
        # Update provider rating
        provider = Provider.query.get(booking.provider_id)
        if provider:
            provider.update_rating()
        
        return jsonify({
            'message': 'Review submitted successfully',
            'review': review.to_dict(include_customer_name=True)
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Job-based rating routes
@ratings_bp.route('/jobs/<int:job_id>', methods=['POST'], endpoint='submit_job_rating')
@jwt_required()
@customer_required
def submit_job_rating(job_id):
    """Submit a rating for a completed job"""
    job = Job.query.get_or_404(job_id)
    
    current_user = get_jwt_identity()
    user_id = current_user['id'] if isinstance(current_user, dict) else current_user
    user = User.query.get(user_id)
    
    # Verify job belongs to customer
    if job.customer_id != user.customer.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Verify job status is COMPLETED (not REPORTED)
    if job.status != 'COMPLETED':
        if job.status == 'REPORTED':
            return jsonify({'error': 'Cannot rate a reported job'}), 400
        return jsonify({'error': 'Can only rate completed jobs'}), 400
    
    # Check if rating already exists for this job
    existing_rating = Rating.query.filter_by(job_id=job_id).first()
    if existing_rating:
        return jsonify({'error': 'Rating already submitted for this job'}), 400
    
    data = request.get_json()
    rating_value = data.get('rating')
    review_text = data.get('review_text', '')
    
    if rating_value is None:
        return jsonify({'error': 'Rating is required'}), 400
    
    if not isinstance(rating_value, int) or rating_value < 0 or rating_value > 5:
        return jsonify({'error': 'Rating must be between 0 and 5'}), 400
    
    try:
        # Get associated booking
        booking = Booking.query.filter_by(job_id=job_id).first()
        
        rating = Rating(
            job_id=job_id,
            booking_id=booking.id if booking else None,
            customer_id=user.customer.id,
            provider_id=job.provider_id,
            rating=rating_value,
            review_text=review_text
        )
        db.session.add(rating)
        db.session.commit()
        
        # Update provider rating
        provider = Provider.query.get(job.provider_id)
        if provider:
            provider.update_rating()
        
        return jsonify({
            'message': 'Rating submitted successfully',
            'rating': rating.to_dict(include_customer_name=True)
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@ratings_bp.route('/jobs/<int:job_id>', methods=['GET'], endpoint='get_job_rating')
@jwt_required()
@customer_required
def get_job_rating(job_id):
    """Check if a rating exists for a job"""
    job = Job.query.get_or_404(job_id)
    
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    # Verify job belongs to customer
    if job.customer_id != user.customer.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Check if rating exists
    existing_rating = Rating.query.filter_by(job_id=job_id).first()
    
    return jsonify({
        'has_rating': existing_rating is not None,
        'can_rate': job.status == 'COMPLETED' and existing_rating is None,
        'rating': existing_rating.to_dict(include_customer_name=True) if existing_rating else None
    }), 200


@ratings_bp.route('/providers/<int:provider_id>', methods=['GET'], endpoint='get_provider_reviews')
@jwt_required()
def get_provider_reviews(provider_id):
    """Get all reviews for a provider"""
    provider = Provider.query.get_or_404(provider_id)
    
    reviews = Rating.query.filter_by(provider_id=provider_id).order_by(Rating.created_at.desc()).all()
    
    return jsonify({
        'reviews': [review.to_dict(include_customer_name=True) for review in reviews],
        'count': len(reviews),
        'average_rating': provider.rating_avg,
        'total_ratings': provider.rating_count
    }), 200


@ratings_bp.route('/providers/<int:provider_id>/stats', methods=['GET'], endpoint='get_rating_stats')
@jwt_required()
def get_rating_stats(provider_id):
    """Get rating statistics for a provider"""
    provider = Provider.query.get_or_404(provider_id)
    
    all_ratings = Rating.query.filter_by(provider_id=provider_id).all()
    
    rating_stats = {
        'total': len(all_ratings),
        'average': provider.rating_avg,
        'breakdown': {str(i): 0 for i in range(1, 6)}
    }
    
    for rating in all_ratings:
        rating_stats['breakdown'][str(rating.rating)] += 1
    
    return jsonify(rating_stats), 200

