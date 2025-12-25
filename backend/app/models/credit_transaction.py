from extensions import db
from datetime import datetime


class CreditTransaction(db.Model):
    """Credit transaction model for auditing credit deductions and purchases"""
    __tablename__ = 'credit_transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False, index=True)
    transaction_type = db.Column(db.String(30), nullable=False, index=True)  # 'deduction', 'purchase', 'refund', 'emergency_service_fee'
    amount = db.Column(db.Integer, nullable=False)  # Positive for purchase/refund, negative for deduction
    description = db.Column(db.String(200), nullable=True)  # e.g., 'Message to provider', 'Call reveal', 'Credit purchase'
    provider_id = db.Column(db.Integer, db.ForeignKey('providers.id'), nullable=True, index=True)  # For provider-related transactions
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=True, index=True)  # For job-related transactions
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    customer = db.relationship('Customer', backref='credit_transactions', lazy=True)
    provider = db.relationship('Provider', backref='credit_transactions', lazy=True)
    job = db.relationship('Job', backref='credit_transactions', lazy=True)
    
    def __repr__(self):
        return f'<CreditTransaction {self.id}: {self.transaction_type} {self.amount}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'customer_id': self.customer_id,
            'transaction_type': self.transaction_type,
            'amount': self.amount,
            'description': self.description,
            'provider_id': self.provider_id,
            'job_id': self.job_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

