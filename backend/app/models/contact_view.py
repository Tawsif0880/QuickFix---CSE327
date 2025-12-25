from extensions import db
from datetime import datetime


class ContactView(db.Model):
    """Contact view model for tracking when customers view provider contact numbers"""
    __tablename__ = 'contact_views'
    
    id = db.Column(db.Integer, primary_key=True)
    provider_id = db.Column(db.Integer, db.ForeignKey('providers.id'), nullable=False, index=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False, index=True)
    credits_awarded = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    provider = db.relationship('Provider', backref='contact_views', lazy=True)
    customer = db.relationship('Customer', backref='contact_views', lazy=True)
    
    def __repr__(self):
        return f'<ContactView {self.id}: Provider {self.provider_id} viewed by Customer {self.customer_id}>'
    
    def to_dict(self, include_customer=False):
        data = {
            'id': self.id,
            'provider_id': self.provider_id,
            'customer_id': self.customer_id,
            'credits_awarded': self.credits_awarded,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_customer and self.customer:
            data['customer'] = self.customer.to_dict()
        return data

