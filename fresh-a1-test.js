/**
 * FRESH A-1 TEST - Create new A-1 user and test fixed interview
 */

const puppeteer = require('puppeteer');
const crypto = require('crypto');

async function freshA1Test() {
  console.log('🎯 FRESH A-1 TEST - NEW USER WITH FIXED LOGIC');
  console.log('='.repeat(50));

  let browser = null;
  const randomId = crypto.randomBytes(4).toString('hex');
  const testEmail = `A-1-fresh-${randomId}@testing.com`;

  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      slowMo: 200
    });

    const page = await browser.newPage();
    await page.setCacheEnabled(false);

    console.log(`🔑 Create and login as: ${testEmail}`);
    await page.goto('http://localhost:5179/register', { waitUntil: 'networkidle0' });

    // Register new user
    await page.type('input[name="email"]', testEmail);
    await page.type('input[name="password"]', 'SecureTest123!');
    await page.type('input[name="firstName"]', 'Fresh');
    await page.type('input[name="lastName"]', 'A1Test');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Complete profile
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

    console.log('🎯 Start interview');
    await page.goto('http://localhost:5179/interview', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Complete A-1 interview
    let questionCount = 0;
    while (questionCount < 8) {
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

      // A-1 answers
      let selectedOption = null;
      const questionLower = questionInfo.question.toLowerCase();

      if (questionLower.includes('purpose') || questionLower.includes('category') || questionLower.includes('eligibility')) {
        // Q1: Diplomatic
        selectedOption = questionInfo.options.find(opt =>
          opt.text.toLowerCase().includes('diplomatic')
        );
        console.log(`🎯 Q1: Selecting diplomatic purpose`);
      } else if (questionInfo.options.some(opt =>
        opt.text.toLowerCase().includes('diplomat') &&
        opt.text.toLowerCase().includes('government'))) {
        // Q2: A-series path
        selectedOption = questionInfo.options.find(opt =>
          opt.text.toLowerCase().includes('diplomat') &&
          opt.text.toLowerCase().includes('government')
        );
        console.log(`🎯 Q2: Selecting A-series path`);
      } else if (questionLower.includes('diplomat') && !questionLower.includes('working')) {
        // Q3: Are you a diplomat?
        selectedOption = questionInfo.options.find(opt =>
          opt.value.toLowerCase() === 'yes' || opt.text.toLowerCase().includes('yes')
        );
        console.log(`🎯 Q3: Yes - I am a diplomat`);
      } else if (questionLower.includes('government') && questionLower.includes('official')) {
        // Q4: Government official?
        selectedOption = questionInfo.options.find(opt =>
          opt.value.toLowerCase() === 'yes' || opt.text.toLowerCase().includes('yes')
        );
        console.log(`🎯 Q4: Yes - I am a government official`);
      } else if (questionLower.includes('international') && questionLower.includes('organization')) {
        // Q5: International org?
        selectedOption = questionInfo.options.find(opt =>
          opt.value.toLowerCase() === 'no' || opt.text.toLowerCase().includes('no')
        );
        console.log(`🎯 Q5: No - Not international org (A-1 requires this)`);
      } else {
        selectedOption = questionInfo.options.find(opt => opt.value && opt.value !== '');
        console.log(`🤔 Other question - using first option`);
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
      WHERE u.Email = ${testEmail}
      ORDER BY c.UpdatedAt DESC
    `;

    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      console.log('📄 Database Result:');
      console.log(`   Email: ${user.Email}`);
      console.log(`   Visa Code: ${user.VisaCode || 'NONE'}`);

      if (user.VisaCode === 'A-1') {
        console.log('\n🎉🎉🎉 SUCCESS: FRESH A-1 USER ASSIGNED A-1 VISA! 🎉🎉🎉');
      } else {
        console.log(`\n❌ FAILED: Expected A-1, got ${user.VisaCode || 'NONE'}`);
      }
    } else {
      console.log('❌ No database result found');
    }
    await sql.close();
  } catch (e) {
    console.error('❌ Database check failed:', e.message);
  }
}

freshA1Test().catch(console.error);