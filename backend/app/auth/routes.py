from flask import request, jsonify
from app.auth import auth_bp
from app.auth.utils import create_user, check_password, generate_tokens
from extensions import db
from app.models.user import User
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user (customer or provider)"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['email', 'password', 'role']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    email = data['email'].lower().strip()
    password = data['password']
    role = data['role'].lower()
    
    # Validate role
    if role not in ['customer', 'provider', 'admin']:
        return jsonify({'error': 'Invalid role. Must be customer, provider, or admin'}), 400
    
    # Check if user already exists
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    # Validate password length
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    # Additional validation for provider
    if role == 'provider':
        if not data.get('category'):
            return jsonify({'error': 'Category is required for providers'}), 400
    
    try:
        # Create user
        user = create_user(
            email=email,
            password=password,
            role=role,
            name=data.get('name', ''),
            phone=data.get('phone'),
            address=data.get('address'),
            category=data.get('category'),
            description=data.get('description'),
            service_area=data.get('service_area'),
            hourly_rate=data.get('hourly_rate')
        )
        
        # Generate tokens
        access_token, refresh_token = generate_tokens(user)
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user and return JWT tokens"""
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    email = data['email'].lower().strip()
    password = data['password']
    
    # Find user
    user = User.query.filter_by(email=email).first()
    
    if not user or not check_password(password, user.password_hash):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 403
    
    # Generate tokens
    access_token, refresh_token = generate_tokens(user)
    
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    
    if not user or not user.is_active:
        return jsonify({'error': 'User not found or inactive'}), 401
    
    access_token, _ = generate_tokens(user)
    
    return jsonify({
        'access_token': access_token
    }), 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (token blacklisting can be added here)"""
    # In a production app, you would add the token to a blacklist
    # For now, we'll just return success
    return jsonify({'message': 'Logged out successfully'}), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user"""
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user_data = user.to_dict()
    
    # Add profile data based on role
    if user.role == 'customer' and user.customer:
        user_data['profile'] = user.customer.to_dict()
    elif user.role == 'provider' and user.provider:
        user_data['profile'] = user.provider.to_dict()
    
    return jsonify(user_data), 200

