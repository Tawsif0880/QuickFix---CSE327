from flask import request, jsonify
from app.users import users_bp
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from app.models.user import User
from app.models.customer import Customer
from app.models.provider import Provider
from app.models.job import Job
from app.models.booking import Booking
from app.models.rating import Rating


@users_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user's profile"""
    current_user = get_jwt_identity()
    user_id = current_user['id'] if isinstance(current_user, dict) else current_user
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user_data = user.to_dict()
    
    # Add profile data based on role
    if user.role == 'customer' and user.customer:
        user_data['profile'] = user.customer.to_dict()
    elif user.role == 'provider' and user.provider:
        user_data['profile'] = user.provider.to_dict()
    
    return jsonify(user_data), 200


@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update current user's profile"""
    current_user = get_jwt_identity()
    user_id = current_user['id'] if isinstance(current_user, dict) else current_user
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    try:
        if user.role == 'customer' and user.customer:
            customer = user.customer
            if 'name' in data:
                customer.name = data['name']
            if 'phone' in data:
                customer.phone = data['phone']
            if 'address' in data:
                customer.address = data['address']
            db.session.commit()
            return jsonify({'message': 'Profile updated', 'profile': customer.to_dict()}), 200
        
        elif user.role == 'provider' and user.provider:
            provider = user.provider
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
            return jsonify({'message': 'Profile updated', 'profile': provider.to_dict()}), 200
        
        return jsonify({'error': 'Profile not found'}), 404
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@users_bp.route('/job-history', methods=['GET'])
@jwt_required()
def get_job_history():
    """Get customer's job history"""
    current_user = get_jwt_identity()
    user_id = current_user['id'] if isinstance(current_user, dict) else current_user
    user = User.query.get(user_id)
    
    if not user or user.role != 'customer':
        return jsonify({'error': 'Customer access required'}), 403
    
    if not user.customer:
        return jsonify({'error': 'Customer profile not found'}), 404
    
    jobs = Job.query.filter_by(customer_id=user.customer.id).order_by(Job.created_at.desc()).all()
    
    return jsonify({
        'jobs': [job.to_dict() for job in jobs]
    }), 200


@users_bp.route('/ratings', methods=['GET'])
@jwt_required()
def get_ratings():
    """Get user's ratings (given or received)"""
    current_user = get_jwt_identity()
    user_id = current_user['id'] if isinstance(current_user, dict) else current_user
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    ratings = []
    
    if user.role == 'customer' and user.customer:
        # Ratings given by customer
        ratings = Rating.query.filter_by(customer_id=user.customer.id).order_by(Rating.created_at.desc()).all()
    elif user.role == 'provider' and user.provider:
        # Ratings received by provider
        ratings = Rating.query.filter_by(provider_id=user.provider.id).order_by(Rating.created_at.desc()).all()
    
    return jsonify({
        'ratings': [rating.to_dict(include_customer_name=True) for rating in ratings]
    }), 200

