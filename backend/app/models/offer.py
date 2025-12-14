from extensions import db
from datetime import datetime


class Offer(db.Model):
    """Provider offer on a service request"""
    __tablename__ = 'offers'
    
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False, index=True)
    provider_id = db.Column(db.Integer, db.ForeignKey('providers.id'), nullable=False, index=True)
    price = db.Column(db.Float, nullable=False)
    message = db.Column(db.Text, nullable=True)
    eta = db.Column(db.String(100), nullable=True)  # Estimated time of arrival/completion
    status = db.Column(db.String(20), default='pending', nullable=False, index=True)  # pending, accepted, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    job = db.relationship('Job', backref='offers')
    provider = db.relationship('Provider', backref='offers')
    
    def __repr__(self):
        return f'<Offer {self.id} for Job {self.job_id}>'
    
    def to_dict(self, include_provider=False):
        data = {
            'id': self.id,
            'job_id': self.job_id,
            'provider_id': self.provider_id,
            'price': self.price,
            'message': self.message,
            'eta': self.eta,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_provider and self.provider:
            data['provider'] = self.provider.to_dict()
        return data

