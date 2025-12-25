from extensions import db
from datetime import datetime
import json


class ChatSession(db.Model):
    """Chat Session model for AI chatbot conversations"""
    __tablename__ = 'chat_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=True)
    context_type = db.Column(db.String(50), default='general', nullable=False)  # general, service, booking, support
    messages = db.Column(db.JSON, default=list, nullable=False)  # Store conversation history
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = db.relationship('User', backref='chat_sessions')
    
    def __repr__(self):
        return f'<ChatSession {self.id} - User {self.user_id}>'
    
    def add_message(self, sender_type, content, response=None):
        """
        Add a message to the chat history
        
        Args:
            sender_type (str): 'user' or 'assistant'
            content (str): Message content
            response (str, optional): Assistant response if this is a user message
        """
        message_entry = {
            'id': len(self.messages) + 1,
            'sender_type': sender_type,
            'content': content,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        if response:
            message_entry['response'] = response
            message_entry['response_timestamp'] = datetime.utcnow().isoformat()
        
        self.messages.append(message_entry)
        self.updated_at = datetime.utcnow()
    
    def to_dict(self, include_messages=True):
        """Convert model to dictionary"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'context_type': self.context_type,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_messages:
            data['messages'] = self.messages
        
        return data
    
    def get_conversation_history(self):
        """Get formatted conversation history for Gemini"""
        history = []
        for msg in self.messages:
            if msg['sender_type'] == 'user':
                history.append({
                    'role': 'user',
                    'parts': [msg['content']]
                })
            else:
                if 'response' in msg:
                    history.append({
                        'role': 'model',
                        'parts': [msg['response']]
                    })
        return history


class ChatMessage(db.Model):
    """Individual chat message record"""
    __tablename__ = 'chat_messages'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('chat_sessions.id'), nullable=False, index=True)
    sender_type = db.Column(db.String(20), nullable=False)  # 'user' or 'assistant'
    content = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=True)
    tokens_used = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    session = db.relationship('ChatSession', backref='chat_messages')
    
    def __repr__(self):
        return f'<ChatMessage {self.id} - Session {self.session_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'sender_type': self.sender_type,
            'content': self.content,
            'response': self.response,
            'tokens_used': self.tokens_used,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
