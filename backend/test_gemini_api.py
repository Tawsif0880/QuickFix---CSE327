"""Test Gemini API Connection"""
from dotenv import load_dotenv
import os
import google.generativeai as genai

load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')
print(f"API Key found: {api_key[:20]}..." if api_key else "API Key not found")

try:
    genai.configure(api_key=api_key)
    
    # Use the correct model name
    model = genai.GenerativeModel('gemini-2.5-flash')
    print("Using model: gemini-2.5-flash")
    
    # Test with a simple prompt
    response = model.generate_content("Say 'Hello, I am working!' in one sentence.")
    print("\n✅ Gemini API is working!")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"\n❌ Gemini API Error: {str(e)}")
