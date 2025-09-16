const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 LOGIN DEBUG TEST');
    console.log('==================');
    
    // Capture console logs
    page.on('console', msg => {
      console.log('📝 Console:', msg.text());
    });

    // Monitor API requests  
    page.on('response', response => {
      if (response.url().includes('/auth/login')) {
        console.log(`🌐 Login API Response: ${response.status()}`);
      }
    });

    // Go to login page
    await page.goto('http://localhost:5179/login');
    await page.waitForLoadState('networkidle');
    
    // Add debugging code to check what login returns
    await page.evaluate(() => {
      // Override the auth.login function to log its result
      const originalLogin = window.auth?.login;
      if (originalLogin) {
        window.auth.login = async function(credentials) {
          console.log('🔍 LOGIN: Calling auth.login with', credentials);
          try {
            const result = await originalLogin.call(this, credentials);
            console.log('🔍 LOGIN: Auth result:', JSON.stringify(result));
            return result;
          } catch (error) {
            console.log('🔍 LOGIN: Auth error:', error.message);
            throw error;
          }
        };
      }
      
      // Also override setJwtToken to see if it's called
      const originalSetJwtToken = window.setJwtToken;
      if (originalSetJwtToken) {
        window.setJwtToken = function(token) {
          console.log('🔍 TOKEN: setJwtToken called with:', token ? 'TOKEN_PRESENT' : 'NULL_OR_UNDEFINED');
          console.log('🔍 TOKEN: Token length:', token ? token.length : 'N/A');
          return originalSetJwtToken.call(this, token);
        };
      }
    });

    // Login
    await page.fill('input[name="email"]', 'dcann@cannlaw.com');
    await page.fill('input[name="password"]', 'SecureTest123!');
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Check localStorage
    const token = await page.evaluate(() => localStorage.getItem('jwt_token'));
    console.log('🔑 Final localStorage token:', token ? 'PRESENT' : 'MISSING');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await page.waitForTimeout(10000);
    await browser.close();
  }
})();