from extensions import db
from datetime import datetime


class Customer(db.Model):
    """Customer profile model"""
    __tablename__ = 'customers'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    address = db.Column(db.Text, nullable=True)
    rating_avg = db.Column(db.Float, default=0.0, nullable=False)
    credits = db.Column(db.Integer, default=35, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    jobs = db.relationship('Job', backref='customer', lazy='dynamic', cascade='all, delete-orphan')
    bookings = db.relationship('Booking', backref='customer', lazy='dynamic', cascade='all, delete-orphan')
    conversations_as_customer = db.relationship('Conversation', foreign_keys='Conversation.customer_id', backref='customer', lazy='dynamic')
    
    def __repr__(self):
        return f'<Customer {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'phone': self.phone,
            'address': self.address,
            'rating_avg': self.rating_avg,
            'credits': self.credits,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

