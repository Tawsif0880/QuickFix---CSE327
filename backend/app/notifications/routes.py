from flask import request, jsonify
from app.notifications import notifications_bp
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db, socketio
from app.models.user import User
from app.models.notification import Notification
from app.utils.decorators import customer_required, get_user_id_from_jwt
import json


@notifications_bp.route('', methods=['GET'], endpoint='get_notifications')
@jwt_required()
def get_notifications():
    """Get all notifications for the current user"""
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get query parameters
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    limit = request.args.get('limit', type=int)
    
    # Build query
    query = Notification.query.filter_by(user_id=user.id)
    
    if unread_only:
        query = query.filter_by(is_read=False)
    
    query = query.order_by(Notification.created_at.desc())
    
    if limit:
        query = query.limit(limit)
    
    notifications = query.all()
    
    notifications_data = []
    for notification in notifications:
        notification_dict = notification.to_dict()
        # Parse JSON data if present
        if notification.data:
            try:
                notification_dict['data'] = json.loads(notification.data)
            except (json.JSONDecodeError, TypeError):
                notification_dict['data'] = notification.data
        notifications_data.append(notification_dict)
    
    # Get unread count
    unread_count = Notification.query.filter_by(
        user_id=user.id,
        is_read=False
    ).count()
    
    return jsonify({
        'notifications': notifications_data,
        'count': len(notifications_data),
        'unread_count': unread_count
    }), 200


@notifications_bp.route('/<int:notification_id>/read', methods=['PUT'], endpoint='mark_as_read')
@jwt_required()
def mark_as_read(notification_id):
    """Mark a notification as read"""
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    notification = Notification.query.get_or_404(notification_id)
    
    # Check ownership
    if notification.user_id != user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    notification.is_read = True
    db.session.commit()
    
    # Emit socket event for notification read
    user_room = f'user_{user.id}'
    unread_count = Notification.query.filter_by(
        user_id=user.id,
        is_read=False
    ).count()
    socketio.emit('notification_read', {
        'notification_id': notification_id,
        'unread_count': unread_count
    }, room=user_room)
    
    return jsonify({
        'message': 'Notification marked as read',
        'notification': notification.to_dict()
    }), 200


@notifications_bp.route('/read-all', methods=['PUT'], endpoint='mark_all_as_read')
@jwt_required()
def mark_all_as_read():
    """Mark all notifications as read for the current user"""
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    Notification.query.filter_by(
        user_id=user.id,
        is_read=False
    ).update({'is_read': True})
    
    db.session.commit()
    
    # Emit socket event for all notifications read
    user_room = f'user_{user.id}'
    socketio.emit('notification_read', {
        'notification_id': None,
        'unread_count': 0
    }, room=user_room)
    
    return jsonify({
        'message': 'All notifications marked as read'
    }), 200


@notifications_bp.route('/unread-count', methods=['GET'], endpoint='get_unread_count')
@jwt_required()
def get_unread_count():
    """Get unread notification count for the current user"""
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    unread_count = Notification.query.filter_by(
        user_id=user.id,
        is_read=False
    ).count()
    
    return jsonify({
        'unread_count': unread_count
    }), 200

