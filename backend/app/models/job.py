from extensions import db
from datetime import datetime


class Job(db.Model):
    """Job/Service Request model"""
    __tablename__ = 'jobs'
    
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False, index=True)
    provider_id = db.Column(db.Integer, db.ForeignKey('providers.id'), nullable=True, index=True)  # Null until accepted (acts as accepted_provider_id)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False, index=True)
    status = db.Column(db.String(20), default='OPEN', nullable=False, index=True)  # OPEN, ACCEPTED, COMPLETED, REPORTED, CLOSED, in_progress, cancelled
    is_emergency = db.Column(db.Boolean, default=False, nullable=False, index=True)
    offered_price = db.Column(db.Float, nullable=True)  # Price offered by customer
    price = db.Column(db.Float, nullable=True)  # Agreed price (after acceptance)
    location_address = db.Column(db.String(200), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    preferred_date = db.Column(db.DateTime, nullable=True)  # Preferred service date
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    report_reason = db.Column(db.Text, nullable=True)  # Reason when provider reports customer
    
    # Relationships
    bookings = db.relationship('Booking', backref='job', lazy='dynamic', cascade='all, delete-orphan')
    ratings = db.relationship('Rating', backref='job', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Job {self.title}>'
    
    def to_dict(self, include_customer=False):
        data = {
            'id': self.id,
            'customer_id': self.customer_id,
            'provider_id': self.provider_id,
            'accepted_provider_id': self.provider_id,  # Alias for clarity
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'status': self.status,
            'is_emergency': self.is_emergency,
            'offered_price': self.offered_price,
            'price': self.price,
            'location_address': self.location_address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'preferred_date': self.preferred_date.isoformat() if self.preferred_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'report_reason': self.report_reason
        }
        if include_customer and self.customer:
            data['customer'] = self.customer.to_dict()
        return data

