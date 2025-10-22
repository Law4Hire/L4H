const puppeteer = require('puppeteer');

async function testLanguageCodeWarnings() {
  console.log('🔍 Testing for "rejecting language code" warnings...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Capture all console messages
    const warnings = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('rejecting language code') || text.includes('not found in supportedLngs')) {
        warnings.push(text);
        console.log(`⚠️  ${text}`);
      }
    });

    // Navigate to Visa Library
    console.log('📍 Loading http://localhost:5173/visa-library...\n');
    await page.goto('http://localhost:5173/visa-library', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n🔄 Switching to Hindi (hi-IN)...\n');
    await page.select('select', 'hi-IN');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n📊 Summary:');
    if (warnings.length === 0) {
      console.log('✅ No "rejecting language code" warnings found!');
    } else {
      console.log(`❌ Found ${warnings.length} language code warnings:`);
      warnings.forEach(w => console.log(`   - ${w}`));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testLanguageCodeWarnings().catch(console.error);
