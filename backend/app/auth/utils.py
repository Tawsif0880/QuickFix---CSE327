import bcrypt
from flask_jwt_extended import create_access_token, create_refresh_token
from extensions import db
from app.models.user import User
from app.models.customer import Customer
from app.models.provider import Provider


def hash_password(password):
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def check_password(password, password_hash):
    """Check if password matches hash"""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))


def create_user(email, password, role, **kwargs):
    """Create a new user with hashed password"""
    password_hash = hash_password(password)
    user = User(
        email=email,
        password_hash=password_hash,
        role=role
    )
    db.session.add(user)
    db.session.flush()  # Get user.id
    
    # Create profile based on role
    if role == 'customer':
        customer = Customer(
            user_id=user.id,
            name=kwargs.get('name', ''),
            phone=kwargs.get('phone'),
            address=kwargs.get('address'),
            credits=35  # Initialize with 35 credits
        )
        db.session.add(customer)
    elif role == 'provider':
        provider = Provider(
            user_id=user.id,
            name=kwargs.get('name', ''),
            phone=kwargs.get('phone'),
            category=kwargs.get('category', ''),
            description=kwargs.get('description'),
            service_area=kwargs.get('service_area'),
            hourly_rate=kwargs.get('hourly_rate')
        )
        db.session.add(provider)
    
    db.session.commit()
    return user


def generate_tokens(user):
    """Generate access and refresh tokens for user"""
    identity = {
        'id': user.id,
        'email': user.email,
        'role': user.role
    }
    access_token = create_access_token(identity=identity)
    refresh_token = create_refresh_token(identity=identity)
    return access_token, refresh_token

