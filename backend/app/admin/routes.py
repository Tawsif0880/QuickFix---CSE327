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
from sqlalchemy import func, and_
from datetime import datetime, timedelta


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


@admin_bp.route('/statistics/user-growth', methods=['GET'])
@jwt_required()
@admin_required
def get_user_growth():
    """Get user growth statistics over time"""
    period = request.args.get('period', 'all')  # 7d, 30d, 6m, all
    group_by = request.args.get('group_by')  # day, week, month
    
    # Calculate date filter
    now = datetime.utcnow()
    date_filter = None
    
    if period == '7d':
        date_filter = now - timedelta(days=7)
        if not group_by:
            group_by = 'day'
    elif period == '30d':
        date_filter = now - timedelta(days=30)
        if not group_by:
            group_by = 'day'
    elif period == '6m':
        date_filter = now - timedelta(days=180)
        if not group_by:
            group_by = 'week'
    else:  # all
        if not group_by:
            group_by = 'month'
    
    # Build query with date filter
    customer_query = User.query.filter_by(role='customer')
    provider_query = User.query.filter_by(role='provider')
    
    if date_filter:
        customer_query = customer_query.filter(User.created_at >= date_filter)
        provider_query = provider_query.filter(User.created_at >= date_filter)
    
    # Group by date based on group_by parameter
    if group_by == 'day':
        customer_date_func = func.date(User.created_at)
        provider_date_func = func.date(User.created_at)
    elif group_by == 'week':
        # SQLite: use strftime to get year-week
        customer_date_func = func.strftime('%Y-W%W', User.created_at)
        provider_date_func = func.strftime('%Y-W%W', User.created_at)
    else:  # month
        customer_date_func = func.strftime('%Y-%m', User.created_at)
        provider_date_func = func.strftime('%Y-%m', User.created_at)
    
    # Get customer counts grouped by date
    customer_results = db.session.query(
        customer_date_func.label('date'),
        func.count(User.id).label('count')
    ).filter_by(role='customer')
    
    if date_filter:
        customer_results = customer_results.filter(User.created_at >= date_filter)
    
    customer_results = customer_results.group_by('date').order_by('date').all()
    
    # Get provider counts grouped by date
    provider_results = db.session.query(
        provider_date_func.label('date'),
        func.count(User.id).label('count')
    ).filter_by(role='provider')
    
    if date_filter:
        provider_results = provider_results.filter(User.created_at >= date_filter)
    
    provider_results = provider_results.group_by('date').order_by('date').all()
    
    # Combine results into a single list
    date_map = {}
    
    for date, count in customer_results:
        date_str = str(date)
        if date_str not in date_map:
            date_map[date_str] = {'date': date_str, 'customer_count': 0, 'provider_count': 0}
        date_map[date_str]['customer_count'] = count
    
    for date, count in provider_results:
        date_str = str(date)
        if date_str not in date_map:
            date_map[date_str] = {'date': date_str, 'customer_count': 0, 'provider_count': 0}
        date_map[date_str]['provider_count'] = count
    
    # Convert to sorted list
    result = sorted(date_map.values(), key=lambda x: x['date'])
    
    return jsonify({'data': result}), 200


@admin_bp.route('/statistics/service-demand', methods=['GET'])
@jwt_required()
@admin_required
def get_service_demand():
    """Get service demand statistics by category"""
    period = request.args.get('period', 'all')  # 7d, 30d, 6m, all
    
    # Calculate date filter
    now = datetime.utcnow()
    date_filter = None
    
    if period == '7d':
        date_filter = now - timedelta(days=7)
    elif period == '30d':
        date_filter = now - timedelta(days=30)
    elif period == '6m':
        date_filter = now - timedelta(days=180)
    # else: all - no filter
    
    # Build query
    query = db.session.query(
        Job.category,
        func.count(Job.id).label('job_count')
    )
    
    if date_filter:
        query = query.filter(Job.created_at >= date_filter)
    
    results = query.group_by(Job.category).order_by(func.count(Job.id).desc()).all()
    
    # Format results
    result = [{'category': category, 'job_count': count} for category, count in results]
    
    return jsonify({'data': result}), 200


@admin_bp.route('/statistics/provider-verification', methods=['GET'])
@jwt_required()
@admin_required
def get_provider_verification():
    """Get provider verification funnel statistics"""
    period = request.args.get('period', 'all')  # 7d, 30d, 6m, all
    
    # Calculate date filter
    now = datetime.utcnow()
    date_filter = None
    
    if period == '7d':
        date_filter = now - timedelta(days=7)
    elif period == '30d':
        date_filter = now - timedelta(days=30)
    elif period == '6m':
        date_filter = now - timedelta(days=180)
    # else: all - no filter
    
    # Build queries
    total_query = Provider.query
    verified_query = Provider.query.filter_by(verified=True)
    
    if date_filter:
        total_query = total_query.filter(Provider.created_at >= date_filter)
        verified_query = verified_query.filter(Provider.created_at >= date_filter)
    
    total_providers = total_query.count()
    verified_providers = verified_query.count()
    unverified_providers = total_providers - verified_providers
    
    result = {
        'total_providers': total_providers,
        'verified_providers': verified_providers,
        'unverified_providers': unverified_providers,
        'verification_rate': round((verified_providers / total_providers * 100) if total_providers > 0 else 0, 2)
    }
    
    return jsonify(result), 200

