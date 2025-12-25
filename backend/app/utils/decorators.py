from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity


def get_user_id_from_jwt(current_user):
    """Extract user ID from JWT identity (handles both dict and scalar formats)"""
    if isinstance(current_user, dict):
        return current_user.get('id')
    return current_user


def customer_required(f):
    """Decorator to require customer role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user = get_jwt_identity()
        if current_user.get('role') != 'customer':
            return jsonify({'error': 'Customer access required'}), 403
        return f(*args, **kwargs)
    return decorated_function


def provider_required(f):
    """Decorator to require provider role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user = get_jwt_identity()
        if current_user.get('role') != 'provider':
            return jsonify({'error': 'Provider access required'}), 403
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user = get_jwt_identity()
        if current_user.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function


