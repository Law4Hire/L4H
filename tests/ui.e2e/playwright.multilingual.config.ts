import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration specifically for multilingual e2e tests
 * 
 * This configuration is optimized for testing multilingual functionality
 * with appropriate timeouts, retry strategies, and browser settings
 */
export default defineConfig({
  testDir: '.',
  testMatch: 'multilingual-e2e.spec.ts',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'test-results/multilingual-html-report' }],
    ['json', { outputFile: 'test-results/multilingual-results.json' }],
    ['junit', { outputFile: 'test-results/multilingual-results.xml' }]
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Extended timeout for multilingual tests */
    actionTimeout: 30000,
    navigationTimeout: 30000,
    
    /* Locale settings for testing */
    locale: 'en-US',
    timezoneId: 'America/New_York',
    
    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9'
    }
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium-multilingual',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable additional Chrome features for better i18n support
        launchOptions: {
          args: [
            '--enable-features=VaapiVideoDecoder',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--lang=en-US'
          ]
        }
      },
    },

    {
      name: 'firefox-multilingual',
      use: { 
        ...devices['Desktop Firefox'],
        // Firefox-specific settings for i18n
        launchOptions: {
          firefoxUserPrefs: {
            'intl.accept_languages': 'en-US,en',
            'font.name.serif.x-unicode': 'Arial Unicode MS',
            'font.name.sans-serif.x-unicode': 'Arial Unicode MS'
          }
        }
      },
    },

    {
      name: 'webkit-multilingual',
      use: { 
        ...devices['Desktop Safari'],
        // Safari-specific settings
        locale: 'en-US'
      },
    },

    /* Test against mobile viewports for responsive multilingual design */
    {
      name: 'Mobile Chrome Multilingual',
      use: { 
        ...devices['Pixel 5'],
        locale: 'en-US'
      },
    },
    {
      name: 'Mobile Safari Multilingual',
      use: { 
        ...devices['iPhone 12'],
        locale: 'en-US'
      },
    },

    /* RTL-specific testing configurations */
    {
      name: 'RTL Testing - Arabic',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'ar-SA',
        extraHTTPHeaders: {
          'Accept-Language': 'ar-SA,ar;q=0.9,en;q=0.8'
        }
      },
    },
    {
      name: 'RTL Testing - Urdu',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'ur-PK',
        extraHTTPHeaders: {
          'Accept-Language': 'ur-PK,ur;q=0.9,en;q=0.8'
        }
      },
    },

    /* CJK language testing */
    {
      name: 'CJK Testing - Chinese',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'zh-CN',
        extraHTTPHeaders: {
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        }
      },
    },
    {
      name: 'CJK Testing - Japanese',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'ja-JP',
        extraHTTPHeaders: {
          'Accept-Language': 'ja-JP,ja;q=0.9,en;q=0.8'
        }
      },
    }
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./global-setup-multilingual.ts'),
  globalTeardown: require.resolve('./global-teardown-multilingual.ts'),

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  /* Test timeout for multilingual tests (longer due to translation loading) */
  timeout: 60000,

  /* Expect timeout for assertions */
  expect: {
    timeout: 10000
  },

  /* Output directory for test artifacts */
  outputDir: 'test-results/multilingual-artifacts',

  /* Maximum number of test failures before stopping */
  maxFailures: process.env.CI ? 5 : undefined,
});