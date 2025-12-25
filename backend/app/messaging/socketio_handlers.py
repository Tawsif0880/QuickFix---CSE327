from flask import request
from flask_jwt_extended import decode_token
from extensions import socketio, db
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.models.customer import Customer
from app.models.provider import Provider
from app.models.provider_credit_transaction import ProviderCreditTransaction
from app.models.credit_transaction import CreditTransaction
from datetime import datetime


def calculate_credits_for_3_messages(provider_rating):
    """Calculate credits needed for 3 messages based on provider rating"""
    # Handle None or 0.0 as NA
    if provider_rating is None or provider_rating == 0.0:
        return 6  # NA counts as 6 credits for 3 messages
    
    if provider_rating >= 4.5:
        return 6  # 6 credits for 3 messages
    elif provider_rating >= 4.0:
        return 4  # 4 credits for 3 messages
    elif provider_rating >= 3.0:
        return 3  # 3 credits for 3 messages
    else:
        return 2  # 2 credits for 3 messages


def calculate_provider_credits_per_3_messages(provider_rating):
    """Calculate provider credits earned per 3 customer messages based on provider rating"""
    # Handle None or 0.0 as NA
    if provider_rating is None or provider_rating == 0.0:
        return 3.0  # NA counts as 3.0 credits per 3 messages
    
    if provider_rating >= 4.5:
        return 3.0
    elif provider_rating >= 4.0:
        return 2.0
    elif provider_rating >= 3.0:
        return 1.5
    else:
        return 1.0


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
        provider_credits_awarded = 0
        
        if user.role == 'customer':
            if not user.customer:
                return {'error': 'Customer profile not found'}
            
            # Get provider rating
            provider = conversation.provider
            provider_rating = provider.rating_avg if provider else None
            
            # Increment customer message count first
            conversation.customer_message_count += 1
            
            # Calculate credits needed for 3 messages
            credits_for_3_messages = calculate_credits_for_3_messages(provider_rating)
            
            # Deduct credits only every 3 messages
            if conversation.customer_message_count % 3 == 0:
                # Check if customer has enough credits for 3 messages
                if user.customer.credits < credits_for_3_messages:
                    # Rollback the count increment
                    conversation.customer_message_count -= 1
                    db.session.rollback()
                    return {
                        'error': 'Insufficient credits',
                        'required': credits_for_3_messages,
                        'available': user.customer.credits,
                        'message': f'You need {credits_for_3_messages} credits to send 3 messages. You have {user.customer.credits} credits.'
                    }
                
                # Deduct credits for 3 messages
                user.customer.credits -= credits_for_3_messages
                
                # Ensure credits never go negative (safety check)
                if user.customer.credits < 0:
                    user.customer.credits = 0
                
                credits_deducted = credits_for_3_messages
                remaining_credits = user.customer.credits
                
                # Create customer credit transaction record
                transaction = CreditTransaction(
                    customer_id=user.customer.id,
                    transaction_type='deduction',
                    amount=-credits_for_3_messages,  # Negative for deduction
                    description=f'Credits deducted for 3 messages (batch #{conversation.customer_message_count // 3})',
                    provider_id=provider.id if provider else None
                )
                db.session.add(transaction)
            
            # Award provider credits every 3 customer messages
            if conversation.customer_message_count % 3 == 0 and provider:
                provider_rating = provider.rating_avg if provider else None
                credits_to_award = calculate_provider_credits_per_3_messages(provider_rating)
                
                # Award credits to provider
                provider.credits += credits_to_award
                provider_credits_awarded = credits_to_award
                
                # Create provider credit transaction record
                transaction = ProviderCreditTransaction(
                    provider_id=provider.id,
                    transaction_type='message_batch',
                    amount=credits_to_award,
                    status='completed',
                    method=None,
                    description=f'Credits earned for 3 customer messages (batch #{conversation.customer_message_count // 3})'
                )
                db.session.add(transaction)
        
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
        if user.role == 'customer':
            message_data['customer_message_count'] = conversation.customer_message_count
            message_data['next_credit_deduction_at'] = ((conversation.customer_message_count // 3) + 1) * 3
            if credits_deducted > 0:
                message_data['credits_deducted'] = credits_deducted
                message_data['remaining_credits'] = remaining_credits
        if provider_credits_awarded > 0:
            message_data['provider_credits_awarded'] = provider_credits_awarded
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
        
        result = {
            'status': 'sent',
            'message': message_data,
            'provider_credits_awarded': provider_credits_awarded
        }
        if user.role == 'customer':
            result['customer_message_count'] = conversation.customer_message_count
            result['next_credit_deduction_at'] = ((conversation.customer_message_count // 3) + 1) * 3
            if credits_deducted > 0:
                result['credits_deducted'] = credits_deducted
                result['remaining_credits'] = remaining_credits
        return result
    
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

