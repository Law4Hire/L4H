/**
 * DEBUG INTERVIEW ANSWERS - See exactly what answers are being stored
 */

const puppeteer = require('puppeteer');

async function debugInterviewAnswers() {
  console.log('🔍 DEBUG INTERVIEW ANSWERS');
  console.log('='.repeat(50));

  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      slowMo: 300
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

    // Store answers to track what's happening
    let storedAnswers = {};

    // Question 1: Purpose
    console.log('\n❓ Question 1: Purpose');
    const q1Info = await page.evaluate(() => {
      const main = document.querySelector('main');
      const questionEl = main?.querySelector('h3');
      const select = Array.from(main?.querySelectorAll('select') || [])
        .find(s => Array.from(s.options).length > 5);

      return {
        question: questionEl?.textContent?.trim() || '',
        options: select ? Array.from(select.options).map(opt => ({
          value: opt.value,
          text: opt.textContent.trim()
        })) : []
      };
    });

    console.log(`📝 Q1: ${q1Info.question}`);
    const diplomaticOption = q1Info.options.find(opt =>
      opt.text.toLowerCase().includes('diplomatic')
    );

    if (diplomaticOption) {
      console.log(`🎯 Selecting: ${diplomaticOption.text}`);
      await page.evaluate((value) => {
        const main = document.querySelector('main');
        const select = Array.from(main?.querySelectorAll('select') || [])
          .find(s => Array.from(s.options).length > 5);
        if (select) {
          select.value = value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, diplomaticOption.value);

      storedAnswers.purpose = diplomaticOption.value;
      console.log(`   📊 Stored: purpose = "${diplomaticOption.value}"`);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const nextClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nextBtn = buttons.find(btn =>
          btn.textContent.trim() === 'Next Question' ||
          (btn.textContent.toLowerCase().includes('next') && !btn.textContent.toLowerCase().includes('library'))
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

        // Question 2: Diplomatic subcategory
        console.log('\n❓ Question 2: Diplomatic subcategory');
        const q2Info = await page.evaluate(() => {
          const main = document.querySelector('main');
          const questionEl = main?.querySelector('h3');
          const select = Array.from(main?.querySelectorAll('select') || [])
            .find(s => Array.from(s.options).some(opt =>
              opt.text.toLowerCase().includes('diplomat') ||
              opt.text.toLowerCase().includes('government')
            ));

          return {
            question: questionEl?.textContent?.trim() || '',
            options: select ? Array.from(select.options).map(opt => ({
              value: opt.value,
              text: opt.textContent.trim()
            })) : []
          };
        });

        console.log(`📝 Q2: ${q2Info.question}`);
        q2Info.options.forEach((opt, i) => {
          console.log(`   ${i + 1}. "${opt.text}" (${opt.value})`);
        });

        const diplomaticGovOption = q2Info.options.find(opt =>
          opt.text.toLowerCase().includes('diplomat') &&
          opt.text.toLowerCase().includes('government')
        );

        if (diplomaticGovOption) {
          console.log(`🎯 Selecting: ${diplomaticGovOption.text}`);
          await page.evaluate((value) => {
            const main = document.querySelector('main');
            const select = Array.from(main?.querySelectorAll('select') || [])
              .find(s => Array.from(s.options).some(opt =>
                opt.text.toLowerCase().includes('diplomat') ||
                opt.text.toLowerCase().includes('government')
              ));
            if (select) {
              select.value = value;
              select.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }, diplomaticGovOption.value);

          // Try to figure out what key this answer is stored as
          console.log(`   📊 Stored: ??? = "${diplomaticGovOption.value}"`);
          console.log(`   🤔 This might be stored as 'purpose', 'category', or 'diplomaticType'`);

          await new Promise(resolve => setTimeout(resolve, 1000));

          // Check if interview is complete now
          const isCompleteAfterQ2 = await page.evaluate(() => {
            return {
              hasCompleteScreen: !!document.querySelector('[data-testid="interview-complete-summary"]'),
              url: window.location.href
            };
          });

          console.log(`   🔍 Is complete after Q2: ${isCompleteAfterQ2.hasCompleteScreen}`);
          console.log(`   📍 URL: ${isCompleteAfterQ2.url}`);

          if (!isCompleteAfterQ2.hasCompleteScreen) {
            const nextClicked2 = await page.evaluate(() => {
              const buttons = Array.from(document.querySelectorAll('button'));
              const nextBtn = buttons.find(btn =>
                btn.textContent.trim() === 'Next Question' ||
                (btn.textContent.toLowerCase().includes('next') && !btn.textContent.toLowerCase().includes('library'))
              );
              if (nextBtn && !nextBtn.disabled) {
                nextBtn.click();
                return true;
              }
              return false;
            });

            if (nextClicked2) {
              console.log('⏭️ Next clicked for Q3');
              await new Promise(resolve => setTimeout(resolve, 3000));

              // Check what happens after Q2
              const afterQ2 = await page.evaluate(() => {
                const main = document.querySelector('main');
                const questionEl = main?.querySelector('h3');
                const hasCompleteScreen = !!document.querySelector('[data-testid="interview-complete-summary"]');

                return {
                  hasCompleteScreen,
                  question: questionEl?.textContent?.trim() || '',
                  url: window.location.href
                };
              });

              console.log('\n❓ After Q2:');
              console.log(`   Complete: ${afterQ2.hasCompleteScreen}`);
              console.log(`   Question: ${afterQ2.question}`);
              console.log(`   URL: ${afterQ2.url}`);

              if (!afterQ2.hasCompleteScreen && afterQ2.question) {
                console.log('\n✅ Q3 EXISTS! The system is asking more questions.');
              } else {
                console.log('\n❌ NO Q3! Interview completed prematurely.');
              }
            }
          } else {
            console.log('\n❌ Interview completed after Q2! This is the problem.');
          }
        }
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log(`   Purpose stored: ${storedAnswers.purpose || 'Unknown'}`);
    console.log('   Expected flow: Q1=purpose, Q2=diplomaticType, Q3=diplomat?, Q4=govOfficial?, Q5=intlOrg?');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugInterviewAnswers().catch(console.error);