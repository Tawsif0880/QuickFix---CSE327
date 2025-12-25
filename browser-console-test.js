// Browser Console Test Script
// Open browser DevTools (F12) and paste this in the Console tab

console.log('🧪 Starting Chatbot Debug Test...');

// Check if token exists
const token = localStorage.getItem('token');
console.log('1️⃣ Token:', token ? '✅ Found' : '❌ Not found (please login first)');

if (!token) {
  console.error('Please login first, then run this test again');
} else {
  // Test the API
  async function testChatbotAPI() {
    try {
      console.log('\n2️⃣ Testing Start Diagnosis...');
      const startResponse = await fetch('http://localhost:5000/bot/diagnose/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const startData = await startResponse.json();
      console.log('Start Response:', startData);
      
      if (!startData.success) {
        console.error('❌ Failed to start:', startData.error);
        return;
      }
      
      const sessionId = startData.session_id;
      console.log('✅ Session ID:', sessionId);
      
      console.log('\n3️⃣ Testing Set Category...');
      const categoryResponse = await fetch(`http://localhost:5000/bot/diagnose/${sessionId}/set-category`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ category: 'plumbing' })
      });
      
      const categoryData = await categoryResponse.json();
      console.log('Category Response:', categoryData);
      
      console.log('\n4️⃣ Testing Set Problem...');
      const problemResponse = await fetch(`http://localhost:5000/bot/diagnose/${sessionId}/set-problem`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ description: 'My kitchen sink is leaking' })
      });
      
      const problemData = await problemResponse.json();
      console.log('Problem Response:', problemData);
      
      console.log('\n5️⃣ Testing Analyze...');
      const analyzeResponse = await fetch(`http://localhost:5000/bot/diagnose/${sessionId}/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          details: 'The leak started this morning and water is pooling in the cabinet' 
        })
      });
      
      const analyzeData = await analyzeResponse.json();
      console.log('Analyze Response:', analyzeData);
      
      if (analyzeData.success) {
        console.log('\n✅ ALL TESTS PASSED!');
        console.log('📊 Analysis Results:');
        console.log('   Severity:', analyzeData.severity);
        console.log('   Professional Needed:', analyzeData.professional_needed);
        console.log('   DIY Solutions:', analyzeData.diy_solutions?.length || 0);
        console.log('   Diagnosis:', analyzeData.diagnosis?.analysis);
      } else {
        console.error('❌ Analyze failed:', analyzeData.error);
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }
  
  testChatbotAPI();
}
