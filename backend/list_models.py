"""List Available Gemini Models"""
from dotenv import load_dotenv
import os
import google.generativeai as genai

load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')
print(f"API Key found: {api_key[:20]}..." if api_key else "API Key not found")

try:
    genai.configure(api_key=api_key)
    
    print("\nAvailable models:")
    for model in genai.list_models():
        if 'generateContent' in model.supported_generation_methods:
            print(f"  - {model.name}")
            
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
