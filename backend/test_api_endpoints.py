"""Test Backend API Endpoints"""
import requests
import json

# Base URL (adjust if needed)
BASE_URL = "http://localhost:5000"

# You need a valid JWT token - get it from your login
# For testing, you can login first or use an existing token
def test_chatbot_flow():
    print("=" * 60)
    print("🧪 Testing Chatbot API Flow")
    print("=" * 60)
    
    # You'll need to replace this with a valid token
    # Get it by logging in through the app or Postman
    token = "YOUR_JWT_TOKEN_HERE"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print("\n1️⃣ Testing /bot/diagnose/start")
    try:
        response = requests.post(f"{BASE_URL}/bot/diagnose/start", headers=headers)
        print(f"   Status: {response.status_code}")
        data = response.json()
        print(f"   Response: {json.dumps(data, indent=2)}")
        
        if data.get('success'):
            session_id = data.get('session_id')
            print(f"   ✅ Session ID: {session_id}")
            
            print("\n2️⃣ Testing /bot/diagnose/{session_id}/categories")
            response = requests.get(f"{BASE_URL}/bot/diagnose/{session_id}/categories", headers=headers)
            print(f"   Status: {response.status_code}")
            data = response.json()
            print(f"   Categories: {len(data.get('categories', []))} found")
            
            print("\n3️⃣ Testing /bot/diagnose/{session_id}/set-category")
            payload = {"category": "plumbing"}
            response = requests.post(f"{BASE_URL}/bot/diagnose/{session_id}/set-category", 
                                   headers=headers, json=payload)
            print(f"   Status: {response.status_code}")
            data = response.json()
            print(f"   Response: {json.dumps(data, indent=2)}")
            
            print("\n4️⃣ Testing /bot/diagnose/{session_id}/set-problem")
            payload = {"description": "My kitchen sink is leaking"}
            response = requests.post(f"{BASE_URL}/bot/diagnose/{session_id}/set-problem",
                                   headers=headers, json=payload)
            print(f"   Status: {response.status_code}")
            data = response.json()
            print(f"   Response: {json.dumps(data, indent=2)}")
            
            print("\n5️⃣ Testing /bot/diagnose/{session_id}/analyze")
            payload = {"details": "The leak started this morning and water is pooling in the cabinet"}
            response = requests.post(f"{BASE_URL}/bot/diagnose/{session_id}/analyze",
                                   headers=headers, json=payload)
            print(f"   Status: {response.status_code}")
            data = response.json()
            print(f"   Response Keys: {list(data.keys())}")
            if data.get('success'):
                print(f"   ✅ Severity: {data.get('severity')}")
                print(f"   ✅ Professional Needed: {data.get('professional_needed')}")
                print(f"   ✅ DIY Solutions: {len(data.get('diy_solutions', []))}")
            else:
                print(f"   ❌ Error: {data.get('error')}")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")

if __name__ == "__main__":
    print("\n⚠️  NOTE: You need a valid JWT token to run this test")
    print("   1. Login through the app or use Postman")
    print("   2. Copy the token from localStorage or response")
    print("   3. Update the 'token' variable in this script")
    print("\n   Or just test through the browser console!\n")
    
    # Uncomment to run
    # test_chatbot_flow()
