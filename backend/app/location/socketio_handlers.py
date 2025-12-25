from flask import request
from flask_jwt_extended import decode_token
from extensions import socketio, db
from app.models.user import User
from app.models.provider import Provider
from app.models.location_update import LocationUpdate
from app.models.booking import Booking
from datetime import datetime


@socketio.on('update_location')
def handle_location_update(data):
    """Handle provider location update"""
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    token = data.get('token')
    
    if not latitude or not longitude or not token:
        return {'error': 'latitude, longitude, and token are required'}
    
    try:
        decoded = decode_token(token)
        user_id = decoded['sub']['id']
        user = User.query.get(user_id)
        
        if not user or user.role != 'provider':
            return {'error': 'Provider access required'}
        
        if not user.provider:
            return {'error': 'Provider profile not found'}
        
        # Create location update
        location_update = LocationUpdate(
            provider_id=user.provider.id,
            latitude=latitude,
            longitude=longitude
        )
        db.session.add(location_update)
        db.session.commit()
        
        # Get active bookings for this provider
        active_bookings = Booking.query.filter_by(
            provider_id=user.provider.id,
            status='in_progress'
        ).all()
        
        # Broadcast location to customers with active bookings
        for booking in active_bookings:
            if booking.customer and booking.customer.user:
                room = f'customer_{booking.customer.user_id}'
                socketio.emit('location_update', {
                    'provider_id': user.provider.id,
                    'provider_name': user.provider.name,
                    'latitude': latitude,
                    'longitude': longitude,
                    'timestamp': location_update.timestamp.isoformat()
                }, room=room)
        
        return {'status': 'updated', 'location': location_update.to_dict()}
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}


@socketio.on('subscribe_location')
def handle_subscribe_location(data):
    """Customer subscribes to provider location updates"""
    provider_id = data.get('provider_id')
    token = data.get('token')
    
    if not provider_id or not token:
        return {'error': 'provider_id and token are required'}
    
    try:
        decoded = decode_token(token)
        user_id = decoded['sub']['id']
        user = User.query.get(user_id)
        
        if not user or user.role != 'customer':
            return {'error': 'Customer access required'}
        
        # Check if customer has active booking with provider
        if not user.customer:
            return {'error': 'Customer profile not found'}
        
        active_booking = Booking.query.filter_by(
            customer_id=user.customer.id,
            provider_id=provider_id,
            status='in_progress'
        ).first()
        
        if not active_booking:
            return {'error': 'No active booking with this provider'}
        
        # Join room for location updates
        room = f'customer_{user_id}'
        socketio.server.enter_room(request.sid, room)
        
        return {'status': 'subscribed', 'provider_id': provider_id}
    
    except Exception as e:
        return {'error': str(e)}

