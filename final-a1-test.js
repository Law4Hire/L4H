/**
 * FINAL A-1 TEST - Use correct "Next Question" button
 * MUST RESULT IN A-1 VISA ASSIGNMENT
 */

const puppeteer = require('puppeteer');

async function finalA1Test() {
  console.log('🚨 FINAL A-1 TEST - CORRECT BUTTON TARGETING');
  console.log('='.repeat(60));

  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      slowMo: 300
    });

    const page = await browser.newPage();
    await page.setCacheEnabled(false);

    // Login
    console.log('🔑 Login');
    await page.goto('http://localhost:5179/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'A-1@testing.com');
    await page.type('input[type="password"]', 'SecureTest123!');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Go to interview
    console.log('🎯 Go to interview');
    await page.goto('http://localhost:5179/interview', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    let questionCount = 0;
    while (questionCount < 10) {
      questionCount++;
      console.log(`\n❓ Question ${questionCount}`);

      // Check if interview is complete
      const completionCheck = await page.evaluate(() => {
        const complete = document.querySelector('[data-testid="interview-complete-summary"]');
        const recommendation = document.querySelector('[data-testid="recommended-visa-type"]');
        return {
          isComplete: !!complete,
          recommendation: recommendation?.textContent?.trim() || ''
        };
      });

      if (completionCheck.isComplete) {
        console.log(`🎉 Interview completed! Recommendation: ${completionCheck.recommendation}`);
        break;
      }

      // Get current question
      const questionInfo = await page.evaluate(() => {
        const main = document.querySelector('main');
        if (!main) return { hasSelect: false };

        const questionElement = main.querySelector('h3');
        const selects = Array.from(main.querySelectorAll('select'));

        let interviewSelect = null;
        for (const select of selects) {
          const options = Array.from(select.options);
          if (options.some(opt => opt.value.includes('-') && opt.value.length === 5)) {
            continue; // Skip language selectors
          }
          if (options.length > 1) {
            interviewSelect = select;
            break;
          }
        }

        if (!interviewSelect) return { hasSelect: false };

        return {
          hasSelect: true,
          question: questionElement?.textContent?.trim() || 'Unknown question',
          options: Array.from(interviewSelect.options).map(opt => ({
            value: opt.value,
            text: opt.textContent.trim()
          }))
        };
      });

      if (!questionInfo.hasSelect) {
        console.log('⚠️ No more questions or interview complete');
        break;
      }

      console.log(`📝 ${questionInfo.question}`);
      console.log('📋 Options:');
      questionInfo.options.forEach((opt, i) => {
        console.log(`   ${i + 1}. "${opt.text}" (${opt.value})`);
      });

      // Answer based on question for A-1 diplomatic visa
      let answer = null;
      const questionLower = questionInfo.question.toLowerCase();

      if (questionLower.includes('purpose') || questionLower.includes('category') || questionLower.includes('eligibility')) {
        // Question 1: Select "Diplomatic, IO & NATO"
        answer = questionInfo.options.find(opt =>
          opt.text.toLowerCase().includes('diplomatic') ||
          opt.text.toLowerCase().includes('nato')
        );
      } else if (questionLower.includes('diplomat') && !questionLower.includes('working')) {
        // Are you a diplomat? YES for A-1
        answer = questionInfo.options.find(opt =>
          opt.value.toLowerCase() === 'yes' || opt.text.toLowerCase().includes('yes')
        );
      } else if (questionLower.includes('government') && questionLower.includes('official')) {
        // Are you a government official? YES for A-1
        answer = questionInfo.options.find(opt =>
          opt.value.toLowerCase() === 'yes' || opt.text.toLowerCase().includes('yes')
        );
      } else if (questionLower.includes('international') && questionLower.includes('organization')) {
        // International organization? NO for A-1 (they're government, not IO)
        answer = questionInfo.options.find(opt =>
          opt.value.toLowerCase() === 'no' || opt.text.toLowerCase().includes('no')
        );
      } else {
        // Default to first valid option
        answer = questionInfo.options.find(opt => opt.value && opt.value !== '');
      }

      if (!answer) {
        console.log('❌ No suitable answer found');
        break;
      }

      console.log(`🎯 Selecting: "${answer.text}"`);

      // Select the answer
      const selected = await page.evaluate((value) => {
        const main = document.querySelector('main');
        const selects = Array.from(main.querySelectorAll('select'));

        for (const select of selects) {
          const options = Array.from(select.options);
          if (options.some(opt => opt.value.includes('-') && opt.value.length === 5)) {
            continue;
          }

          if (options.some(opt => opt.value === value)) {
            select.value = value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }
        return false;
      }, answer.value);

      if (!selected) {
        console.log('❌ Could not select answer');
        break;
      }

      console.log('✅ Answer selected');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Click the CORRECT "Next Question" button
      const nextResult = await page.evaluate(() => {
        const allButtons = Array.from(document.querySelectorAll('button'));

        // Look specifically for "Next Question" button
        const nextQuestionBtn = allButtons.find(btn =>
          btn.textContent.trim() === 'Next Question'
        );

        if (nextQuestionBtn && !nextQuestionBtn.disabled) {
          nextQuestionBtn.click();
          return { success: true, buttonText: nextQuestionBtn.textContent.trim() };
        }

        // Fallback: look for other next-like buttons but avoid "Visa Library"
        const otherNextBtn = allButtons.find(btn =>
          (btn.textContent.toLowerCase().includes('next') ||
           btn.textContent.toLowerCase().includes('continue') ||
           btn.type === 'submit') &&
          !btn.textContent.toLowerCase().includes('library') &&
          !btn.textContent.toLowerCase().includes('reset') &&
          !btn.textContent.toLowerCase().includes('hello') &&
          !btn.disabled &&
          btn.offsetParent !== null
        );

        if (otherNextBtn) {
          otherNextBtn.click();
          return { success: true, buttonText: otherNextBtn.textContent.trim() };
        }

        return {
          success: false,
          availableButtons: allButtons.map(btn => btn.textContent.trim())
        };
      });

      if (nextResult.success) {
        console.log(`⏭️ Clicked: "${nextResult.buttonText}"`);
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check if we're still in interview
        const currentUrl = page.url();
        if (currentUrl.includes('visa-library')) {
          console.log('❌ Redirected to visa library - stopping');
          break;
        } else {
          console.log('✅ Still in interview - continuing');
        }
      } else {
        console.log('❌ Could not find Next button');
        console.log('Available buttons:', nextResult.availableButtons);
        break;
      }
    }

    // Wait for completion
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check final result
    const finalResult = await page.evaluate(() => {
      const complete = document.querySelector('[data-testid="interview-complete-summary"]');
      const recommendation = document.querySelector('[data-testid="recommended-visa-type"]');

      return {
        isComplete: !!complete,
        recommendation: recommendation?.textContent?.trim() || '',
        url: window.location.href
      };
    });

    console.log('\n📊 Final Interview Result:');
    console.log(`   Complete: ${finalResult.isComplete ? '✅' : '❌'}`);
    console.log(`   Recommendation: ${finalResult.recommendation || 'None'}`);
    console.log(`   URL: ${finalResult.url}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Final database check
  console.log('\n🔍 FINAL DATABASE VERIFICATION');
  try {
    const sql = require('mssql');
    const config = {
      server: 'localhost',
      port: 14333,
      database: 'L4H',
      user: 'sa',
      password: 'SecureTest123!',
      options: { encrypt: false, trustServerCertificate: true }
    };

    await sql.connect(config);
    const result = await sql.query`
      SELECT u.Email, c.VisaTypeId, vt.Code as VisaCode, vt.Name as VisaName
      FROM Users u
      LEFT JOIN Cases c ON u.Id = c.UserId
      LEFT JOIN VisaTypes vt ON c.VisaTypeId = vt.Id
      WHERE u.Email = 'A-1@testing.com'
      ORDER BY c.UpdatedAt DESC
    `;

    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      console.log('📄 DATABASE RESULT:');
      console.log(`   Email: ${user.Email}`);
      console.log(`   Visa Code: ${user.VisaCode || 'NONE'}`);
      console.log(`   Visa Name: ${user.VisaName || 'NONE'}`);

      if (user.VisaCode === 'A-1') {
        console.log('\n🎉🎉🎉 SUCCESS: A-1 USER ASSIGNED A-1 VISA! 🎉🎉🎉');
      } else if (user.VisaCode) {
        console.log(`\n⚠️ WRONG VISA: Expected A-1, got ${user.VisaCode}`);
      } else {
        console.log('\n❌ FAILED: A-1 user still not assigned any visa');
      }
    }
    await sql.close();
  } catch (e) {
    console.error('❌ Database check failed:', e.message);
  }
}

finalA1Test().catch(console.error);