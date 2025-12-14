from extensions import db
from datetime import datetime


class Provider(db.Model):
    """Provider profile model"""
    __tablename__ = 'providers'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    category = db.Column(db.String(50), nullable=False, index=True)  # e.g., 'plumber', 'electrician', 'carpenter'
    description = db.Column(db.Text, nullable=True)
    service_area = db.Column(db.String(200), nullable=True)  # Service area description
    hourly_rate = db.Column(db.Float, nullable=True)
    documents = db.Column(db.Text, nullable=True)  # JSON string of document URLs
    verified = db.Column(db.Boolean, default=False, nullable=False, index=True)
    rating_avg = db.Column(db.Float, default=0.0, nullable=False)
    rating_count = db.Column(db.Integer, default=0, nullable=False)
    is_available = db.Column(db.Boolean, default=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    jobs = db.relationship('Job', backref='provider', lazy='dynamic', cascade='all, delete-orphan')
    bookings = db.relationship('Booking', backref='provider', lazy='dynamic', cascade='all, delete-orphan')
    conversations_as_provider = db.relationship('Conversation', foreign_keys='Conversation.provider_id', backref='provider', lazy='dynamic')
    location_updates = db.relationship('LocationUpdate', backref='provider', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Provider {self.name}>'
    
    def update_rating(self):
        """Update average rating from all reviews"""
        from app.models.rating import Rating
        ratings = Rating.query.filter_by(provider_id=self.id).all()
        if ratings:
            self.rating_avg = sum(r.rating for r in ratings) / len(ratings)
            self.rating_count = len(ratings)
        else:
            self.rating_avg = 0.0
            self.rating_count = 0
        db.session.commit()
    
    def to_dict(self, include_contact=False):
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'category': self.category,
            'description': self.description,
            'service_area': self.service_area,
            'hourly_rate': self.hourly_rate,
            'verified': self.verified,
            'rating_avg': self.rating_avg,
            'rating_count': self.rating_count,
            'is_available': self.is_available,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_contact:
            data['phone'] = self.phone
        return data

