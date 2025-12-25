from extensions import db
from datetime import datetime


class SavedJob(db.Model):
    """Saved job model for providers to save jobs for later"""
    __tablename__ = 'saved_jobs'
    
    id = db.Column(db.Integer, primary_key=True)
    provider_id = db.Column(db.Integer, db.ForeignKey('providers.id'), nullable=False, index=True)
    service_request_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    provider = db.relationship('Provider', backref='saved_jobs', lazy=True)
    service_request = db.relationship('Job', backref='saved_by_providers', lazy=True)
    
    # Unique constraint: provider can only save a job once
    __table_args__ = (db.UniqueConstraint('provider_id', 'service_request_id', name='_provider_job_uc'),)
    
    def __repr__(self):
        return f'<SavedJob {self.id}: Provider {self.provider_id} -> Job {self.service_request_id}>'
    
    def to_dict(self, include_job=False):
        data = {
            'id': self.id,
            'provider_id': self.provider_id,
            'service_request_id': self.service_request_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_job and self.service_request:
            data['service_request'] = self.service_request.to_dict(include_customer=True)
        return data
