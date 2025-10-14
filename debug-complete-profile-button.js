/**
 * DEBUG COMPLETE PROFILE BUTTON - Find out why button isn't working
 */

const puppeteer = require('puppeteer');

async function debugCompleteProfileButton() {
  console.log('🔍 DEBUG COMPLETE PROFILE BUTTON');
  console.log('='.repeat(50));

  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 720 },
      slowMo: 500
    });

    const page = await browser.newPage();
    await page.setCacheEnabled(false);

    // Login and get to profile completion
    await page.goto('http://localhost:5179/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'B-2@testing.com');
    await page.type('input[type="password"]', 'SecureTest123!');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 5000));

    if (page.url().includes('profile-completion')) {
      console.log('📝 On profile completion page');

      // Fill out profile quickly
      await page.type('input[name="streetAddress"]', '123 Main Street');
      await page.type('input[name="city"]', 'New York');
      await page.type('input[name="postalCode"]', '10001');
      await page.type('input[name="dateOfBirth"]', '1990-05-15');
      await page.select('select[name="maritalStatus"]', 'Single');

      console.log('✅ Profile fields filled');

      // Analyze the Complete Profile button in detail
      const buttonAnalysis = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const completeButton = buttons.find(btn => btn.textContent.trim() === 'Complete Profile');

        if (!completeButton) {
          return {
            error: 'Complete Profile button not found',
            allButtons: buttons.map(btn => btn.textContent.trim())
          };
        }

        return {
          found: true,
          text: completeButton.textContent.trim(),
          disabled: completeButton.disabled,
          type: completeButton.type,
          className: completeButton.className,
          style: completeButton.style.cssText,
          offsetParent: !!completeButton.offsetParent, // Check if visible
          getBoundingClientRect: completeButton.getBoundingClientRect(),
          onclick: !!completeButton.onclick,
          addEventListener: completeButton.hasAttribute('data-test') // Check for any test attributes
        };
      });

      console.log('🔍 Complete Profile Button Analysis:');
      console.log(JSON.stringify(buttonAnalysis, null, 2));

      if (buttonAnalysis.found && !buttonAnalysis.disabled) {
        console.log('🎯 Button looks clickable, trying multiple click methods...');

        // Method 1: Direct Puppeteer click
        try {
          const buttons = await page.$$('button');
          for (const button of buttons) {
            const text = await page.evaluate(btn => btn.textContent.trim(), button);
            if (text === 'Complete Profile') {
              console.log('Method 1: Direct Puppeteer click');
              await button.click();
              await new Promise(resolve => setTimeout(resolve, 2000));

              const newUrl = page.url();
              console.log(`   Result: URL changed to ${newUrl}`);
              if (!newUrl.includes('profile-completion')) {
                console.log('   ✅ SUCCESS: Left profile completion page!');
                break;
              }
            }
          }
        } catch (error) {
          console.log(`   ❌ Method 1 failed: ${error.message}`);
        }

        // Method 2: JavaScript click
        if (page.url().includes('profile-completion')) {
          console.log('Method 2: JavaScript click');
          try {
            await page.evaluate(() => {
              const buttons = Array.from(document.querySelectorAll('button'));
              const completeButton = buttons.find(btn => btn.textContent.trim() === 'Complete Profile');
              if (completeButton) {
                completeButton.click();
                return true;
              }
              return false;
            });

            await new Promise(resolve => setTimeout(resolve, 2000));
            const newUrl = page.url();
            console.log(`   Result: URL changed to ${newUrl}`);
            if (!newUrl.includes('profile-completion')) {
              console.log('   ✅ SUCCESS: Left profile completion page!');
            }
          } catch (error) {
            console.log(`   ❌ Method 2 failed: ${error.message}`);
          }
        }

        // Method 3: Focus and Enter
        if (page.url().includes('profile-completion')) {
          console.log('Method 3: Focus and Enter key');
          try {
            await page.evaluate(() => {
              const buttons = Array.from(document.querySelectorAll('button'));
              const completeButton = buttons.find(btn => btn.textContent.trim() === 'Complete Profile');
              if (completeButton) {
                completeButton.focus();
                return true;
              }
              return false;
            });

            await page.keyboard.press('Enter');
            await new Promise(resolve => setTimeout(resolve, 2000));

            const newUrl = page.url();
            console.log(`   Result: URL changed to ${newUrl}`);
            if (!newUrl.includes('profile-completion')) {
              console.log('   ✅ SUCCESS: Left profile completion page!');
            }
          } catch (error) {
            console.log(`   ❌ Method 3 failed: ${error.message}`);
          }
        }
      }

      const finalUrl = page.url();
      console.log(`📍 Final URL: ${finalUrl}`);

      if (finalUrl.includes('profile-completion')) {
        console.log('❌ Still on profile completion page - button not working');
      } else {
        console.log('✅ Successfully left profile completion page!');

        // Now test interview page
        await page.goto('http://localhost:5179/interview', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 3000));

        const mainCheck = await page.evaluate(() => {
          const main = document.querySelector('main');
          return {
            mainExists: !!main,
            selectsInMain: main ? main.querySelectorAll('select').length : 0
          };
        });

        console.log(`🎯 Interview page: Main exists: ${mainCheck.mainExists}, Selects: ${mainCheck.selectsInMain}`);

        if (mainCheck.selectsInMain > 0) {
          console.log('🎉 SUCCESS: Interview questions loaded after profile completion!');
        }
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
}

debugCompleteProfileButton().catch(console.error);