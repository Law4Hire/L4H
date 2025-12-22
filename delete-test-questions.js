// Delete test questions via API
const http = require('http');
const fs = require('fs');

async function deleteTestQuestions() {
  // Get token
  let token;
  try {
    const authData = fs.readFileSync('tests/ui.e2e/.auth/admin-auth.json', 'utf8');
    const authJson = JSON.parse(authData);
    token = authJson.jwt_token;
    console.log('Using stored token');
  } catch (err) {
    console.log('No stored token, getting new one...');
    // Login to get token
    const loginData = JSON.stringify({
      email: 'dcann@cannlaw.com',
      password: 'SecureTest123!',
      rememberMe: false
    });

    const loginPromise = new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 8765,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(loginData)
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          const response = JSON.parse(data);
          resolve(response.token);
        });
      });
      req.on('error', reject);
      req.write(loginData);
      req.end();
    });

    token = await loginPromise;
    console.log('Got new token');
  }

  // Get all questions
  const getAllPromise = new Promise((resolve, reject) => {
    http.get({
      hostname: 'localhost',
      port: 8765,
      path: '/api/v1/admin/interview-questions',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const allQuestions = await getAllPromise;
  console.log(`Total questions: ${allQuestions.length}`);

  // Filter test questions
  const testQuestions = allQuestions.filter(q =>
    q.key.includes('e2e_test') ||
    q.key.includes('integration_test') ||
    q.key.includes('json_format_test') ||
    q.key.includes('api_test')
  );

  console.log(`Found ${testQuestions.length} test questions to delete`);

  // Delete each test question
  for (const q of testQuestions) {
    console.log(`Deleting: ${q.key} (${q.text})`);
    await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 8765,
        path: `/api/v1/admin/interview-questions/${q.id}`,
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, (res) => {
        console.log(`  Deleted ${q.key}: HTTP ${res.statusCode}`);
        resolve();
      });
      req.on('error', reject);
      req.end();
    });
  }

  console.log('✅ All test questions deleted');
}

deleteTestQuestions().catch(console.error);
