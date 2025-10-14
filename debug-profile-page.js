/**
 * DEBUG PROFILE PAGE - See what fields are available
 */

const puppeteer = require('puppeteer');

async function debugProfilePage() {
  console.log('🔍 Debug Profile Completion Page');
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

    console.log('🔑 Login');
    await page.goto('http://localhost:5179/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'B-2@testing.com');
    await page.type('input[type="password"]', 'SecureTest123!');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    if (currentUrl.includes('profile-completion')) {
      console.log('📝 On profile completion page, analyzing form...');

      const formAnalysis = await page.evaluate(() => {
        return {
          url: window.location.href,
          title: document.title,
          h1: document.querySelector('h1')?.textContent,
          h2: document.querySelector('h2')?.textContent,
          allInputs: Array.from(document.querySelectorAll('input')).map(input => ({
            type: input.type,
            name: input.name,
            placeholder: input.placeholder,
            id: input.id,
            className: input.className
          })),
          allSelects: Array.from(document.querySelectorAll('select')).map(select => ({
            name: select.name,
            id: select.id,
            className: select.className,
            optionCount: select.options.length,
            firstOption: select.options[0]?.textContent
          })),
          allButtons: Array.from(document.querySelectorAll('button')).map(btn => ({
            type: btn.type,
            text: btn.textContent.trim(),
            className: btn.className
          })),
          formElements: Array.from(document.querySelectorAll('form')).length,
          bodyText: document.body.textContent.substring(0, 500)
        };
      });

      console.log('📊 Profile Page Analysis:');
      console.log(`   Title: ${formAnalysis.title}`);
      console.log(`   H1: ${formAnalysis.h1}`);
      console.log(`   H2: ${formAnalysis.h2}`);
      console.log(`   Forms: ${formAnalysis.formElements}`);

      console.log('\n📝 Input Fields:');
      formAnalysis.allInputs.forEach((input, i) => {
        console.log(`   ${i + 1}. Type: ${input.type}, Name: "${input.name}", Placeholder: "${input.placeholder}"`);
      });

      console.log('\n🔽 Select Fields:');
      formAnalysis.allSelects.forEach((select, i) => {
        console.log(`   ${i + 1}. Name: "${select.name}", Options: ${select.optionCount}, First: "${select.firstOption}"`);
      });

      console.log('\n🔘 Buttons:');
      formAnalysis.allButtons.forEach((btn, i) => {
        console.log(`   ${i + 1}. Type: ${btn.type}, Text: "${btn.text}"`);
      });

      console.log('\n📄 Body text snippet:');
      console.log(`   ${formAnalysis.bodyText}...`);

    } else {
      console.log('🔄 Not on profile completion page, going to interview...');
    }

    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugProfilePage().catch(console.error);