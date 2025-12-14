from flask import request, jsonify
from app.admin import admin_bp
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from app.models.user import User
from app.models.customer import Customer
from app.models.provider import Provider
from app.models.job import Job
from app.models.booking import Booking
from app.models.message import Message
from app.models.conversation import Conversation
from app.utils.decorators import admin_required


@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@admin_required
def get_dashboard():
    """Get admin dashboard statistics"""
    # User statistics
    total_users = User.query.count()
    total_customers = Customer.query.count()
    total_providers = Provider.query.count()
    verified_providers = Provider.query.filter_by(verified=True).count()
    
    # Job statistics
    total_jobs = Job.query.count()
    pending_jobs = Job.query.filter_by(status='pending').count()
    completed_jobs = Job.query.filter_by(status='completed').count()
    
    # Booking statistics
    total_bookings = Booking.query.count()
    active_bookings = Booking.query.filter_by(status='in_progress').count()
    completed_bookings = Booking.query.filter_by(status='completed').count()
    
    stats = {
        'users': {
            'total': total_users,
            'customers': total_customers,
            'providers': total_providers,
            'verified_providers': verified_providers
        },
        'jobs': {
            'total': total_jobs,
            'pending': pending_jobs,
            'completed': completed_jobs
        },
        'bookings': {
            'total': total_bookings,
            'active': active_bookings,
            'completed': completed_bookings
        }
    }
    
    return jsonify(stats), 200


@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required
def get_users():
    """Get all users"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    role = request.args.get('role')
    
    query = User.query
    
    if role:
        query = query.filter_by(role=role)
    
    users = query.paginate(page=page, per_page=per_page, error_out=False)
    
    users_data = []
    for user in users.items:
        user_data = user.to_dict()
        if user.role == 'customer' and user.customer:
            user_data['profile'] = user.customer.to_dict()
        elif user.role == 'provider' and user.provider:
            user_data['profile'] = user.provider.to_dict()
        users_data.append(user_data)
    
    return jsonify({
        'users': users_data,
        'total': users.total,
        'page': page,
        'per_page': per_page,
        'pages': users.pages
    }), 200


@admin_bp.route('/jobs', methods=['GET'])
@jwt_required()
@admin_required
def get_jobs():
    """Get all jobs"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')
    
    query = Job.query
    
    if status:
        query = query.filter_by(status=status)
    
    jobs = query.order_by(Job.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'jobs': [job.to_dict() for job in jobs.items],
        'total': jobs.total,
        'page': page,
        'per_page': per_page,
        'pages': jobs.pages
    }), 200


@admin_bp.route('/chats', methods=['GET'])
@jwt_required()
@admin_required
def get_chats():
    """Get chat logs"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    conversation_id = request.args.get('conversation_id', type=int)
    
    if conversation_id:
        messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
    else:
        messages = Message.query.order_by(Message.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
    
    return jsonify({
        'messages': [msg.to_dict() for msg in messages.items],
        'total': messages.total,
        'page': page,
        'per_page': per_page,
        'pages': messages.pages
    }), 200


@admin_bp.route('/providers/<int:provider_id>/verify', methods=['POST'])
@jwt_required()
@admin_required
def verify_provider(provider_id):
    """Verify a provider"""
    provider = Provider.query.get_or_404(provider_id)
    
    try:
        provider.verified = True
        db.session.commit()
        
        return jsonify({
            'message': 'Provider verified successfully',
            'provider': provider.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<int:user_id>/suspend', methods=['POST'])
@jwt_required()
@admin_required
def suspend_user(user_id):
    """Suspend a user account"""
    user = User.query.get_or_404(user_id)
    
    if user.role == 'admin':
        return jsonify({'error': 'Cannot suspend admin account'}), 400
    
    data = request.get_json()
    suspend = data.get('suspend', True)
    
    try:
        user.is_active = not suspend
        db.session.commit()
        
        action = 'suspended' if suspend else 'activated'
        return jsonify({
            'message': f'User {action} successfully',
            'user': user.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/jobs/<int:job_id>/flag', methods=['POST'])
@jwt_required()
@admin_required
def flag_job(job_id):
    """Flag a job for fraud review"""
    job = Job.query.get_or_404(job_id)
    
    data = request.get_json()
    reason = data.get('reason', '')
    
    try:
        # In a real app, you'd have a flagged field or separate FlaggedJob model
        # For now, we'll just return success
        return jsonify({
            'message': 'Job flagged for review',
            'job_id': job_id,
            'reason': reason
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

