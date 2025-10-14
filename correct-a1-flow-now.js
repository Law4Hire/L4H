/**
 * CORRECT A-1 FLOW - SELECT THE RIGHT PATH TO GET A-1 QUESTIONS
 */

const puppeteer = require('puppeteer');

async function correctA1Flow() {
  console.log('🎯 CORRECT A-1 FLOW - FIXED PATH SELECTION');
  console.log('='.repeat(50));

  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      slowMo: 200
    });

    const page = await browser.newPage();
    await page.setCacheEnabled(false);

    console.log('🔑 Login');
    await page.goto('http://localhost:5179/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'A-1@testing.com');
    await page.type('input[type="password"]', 'SecureTest123!');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const afterLoginUrl = page.url();
    if (afterLoginUrl.includes('profile-completion')) {
      console.log('📝 Complete profile registration');
      await page.type('input[name="streetAddress"]', '123 Embassy Row');
      await page.type('input[name="city"]', 'Washington');
      await page.type('input[name="postalCode"]', '20037');
      await page.type('input[name="dateOfBirth"]', '1970-01-01');
      await page.select('select[name="maritalStatus"]', 'Married');

      const countryInputs = await page.$$('input[placeholder*="country"]');
      if (countryInputs.length > 0) {
        await countryInputs[0].click();
        await countryInputs[0].type('United States');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      }

      const passportInputs = await page.$$('input[placeholder*="passport"]');
      if (passportInputs.length > 0) {
        await passportInputs[0].click();
        await passportInputs[0].type('France');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
      }

      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await page.evaluate(btn => btn.textContent.trim(), button);
        if (text === 'Complete Profile') {
          await button.click();
          console.log('   ✅ Profile completed');
          break;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('🎯 Start interview');
    await page.goto('http://localhost:5179/interview', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // A-1 SPECIFIC ANSWERS
    const correctAnswers = [
      {
        questionContains: ['purpose', 'category', 'eligibility'],
        answer: 'Diplomatic, IO & NATO',
        note: 'Q1: Main purpose'
      },
      {
        questionContains: ['diplomat', 'government business', 'international organization', 'nato'],
        answer: 'Diplomat/official government business (A)',
        note: 'Q2: Choose A-series path (NOT NATO!)'
      },
      {
        questionContains: ['diplomat'],
        answer: 'Yes',
        note: 'Q3: Are you a diplomat? YES for A-1'
      },
      {
        questionContains: ['government', 'official'],
        answer: 'Yes',
        note: 'Q4: Government official? YES for A-1'
      },
      {
        questionContains: ['international', 'organization'],
        answer: 'No',
        note: 'Q5: International org? NO for A-1'
      }
    ];

    let answerIndex = 0;
    let questionCount = 0;

    while (questionCount < 8 && answerIndex < correctAnswers.length) {
      questionCount++;
      console.log(`\n❓ Question ${questionCount}`);

      // Check completion
      const isComplete = await page.evaluate(() => {
        const complete = document.querySelector('[data-testid="interview-complete-summary"]');
        const recommendation = document.querySelector('[data-testid="recommended-visa-type"]');
        return {
          complete: !!complete,
          recommendation: recommendation?.textContent?.trim() || ''
        };
      });

      if (isComplete.complete) {
        console.log(`✅ Interview completed! Recommendation: ${isComplete.recommendation}`);
        break;
      }

      // Get question
      const questionInfo = await page.evaluate(() => {
        const main = document.querySelector('main');
        if (!main) return { hasSelect: false };

        const questionEl = main.querySelector('h3');
        const selects = Array.from(main.querySelectorAll('select'));

        let interviewSelect = null;
        for (const select of selects) {
          const options = Array.from(select.options);
          if (options.some(opt => opt.value.includes('-') && opt.value.length === 5)) {
            continue;
          }
          if (options.length > 1) {
            interviewSelect = select;
            break;
          }
        }

        if (!interviewSelect) return { hasSelect: false };

        return {
          hasSelect: true,
          question: questionEl?.textContent?.trim() || '',
          options: Array.from(interviewSelect.options).map(opt => ({
            value: opt.value,
            text: opt.textContent.trim()
          }))
        };
      });

      if (!questionInfo.hasSelect) {
        console.log('⚠️ No question found');
        break;
      }

      console.log(`📝 ${questionInfo.question}`);
      console.log('📋 Options:');
      questionInfo.options.forEach((opt, i) => {
        console.log(`   ${i + 1}. "${opt.text}" (${opt.value})`);
      });

      // Find correct answer
      const questionLower = questionInfo.question.toLowerCase();
      let selectedOption = null;

      // Use specific A-1 logic
      if (answerIndex < correctAnswers.length) {
        const answerRule = correctAnswers[answerIndex];

        // Check if this question matches the expected pattern
        const matches = answerRule.questionContains.some(keyword =>
          questionLower.includes(keyword.toLowerCase())
        );

        if (matches) {
          selectedOption = questionInfo.options.find(opt =>
            opt.text.toLowerCase().includes(answerRule.answer.toLowerCase()) ||
            opt.text === answerRule.answer
          );

          console.log(`🎯 Using rule ${answerIndex + 1}: ${answerRule.note}`);
          answerIndex++;
        } else {
          // Fallback: try to match by keywords
          selectedOption = questionInfo.options.find(opt => opt.value && opt.value !== '');
          console.log(`🤔 Question doesn't match expected pattern, using fallback`);
        }
      }

      if (!selectedOption) {
        console.log('❌ No suitable answer found');
        break;
      }

      console.log(`🎯 Selecting: "${selectedOption.text}"`);

      // Select answer
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
      }, selectedOption.value);

      if (!selected) {
        console.log('❌ Could not select answer');
        break;
      }

      console.log('✅ Answer selected');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Click Next
      const nextClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nextBtn = buttons.find(btn =>
          btn.textContent.trim() === 'Next Question'
        );

        if (nextBtn && !nextBtn.disabled) {
          nextBtn.click();
          return true;
        }

        const otherBtn = buttons.find(btn =>
          (btn.textContent.toLowerCase().includes('next') ||
           btn.type === 'submit') &&
          !btn.textContent.toLowerCase().includes('library') &&
          !btn.disabled
        );

        if (otherBtn) {
          otherBtn.click();
          return true;
        }

        return false;
      });

      if (nextClicked) {
        console.log('⏭️ Next clicked');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log('❌ Could not click Next');
        break;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Database check
  console.log('\n🔍 DATABASE CHECK');
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
      console.log('📄 Database Result:');
      console.log(`   Email: ${user.Email}`);
      console.log(`   Visa Code: ${user.VisaCode || 'NONE'}`);

      if (user.VisaCode === 'A-1') {
        console.log('\n🎉🎉🎉 SUCCESS: A-1 USER ASSIGNED A-1 VISA! 🎉🎉🎉');
      } else {
        console.log(`\n❌ FAILED: Expected A-1, got ${user.VisaCode || 'NONE'}`);
      }
    }
    await sql.close();
  } catch (e) {
    console.error('❌ Database check failed:', e.message);
  }
}

correctA1Flow().catch(console.error);