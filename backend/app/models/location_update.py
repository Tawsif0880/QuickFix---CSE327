from extensions import db
from datetime import datetime


class LocationUpdate(db.Model):
    """Provider location tracking model"""
    __tablename__ = 'location_updates'
    
    id = db.Column(db.Integer, primary_key=True)
    provider_id = db.Column(db.Integer, db.ForeignKey('providers.id'), nullable=False, index=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def __repr__(self):
        return f'<LocationUpdate {self.provider_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'provider_id': self.provider_id,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

