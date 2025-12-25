from flask import Flask
from config import config
from extensions import db, jwt, socketio, cors, limiter

# Import models to register them with SQLAlchemy
from app.models import (
    User, Customer, Provider, Job, Booking,
    Message, Conversation, Rating, LocationUpdate, Notification,
    CreditTransaction, ProviderCreditTransaction, ContactView, SavedJob,
    ChatSession, ChatMessage
)


def create_app(config_name='default'):
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={
        r"/api/*": {
            "origins": app.config['CORS_ORIGINS'],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Initialize rate limiter if enabled
    if app.config.get('RATELIMIT_ENABLED'):
        limiter.init_app(app)
    
    # Initialize SocketIO
    socketio.init_app(
        app,
        cors_allowed_origins=app.config['CORS_ORIGINS'],
        async_mode='threading'
    )
    
    # Register system blueprint (health check and routes)
    from app.system import system_bp
    app.register_blueprint(system_bp)
    
    # Register blueprints
    from app.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    # Register Phase 2 blueprints
    from app.users import users_bp
    app.register_blueprint(users_bp, url_prefix='/api/users')
    
    from app.providers import providers_bp
    app.register_blueprint(providers_bp, url_prefix='/api/providers')
    app.register_blueprint(providers_bp, url_prefix='/api/provider', name_prefix='provider_')
    
    from app.jobs import jobs_bp
    app.register_blueprint(jobs_bp, url_prefix='/api/jobs')
    app.register_blueprint(jobs_bp, url_prefix='/api/customer/service-requests', name_prefix='customer_service_requests_')
    app.register_blueprint(jobs_bp, url_prefix='/api/customer/requests', name_prefix='customer_requests_')
    app.register_blueprint(jobs_bp, url_prefix='/api/provider/jobs', name_prefix='provider_jobs_')
    
    from app.bookings import bookings_bp
    app.register_blueprint(bookings_bp, url_prefix='/api/bookings')
    app.register_blueprint(bookings_bp, url_prefix='/api/customer/bookings', name_prefix='customer_bookings_')
    app.register_blueprint(bookings_bp, url_prefix='/api/provider/bookings', name_prefix='provider_bookings_')
    
    from app.messaging import messaging_bp
    app.register_blueprint(messaging_bp, url_prefix='/api/customer/conversations', name_prefix='customer_')
    app.register_blueprint(messaging_bp, url_prefix='/api/provider/conversations', name_prefix='provider_')
    
    from app.location import location_bp
    app.register_blueprint(location_bp, url_prefix='/api/location')
    
    from app.ratings import ratings_bp
    app.register_blueprint(ratings_bp, url_prefix='/api/ratings')
    
    from app.admin import admin_bp
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    from app.credits import credits_bp
    app.register_blueprint(credits_bp, url_prefix='/api/credits')
    
    from app.emergency import emergency_bp
    app.register_blueprint(emergency_bp, url_prefix='/api/emergency')
    app.register_blueprint(emergency_bp, url_prefix='/api/provider/emergency', name_prefix='provider_emergency_')
    
    from app.notifications import notifications_bp
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(notifications_bp, url_prefix='/api/customer/notifications', name_prefix='customer_notifications_')
    
    # Optional bot module
    try:
        from app.bot import bot_bp
        app.register_blueprint(bot_bp, url_prefix='/api/bot')
    except ImportError:
        pass
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return {'error': 'Internal server error'}, 500
    
    # Import Socket.IO handlers to register them
    from app.messaging import socketio_handlers  # noqa: F401
    from app.emergency import socketio_handlers as emergency_socketio_handlers  # noqa: F401
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app

