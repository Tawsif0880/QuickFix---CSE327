from flask import request, jsonify
from app.messaging import messaging_bp
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db, socketio
from datetime import datetime
from app.models.user import User
from app.models.customer import Customer
from app.models.provider import Provider
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.provider_credit_transaction import ProviderCreditTransaction
from app.utils.decorators import customer_required, provider_required, get_user_id_from_jwt


@messaging_bp.route('', methods=['POST'], endpoint='start_conversation')
@jwt_required()
@customer_required
def start_conversation():
    """Start a conversation with a provider"""
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    if not user.customer:
        return jsonify({'error': 'Customer profile not found'}), 404
    
    data = request.get_json()
    provider_id = data.get('provider_id')
    
    if not provider_id:
        return jsonify({'error': 'provider_id is required'}), 400
    
    provider = Provider.query.get(provider_id)
    if not provider:
        return jsonify({'error': 'Provider not found'}), 404
    
    # CRITICAL: Customers cannot start conversations with unavailable providers
    if not provider.is_available:
        return jsonify({'error': 'Provider is not available'}), 403
    
    # Check if conversation already exists
    existing_conv = Conversation.query.filter_by(
        customer_id=user.customer.id,
        provider_id=provider_id
    ).first()
    
    if existing_conv:
        return jsonify({
            'message': 'Conversation already exists',
            'conversation': existing_conv.to_dict()
        }), 200
    
    try:
        conversation = Conversation(
            customer_id=user.customer.id,
            provider_id=provider_id
        )
        db.session.add(conversation)
        db.session.commit()
        
        return jsonify({
            'message': 'Conversation started',
            'conversation': conversation.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@messaging_bp.route('/unread-count', methods=['GET'], endpoint='get_unread_count')
@jwt_required()
def get_unread_count():
    """Get total unread message count for the user"""
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    # Count all unread messages where user is the receiver
    unread_count = Message.query.filter_by(
        receiver_id=user.id,
        is_read=False
    ).count()
    
    return jsonify({
        'unread_count': unread_count
    }), 200


@messaging_bp.route('', methods=['GET'], endpoint='get_conversations')
@jwt_required()
def get_conversations():
    """Get user's conversations"""
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    conversations = []
    
    if user.role == 'customer' and user.customer:
        conversations = Conversation.query.filter_by(
            customer_id=user.customer.id
        ).order_by(Conversation.last_message_at.desc()).all()
    
    elif user.role == 'provider' and user.provider:
        conversations = Conversation.query.filter_by(
            provider_id=user.provider.id
        ).order_by(Conversation.last_message_at.desc()).all()
    
    conversations_data = []
    for conv in conversations:
        conv_data = conv.to_dict()
        # Get last message
        last_message = Message.query.filter_by(conversation_id=conv.id).order_by(Message.created_at.desc()).first()
        if last_message:
            conv_data['last_message'] = last_message.to_dict()
        # Get unread count
        unread_count = Message.query.filter_by(
            conversation_id=conv.id,
            receiver_id=user.id,
            is_read=False
        ).count()
        conv_data['unread_count'] = unread_count
        
        # Add provider/customer info based on role
        if user.role == 'customer' and conv.provider:
            conv_data['provider'] = conv.provider.to_dict(include_contact=False)
        elif user.role == 'provider' and conv.customer:
            conv_data['customer'] = conv.customer.to_dict()
        
        conversations_data.append(conv_data)
    
    return jsonify({
        'conversations': conversations_data,
        'count': len(conversations_data)
    }), 200


@messaging_bp.route('/<int:conversation_id>/messages', methods=['GET'], endpoint='get_messages')
@jwt_required()
def get_messages(conversation_id):
    """Get messages in a conversation"""
    conversation = Conversation.query.get_or_404(conversation_id)
    
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    # Authorization check
    if user.role == 'customer' and conversation.customer_id != user.customer.id:
        return jsonify({'error': 'Unauthorized'}), 403
    elif user.role == 'provider' and conversation.provider_id != user.provider.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    messages = Message.query.filter_by(conversation_id=conversation_id).order_by(Message.created_at.asc()).all()
    
    # Mark messages as read
    unread_messages = Message.query.filter_by(
        conversation_id=conversation_id,
        receiver_id=user.id,
        is_read=False
    ).all()
    
    for msg in unread_messages:
        msg.is_read = True
    
    db.session.commit()
    
    response_data = {
        'messages': [msg.to_dict() for msg in messages],
        'count': len(messages)
    }
    
    # Include customer message count for customers
    if user.role == 'customer':
        response_data['customer_message_count'] = conversation.customer_message_count
        response_data['next_credit_deduction_at'] = ((conversation.customer_message_count // 3) + 1) * 3
    
    return jsonify(response_data), 200


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


@messaging_bp.route('/<int:conversation_id>/messages', methods=['POST'], endpoint='send_message')
@jwt_required()
def send_message(conversation_id):
    """Send a message in a conversation"""
    conversation = Conversation.query.get_or_404(conversation_id)
    
    current_user = get_jwt_identity()
    user = User.query.get(get_user_id_from_jwt(current_user))
    
    # Authorization check
    if user.role == 'customer' and conversation.customer_id != user.customer.id:
        return jsonify({'error': 'Unauthorized'}), 403
    elif user.role == 'provider' and conversation.provider_id != user.provider.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    content = data.get('content')
    
    if not content:
        return jsonify({'error': 'Message content is required'}), 400
    
    # Determine receiver
    if user.role == 'customer':
        receiver_id = conversation.provider.user_id
    else:
        receiver_id = conversation.customer.user_id
    
    # Credit deduction logic (only for customer messages)
    credits_deducted = 0
    provider_credits_awarded = 0
    
    if user.role == 'customer':
        if not user.customer:
            return jsonify({'error': 'Customer profile not found'}), 404
        
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
                return jsonify({
                    'error': 'Insufficient credits',
                    'required': credits_for_3_messages,
                    'available': user.customer.credits,
                    'message': f'You need {credits_for_3_messages} credits to send 3 messages. You have {user.customer.credits} credits.'
                }), 402  # 402 Payment Required
            
            # Deduct credits for 3 messages
            user.customer.credits -= credits_for_3_messages
            
            # Ensure credits never go negative (safety check)
            if user.customer.credits < 0:
                user.customer.credits = 0
            
            credits_deducted = credits_for_3_messages
            
            # Create customer credit transaction record
            from app.models.credit_transaction import CreditTransaction
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
    
    try:
        message = Message(
            conversation_id=conversation_id,
            sender_id=user.id,
            receiver_id=receiver_id,
            content=content
        )
        db.session.add(message)
        
        # Update conversation last_message_at
        conversation.last_message_at = datetime.utcnow()
        
        db.session.commit()
        
        # Emit Socket.IO event for real-time delivery
        socketio.emit('message', message.to_dict(), room=f'conversation_{conversation_id}')
        
        response_data = {
            'message': 'Message sent',
            'message_data': message.to_dict()
        }
        
        # Include credit info if customer sent the message
        if user.role == 'customer':
            response_data['customer_message_count'] = conversation.customer_message_count
            response_data['next_credit_deduction_at'] = ((conversation.customer_message_count // 3) + 1) * 3
            if credits_deducted > 0:
                response_data['credits_deducted'] = credits_deducted
                response_data['remaining_credits'] = user.customer.credits
        
        # Include provider credits awarded if applicable
        if provider_credits_awarded > 0:
            response_data['provider_credits_awarded'] = provider_credits_awarded
        
        return jsonify(response_data), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

