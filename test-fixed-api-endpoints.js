// Updated test script to work with corrected API routes
async function testCorrectedApiEndpoints() {
  console.log('🧪 Testing Corrected API Endpoints...\\n');
  
  const baseUrl = 'http://localhost:8765';
  
  // Test 1: Check ping endpoint (this should work)
  console.log('1️⃣ Testing Ping endpoint...');
  try {
    const response = await fetch(`${baseUrl}/v1/ping`);
    console.log('✅ Ping endpoint status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('Response:', data);
    }
  } catch (error) {
    console.log('❌ Ping endpoint failed:', error.message);
  }
  
  // Test 2: Try direct API call to check-email (expected to still fail due to Swagger issue)
  console.log('\\n2️⃣ Testing Auth check-email directly...');
  try {
    const response = await fetch(`${baseUrl}/v1/auth/check-email?email=test@example.com`);
    console.log('Auth check-email endpoint status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('Response:', data);
    } else {
      console.log('Expected failure due to controller registration issue');
    }
  } catch (error) {
    console.log('❌ Auth check-email endpoint failed:', error.message);
  }

  // Test 3: Test through frontend proxy on port 5175 (L4H frontend)
  console.log('\\n3️⃣ Testing through frontend proxy...');
  try {
    const response = await fetch(`http://localhost:5175/api/v1/auth/check-email?email=test@example.com`);
    console.log('Frontend proxy endpoint status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('Response:', data);
    }
  } catch (error) {
    console.log('❌ Frontend proxy request failed:', error.message);
  }

  // Test 4: Test through frontend proxy on port 5180 (correct L4H port based on user's comment)
  console.log('\\n4️⃣ Testing through L4H frontend on port 5180...');
  try {
    const response = await fetch(`http://localhost:5180/api/v1/auth/check-email?email=test@example.com`);
    console.log('L4H frontend proxy endpoint status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('Response:', data);
    }
  } catch (error) {
    console.log('❌ L4H frontend proxy request failed:', error.message);
  }
  
  console.log('\\n🔍 The Swagger configuration error is preventing proper controller registration.');
  console.log('This explains why API endpoints are returning 404 even though the server is running.');
  console.log('The ping endpoint works because it is registered differently in Program.cs');
}

// Use fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testCorrectedApiEndpoints().catch(console.error);