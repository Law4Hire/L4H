const puppeteer = require('puppeteer');

async function testVisaLibrary() {
  console.log('🧪 Starting Visa Library Language Switching Test...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Track console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to Visa Library
    console.log('📍 Navigating to Visa Library page...');
    await page.goto('http://localhost:5173/visa-library', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for page to load
    await page.waitForSelector('h2', { timeout: 10000 });

    console.log('✅ Page loaded successfully\n');

    // Test 1: Check if visa cards are visible
    console.log('Test 1: Checking if visa cards are visible...');
    const visaCards = await page.$$('[role="dialog"]');
    const cardCount = await page.$$eval('.cursor-pointer', cards => cards.length);
    console.log(`✅ Found ${cardCount} visa cards\n`);

    // Test 2: Click on a visa card to open modal
    console.log('Test 2: Opening modal by clicking visa card...');
    await page.click('.cursor-pointer');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if modal is open
    const modalVisible = await page.$('[role="dialog"]');
    if (modalVisible) {
      console.log('✅ Modal opened successfully\n');

      // Test 3: Check if close button has aria-label
      console.log('Test 3: Checking close button aria-label...');
      const closeButton = await page.$('[role="dialog"] button[aria-label]');
      if (closeButton) {
        const ariaLabel = await page.evaluate(btn => btn.getAttribute('aria-label'), closeButton);
        console.log(`✅ Close button has aria-label: "${ariaLabel}"\n`);
      } else {
        console.log('❌ Close button not found or missing aria-label\n');
      }

      // Close modal
      await page.click('[role="dialog"] button[aria-label]');
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      console.log('❌ Modal did not open\n');
    }

    // Test 4: Switch language and test again
    console.log('Test 4: Testing language switching...');

    // Try to find language switcher
    const langSwitcher = await page.$('select, button[aria-label*="language"], button[aria-label*="Language"]');

    if (langSwitcher) {
      console.log('✅ Language switcher found\n');

      // Get tag name to determine if it's a select or button
      const tagName = await page.evaluate(el => el.tagName, langSwitcher);

      if (tagName === 'SELECT') {
        // Change to Spanish
        await page.select('select', 'es-ES');
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ Changed language to Spanish (es-ES)\n');

        // Open modal again
        await page.click('.cursor-pointer');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check close button label again
        const closeButtonES = await page.$('[role="dialog"] button[aria-label]');
        if (closeButtonES) {
          const ariaLabelES = await page.evaluate(btn => btn.getAttribute('aria-label'), closeButtonES);
          console.log(`✅ Close button aria-label in Spanish: "${ariaLabelES}"\n`);
        }

        // Close modal
        await page.click('[role="dialog"] button[aria-label]');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } else {
      console.log('⚠️  Language switcher not found on page\n');
    }

    // Test 5: Report console errors
    console.log('Test 5: Checking for console errors...');
    if (consoleErrors.length > 0) {
      console.log(`❌ Found ${consoleErrors.length} console errors:`);
      consoleErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
      console.log('');
    } else {
      console.log('✅ No console errors detected\n');
    }

    console.log('🎉 All tests completed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testVisaLibrary().catch(console.error);
