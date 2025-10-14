/**
 * FIX A-1 NOW - Complete A-1 user workflow and assign A-1 visa
 * NO EXCUSES - MUST WORK
 */

const puppeteer = require('puppeteer');

async function fixA1Now() {
  console.log('🚨 FIX A-1 NOW - MUST ASSIGN A-1 VISA');
  console.log('='.repeat(60));

  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      slowMo: 200
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

    // Skip profile completion entirely and go straight to interview
    console.log('🎯 Go directly to interview');
    await page.goto('http://localhost:5179/interview', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Get current URL
    const currentUrl = page.url();
    console.log(`📍 Interview URL: ${currentUrl}`);

    // If redirected to profile, complete it quickly
    if (currentUrl.includes('profile-completion')) {
      console.log('📝 Forced to complete profile first');

      // Use Skip for now if available
      const skipButton = await page.$('button');
      const allButtons = await page.$$('button');

      for (const button of allButtons) {
        const text = await page.evaluate(btn => btn.textContent.trim(), button);
        console.log(`   Found button: "${text}"`);

        if (text === 'Skip for now' || text.toLowerCase().includes('skip')) {
          await button.click();
          console.log('   ✅ Clicked Skip for now');
          await new Promise(resolve => setTimeout(resolve, 3000));
          break;
        }
      }

      // Try interview again
      await page.goto('http://localhost:5179/interview', { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Find and interact with the interview dropdown
    let attempts = 0;
    while (attempts < 5) {
      attempts++;
      console.log(`🔍 Attempt ${attempts} to find interview dropdown`);

      const interviewData = await page.evaluate(() => {
        // Look for ANY select elements
        const allSelects = Array.from(document.querySelectorAll('select'));
        console.log(`Found ${allSelects.length} select elements total`);

        // Focus on main element
        const main = document.querySelector('main');
        if (!main) {
          return { error: 'No main element found' };
        }

        const mainSelects = Array.from(main.querySelectorAll('select'));
        console.log(`Found ${mainSelects.length} select elements in main`);

        // Find interview select (not language)
        let interviewSelect = null;
        for (const select of mainSelects) {
          const options = Array.from(select.options);
          console.log(`Select has ${options.length} options`);

          // Skip if it looks like a language selector
          const isLanguage = options.some(opt =>
            opt.value.includes('-') && opt.value.length === 5
          );

          if (!isLanguage && options.length > 2) {
            interviewSelect = select;
            break;
          }
        }

        if (!interviewSelect) {
          return {
            error: 'No interview select found',
            totalSelects: allSelects.length,
            mainSelects: mainSelects.length,
            mainText: main.textContent.substring(0, 200)
          };
        }

        return {
          success: true,
          options: Array.from(interviewSelect.options).map(opt => ({
            value: opt.value,
            text: opt.textContent.trim()
          }))
        };
      });

      if (interviewData.success) {
        console.log('✅ Found interview dropdown!');
        console.log('📋 Options:');
        interviewData.options.forEach((opt, i) => {
          const isDiplomatic = opt.text.toLowerCase().includes('diplomatic') ||
                              opt.text.toLowerCase().includes('nato');
          console.log(`   ${i + 1}. "${opt.text}" (${opt.value}) ${isDiplomatic ? '← DIPLOMATIC' : ''}`);
        });

        // Select diplomatic option for A-1
        const diplomaticOption = interviewData.options.find(opt =>
          opt.text.toLowerCase().includes('diplomatic') ||
          opt.text.toLowerCase().includes('nato')
        );

        if (diplomaticOption) {
          console.log(`🎯 Selecting: ${diplomaticOption.text}`);

          const selected = await page.evaluate((value) => {
            const main = document.querySelector('main');
            const selects = Array.from(main.querySelectorAll('select'));

            for (const select of selects) {
              const options = Array.from(select.options);
              // Skip language selectors
              if (options.some(opt => opt.value.includes('-') && opt.value.length === 5)) {
                continue;
              }

              // Find and select the diplomatic option
              if (options.some(opt => opt.value === value)) {
                select.value = value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
              }
            }
            return false;
          }, diplomaticOption.value);

          if (selected) {
            console.log('✅ Diplomatic option selected');

            // Click Next
            await new Promise(resolve => setTimeout(resolve, 1000));

            const nextResult = await page.evaluate(() => {
              const buttons = Array.from(document.querySelectorAll('button'));
              const nextBtn = buttons.find(btn =>
                btn.textContent.toLowerCase().includes('next') ||
                btn.textContent.toLowerCase().includes('continue') ||
                btn.type === 'submit'
              );

              if (nextBtn && !nextBtn.disabled) {
                nextBtn.click();
                return { clicked: true, text: nextBtn.textContent.trim() };
              }

              return { clicked: false, buttons: buttons.map(b => b.textContent.trim()) };
            });

            if (nextResult.clicked) {
              console.log(`✅ Clicked: ${nextResult.text}`);
              await new Promise(resolve => setTimeout(resolve, 3000));

              // Check if we're still in interview flow
              const newUrl = page.url();
              console.log(`📍 After Next: ${newUrl}`);

              if (newUrl.includes('visa-library')) {
                console.log('❌ Redirected to visa library - workflow incomplete');
              } else {
                console.log('✅ Still in interview - continuing...');

                // Continue with more questions if needed
                let moreQuestions = true;
                let questionCount = 1;

                while (moreQuestions && questionCount < 10) {
                  questionCount++;
                  console.log(`❓ Question ${questionCount}`);

                  await new Promise(resolve => setTimeout(resolve, 2000));

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
                    moreQuestions = false;
                    break;
                  }

                  // Look for next question
                  const nextQuestion = await page.evaluate(() => {
                    const main = document.querySelector('main');
                    if (!main) return { hasSelect: false };

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
                      question: main.querySelector('h3')?.textContent?.trim() || 'Unknown question',
                      options: Array.from(interviewSelect.options).map(opt => ({
                        value: opt.value,
                        text: opt.textContent.trim()
                      }))
                    };
                  });

                  if (!nextQuestion.hasSelect) {
                    console.log('⚠️ No more questions found');
                    moreQuestions = false;
                    break;
                  }

                  console.log(`📝 Q${questionCount}: ${nextQuestion.question}`);

                  // For A-1, answer YES to diplomat questions
                  let answer = null;
                  const questionLower = nextQuestion.question.toLowerCase();

                  if (questionLower.includes('diplomat')) {
                    answer = nextQuestion.options.find(opt =>
                      opt.value.toLowerCase() === 'yes' || opt.text.toLowerCase().includes('yes')
                    );
                  } else if (questionLower.includes('government') && questionLower.includes('official')) {
                    answer = nextQuestion.options.find(opt =>
                      opt.value.toLowerCase() === 'yes' || opt.text.toLowerCase().includes('yes')
                    );
                  } else if (questionLower.includes('international')) {
                    answer = nextQuestion.options.find(opt =>
                      opt.value.toLowerCase() === 'no' || opt.text.toLowerCase().includes('no')
                    );
                  } else {
                    // Default to first valid option
                    answer = nextQuestion.options.find(opt => opt.value && opt.value !== '');
                  }

                  if (answer) {
                    console.log(`🎯 Answering: ${answer.text}`);

                    const answered = await page.evaluate((value) => {
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

                    if (answered) {
                      console.log('✅ Answer selected');

                      // Click Next
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      const nextClicked = await page.evaluate(() => {
                        const buttons = Array.from(document.querySelectorAll('button'));
                        const nextBtn = buttons.find(btn =>
                          btn.textContent.toLowerCase().includes('next') ||
                          btn.textContent.toLowerCase().includes('continue') ||
                          btn.type === 'submit'
                        );

                        if (nextBtn && !nextBtn.disabled) {
                          nextBtn.click();
                          return true;
                        }
                        return false;
                      });

                      if (nextClicked) {
                        console.log('⏭️ Next clicked');
                        await new Promise(resolve => setTimeout(resolve, 3000));
                      } else {
                        console.log('❌ Could not click Next');
                        moreQuestions = false;
                      }
                    }
                  } else {
                    console.log('❌ No suitable answer found');
                    moreQuestions = false;
                  }
                }
              }
            } else {
              console.log('❌ Could not click Next button');
              console.log('Available buttons:', nextResult.buttons);
            }
          }
        }
        break;
      } else {
        console.log(`❌ Attempt ${attempts} failed: ${interviewData.error}`);
        if (interviewData.mainText) {
          console.log(`Main content: ${interviewData.mainText}`);
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Check database result
  console.log('\n🔍 FINAL DATABASE CHECK');
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

      if (user.VisaCode === 'A-1') {
        console.log('\n🎉 SUCCESS: A-1 USER ASSIGNED A-1 VISA!');
      } else {
        console.log('\n❌ FAILED: A-1 user not assigned A-1 visa');
      }
    }
    await sql.close();
  } catch (e) {
    console.error('❌ Database check failed:', e.message);
  }
}

fixA1Now().catch(console.error);