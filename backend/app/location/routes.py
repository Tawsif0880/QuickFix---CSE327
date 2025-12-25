from flask import request, jsonify
from app.location import location_bp
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from app.models.user import User
from app.models.provider import Provider
from app.models.location_update import LocationUpdate
from app.utils.decorators import provider_required


@location_bp.route('/<int:provider_id>', methods=['GET'])
@jwt_required()
def get_provider_location(provider_id):
    """Get current provider location"""
    provider = Provider.query.get_or_404(provider_id)
    
    # Get latest location update
    location = LocationUpdate.query.filter_by(provider_id=provider_id).order_by(LocationUpdate.timestamp.desc()).first()
    
    if not location:
        return jsonify({'error': 'Location not available'}), 404
    
    return jsonify(location.to_dict()), 200

