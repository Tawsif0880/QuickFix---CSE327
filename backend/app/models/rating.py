from extensions import db
from datetime import datetime


class Rating(db.Model):
    """Rating/Review model"""
    __tablename__ = 'ratings'
    
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=True, index=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=True, index=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False, index=True)
    provider_id = db.Column(db.Integer, db.ForeignKey('providers.id'), nullable=False, index=True)
    rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    review_text = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    customer = db.relationship('Customer', backref='ratings_given')
    provider = db.relationship('Provider', backref='ratings_received')
    
    def __repr__(self):
        return f'<Rating {self.rating} stars>'
    
    def to_dict(self, include_customer_name=False):
        data = {
            'id': self.id,
            'job_id': self.job_id,
            'booking_id': self.booking_id,
            'customer_id': self.customer_id,
            'provider_id': self.provider_id,
            'rating': self.rating,
            'review_text': self.review_text,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_customer_name and self.customer:
            data['customer_name'] = self.customer.name
        return data

