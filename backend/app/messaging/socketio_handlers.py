from flask import request
from flask_jwt_extended import decode_token
from extensions import socketio, db
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.models.customer import Customer
from datetime import datetime


def calculate_credits_for_message(provider_rating):
    """Calculate credits needed based on provider rating"""
    if provider_rating is None or provider_rating == 0.0:
        return 6  # NA counts as 6 credits
    elif provider_rating >= 4.5:
        return 6
    elif provider_rating >= 4.0:
        return 4
    elif provider_rating >= 3.0:
        return 2.5
    else:
        return 1


@socketio.on('join_conversation')
def handle_join_conversation(data):
    """Handle joining a conversation room"""
    conversation_id = data.get('conversation_id')
    token = data.get('token')
    
    if not conversation_id or not token:
        return {'error': 'conversation_id and token are required'}
    
    try:
        decoded = decode_token(token)
        user_id = decoded['sub']['id']
        
        # Verify user has access to conversation
        conversation = Conversation.query.get(conversation_id)
        if not conversation:
            return {'error': 'Conversation not found'}
        
        user = User.query.get(user_id)
        if not user:
            return {'error': 'User not found'}
        
        # Check authorization
        if user.role == 'customer' and conversation.customer_id != user.customer.id:
            return {'error': 'Unauthorized'}
        elif user.role == 'provider' and conversation.provider_id != user.provider.id:
            return {'error': 'Unauthorized'}
        
        # Join room
        room = f'conversation_{conversation_id}'
        socketio.server.enter_room(request.sid, room)
        
        return {'status': 'joined', 'conversation_id': conversation_id}
    
    except Exception as e:
        return {'error': str(e)}


@socketio.on('send_message')
def handle_send_message(data):
    """Handle sending a message via Socket.IO with credit deduction"""
    conversation_id = data.get('conversation_id')
    content = data.get('content')
    token = data.get('token')
    
    if not conversation_id or not content or not token:
        return {'error': 'conversation_id, content, and token are required'}
    
    try:
        decoded = decode_token(token)
        user_id = decoded['sub']['id']
        user = User.query.get(user_id)
        
        if not user:
            return {'error': 'User not found'}
        
        conversation = Conversation.query.get(conversation_id)
        if not conversation:
            return {'error': 'Conversation not found'}
        
        # Authorization check
        if user.role == 'customer' and conversation.customer_id != user.customer.id:
            return {'error': 'Unauthorized'}
        elif user.role == 'provider' and conversation.provider_id != user.provider.id:
            return {'error': 'Unauthorized'}
        
        # Determine receiver
        if user.role == 'customer':
            receiver_id = conversation.provider.user_id
        else:
            receiver_id = conversation.customer.user_id
        
        # Credit deduction logic (only for customer messages)
        credits_deducted = 0
        remaining_credits = None
        if user.role == 'customer':
            if not user.customer:
                return {'error': 'Customer profile not found'}
            
            # Get provider rating
            provider = conversation.provider
            provider_rating = provider.rating_avg if provider else None
            
            # Calculate credits needed
            credits_needed = calculate_credits_for_message(provider_rating)
            
            # Check if customer has enough credits
            if user.customer.credits < credits_needed:
                return {
                    'error': 'Insufficient credits',
                    'required': credits_needed,
                    'available': user.customer.credits
                }
            
            # Deduct credits (round 2.5 to 3 for integer storage)
            credits_to_deduct = int(round(credits_needed))
            user.customer.credits -= credits_to_deduct
            
            # Ensure credits never go negative (safety check)
            if user.customer.credits < 0:
                user.customer.credits = 0
            
            credits_deducted = credits_to_deduct
            remaining_credits = user.customer.credits
        
        # Create message
        message = Message(
            conversation_id=conversation_id,
            sender_id=user.id,
            receiver_id=receiver_id,
            content=content
        )
        db.session.add(message)
        conversation.last_message_at = datetime.utcnow()
        db.session.commit()
        
        # Broadcast message to room
        room = f'conversation_{conversation_id}'
        message_data = message.to_dict()
        if credits_deducted > 0:
            message_data['credits_deducted'] = credits_deducted
            message_data['remaining_credits'] = remaining_credits
        socketio.emit('message', message_data, room=room)
        
        # Broadcast unread count update to receiver
        receiver_room = f'user_{receiver_id}'
        unread_count = Message.query.filter_by(
            conversation_id=conversation_id,
            receiver_id=receiver_id,
            is_read=False
        ).count()
        socketio.emit('unread_count_update', {
            'conversation_id': conversation_id,
            'unread_count': unread_count
        }, room=receiver_room)
        
        return {
            'status': 'sent',
            'message': message_data,
            'credits_deducted': credits_deducted,
            'remaining_credits': remaining_credits
        }
    
    except Exception as e:
        db.session.rollback()
        return {'error': str(e)}


@socketio.on('join_user_room')
def handle_join_user_room(data):
    """Handle joining user's personal room for unread count updates"""
    token = data.get('token')
    
    if not token:
        return {'error': 'token is required'}
    
    try:
        decoded = decode_token(token)
        user_id = decoded['sub']['id']
        
        # Join user's personal room
        room = f'user_{user_id}'
        socketio.server.enter_room(request.sid, room)
        
        return {'status': 'joined', 'user_id': user_id}
    
    except Exception as e:
        return {'error': str(e)}

