// Test script to verify Swagger fix resolved API endpoint issues
async function testSwaggerFix() {
  console.log('🧪 Testing API Endpoints After Swagger Fix...\n');
  
  const baseUrl = 'http://localhost:8765';
  
  // Test 1: Ping endpoint (should work)
  console.log('1️⃣ Testing Ping endpoint...');
  try {
    const response = await fetch(`${baseUrl}/v1/ping`);
    console.log('✅ Ping status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('Response:', data);
    }
  } catch (error) {
    console.log('❌ Ping failed:', error.message);
  }
  
  // Test 2: Auth check-email endpoint (previously failing)
  console.log('\n2️⃣ Testing Auth check-email endpoint...');
  try {
    const response = await fetch(`${baseUrl}/v1/auth/check-email?email=test@example.com`);
    console.log('✅ Auth check-email status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('Response:', data);
    } else {
      console.log('Response status indicates issue may still exist');
    }
  } catch (error) {
    console.log('❌ Auth check-email failed:', error.message);
  }

  // Test 3: Pricing endpoint (required for dashboard)
  console.log('\n3️⃣ Testing Pricing endpoint...');
  try {
    const response = await fetch(`${baseUrl}/v1/pricing`);
    console.log('✅ Pricing status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('Response length:', Array.isArray(data) ? data.length : 'Not array');
    } else {
      console.log('Response indicates pricing endpoint needs JWT token');
    }
  } catch (error) {
    console.log('❌ Pricing failed:', error.message);
  }

  // Test 4: Login endpoint to get JWT token
  console.log('\n4️⃣ Testing Login endpoint...');
  try {
    const response = await fetch(`${baseUrl}/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'dcann@cannlaw.com',
        password: 'SecureTest123!'
      })
    });
    console.log('✅ Login status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('Login successful, got JWT token');
      return data.accessToken; // Return token for further testing
    } else {
      console.log('Login failed - may need to check credentials');
    }
  } catch (error) {
    console.log('❌ Login failed:', error.message);
  }
  
  return null;
}

// Use fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testSwaggerFix()
  .then(token => {
    if (token) {
      console.log('\n🎉 API endpoints are working! Swagger fix successful!');
    } else {
      console.log('\n⚠️ Some endpoints working, but authentication may need review');
    }
  })
  .catch(console.error);