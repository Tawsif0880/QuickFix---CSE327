from extensions import db
from datetime import datetime


class Booking(db.Model):
    """Booking model - created when customer accepts provider offer"""
    __tablename__ = 'bookings'
    
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False, index=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False, index=True)
    provider_id = db.Column(db.Integer, db.ForeignKey('providers.id'), nullable=False, index=True)
    status = db.Column(db.String(20), default='pending', nullable=False, index=True)  # pending, confirmed, in_progress, completed, cancelled
    price = db.Column(db.Float, nullable=False)
    scheduled_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    ratings = db.relationship('Rating', backref='booking', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Booking {self.id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'job_id': self.job_id,
            'customer_id': self.customer_id,
            'provider_id': self.provider_id,
            'status': self.status,
            'price': self.price,
            'scheduled_at': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

