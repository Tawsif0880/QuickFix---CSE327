"""
Gemini AI Chat Service
Service to handle communication with Google's Gemini API
"""
import os
import google.generativeai as genai
from datetime import datetime


class GeminiChatService:
    """Service to handle Gemini AI interactions"""
    
    def __init__(self, api_key=None):
        """Initialize Gemini service with API key"""
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")
        
        genai.configure(api_key=self.api_key)
        # Use gemini-2.5-flash - optimized for free tier with good performance
        # Free tier limits: 15 RPM (requests per minute), 1 million TPM (tokens per minute)
        self.model = genai.GenerativeModel(
            'gemini-2.5-flash',
            generation_config={
                'temperature': 0.7,  # Balanced creativity/accuracy
                'top_p': 0.95,
                'top_k': 40,
                'max_output_tokens': 2048,  # Limit output for free tier
            },
            safety_settings=[
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        )
        
    def start_chat(self, system_prompt=None):
        """Start a new chat session with optional system prompt"""
        if system_prompt:
            # Create chat with system instruction
            self.chat = self.model.start_chat(
                history=[]
            )
            self._system_prompt = system_prompt
        else:
            self.chat = self.model.start_chat(
                history=[]
            )
            self._system_prompt = None
        return self.chat
    
    def send_message(self, user_message):
        """
        Send a message to Gemini and get response
        
        Args:
            user_message (str): The user's message
            
        Returns:
            dict: Response containing:
                - success (bool): Whether request was successful
                - response (str): AI response text
                - error (str): Error message if failed
        """
        try:
            if not hasattr(self, 'chat'):
                self.start_chat()
            
            # Send message and get response
            response = self.chat.send_message(user_message)
            
            return {
                'success': True,
                'response': response.text,
                'timestamp': datetime.utcnow().isoformat()
            }
        except Exception as e:
            error_msg = str(e)
            # Handle common free tier errors
            if 'quota' in error_msg.lower() or 'rate limit' in error_msg.lower():
                error_msg = "Rate limit exceeded. Please wait a moment and try again."
            elif '429' in error_msg:
                error_msg = "Too many requests. Please wait a few seconds and try again."
            elif 'api key' in error_msg.lower():
                error_msg = "API key configuration error. Please contact support."
            
            return {
                'success': False,
                'response': None,
                'error': error_msg,
                'timestamp': datetime.utcnow().isoformat()
            }
    
    def get_quick_response(self, prompt):
        """
        Get a quick response without maintaining chat history
        Useful for one-off queries
        
        Args:
            prompt (str): The prompt to send
            
        Returns:
            str: The AI response
        """
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            error_msg = str(e)
            # Handle common free tier errors
            if 'quota' in error_msg.lower() or 'rate limit' in error_msg.lower():
                return "Rate limit exceeded. Please wait a moment and try again."
            elif '429' in error_msg:
                return "Too many requests. Please wait a few seconds and try again."
            elif 'safety' in error_msg.lower():
                return "Response blocked due to safety settings. Please rephrase your question."
            return f"Error: {error_msg}"
    
    def create_system_prompt(self, context="general"):
        """
        Create a system prompt based on context
        
        Args:
            context (str): The context - 'general', 'service', 'booking', etc.
            
        Returns:
            str: System prompt for the context
        """
        prompts = {
            'general': """You are a helpful assistant for QuickFix, a service marketplace platform. 
You help customers find services, book appointments, and get support. 
Be friendly, professional, and helpful. Keep responses concise and clear.""",
            
            'service': """You are a QuickFix service expert assistant. 
Help customers understand different services, pricing, and how to book. 
Provide information about various service categories like plumbing, electrical work, carpentry, etc.
Be knowledgeable, helpful, and suggest relevant services based on customer needs.""",
            
            'booking': """You are a QuickFix booking assistant. 
Help customers with booking services, scheduling, and payment information. 
Provide clear guidance on the booking process and answer questions about availability.""",
            
            'support': """You are a QuickFix customer support specialist. 
Help resolve customer issues, answer FAQs, and provide guidance on platform features. 
Be empathetic, patient, and thorough in your responses."""
        }
        
        return prompts.get(context, prompts['general'])


# Initialize a global chat service instance
_chat_service = None

def get_gemini_service(api_key=None):
    """Get or create a Gemini service instance"""
    global _chat_service
    if _chat_service is None:
        _chat_service = GeminiChatService(api_key)
    return _chat_service


def initialize_gemini(app):
    """Initialize Gemini service with Flask app config"""
    global _chat_service
    api_key = app.config.get('GEMINI_API_KEY') or os.getenv('GEMINI_API_KEY')
    if api_key:
        try:
            _chat_service = GeminiChatService(api_key)
            print("✓ Gemini API service initialized successfully (gemini-2.5-flash)")
            print("✓ Free tier: 15 requests/min, optimized for performance")
        except Exception as e:
            print(f"✗ Failed to initialize Gemini service: {e}")
    else:
        print("⚠ GEMINI_API_KEY not found - chatbot will not be available")
