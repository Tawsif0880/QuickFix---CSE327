from extensions import db
from datetime import datetime


class ProviderCreditTransaction(db.Model):
    """Provider credit transaction model for auditing credit redemptions and deductions"""
    __tablename__ = 'provider_credit_transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    provider_id = db.Column(db.Integer, db.ForeignKey('providers.id'), nullable=False, index=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=True, index=True)  # For job acceptance fees
    transaction_type = db.Column(db.String(30), nullable=False, index=True)  # 'redeem', 'job_acceptance_fee', 'emergency_service_earning', 'credit_purchase'
    amount = db.Column(db.Float, nullable=False)  # Amount redeemed or deducted (negative for deductions)
    status = db.Column(db.String(20), default='completed', nullable=False)  # 'completed', 'pending', 'failed'
    method = db.Column(db.String(50), nullable=True)  # 'bank', etc.
    description = db.Column(db.String(200), nullable=True)  # e.g., 'Bank transfer redemption', 'Job acceptance fee (5%)'
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    provider = db.relationship('Provider', backref='provider_credit_transactions', lazy=True)
    job = db.relationship('Job', backref='provider_credit_transactions', lazy=True)
    
    def __repr__(self):
        return f'<ProviderCreditTransaction {self.id}: {self.transaction_type} {self.amount}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'provider_id': self.provider_id,
            'job_id': self.job_id,
            'transaction_type': self.transaction_type,
            'amount': self.amount,
            'status': self.status,
            'method': self.method,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

