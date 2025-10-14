const puppeteer = require('puppeteer');

/**
 * UI TEST: L-1A vs L-1B Visa Differentiation
 *
 * This test verifies that the frontend correctly displays L-1A for executive/manager
 * and L-1B for specialized knowledge roles.
 *
 * Previous bug: API was returning visaType.Name instead of visaType.Code,
 * causing both options to display incorrectly.
 */

async function testL1Differentiation() {
  console.log('\n========================================');
  console.log('UI TEST: L-1A vs L-1B Differentiation');
  console.log('========================================\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--start-maximized'],
    defaultViewport: null
  });

  const page = await browser.newPage();
  const API_BASE = 'http://localhost:8765/api/v1';
  const WEB_BASE = 'http://localhost:5173';

  // Test user credentials
  const testUsers = [
    {
      email: 'test-l1a-executive@testing.com',
      password: 'Test123!',
      role: 'executive',
      expectedVisa: 'L-1A'
    },
    {
      email: 'test-l1b-specialized@testing.com',
      password: 'Test123!',
      role: 'specialized',
      expectedVisa: 'L-1B'
    }
  ];

  for (const testUser of testUsers) {
    console.log(`\n--- Testing ${testUser.expectedVisa} for ${testUser.role} role ---\n`);

    try {
      // Step 1: Register user
      console.log(`Step 1: Registering user ${testUser.email}...`);
      const registerResponse = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
          firstName: testUser.role === 'executive' ? 'Executive' : 'Specialized',
          lastName: 'Tester',
          preferredLanguage: 'en-US'
        })
      });

      if (!registerResponse.ok) {
        const existingText = await registerResponse.text();
        if (existingText.includes('already exists')) {
          console.log('User already exists, continuing with login...');
        } else {
          throw new Error(`Registration failed: ${registerResponse.status} ${existingText}`);
        }
      } else {
        console.log('✓ User registered successfully');
      }

      // Step 2: Login
      console.log('Step 2: Logging in...');
      await page.goto(`${WEB_BASE}/login`);
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });

      await page.type('input[type="email"]', testUser.email);
      await page.type('input[type="password"]', testUser.password);

      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
      console.log('✓ Logged in successfully');

      // Step 3: Start Interview
      console.log('Step 3: Starting interview...');
      await page.goto(`${WEB_BASE}/dashboard`);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Find and click the Visa Interview button - navigate directly to interview page
      // The dashboard doesn't have a direct Start Interview button, so we navigate to interview
      // Users should already have an active case from registration
      const cases = await page.evaluate(async () => {
        const response = await fetch('/api/v1/cases/my-cases', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
          }
        });
        const data = await response.json();
        return data;
      });

      if (!cases || cases.length === 0) {
        throw new Error('No case found for user');
      }

      const caseId = cases[0].id;
      console.log(`  → Found case ID: ${caseId}`);

      // Start a new interview session for this case
      const sessionId = await page.evaluate(async (caseId) => {
        const response = await fetch('/api/v1/interview/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
          },
          body: JSON.stringify({ caseId })
        });
        const data = await response.json();
        return data.sessionId;
      }, caseId);

      console.log(`  → Started interview session: ${sessionId}`);

      // Navigate to interview page with session
      await page.goto(`${WEB_BASE}/interview?sessionId=${sessionId}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✓ Interview started');

      // Step 4: Answer questions
      console.log('Step 4: Answering interview questions...');

      // Purpose: Employment
      await page.waitForSelector('input[value="employment"]', { timeout: 5000 });
      await page.click('input[value="employment"]');
      await page.click('button:has-text("Next Question")');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('  ✓ Selected employment purpose');

      // Sponsor: Yes
      await page.waitForSelector('input[value="yes"]', { timeout: 5000 });
      await page.click('input[value="yes"]');
      await page.click('button:has-text("Next Question")');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('  ✓ Confirmed sponsorship');

      // Education: Bachelor's
      await page.waitForSelector('input[value="bachelor"]', { timeout: 5000 });
      await page.click('input[value="bachelor"]');
      await page.click('button:has-text("Next Question")');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('  ✓ Selected Bachelor\'s degree');

      // Same Company: Yes (L-1 transfer)
      await page.waitForSelector('input[value="yes"]', { timeout: 5000 });
      const sameCompanyYes = await page.$('input[value="yes"]');
      await sameCompanyYes.click();
      await page.click('button:has-text("Next Question")');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('  ✓ Confirmed same company transfer');

      // Managerial Role: Executive or Specialized
      console.log(`  → Selecting role: ${testUser.role}`);
      await page.waitForSelector(`input[value="${testUser.role}"]`, { timeout: 5000 });
      await page.click(`input[value="${testUser.role}"]`);
      await page.click('button:has-text("Next Question")');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(`  ✓ Selected ${testUser.role} role`);

      // Step 5: Verify recommendation
      console.log('Step 5: Verifying visa recommendation...');
      await page.waitForSelector('text=Interview Complete', { timeout: 5000 });

      // Get the visa recommendation text
      const recommendationText = await page.evaluate(() => {
        const element = document.querySelector('.text-2xl.font-bold.text-blue-600');
        return element ? element.textContent : null;
      });

      console.log(`  → Recommendation displayed: "${recommendationText}"`);
      console.log(`  → Expected visa: "${testUser.expectedVisa}"`);

      if (recommendationText === testUser.expectedVisa) {
        console.log(`✅ SUCCESS: Correct visa type displayed (${testUser.expectedVisa})`);
      } else {
        console.log(`❌ FAILURE: Expected ${testUser.expectedVisa} but got ${recommendationText}`);
        await page.screenshot({
          path: `test-l1-differentiation-error-${testUser.role}.png`,
          fullPage: true
        });
      }

      // Screenshot for proof
      await page.screenshot({
        path: `test-l1-differentiation-${testUser.expectedVisa}-success.png`,
        fullPage: true
      });

    } catch (error) {
      console.error(`❌ Error testing ${testUser.expectedVisa}:`, error.message);
      await page.screenshot({
        path: `test-l1-differentiation-error-${testUser.role}.png`,
        fullPage: true
      });
    }

    console.log('\n' + '='.repeat(50) + '\n');
  }

  console.log('\n========================================');
  console.log('TEST COMPLETE');
  console.log('========================================\n');

  await browser.close();
}

testL1Differentiation().catch(console.error);
