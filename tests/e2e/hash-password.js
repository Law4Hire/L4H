// Simple script to create a test user via signup API
const https = require('https');
const http = require('http');

const signupData = JSON.stringify({
  email: 'testadmin@cannlaw.com',
  password: 'Admin123!',
  confirmPassword: 'Admin123!',
  firstName: 'Test',
  lastName: 'Admin',
  preferredLanguage: 'en'
});

const options = {
  hostname: 'localhost',
  port: 8765,
  path: '/api/v1/auth/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': signupData.length
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (error) => console.error(error));
req.write(signupData);
req.end();
