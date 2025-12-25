"""
Verification script to check if Gemini AI Chatbot is properly configured
Run this to verify all components are in place before using the chatbot
"""
import os
import sys

def check_environment():
    """Check if GEMINI_API_KEY is set"""
    api_key = os.getenv('GEMINI_API_KEY')
    if api_key:
        print("✅ GEMINI_API_KEY is set")
        print(f"   Key preview: {api_key[:10]}...{api_key[-5:]}")
        return True
    else:
        print("❌ GEMINI_API_KEY not set")
        print("   Please set it with:")
        print("   Windows (PowerShell): $env:GEMINI_API_KEY='your_key_here'")
        print("   Windows (CMD): set GEMINI_API_KEY=your_key_here")
        print("   Linux/Mac: export GEMINI_API_KEY=your_key_here")
        print("\n   Or add to .env file:")
        print("   GEMINI_API_KEY=your_key_here")
        return False

def check_packages():
    """Check if required packages are installed"""
    packages = {
        'google.generativeai': 'google-generativeai',
        'flask': 'flask',
        'flask_jwt_extended': 'flask-jwt-extended',
        'sqlalchemy': 'sqlalchemy'
    }
    
    all_installed = True
    for module, package in packages.items():
        try:
            __import__(module)
            print(f"✅ {package} is installed")
        except ImportError:
            print(f"❌ {package} is not installed")
            print(f"   Install with: pip install {package}")
            all_installed = False
    
    return all_installed

def check_files():
    """Check if required files exist"""
    required_files = [
        'app/bot/gemini_service.py',
        'app/bot/routes.py',
        'app/models/chat_session.py'
    ]
    
    all_exist = True
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"✅ {file_path} exists")
        else:
            print(f"❌ {file_path} not found")
            all_exist = False
    
    return all_exist

def check_frontend_files():
    """Check if frontend files exist"""
    required_files = [
        '../customer-pwa/src/pages/ChatAI.jsx',
        '../customer-pwa/src/pages/ChatAI.css',
        '../customer-pwa/src/services/chatService.js'
    ]
    
    all_exist = True
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"✅ {file_path} exists")
        else:
            print(f"❌ {file_path} not found")
            all_exist = False
    
    return all_exist

def test_gemini_connection():
    """Test connection to Gemini API"""
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("⚠️  Skipping Gemini connection test - API key not set")
        return False
    
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-pro')
        
        # Try a simple request
        response = model.generate_content("Say 'Hello' in one word")
        if response.text:
            print("✅ Gemini API connection successful")
            print(f"   Response: {response.text[:50]}...")
            return True
    except Exception as e:
        print(f"❌ Gemini API connection failed: {str(e)}")
        return False

def main():
    """Run all checks"""
    print("\n" + "="*60)
    print("🤖 Gemini AI Chatbot Configuration Verification")
    print("="*60 + "\n")
    
    checks = [
        ("Environment Variables", check_environment),
        ("Python Packages", check_packages),
        ("Backend Files", check_files),
        ("Frontend Files", check_frontend_files),
        ("Gemini API Connection", test_gemini_connection)
    ]
    
    results = []
    for check_name, check_func in checks:
        print(f"\n{check_name}:")
        print("-" * 40)
        try:
            result = check_func()
            results.append((check_name, result))
        except Exception as e:
            print(f"❌ Error during check: {str(e)}")
            results.append((check_name, False))
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    all_passed = all(result for _, result in results)
    
    for check_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {check_name}")
    
    if all_passed:
        print("\n🎉 All checks passed! Chatbot is ready to use.")
        print("\n📝 Next steps:")
        print("1. Make sure backend is running: python run.py")
        print("2. Make sure frontend is running: npm run dev (in customer-pwa)")
        print("3. Go to http://localhost:3000")
        print("4. Login with test credentials: testcustomer@test.com / test123")
        print("5. Click 'Chat With AI Assistant' on dashboard")
    else:
        print("\n⚠️  Some checks failed. Please fix the issues above.")
        print("For more help, see CHATBOT_SETUP.md")
    
    return 0 if all_passed else 1

if __name__ == '__main__':
    sys.exit(main())
