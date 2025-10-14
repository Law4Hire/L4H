/**
 * DEBUG NEXT BUTTON - Find out why it's clicking Visa Library instead of Next
 */

const puppeteer = require('puppeteer');

async function debugNextButton() {
  console.log('🔍 DEBUG NEXT BUTTON ISSUE');
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

    // Login and go to interview
    await page.goto('http://localhost:5179/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'A-1@testing.com');
    await page.type('input[type="password"]', 'SecureTest123!');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 3000));

    await page.goto('http://localhost:5179/interview', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Select diplomatic option
    const selected = await page.evaluate(() => {
      const main = document.querySelector('main');
      const selects = Array.from(main.querySelectorAll('select'));

      for (const select of selects) {
        const options = Array.from(select.options);
        // Skip language selectors
        if (options.some(opt => opt.value.includes('-') && opt.value.length === 5)) {
          continue;
        }

        // Find diplomatic option
        const diplomaticOption = options.find(opt =>
          opt.text.toLowerCase().includes('diplomatic') ||
          opt.text.toLowerCase().includes('nato')
        );

        if (diplomaticOption) {
          select.value = diplomaticOption.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      return false;
    });

    if (selected) {
      console.log('✅ Diplomatic option selected');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Now analyze ALL buttons on the page
      const buttonAnalysis = await page.evaluate(() => {
        const allButtons = Array.from(document.querySelectorAll('button'));

        return {
          totalButtons: allButtons.length,
          buttons: allButtons.map((btn, i) => ({
            index: i,
            text: btn.textContent.trim(),
            type: btn.type,
            disabled: btn.disabled,
            className: btn.className,
            id: btn.id,
            visible: btn.offsetParent !== null,
            inMain: document.querySelector('main')?.contains(btn) || false
          }))
        };
      });

      console.log(`📊 Button analysis (${buttonAnalysis.totalButtons} buttons found):`);
      buttonAnalysis.buttons.forEach(btn => {
        const location = btn.inMain ? 'MAIN' : 'OTHER';
        const status = btn.disabled ? 'DISABLED' : btn.visible ? 'ENABLED' : 'HIDDEN';
        console.log(`   ${btn.index + 1}. "${btn.text}" (${btn.type}) [${status}] [${location}]`);
      });

      // Look specifically for Next-like buttons
      const nextButtons = buttonAnalysis.buttons.filter(btn =>
        btn.text.toLowerCase().includes('next') ||
        btn.text.toLowerCase().includes('continue') ||
        btn.text.toLowerCase().includes('submit') ||
        btn.type === 'submit'
      );

      console.log('\n🎯 Next-like buttons:');
      nextButtons.forEach(btn => {
        console.log(`   "${btn.text}" (${btn.type}) - Disabled: ${btn.disabled}, Visible: ${btn.visible}`);
      });

      // Check what happens when we try to click the actual Next button
      console.log('\n🔍 Looking for the correct Next button...');

      const nextResult = await page.evaluate(() => {
        const allButtons = Array.from(document.querySelectorAll('button'));

        // Find all possible next buttons
        const nextCandidates = allButtons.filter(btn =>
          btn.textContent.toLowerCase().includes('next') ||
          btn.textContent.toLowerCase().includes('continue') ||
          btn.type === 'submit'
        );

        // Exclude buttons that are clearly not the interview next button
        const validNextButtons = nextCandidates.filter(btn =>
          !btn.textContent.toLowerCase().includes('library') &&
          !btn.textContent.toLowerCase().includes('skip') &&
          !btn.disabled &&
          btn.offsetParent !== null
        );

        return {
          allNextCandidates: nextCandidates.map(btn => ({
            text: btn.textContent.trim(),
            disabled: btn.disabled,
            visible: btn.offsetParent !== null
          })),
          validNextButtons: validNextButtons.map(btn => ({
            text: btn.textContent.trim(),
            disabled: btn.disabled,
            visible: btn.offsetParent !== null
          }))
        };
      });

      console.log('\n📋 All Next candidates:');
      nextResult.allNextCandidates.forEach(btn => {
        console.log(`   "${btn.text}" - Disabled: ${btn.disabled}, Visible: ${btn.visible}`);
      });

      console.log('\n✅ Valid Next buttons:');
      nextResult.validNextButtons.forEach(btn => {
        console.log(`   "${btn.text}" - Disabled: ${btn.disabled}, Visible: ${btn.visible}`);
      });

      // Try clicking the first valid next button
      if (nextResult.validNextButtons.length > 0) {
        const clicked = await page.evaluate(() => {
          const allButtons = Array.from(document.querySelectorAll('button'));
          const nextBtn = allButtons.find(btn =>
            (btn.textContent.toLowerCase().includes('next') ||
             btn.textContent.toLowerCase().includes('continue') ||
             btn.type === 'submit') &&
            !btn.textContent.toLowerCase().includes('library') &&
            !btn.disabled &&
            btn.offsetParent !== null
          );

          if (nextBtn) {
            nextBtn.click();
            return { success: true, buttonText: nextBtn.textContent.trim() };
          }
          return { success: false };
        });

        if (clicked.success) {
          console.log(`🎯 Clicked: "${clicked.buttonText}"`);
          await new Promise(resolve => setTimeout(resolve, 3000));

          const finalUrl = page.url();
          console.log(`📍 Final URL: ${finalUrl}`);

          if (finalUrl.includes('visa-library')) {
            console.log('❌ STILL redirected to visa library');
          } else {
            console.log('✅ Stayed in interview flow!');
          }
        }
      } else {
        console.log('❌ No valid Next buttons found');
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

debugNextButton().catch(console.error);