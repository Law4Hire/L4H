/**
 * SIMPLE INTERVIEW TEST
 * Just test if we can complete one interview end-to-end without any complications
 */

const puppeteer = require('puppeteer');

async function testSimpleInterview() {
  console.log('🎯 Simple Interview Test');
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

    console.log('📍 Step 1: Navigate directly to interview page');
    await page.goto('http://localhost:5179/interview', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('📍 Step 2: Take screenshot of current state');
    await page.screenshot({
      path: 'simple-interview-current-state.png',
      fullPage: true
    });

    // Check what's on the page
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        h1Text: document.querySelector('h1')?.textContent || 'No H1',
        h2Text: document.querySelector('h2')?.textContent || 'No H2',
        h3Text: document.querySelector('h3')?.textContent || 'No H3',
        hasSelects: document.querySelectorAll('select').length,
        hasButtons: document.querySelectorAll('button').length,
        bodyTextSnippet: document.body.textContent.substring(0, 200)
      };
    });

    console.log('📊 Page Info:');
    console.log(`   Title: ${pageInfo.title}`);
    console.log(`   URL: ${pageInfo.url}`);
    console.log(`   H1: ${pageInfo.h1Text}`);
    console.log(`   H2: ${pageInfo.h2Text}`);
    console.log(`   H3: ${pageInfo.h3Text}`);
    console.log(`   Selects: ${pageInfo.hasSelects}`);
    console.log(`   Buttons: ${pageInfo.hasButtons}`);
    console.log(`   Body snippet: ${pageInfo.bodyTextSnippet}...`);

    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testSimpleInterview().then(() => {
  console.log('✅ Simple test completed');
}).catch(error => {
  console.error('💥 Test error:', error);
});