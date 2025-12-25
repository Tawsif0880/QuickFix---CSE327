from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from app.models.chat_session import ChatSession, ChatMessage
from app.models.user import User
from app.bot.gemini_service import get_gemini_service, GeminiChatService
from app.bot.conversation_flow import ConversationFlow, ConversationStage, ServiceCategory
from app.utils.decorators import get_user_id_from_jwt
from datetime import datetime
import os
import json

bot_bp = Blueprint('bot', __name__)

# Store active chat instances per session
_active_chats = {}
# Store conversation flows per session
_conversation_flows = {}


def get_user_or_404(user_id):
    """Get user or return 404"""
    user = User.query.get(user_id)
    if not user:
        return None
    return user


# ==================== PROBLEM DIAGNOSIS FLOW ====================

@bot_bp.route('/diagnose/start', methods=['POST'])
@jwt_required()
def start_diagnosis():
    """Start a new problem diagnosis session"""
    current_user = get_jwt_identity()
    user_id = get_user_id_from_jwt(current_user)
    
    try:
        user = get_user_or_404(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Create a new chat session
        session = ChatSession(
            user_id=user_id,
            title=f'Diagnosis - {datetime.utcnow().strftime("%Y-%m-%d %H:%M")}',
            context_type='service',
            messages=[]
        )
        db.session.add(session)
        db.session.flush()
        
        # Create conversation flow
        flow = ConversationFlow(user_id, session.id)
        _conversation_flows[session.id] = flow
        
        # Get greeting
        greeting = flow.get_greeting_message()
        session.add_message('assistant', greeting['message'])
        db.session.commit()
        
        return jsonify({
            'success': True,
            'session_id': session.id,
            'stage': greeting['stage'],
            'message': greeting['message'],
            'next_action': greeting['next_action']
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bot_bp.route('/diagnose/<int:session_id>/categories', methods=['GET'])
@jwt_required()
def get_categories(session_id):
    """Get service categories"""
    current_user = get_jwt_identity()
    user_id = get_user_id_from_jwt(current_user)
    
    try:
        session = ChatSession.query.filter_by(
            id=session_id,
            user_id=user_id
        ).first()
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Get or create flow
        if session_id not in _conversation_flows:
            _conversation_flows[session_id] = ConversationFlow(user_id, session_id)
        
        flow = _conversation_flows[session_id]
        category_options = flow.get_category_options()
        
        return jsonify({
            'success': True,
            'stage': category_options['stage'],
            'message': category_options['message'],
            'options': category_options['options'],
            'next_action': category_options['next_action']
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bot_bp.route('/diagnose/<int:session_id>/set-category', methods=['POST'])
@jwt_required()
def set_category(session_id):
    """Set service category and ask for problem description"""
    current_user = get_jwt_identity()
    user_id = get_user_id_from_jwt(current_user)
    data = request.get_json() or {}
    
    if not data.get('category'):
        return jsonify({'error': 'Category is required'}), 400
    
    try:
        session = ChatSession.query.filter_by(
            id=session_id,
            user_id=user_id
        ).first()
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Get or create flow
        if session_id not in _conversation_flows:
            _conversation_flows[session_id] = ConversationFlow(user_id, session_id)
        
        flow = _conversation_flows[session_id]
        result = flow.set_category(data.get('category'))
        
        if 'error' in result:
            return jsonify(result), 400
        
        # Save to session
        session.add_message('user', f"I need help with: {data.get('category')}")
        session.add_message('assistant', result['message'])
        db.session.commit()
        
        return jsonify({
            'success': True,
            'stage': result['stage'],
            'message': result['message'],
            'suggested_issues': result['suggested_issues'],
            'next_action': result['next_action']
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bot_bp.route('/diagnose/<int:session_id>/set-problem', methods=['POST'])
@jwt_required()
def set_problem(session_id):
    """Set problem description and ask for details"""
    current_user = get_jwt_identity()
    user_id = get_user_id_from_jwt(current_user)
    data = request.get_json() or {}
    
    if not data.get('description'):
        return jsonify({'error': 'Problem description is required'}), 400
    
    try:
        session = ChatSession.query.filter_by(
            id=session_id,
            user_id=user_id
        ).first()
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Get flow
        if session_id not in _conversation_flows:
            return jsonify({'error': 'Session not initialized'}), 400
        
        flow = _conversation_flows[session_id]
        result = flow.set_problem_description(data.get('description'))
        
        # Save to session
        session.add_message('user', data.get('description'))
        session.add_message('assistant', result['message'])
        db.session.commit()
        
        return jsonify({
            'success': True,
            'stage': result['stage'],
            'message': result['message'],
            'details_needed': result['details_needed'],
            'next_action': result['next_action']
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bot_bp.route('/diagnose/<int:session_id>/analyze', methods=['POST'])
@jwt_required()
def analyze_situation(session_id):
    """Analyze the detailed situation and provide diagnosis"""
    current_user = get_jwt_identity()
    user_id = get_user_id_from_jwt(current_user)
    data = request.get_json() or {}
    
    if not data.get('details'):
        return jsonify({'error': 'Detailed situation is required'}), 400
    
    try:
        session = ChatSession.query.filter_by(
            id=session_id,
            user_id=user_id
        ).first()
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Get flow
        if session_id not in _conversation_flows:
            return jsonify({'error': 'Session not initialized'}), 400
        
        flow = _conversation_flows[session_id]
        analysis = flow.set_detailed_situation(data.get('details'))
        
        # Save to session
        session.add_message('user', data.get('details'))
        
        # Create analysis message
        analysis_message = f"""
Based on your description:
- **Severity**: {analysis['severity'].capitalize()}
- **Diagnosis**: {analysis['diagnosis']['analysis']}

**DIY Tips:**
{chr(10).join([f"• {tip}" for tip in analysis['diy_solutions'][:3]])}

**Risk Assessment**: {', '.join(analysis['risk_assessment']).capitalize()}

**Professional Help Needed**: {'Yes - Recommended' if analysis['professional_needed'] else 'Optional'}
"""
        session.add_message('assistant', analysis_message)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'stage': analysis['stage'],
            'severity': analysis['severity'],
            'diagnosis': analysis['diagnosis'],
            'diy_solutions': analysis['diy_solutions'],
            'risk_assessment': analysis['risk_assessment'],
            'professional_needed': analysis['professional_needed'],
            'next_action': analysis['next_action']
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bot_bp.route('/diagnose/<int:session_id>/recommendation', methods=['GET'])
@jwt_required()
def get_recommendation(session_id):
    """Get provider recommendation"""
    current_user = get_jwt_identity()
    user_id = get_user_id_from_jwt(current_user)
    
    try:
        session = ChatSession.query.filter_by(
            id=session_id,
            user_id=user_id
        ).first()
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Get flow
        if session_id not in _conversation_flows:
            return jsonify({'error': 'Session not initialized'}), 400
        
        flow = _conversation_flows[session_id]
        recommendation = flow.get_recommendation()
        offer = flow.get_provider_offer()
        
        # Save to session
        session.add_message('assistant', recommendation['message'])
        session.add_message('assistant', offer['message'])
        db.session.commit()
        
        return jsonify({
            'success': True,
            'recommendation': recommendation,
            'offer': offer,
            'category': flow.service_category
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bot_bp.route('/diagnose/<int:session_id>/ask', methods=['POST'])
@jwt_required()
def ask_question(session_id):
    """Ask follow-up questions using AI after diagnosis"""
    current_user = get_jwt_identity()
    user_id = get_user_id_from_jwt(current_user)
    data = request.get_json() or {}
    
    question = data.get('question', '').strip()
    if not question:
        return jsonify({'error': 'Question is required'}), 400
    
    try:
        session = ChatSession.query.filter_by(
            id=session_id,
            user_id=user_id
        ).first()
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Get flow context
        if session_id not in _conversation_flows:
            return jsonify({'error': 'Session not initialized'}), 400
        
        flow = _conversation_flows[session_id]
        
        # Use AI to answer with context
        gemini_service = get_gemini_service()
        
        # Create context-aware prompt
        context_prompt = f"""You are QuickFix AI Assistant helping with a {flow.service_category} issue.

Previous Context:
- Problem: {flow.problem_description}
- Details: {flow.detailed_situation}

User's question: {question}

Provide a helpful, concise answer (2-3 sentences) based on the context. Be friendly and professional. 
If the question is about pricing, timing, or finding providers, mention that they can hire a verified professional through the QuickFix platform."""

        response_text = gemini_service.get_quick_response(context_prompt)
        
        # Save to session
        session.add_message('user', question)
        session.add_message('assistant', response_text)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'question': question,
            'answer': response_text
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bot_bp.route('/health', methods=['GET'])
def health_check():
    """Check if chatbot service is available"""
    try:
        service = get_gemini_service()
        return jsonify({
            'status': 'ok',
            'service': 'Gemini AI Chatbot',
            'message': 'Chatbot service is running'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Chatbot service is not available',
            'error': str(e)
        }), 503


@bot_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_sessions():
    """Get all chat sessions for the current user"""
    current_user = get_jwt_identity()
    user_id = get_user_id_from_jwt(current_user)
    
    try:
        sessions = ChatSession.query.filter_by(
            user_id=user_id,
            is_active=True
        ).order_by(ChatSession.updated_at.desc()).all()
        
        return jsonify({
            'success': True,
            'sessions': [session.to_dict(include_messages=False) for session in sessions]
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bot_bp.route('/sessions', methods=['POST'])
@jwt_required()
def create_session():
    """Create a new chat session"""
    current_user = get_jwt_identity()
    user_id = get_user_id_from_jwt(current_user)
    data = request.get_json() or {}
    
    try:
        user = get_user_or_404(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        context_type = data.get('context_type', 'general')
        title = data.get('title', f'Chat - {datetime.utcnow().strftime("%Y-%m-%d %H:%M")}')
        
        session = ChatSession(
            user_id=user_id,
            title=title,
            context_type=context_type,
            messages=[]
        )
        
        db.session.add(session)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'session': session.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bot_bp.route('/sessions/<int:session_id>', methods=['GET'])
@jwt_required()
def get_session(session_id):
    """Get a specific chat session"""
    current_user = get_jwt_identity()
    user_id = get_user_id_from_jwt(current_user)
    
    try:
        session = ChatSession.query.filter_by(
            id=session_id,
            user_id=user_id
        ).first()
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        return jsonify({
            'success': True,
            'session': session.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bot_bp.route('/sessions/<int:session_id>/message', methods=['POST'])
@jwt_required()
def send_message(session_id):
    """Send a message in a chat session"""
    current_user = get_jwt_identity()
    user_id = get_user_id_from_jwt(current_user)
    data = request.get_json() or {}
    
    if not data.get('message'):
        return jsonify({'error': 'Message content is required'}), 400
    
    try:
        # Get or create chat session
        session = ChatSession.query.filter_by(
            id=session_id,
            user_id=user_id
        ).first()
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        user_message = data.get('message').strip()
        
        # Initialize Gemini service
        try:
            gemini_service = get_gemini_service()
        except ValueError as e:
            return jsonify({
                'error': 'Gemini API is not configured. Please set GEMINI_API_KEY environment variable.',
                'details': str(e)
            }), 503
        
        # Start or get existing chat
        if session_id not in _active_chats:
            chat_instance = gemini_service.start_chat()
            _active_chats[session_id] = chat_instance
        
        # Send message to Gemini
        response_data = gemini_service.send_message(user_message)
        
        if not response_data['success']:
            return jsonify({
                'success': False,
                'error': response_data.get('error', 'Failed to get response')
            }), 500
        
        ai_response = response_data.get('response')
        
        # Save message to database
        session.add_message(
            sender_type='user',
            content=user_message,
            response=ai_response
        )
        
        # Also save individual message record
        chat_msg = ChatMessage(
            session_id=session_id,
            sender_type='user',
            content=user_message,
            response=ai_response
        )
        db.session.add(chat_msg)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'user_message': user_message,
            'ai_response': ai_response,
            'session': session.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bot_bp.route('/sessions/<int:session_id>', methods=['DELETE'])
@jwt_required()
def delete_session(session_id):
    """Delete a chat session"""
    current_user = get_jwt_identity()
    user_id = get_user_id_from_jwt(current_user)
    
    try:
        session = ChatSession.query.filter_by(
            id=session_id,
            user_id=user_id
        ).first()
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        # Soft delete
        session.is_active = False
        
        # Clear from active chats cache
        if session_id in _active_chats:
            del _active_chats[session_id]
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Session deleted'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bot_bp.route('/quick-response', methods=['POST'])
@jwt_required()
def quick_response():
    """Get a quick response without creating a session"""
    data = request.get_json() or {}
    
    if not data.get('prompt'):
        return jsonify({'error': 'Prompt is required'}), 400
    
    try:
        gemini_service = get_gemini_service()
        response = gemini_service.get_quick_response(data.get('prompt'))
        
        return jsonify({
            'success': True,
            'response': response
        }), 200
    except ValueError as e:
        return jsonify({
            'error': 'Gemini API is not configured',
            'details': str(e)
        }), 503
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@bot_bp.route('/context-info', methods=['GET'])
def get_context_info():
    """Get information about available contexts"""
    return jsonify({
        'contexts': {
            'general': 'General assistance and questions',
            'service': 'Service information and recommendations',
            'booking': 'Help with booking services',
            'support': 'Customer support and troubleshooting'
        }
    }), 200
