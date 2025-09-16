// Simple test to verify API endpoints are working
async function testApiEndpoints() {
  console.log('🧪 Testing API Endpoints...\n');
  
  const baseUrl = 'http://localhost:8765/api';
  
  // Test 1: Check if auth endpoints exist
  console.log('1️⃣ Testing Auth endpoints...');
  
  try {
    const response = await fetch(`${baseUrl}/v1/auth/check-email?email=test@example.com`);
    console.log('✅ Auth check-email endpoint status:', response.status);
  } catch (error) {
    console.log('❌ Auth check-email endpoint failed:', error.message);
  }
  
  // Test 2: Try to login with test credentials
  console.log('\n2️⃣ Testing Login...');
  let token = null;
  
  try {
    const loginResponse = await fetch(`${baseUrl}/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'dcann@cannlaw.com',
        password: 'SecureTest123!'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      token = loginData.accessToken;
      console.log('✅ Login successful, token received');
    } else {
      console.log('❌ Login failed with status:', loginResponse.status);
      const errorText = await loginResponse.text();
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.log('❌ Login request failed:', error.message);
  }
  
  if (!token) {
    console.log('❌ Cannot continue tests without valid token');
    return;
  }
  
  // Test 3: Check cases endpoint
  console.log('\n3️⃣ Testing Cases endpoint...');
  try {
    const casesResponse = await fetch(`${baseUrl}/v1/cases/mine`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (casesResponse.ok) {
      const cases = await casesResponse.json();
      console.log('✅ Cases endpoint working, returned', cases.length, 'cases');
    } else {
      console.log('❌ Cases endpoint failed with status:', casesResponse.status);
      const errorText = await casesResponse.text();
      console.log('Error details:', errorText.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Cases request failed:', error.message);
  }
  
  // Test 4: Check pricing endpoint  
  console.log('\n4️⃣ Testing Pricing endpoint...');
  try {
    const pricingResponse = await fetch(`${baseUrl}/v1/pricing?visaType=H1B&country=US`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (pricingResponse.ok) {
      const pricing = await pricingResponse.json();
      console.log('✅ Pricing endpoint working, returned', pricing.packages?.length || 0, 'packages');
    } else {
      console.log('❌ Pricing endpoint failed with status:', pricingResponse.status);
      const errorText = await pricingResponse.text();
      console.log('Error details:', errorText.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Pricing request failed:', error.message);
  }
  
  // Test 5: Check interview endpoint
  console.log('\n5️⃣ Testing Interview endpoint...');
  try {
    // First try to get history
    const historyResponse = await fetch(`${baseUrl}/v1/interview/history`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (historyResponse.ok) {
      console.log('✅ Interview history endpoint working');
    } else {
      console.log('❌ Interview history endpoint failed with status:', historyResponse.status);
      const errorText = await historyResponse.text();
      console.log('Error details:', errorText.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Interview request failed:', error.message);
  }
  
  console.log('\n🏁 API Endpoint Tests Complete');
}

// Use fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testApiEndpoints().catch(console.error);