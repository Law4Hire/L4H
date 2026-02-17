
const fetch = require('node-fetch');

async function getUserCount() {
  try {
    // Get admin token
    const loginResponse = await fetch('http://localhost:8765/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'dcann@cannlaw.com', password: 'SecureTest123!' })
    });

    if (!loginResponse.ok) {
      throw new Error(`Admin login failed: ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    const adminToken = loginData.token;

    // Get user count
    const analyticsResponse = await fetch('http://localhost:8765/api/v1/admin/analytics/dashboard', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!analyticsResponse.ok) {
      throw new Error(`Failed to get user count: ${analyticsResponse.statusText}`);
    }

    const analyticsData = await analyticsResponse.json();
    console.log(`Total users in the system: ${analyticsData.totalUsers}`);
    process.exit(0);
  } catch (error) {
    console.error('Error getting user count:', error.message);
    process.exit(1);
  }
}

getUserCount();
