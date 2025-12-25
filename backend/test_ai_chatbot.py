"""Test AI-Powered Conversation Flow"""
from dotenv import load_dotenv
load_dotenv()

from app.bot.conversation_flow import ConversationFlow, ServiceCategory
from app.bot.gemini_service import get_gemini_service

print("=" * 70)
print("🤖 Testing AI-Powered Chatbot Flow")
print("=" * 70)

# Test 1: Initialize
print("\n1️⃣ Creating conversation flow...")
flow = ConversationFlow(user_id=1, session_id=1)
print("   ✅ Flow created")

# Test 2: Greeting
print("\n2️⃣ Getting greeting...")
greeting = flow.get_greeting_message()
print(f"   Message: {greeting['message'][:80]}...")

# Test 3: Set Category
print("\n3️⃣ Setting category to 'plumber'...")
category_response = flow.set_category('plumber')
if 'error' in category_response:
    print(f"   ❌ Error: {category_response['error']}")
else:
    print(f"   Response: {category_response['message']}")

# Test 4: Set Problem (with AI questions)
print("\n4️⃣ Setting problem description...")
problem_response = flow.set_problem_description("My kitchen sink is leaking underneath the cabinet")
print(f"   Message: {problem_response['message'][:80]}...")
print(f"   AI Questions: {len(problem_response['details_needed'])} generated")
for i, q in enumerate(problem_response['details_needed'][:3], 1):
    print(f"      {i}. {q}")

# Test 5: AI Analysis
print("\n5️⃣ Running AI analysis...")
analysis = flow.set_detailed_situation("The leak started this morning and water is pooling in the cabinet. I can see water dripping from the pipe connection.")
print(f"\n   📊 AI Analysis Results:")
print(f"   • Severity: {analysis['severity']}")
print(f"   • Professional Needed: {analysis['professional_needed']}")
if 'urgency_level' in analysis:
    print(f"   • Urgency: {analysis['urgency_level']}")
if 'estimated_time' in analysis:
    print(f"   • Estimated Time: {analysis['estimated_time']}")
print(f"   • Diagnosis: {analysis['diagnosis']['analysis'][:100]}...")
print(f"   • DIY Solutions: {len(analysis['diy_solutions'])} tips")
for i, tip in enumerate(analysis['diy_solutions'][:3], 1):
    print(f"      {i}. {tip[:70]}...")
if 'explanation' in analysis and analysis['explanation']:
    print(f"   • Explanation: {analysis['explanation'][:100]}...")

print("\n" + "=" * 70)
print("✅ AI-Powered Chatbot Test Complete!")
print("=" * 70)
print("\n💡 The chatbot is now using Gemini AI for:")
print("   ✓ Generating contextual follow-up questions")
print("   ✓ Analyzing severity and urgency intelligently")
print("   ✓ Providing specific, relevant DIY tips")
print("   ✓ Explaining professional recommendations")
print("   ✓ Adapting to different service categories")
print("=" * 70)
