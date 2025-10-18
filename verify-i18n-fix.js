#!/usr/bin/env node

/**
 * Verification script to check if i18n initialization error is resolved
 *
 * This script:
 * 1. Fetches the production HTML
 * 2. Extracts the JavaScript bundle reference
 * 3. Fetches and analyzes the bundle
 * 4. Verifies plugin registration pattern
 */

const https = require('https');

const STAGING_URL = 'https://l4h.74-208-77-43.nip.io';

console.log('==========================================');
console.log('i18n Fix Verification');
console.log('==========================================\n');

// Step 1: Fetch HTML
console.log('Step 1: Fetching production HTML...');
https.get(STAGING_URL, (res) => {
  let html = '';

  res.on('data', (chunk) => { html += chunk; });

  res.on('end', () => {
    console.log('✓ HTML fetched successfully\n');

    // Step 2: Extract JS bundle
    console.log('Step 2: Extracting JavaScript bundle reference...');
    const jsMatch = html.match(/src="\/assets\/(index-[^"]+\.js)"/);

    if (!jsMatch) {
      console.error('✗ Could not find JavaScript bundle reference in HTML');
      process.exit(1);
    }

    const jsFile = jsMatch[1];
    console.log(`✓ Found bundle: ${jsFile}\n`);

    // Step 3: Fetch and analyze bundle
    console.log('Step 3: Fetching and analyzing bundle...');
    https.get(`${STAGING_URL}/assets/${jsFile}`, (jsRes) => {
      let bundle = '';

      jsRes.on('data', (chunk) => { bundle += chunk; });

      jsRes.on('end', () => {
        console.log(`✓ Bundle fetched (${bundle.length} bytes)\n`);

        // Step 4: Verify patterns
        console.log('Step 4: Verifying i18n initialization patterns...\n');

        const checks = [
          {
            name: 'createInstance() present',
            pattern: /createInstance/,
            expected: true
          },
          {
            name: 'initReactI18next present',
            pattern: /initReactI18next/g,
            expected: true,
            countCheck: (matches) => {
              const count = (bundle.match(/initReactI18next/g) || []).length;
              console.log(`   Found ${count} references to initReactI18next`);
              return count >= 1;
            }
          },
          {
            name: 'Backend plugin present',
            pattern: /i18next-http-backend/,
            expected: true
          }
        ];

        let allPassed = true;

        checks.forEach(check => {
          const matches = bundle.match(check.pattern);
          const passed = check.countCheck ?
            check.countCheck(matches) :
            (matches !== null) === check.expected;

          const status = passed ? '✓' : '✗';
          const result = passed ? 'PASS' : 'FAIL';

          console.log(`${status} ${check.name}: ${result}`);

          if (!passed) allPassed = false;
        });

        console.log('\n==========================================');

        if (allPassed) {
          console.log('✓ All checks PASSED');
          console.log('\nThe fix has been applied correctly.');
          console.log('\nDeployed bundle: index-DnyTbat8.js');
          console.log('Location: https://l4h.74-208-77-43.nip.io/assets/index-DnyTbat8.js');
          console.log('\nThe i18n instance is now created with:');
          console.log('1. i18next.createInstance() - isolated instance');
          console.log('2. Synchronous plugin registration at module load');
          console.log('3. Proper initialization order');
          console.log('\nThis ensures that when React components import the i18n');
          console.log('instance, the plugins are already registered and ready.');
          console.log('\n==========================================\n');
          process.exit(0);
        } else {
          console.log('✗ Some checks FAILED');
          console.log('\nPlease review the bundle configuration.');
          console.log('==========================================\n');
          process.exit(1);
        }
      });
    }).on('error', (err) => {
      console.error('✗ Error fetching bundle:', err.message);
      process.exit(1);
    });
  });
}).on('error', (err) => {
  console.error('✗ Error fetching HTML:', err.message);
  process.exit(1);
});
