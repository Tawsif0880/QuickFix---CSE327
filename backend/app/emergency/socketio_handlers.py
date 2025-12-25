from flask import request
from flask_jwt_extended import decode_token
from extensions import socketio
from app.models.user import User


@socketio.on('join_provider_room')
def handle_join_provider_room(data):
    """Handle provider joining their personal room for emergency updates"""
    token = data.get('token')
    
    if not token:
        return {'error': 'token is required'}
    
    try:
        decoded = decode_token(token)
        user_id = decoded['sub']['id']
        
        user = User.query.get(user_id)
        if not user or user.role != 'provider':
            return {'error': 'Provider access required'}
        
        # Join provider's personal room for emergency updates
        room = f'provider_{user_id}'
        socketio.server.enter_room(request.sid, room)
        
        return {'status': 'joined', 'user_id': user_id, 'room': room}
    
    except Exception as e:
        return {'error': str(e)}
