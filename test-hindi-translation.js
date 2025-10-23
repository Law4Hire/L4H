const puppeteer = require('puppeteer');

async function testHindiTranslation() {
  console.log('🔍 Testing Hindi (hi-IN) translation on Visa Library...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Navigate to Visa Library
    console.log('📍 Loading http://localhost:5173/visa-library...\n');
    await page.goto('http://localhost:5173/visa-library', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Switch to Hindi
    console.log('🔄 Switching to Hindi (hi-IN)...\n');
    await page.select('select', 'hi-IN');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Extract visible text from the page
    const pageContent = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent || '';
      const description = document.querySelector('p')?.textContent || '';

      // Get first few visa cards
      const visaCards = Array.from(document.querySelectorAll('.bg-white')).slice(0, 3);
      const visas = visaCards.map(card => {
        const name = card.querySelector('h3')?.textContent || '';
        const desc = card.querySelector('p')?.textContent || '';
        return { name, desc };
      });

      return { title, description, visas };
    });

    console.log('📄 Page Content in Hindi:');
    console.log('='.repeat(80));
    console.log(`Title: ${pageContent.title}`);
    console.log(`Description: ${pageContent.description.substring(0, 100)}...`);
    console.log('\nFirst 3 Visa Cards:');
    pageContent.visas.forEach((visa, i) => {
      console.log(`\n${i + 1}. ${visa.name}`);
      console.log(`   ${visa.desc.substring(0, 80)}...`);
    });

    console.log('\n' + '='.repeat(80));

    // Check if content is in English (contains common English words)
    const allText = JSON.stringify(pageContent).toLowerCase();
    const hasEnglishWords = /\b(business|visitor|student|occupation|worker)\b/.test(allText);

    if (hasEnglishWords) {
      console.log('⚠️  WARNING: Content appears to still be in ENGLISH, not Hindi!');
      console.log('   The translation file exists but contains English text.');
    } else {
      console.log('✅ Content appears to be properly translated to Hindi.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testHindiTranslation().catch(console.error);
