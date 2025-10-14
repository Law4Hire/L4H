const { chromium } = require('playwright');
const { spawn } = require('child_process');
const { VISA_MASTER_TEST_SCHEMA } = require('./visa-master-test-schema.js');

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:8765';
const PASSWORD = 'SecureTest123!';

const completedTests = [];

async function waitForServerReady() {
  console.log('Waiting for dev server to be ready...');
  for (let i = 0; i < 60; i++) {
    try {
      const response = await fetch(BASE_URL);
      if (response.ok) {
        console.log('Dev server is ready!');
        return;
      }
    } catch (error) {
      // Ignore connection refused errors
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Dev server did not start in time.');
}

async function checkUserExists(email) {
  try {
    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: PASSWORD }),
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function createUser(visaCode, config, page) {
  const email = `${visaCode}.test@testing.com`;
  
  // Registration
  await page.goto(`${BASE_URL}/register`, { timeout: 60000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ timeout: 60000 });

  // Profile Completion
  if (page.url().includes('profile-completion')) {
    await page.selectOption('select[name="gender"]', 'Male');
    await page.selectOption('select[name="maritalStatus"]', config.maritalStatus);
    await page.fill('input[type="date"]', config.dob);
    
    // Country of Residence
    await page.click('input[placeholder*="Search and select your country..."]');
    await page.type('input[placeholder*="Search and select your country..."]', config.country);
    await page.press('input[placeholder*="Search and select your country..."]', 'Enter');

    // Nationality
    await page.click('input[placeholder*="Search and select your passport country..."]');
    await page.type('input[placeholder*="Search and select your passport country..."]', config.country);
    await page.press('input[placeholder*="Search and select your passport country..."]', 'Enter');

    await page.click('button[type="submit"]');
    await page.waitForNavigation({ timeout: 60000 });
  }
  return { success: true };
}

async function runInterview(visaCode, config, page) {
  const email = `${visaCode}.test@testing.com`;

  try {
    // Login
    await page.goto(`${BASE_URL}/login`, { timeout: 60000 });
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ timeout: 60000 });

    // Start Interview
    await page.goto(`${BASE_URL}/interview`, { timeout: 60000 });

    // Answer Questions
    for (const [questionKey, answerValue] of Object.entries(config.answers)) {
      await page.waitForSelector(`select[data-question-key="${questionKey}"]`);
      await page.selectOption(`select[data-question-key="${questionKey}"]`, answerValue);
      await page.click('button:has-text("Next")');
    }

    // Verify Result
    await page.waitForSelector('[data-testid="recommendation-display"]');
    const recommendedVisa = await page.textContent('[data-testid="recommended-visa-type"]');

    const success = recommendedVisa.trim().toLowerCase().includes(visaCode.trim().toLowerCase());
    return { success, recommendedVisa };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

function printProgress() {
  console.clear();
  console.log('===== VISA ASSIGNMENT E2E TEST SUITE =====');
  console.log('\nCompleted Tests:');
  completedTests.forEach(test => {
    console.log(`  ✅ ${test}`);
  });
  console.log('\n=========================================');
}

async function main() {
  try {
    await waitForServerReady();
    console.log('Main function started');
    const browser = await chromium.launch({ headless: true });
    console.log('Browser launched');
    const page = await browser.newPage();
    console.log('New page created');

    for (const visaCode in VISA_MASTER_TEST_SCHEMA) {
      const config = VISA_MASTER_TEST_SCHEMA[visaCode];
      const email = `${visaCode}.test@testing.com`;

      // 1. Create User
      if (!(await checkUserExists(email))) {
        const creationResult = await createUser(visaCode, config, page);
        if (!creationResult.success) {
          console.error(`Failed to create user for ${visaCode}`);
          continue;
        }
      }

      // 2. Run Interview
      const interviewResult = await runInterview(visaCode, config, page);

      // 3. Report Result
      if (interviewResult.success) {
        completedTests.push(visaCode);
        printProgress();
      } else {
        console.error(`Interview failed for ${visaCode}: ${interviewResult.error || `Got ${interviewResult.recommendedVisa}`}`);
      }
    }

    await browser.close();
    console.log('\nAll tests complete!');
  } catch (error) {
    console.error('An unexpected error occurred:', error);
  }
}

main();
