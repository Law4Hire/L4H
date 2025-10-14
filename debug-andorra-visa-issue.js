const https = require('https');

// Test user from Andorra
const testUser = {
  nationality: "Andorra",
  age: 23,
  gender: "Male",
  maritalStatus: "Single"
};

// API endpoint
const options = {
  hostname: 'localhost',
  port: 8765,
  path: '/api/interview/next-question',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  rejectUnauthorized: false
};

// Test 1: No answers yet - should show all 88 visas
console.log('TEST 1: Getting initial question with no answers...');
let req1 = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const result = JSON.parse(data);
    console.log(`Remaining visa types: ${result.remainingVisaTypes || 'N/A'}`);
    console.log(`Question: ${result.question || result.key}`);
    console.log('');

    // Test 2: After answering "purpose" = "business"
    console.log('TEST 2: After answering purpose=business...');
    options.path = '/api/interview/next-question';
    let req2 = https.request(options, (res2) => {
      let data2 = '';
      res2.on('data', (chunk) => { data2 += chunk; });
      res2.on('end', () => {
        const result2 = JSON.parse(data2);
        console.log(`Remaining visa types: ${result2.remainingVisaTypes || 'N/A'}`);
        console.log(`Question: ${result2.question || result2.key}`);
      });
    });
    req2.write(JSON.stringify({
      answers: {
        nationality: "Andorra",
        purpose: "business"
      }
    }));
    req2.end();
  });
});

req1.write(JSON.stringify({
  answers: {
    nationality: "Andorra"
  }
}));
req1.end();
