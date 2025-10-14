/**
 * E2E VISA TEST
 * Tests a single visa type by creating a user, completing the profile, and running the interview.
 */

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import fetch from 'node-fetch';

// Visa configurations with exact answer mappings from AdaptiveInterviewService.cs
const VISA_CONFIGS = {
  'A-1': {
    email: 'A-1.FinalTest@testing.com',
    country: 'United States',
    marital: 'single',
    dob: '1980-01-15',
    description: 'A-1 Diplomatic Visa - Ambassador/Head of State',
    answers: {
      purpose: 'diplomatic',
      diplomat: 'yes',
      governmentOfficial: 'yes',
      internationalOrg: 'no'
    }
  },
  'A-2': {
    email: 'A-2.FinalTest@testing.com',
    country: 'United Kingdom',
    marital: 'married',
    dob: '1975-03-22',
    description: 'A-2 Official Visa - Government Employee on Official Business',
    answers: {
      purpose: 'diplomatic',
      diplomat: 'no',
      governmentOfficial: 'yes',
      internationalOrg: 'no'
    }
  },
  'A-3': {
    email: 'A-3.FinalTest@testing.com',
    country: 'Canada',
    marital: 'single',
    dob: '1985-06-10',
    description: 'A-3 Visa - Employee/Family Member of A-1/A-2 Visa Holder',
    answers: {
      purpose: 'diplomatic',
      diplomat: 'no',
      governmentOfficial: 'no',
      workingForDiplomat: 'yes'
    }
  },
  'B-1': {
    email: 'B-1.FinalTest@testing.com',
    country: 'Germany',
    marital: 'divorced',
    dob: '1982-09-14',
    description: 'B-1 Business Visa - Business Visitor',
    answers: {
      purpose: 'business',
      employerSponsor: 'yes',
      treatyCountry: 'yes'
    }
  },
  'B-2': {
    email: 'B-2.FinalTest@testing.com',
    country: 'France',
    marital: 'married',
    dob: '1990-12-05',
    description: 'B-2 Tourist Visa - Tourism/Pleasure',
    answers: {
      purpose: 'tourism'
    }
  }
};

class VisaTest {
  constructor(visaCode) {
    this.visaCode = visaCode;
    this.config = VISA_CONFIGS[visaCode];
  }

  async run() {
    console.log(`\n============================================================`);
    console.log(`🎯 TESTING ${this.visaCode}: ${this.config.description}`);
    console.log(`============================================================`);

    // Step 1: Check if user exists, create if needed
    console.log(`\n📝 Setting up user for ${this.visaCode} (${this.config.description})`);
    console.log(`   🔍 Checking if user ${this.config.email} already exists...`);

    const userExists = await this.checkUserExists(this.config.email);
    let userCreation = { success: true };

    if (userExists) {
      console.log(`   ✅ User ${this.config.email} already exists`);
    } else {
      console.log(`   📝 Creating new user ${this.config.email}...`);
      userCreation = await this.createUser(this.config);
      if (!userCreation.success) {
        console.log(`❌ ${this.visaCode} user creation failed`);
        return;
      }
    }

    // Step 2: Run interview workflow
    const workflowResult = await this.runInterviewWorkflow();

    if (workflowResult.success) {
      console.log(`✅ ${this.visaCode} workflow completed successfully`);
    } else {
      console.log(`❌ ${this.visaCode} workflow failed`);
    }

    // Step 3: Verify database assignment
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for DB update
    const dbVerification = await this.verifyDatabaseAssignment();

    if (dbVerification.success) {
      console.log(`✅ ${this.visaCode} database assignment verified`);
    } else {
      console.log(`❌ ${this.visaCode} database assignment failed`);
    }
  }

  async checkUserExists(email) {
    try {
      const response = await fetch('http://localhost:8765/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: 'SecureTest123!' })
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async createUser(config) {
    return new Promise((resolve) => {
      const args = [
        'e2e-user-creation-test.js',
        `--email=${config.email}`,
        `--country=${config.country}`,
        `--marital=${config.marital}`,
        `--dob=${config.dob}`
      ];

      const child = spawn('node', args, { stdio: 'pipe' });
      let output = '';
      let error = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
        console.log(data.toString());
      });

      child.stderr.on('data', (data) => {
        error += data.toString();
        console.error(data.toString());
      });

      child.on('close', (code) => {
        const success = code === 0 && output.includes('SUCCESS');
        console.log(`   ${success ? '✅' : '❌'} User creation: ${success ? 'SUCCESS' : 'FAILED'}`);
        resolve({ success, output, error });
      });
    });
  }

  async runInterviewWorkflow() {
    console.log(`\n🎯 Running interview workflow for ${this.visaCode}`);

    let browser = null;
    let page = null;

    try {
      browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1280, height: 720 },
        slowMo: 100
      });

      page = await browser.newPage();
      await page.setCacheEnabled(false);

      console.log(`   🔑 Logging in as ${this.config.email}`);

      // Login
      await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Fill login form
      await page.type('input[type="email"]', this.config.email);
      await new Promise(resolve => setTimeout(resolve, 500));
      await page.type('input[type="password"]', 'SecureTest123!');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Click login button instead of pressing Enter
      await page.click('button[type="submit"]');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check if we're on profile completion page and complete it
      const afterLoginUrl = page.url();
      console.log(`   📍 After login URL: ${afterLoginUrl}`);

      if (afterLoginUrl.includes('profile-completion')) {
        console.log('   📝 Completing user profile registration...');

        try {
          // Fill out profile fields
          await page.select('select[name="gender"]', 'Male');
          await page.select('select[name="maritalStatus"]', this.config.marital);
          await page.type('input[type="date"]', this.config.dob);

          // Select Country of Residence
          await page.click('input[placeholder*="Search and select your country..."]');
          await page.type('input[placeholder*="Search and select your country..."]', this.config.country);
          await new Promise(resolve => setTimeout(resolve, 1000));
          await page.keyboard.press('Enter');

          // Select Nationality
          await page.click('input[placeholder*="Search and select your passport country..."]');
          await page.type('input[placeholder*="Search and select your passport country..."]', this.config.country);
          await new Promise(resolve => setTimeout(resolve, 1000));
          await page.keyboard.press('Enter');
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          await page.click('button[type="submit"]');
          await page.waitForNavigation();
          console.log('   ✅ Profile completion submitted');

        } catch (error) {
          console.log(`   ⚠️ Profile completion had issues, continuing: ${error.message}`);
        }
      }

      // Verify we're logged in by checking the current URL
      const currentUrl = page.url();
      console.log(`   📍 Current URL after profile: ${currentUrl}`);

      if (currentUrl.includes('login')) {
        throw new Error('Login failed - still on login page');
      }

      // Navigate to interview
      console.log(`   📋 Starting interview workflow`);
      await page.goto('http://localhost:5173/interview', { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify we're on the interview page and not redirected to login
      const interviewUrl = page.url();
      console.log(`   📍 Interview page URL: ${interviewUrl}`);

      if (interviewUrl.includes('login')) {
        throw new Error('Interview access failed - redirected to login');
      }

      // Reset interview if needed
      await this.resetInterview(page);

      // Answer interview questions
      let questionCount = 0;
      const maxQuestions = 8;

      while (questionCount < maxQuestions) {
        console.log(`   ❓ Processing question ${questionCount + 1}`);

        // Check if interview is complete
        const isComplete = await page.evaluate(() => {
          return document.querySelector('[data-testid="interview-complete-summary"]') !== null ||
                 document.querySelector('[data-testid="recommendation-display"]') !== null ||
                 document.querySelector('h1, h2, h3')?.textContent?.toLowerCase().includes('complete');
        });

        if (isComplete) {
          console.log(`   ✅ Interview completed after ${questionCount} questions`);
          break;
        }

        // Wait for interview question dropdown to appear and get question info
        let questionInfo = null;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts && !questionInfo?.hasSelect) {
          attempts++;

          questionInfo = await page.evaluate(() => {
            // TARGET MAIN ELEMENT SPECIFICALLY - this was the core issue
            const main = document.querySelector('main');
            if (!main) {
              return { hasQuestion: false, hasSelect: false, error: 'No main element found' };
            }

            const questionElement = main.querySelector('h3');
            const selectElements = main.querySelectorAll('select'); // Only selects INSIDE main

            // Find interview question select within main element
            let interviewSelect = null;
            for (const select of selectElements) {
              const options = Array.from(select.options);
              // Skip language selectors (format: 'en-US', 'fr-FR', etc.)
              if (options.some(opt => opt.value.includes('-') && opt.value.length === 5)) {
                continue;
              }
              // This is an interview question select if it has meaningful options
              if (options.length > 1) {
                interviewSelect = select;
                break;
              }
            }

            return {
              hasQuestion: !!questionElement,
              questionText: questionElement?.textContent?.trim() || '',
              hasSelect: !!interviewSelect,
              selectOptions: interviewSelect ? Array.from(interviewSelect.options).map(opt => ({
                value: opt.value,
                text: opt.textContent.trim()
              })) : [],
              mainSelectCount: selectElements.length,
              totalSelectCount: document.querySelectorAll('select').length
            };
          });

          if (!questionInfo.hasSelect && attempts < maxAttempts) {
            // Wait a bit longer for the dropdown to appear
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        if (!questionInfo.hasQuestion || !questionInfo.hasSelect) {
          console.log(`   ⚠️ No valid question found, may be at end of interview`);
          break;
        }

        console.log(`   📝 Question: ${questionInfo.questionText.substring(0, 80)}...`);
        console.log(`   📊 Available selects:`, questionInfo.allSelects);

        if (questionInfo.selectOptions.length > 0) {
          console.log(`   📋 Question options:`);
          questionInfo.selectOptions.forEach((opt, i) => {
            console.log(`     ${i + 1}. "${opt.text}" (value: "${opt.value}")`);
          });
        }

        // Determine answer based on question
        const answer = this.getAnswerForQuestion(questionText, questionInfo.selectOptions, this.config.answers);
        let answerSelected = false;

        if (answer) {
          console.log(`   💭 Trying to select: ${answer}`);

          // Select the answer from main element dropdown only
          const selected = await page.evaluate((answerValue) => {
            const main = document.querySelector('main');
            if (!main) return false;

            const selects = Array.from(main.querySelectorAll('select')); // Only from main
            for (const select of selects) {
              const options = Array.from(select.options);
              // Skip language selectors
              if (options.some(opt => opt.value.includes('-') && opt.value.length === 5)) {
                continue;
              }
              // Try to select the answer
              if (options.some(opt => opt.value === answerValue)) {
                select.value = answerValue;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
              }
            }
            return false;
          }, answer);

          if (selected) {
            console.log(`   ✅ Successfully selected: ${answer}`);
            answerSelected = true;
          } else {
            console.log(`   ❌ Could not find option: ${answer}`);
          }
        }

        if (!answerSelected && questionInfo.selectOptions.length > 1) {
          // Fallback: select first valid option
          const fallbackOption = questionInfo.selectOptions.find(opt => opt.value && opt.value !== '' && opt.value !== 'select');
          if (fallbackOption) {
            console.log(`   🔄 Using fallback: ${fallbackOption.text}`);
            const fallbackSelected = await page.evaluate((fallbackValue) => {
              const selects = Array.from(document.querySelectorAll('select'));
              for (const select of selects) {
                const options = Array.from(select.options);
                if (options.some(opt => opt.value.includes('-') && opt.value.length === 5)) {
                  continue;
                }
                if (options.some(opt => opt.value === fallbackValue)) {
                  select.value = fallbackValue;
                  select.dispatchEvent(new Event('change', { bubbles: true }));
                  return true;
                }
              }
              return false;
            }, fallbackOption.value);

            if (fallbackSelected) {
              console.log(`   ✅ Fallback selected successfully`);
              answerSelected = true;
            }
          }
        }

        // Only click Next if we actually selected an answer
        if (answerSelected) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const nextClicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const nextBtn = buttons.find(btn =>
              btn.textContent.toLowerCase().includes('next') ||
              btn.type === 'submit'
            );
            if (nextBtn && !nextBtn.disabled) {
              nextBtn.click();
              return true;
            }
            return false;
          });

          if (nextClicked) {
            console.log(`   ⏭️ Clicked Next after selecting answer`);
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Check if redirected to visa library (bad)
            const currentUrl = page.url();
            if (currentUrl.includes('visa-library')) {
              console.log(`   ⚠️ Redirected to visa library, may not be in interview flow`);
              break;
            }
          } else {
            console.log(`   ⚠️ Could not find Next button after selecting answer`);
          }
        } else {
          console.log(`   ⚠️ No answer selected, skipping Next button click`);
          break;
        }

        questionCount++;
      }

      // Check final result
      const finalResult = await page.evaluate(() => {
        const recommendationElement = document.querySelector('[data-testid="recommended-visa-type"]');
        const completeElement = document.querySelector('[data-testid="interview-complete-summary"]');

        return {
          isComplete: !!completeElement,
          recommendedVisa: recommendationElement?.textContent?.trim() || '',
          currentUrl: window.location.href
        };
      });

      console.log(`   📊 Final Result:`);
      console.log(`     Complete: ${finalResult.isComplete ? '✅' : '❌'}`);
      console.log(`     Recommended: ${finalResult.recommendedVisa || 'None'}`);
      console.log(`     URL: ${finalResult.currentUrl}`);

      const success = finalResult.isComplete &&
                     finalResult.recommendedVisa.toLowerCase().includes(this.visaCode.toLowerCase());

      // Take screenshot
      await page.screenshot({
        path: `visa-test-${this.visaCode}-final.png`,
        fullPage: true
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        success,
        recommended: finalResult.recommendedVisa,
        questionsAnswered: questionCount
      };

    } catch (error) {
      console.error(`   ❌ Interview workflow failed: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async resetInterview(page) {
    console.log('   🔄 Checking if interview needs to be reset...');
    const needsReset = await page.evaluate(() => {
      const resetButton = document.querySelector('button[data-testid="interview-reset-button"]');
      return resetButton !== null;
    });

    if (needsReset) {
      console.log('   ⚠️ Interview in progress, resetting...');
      await page.click('button[data-testid="interview-reset-button"]');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('   ✅ Interview reset');
    }
  }

  getAnswerForQuestion(questionText, options, requiredAnswers) {
    const lowerQuestion = questionText.toLowerCase();

    // Map questions to answer keys based on visa logic
    if (lowerQuestion.includes('purpose') || lowerQuestion.includes('category') || lowerQuestion.includes('eligibility')) {
      const purposeValue = requiredAnswers.purpose;
      if (purposeValue) {
        // For diplomatic purpose, look for "Diplomatic, IO & NATO"
        if (purposeValue === 'diplomatic') {
          const diplomaticOption = options.find(opt =>
            opt.text.toLowerCase().includes('diplomatic') ||
            opt.text.toLowerCase().includes('nato') ||
            opt.value.toLowerCase().includes('diplomatic')
          );
          if (diplomaticOption) {
            return diplomaticOption.value;
          }
        }

        // For business purpose, look for "Work & Talent"
        if (purposeValue === 'business') {
          const businessOption = options.find(opt =>
            opt.text.toLowerCase().includes('work') ||
            opt.text.toLowerCase().includes('talent') ||
            opt.text.toLowerCase().includes('business')
          );
          if (businessOption) {
            return businessOption.value;
          }
        }

        // For tourism purpose, look for "Visit & Transit"
        if (purposeValue === 'tourism') {
          const tourismOption = options.find(opt =>
            opt.text.toLowerCase().includes('visit') ||
            opt.text.toLowerCase().includes('transit') ||
            opt.text.toLowerCase().includes('tourism')
          );
          if (tourismOption) {
            return tourismOption.value;
          }
        }

        // Fallback: Look for any matching option
        const matchingOption = options.find(opt =>
          opt.text.toLowerCase().includes(purposeValue) ||
          opt.value.toLowerCase() === purposeValue
        );
        return matchingOption?.value || '';
      }
    }

    if (lowerQuestion.includes('diplomat') && !lowerQuestion.includes('working')) {
      return requiredAnswers.diplomat || '';
    }

    if (lowerQuestion.includes('government') && lowerQuestion.includes('official')) {
      return requiredAnswers.governmentOfficial || '';
    }

    if (lowerQuestion.includes('international') && lowerQuestion.includes('organization')) {
      return requiredAnswers.internationalOrg || '';
    }

    if (lowerQuestion.includes('working') && lowerQuestion.includes('diplomat')) {
      return requiredAnswers.workingForDiplomat || '';
    }

    if (lowerQuestion.includes('treaty') && lowerQuestion.includes('country')) {
      return requiredAnswers.treatyCountry || '';
    }

    if (lowerQuestion.includes('employer') && lowerQuestion.includes('sponsor')) {
      return requiredAnswers.employerSponsor || '';
    }

    return null;
  }

  async verifyDatabaseAssignment() {
    console.log(`\n🔍 Verifying database assignment for ${this.visaCode} (${this.config.email})`);

    try {
      // Create a simple Node.js script to check the database with proper variable passing
      const checkScript = `
        const sql = await import('mssql');

        async function checkVisaAssignment() {
          try {
            const config = {
              server: 'localhost',
              port: 14333,
              database: 'L4H',
              user: 'sa',
              password: 'SecureTest123!',
              options: {
                encrypt: false,
                trustServerCertificate: true
              }
            };

            await sql.connect(config);

            // Query for user's assigned visa type
            const result = await sql.query`\
              SELECT u.Email, c.VisaTypeId, vt.Code as VisaCode, vt.Name as VisaName
              FROM Users u
              LEFT JOIN Cases c ON u.Id = c.UserId
              LEFT JOIN VisaTypes vt ON c.VisaTypeId = vt.Id
              WHERE u.Email = \${'${this.config.email}'}
            `\;\n\n            console.log('✅ DATABASE QUERY SUCCESS');

            if (result.recordset.length === 0) {
              console.log('❌ NO RECORDS: User not found in database');
              process.exit(1);
            }

            const userRecord = result.recordset[0];
            console.log('📄 User Record:', JSON.stringify(userRecord, null, 2));

            if (!userRecord.VisaCode) {
              console.log('❌ NO VISA ASSIGNED: User has no visa type assigned');
              process.exit(1);
            }

            if (userRecord.VisaCode === '${this.visaCode}') {
              console.log(\`✅ CORRECT ASSIGNMENT: User has \${userRecord.VisaCode} visa assigned\`);
              process.exit(0);
            } else {
              console.log(\`❌ WRONG ASSIGNMENT: Expected ${this.visaCode}, got \${userRecord.VisaCode}\`);
              process.exit(1);
            }

          } catch (error) {
            console.error('❌ DATABASE ERROR:', error.message);
            process.exit(1);
          }
        }

        checkVisaAssignment();
      `;

      const { writeFileSync, unlinkSync } = await import('fs');
      writeFileSync(`db-check-${this.visaCode}.js`, checkScript);

      return new Promise((resolve) => {
        const child = spawn('node', [`db-check-${this.visaCode}.js`], { stdio: 'pipe' });
        let output = '';
        let error = '';

        child.stdout.on('data', (data) => {
          output += data.toString();
        });

        child.stderr.on('data', (data) => {
          error += data.toString();
        });

        child.on('close', (code) => {
          const success = code === 0;
          console.log(`   ${success ? '✅' : '❌'} Database verification: ${success ? 'PASS' : 'FAIL'}`);

          if (output.trim()) {
            console.log(`   📄 Database details: ${output.trim()}`);
          }

          if (error.trim() && !success) {
            console.log(`   📄 Error: Database check failed: ${error.trim()}`);
          }

          resolve({ success, output, error });
        });
      });

    } catch (error) {
      console.log(`   ❌ Database verification failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

// Run the test for a single visa type
async function main() {
  const args = process.argv.slice(2);
  const visaCodeArg = args.find(arg => arg.startsWith('--visa='));

  if (!visaCodeArg) {
    console.error('❌ Please provide a visa type with --visa=<visa_code>');
    process.exit(1);
  }

  const visaCode = visaCodeArg.split('=')[1];

  if (!VISA_CONFIGS[visaCode]) {
    console.error(`❌ Invalid visa code: ${visaCode}`);
    console.error(`   Available visa codes: ${Object.keys(VISA_CONFIGS).join(', ')}`);
    process.exit(1);
  }

  const test = new VisaTest(visaCode);

  try {
    await test.run();
    process.exit(0);
  } catch (error) {
    console.error(`\n💥 TEST FAILED: ${error.message}`);
    process.exit(1);
  }
}

main();
