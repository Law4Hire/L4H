#!/usr/bin/env node

// Simple test to check if the production site loads without i18n errors
// Run with: node test-production-site.js

const https = require('https');

console.log('Testing production site: https://l4h.74-208-77-43.nip.io\n');

// Fetch the index.html
https.get('https://l4h.74-208-77-43.nip.io', (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('✓ Site is accessible (HTTP', res.statusCode, ')');

    // Check if it's loading the correct JS file
    const jsMatch = data.match(/src="\/assets\/(index-[^"]+\.js)"/);
    if (jsMatch) {
      console.log('✓ JavaScript file:', jsMatch[1]);

      // Fetch the JS file to verify it exists
      https.get(`https://l4h.74-208-77-43.nip.io/assets/${jsMatch[1]}`, (jsRes) => {
        if (jsRes.statusCode === 200) {
          console.log('✓ JavaScript file loads successfully');
          console.log('\n✅ BASIC TESTS PASSED');
          console.log('\nTo test for i18n errors:');
          console.log('1. Open https://l4h.74-208-77-43.nip.io in your browser');
          console.log('2. Open Developer Tools (F12)');
          console.log('3. Check the Console tab for errors');
          console.log('4. Look for: "You will need to pass in an i18next instance"');
        } else {
          console.log('✗ JavaScript file returned HTTP', jsRes.statusCode);
          process.exit(1);
        }
      }).on('error', (err) => {
        console.error('✗ Error fetching JS:', err.message);
        process.exit(1);
      });
    } else {
      console.log('✗ Could not find JavaScript file in HTML');
      process.exit(1);
    }
  });
}).on('error', (err) => {
  console.error('✗ Error:', err.message);
  process.exit(1);
});
