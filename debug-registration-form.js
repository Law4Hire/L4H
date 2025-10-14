const puppeteer = require('puppeteer');

async function debugRegistrationForm() {
    console.log('🔍 REGISTRATION FORM DEBUG');
    console.log('===========================');

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1280, height: 720 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Navigate to registration
        console.log('📍 Navigating to registration page...');
        await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Take screenshot
        await page.screenshot({ path: 'registration-debug.png' });
        console.log('📸 Screenshot saved: registration-debug.png');

        // Analyze form structure
        const formStructure = await page.evaluate(() => {
            const form = document.querySelector('form');
            if (!form) return { error: 'No form found' };

            const inputs = [...form.querySelectorAll('input')];
            const buttons = [...form.querySelectorAll('button')];

            return {
                formExists: true,
                inputs: inputs.map(input => ({
                    type: input.type,
                    name: input.name,
                    placeholder: input.placeholder,
                    id: input.id,
                    className: input.className,
                    visible: input.offsetParent !== null
                })),
                buttons: buttons.map(button => ({
                    type: button.type,
                    textContent: button.textContent.trim(),
                    className: button.className,
                    visible: button.offsetParent !== null
                })),
                innerHTML: form.innerHTML.substring(0, 1000)
            };
        });

        console.log('\n📋 Form Analysis:');
        console.log('=================');
        console.log('Form exists:', formStructure.formExists);

        if (formStructure.inputs) {
            console.log('\n📝 Input fields:');
            formStructure.inputs.forEach((input, i) => {
                console.log(`  ${i+1}. Type: ${input.type}, Name: "${input.name}", Placeholder: "${input.placeholder}", Visible: ${input.visible}`);
            });
        }

        if (formStructure.buttons) {
            console.log('\n🔘 Buttons:');
            formStructure.buttons.forEach((button, i) => {
                console.log(`  ${i+1}. Type: ${button.type}, Text: "${button.textContent}", Visible: ${button.visible}`);
            });
        }

        if (formStructure.error) {
            console.log('❌ Error:', formStructure.error);
        }

        // Try to find all possible field selectors
        const fieldSelectors = await page.evaluate(() => {
            const selectors = {};

            // Email
            const emailFields = document.querySelectorAll('input[type="email"], input[name*="email"], input[placeholder*="email" i]');
            selectors.email = [...emailFields].map(el => ({
                selector: el.name ? `input[name="${el.name}"]` : `input[type="${el.type}"]`,
                placeholder: el.placeholder
            }));

            // Password
            const passwordFields = document.querySelectorAll('input[type="password"], input[name*="password"], input[placeholder*="password" i]');
            selectors.password = [...passwordFields].map(el => ({
                selector: el.name ? `input[name="${el.name}"]` : `input[type="${el.type}"]`,
                placeholder: el.placeholder
            }));

            // First name
            const firstNameFields = document.querySelectorAll('input[name*="first" i], input[placeholder*="first" i]');
            selectors.firstName = [...firstNameFields].map(el => ({
                selector: el.name ? `input[name="${el.name}"]` : `input[placeholder*="${el.placeholder}"]`,
                placeholder: el.placeholder
            }));

            // Last name
            const lastNameFields = document.querySelectorAll('input[name*="last" i], input[placeholder*="last" i]');
            selectors.lastName = [...lastNameFields].map(el => ({
                selector: el.name ? `input[name="${el.name}"]` : `input[placeholder*="${el.placeholder}"]`,
                placeholder: el.placeholder
            }));

            return selectors;
        });

        console.log('\n🎯 Recommended Selectors:');
        console.log('==========================');
        Object.keys(fieldSelectors).forEach(field => {
            console.log(`${field}:`, fieldSelectors[field]);
        });

        console.log('\n⏳ Keeping browser open for 10 seconds for manual inspection...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        return {
            success: true,
            formStructure,
            fieldSelectors
        };

    } catch (error) {
        console.error('❌ DEBUG FAILED:', error);
        return { success: false, error: error.message };
    } finally {
        await browser.close();
    }
}

// Run the debug
debugRegistrationForm().then(result => {
    if (result.success) {
        console.log('\n🎉 REGISTRATION FORM DEBUG COMPLETED!');
    } else {
        console.log('\n💥 DEBUG FAILED:', result.error);
    }
}).catch(console.error);