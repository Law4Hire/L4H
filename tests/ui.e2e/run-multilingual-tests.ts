#!/usr/bin/env node

/**
 * Multilingual E2E Test Runner
 * 
 * This script provides a comprehensive way to run multilingual e2e tests
 * with various options and configurations.
 */

import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

interface TestRunOptions {
  languages?: string[];
  browsers?: string[];
  headless?: boolean;
  parallel?: boolean;
  retries?: number;
  timeout?: number;
  reporter?: string;
  outputDir?: string;
  baseUrl?: string;
  verbose?: boolean;
  debug?: boolean;
  skipSetup?: boolean;
}

class MultilingualTestRunner {
  private options: TestRunOptions;
  private supportedLanguages = [
    'en-US', 'es-ES', 'fr-FR', 'de-DE', 'ar-SA',
    'zh-CN', 'hi-IN', 'ja-JP', 'ur-PK', 'ru-RU'
  ];
  private supportedBrowsers = [
    'chromium-multilingual',
    'firefox-multilingual', 
    'webkit-multilingual',
    'RTL Testing - Arabic',
    'RTL Testing - Urdu',
    'CJK Testing - Chinese',
    'CJK Testing - Japanese'
  ];

  constructor(options: TestRunOptions = {}) {
    this.options = {
      languages: options.languages || ['en-US', 'es-ES', 'ar-SA'],
      browsers: options.browsers || ['chromium-multilingual'],
      headless: options.headless !== false,
      parallel: options.parallel !== false,
      retries: options.retries || 1,
      timeout: options.timeout || 60000,
      reporter: options.reporter || 'html',
      outputDir: options.outputDir || 'test-results/multilingual',
      baseUrl: options.baseUrl || 'http://localhost:5173',
      verbose: options.verbose || false,
      debug: options.debug || false,
      skipSetup: options.skipSetup || false,
      ...options
    };
  }

  async run(): Promise<void> {
    console.log('🌐 Starting Multilingual E2E Test Runner');
    console.log('=====================================');
    
    this.printConfiguration();
    
    if (!this.options.skipSetup) {
      await this.setupEnvironment();
    }
    
    await this.runTests();
    
    console.log('✅ Multilingual E2E tests completed');
  }

  private printConfiguration(): void {
    console.log('📋 Test Configuration:');
    console.log(`   Languages: ${this.options.languages?.join(', ')}`);
    console.log(`   Browsers: ${this.options.browsers?.join(', ')}`);
    console.log(`   Headless: ${this.options.headless}`);
    console.log(`   Parallel: ${this.options.parallel}`);
    console.log(`   Retries: ${this.options.retries}`);
    console.log(`   Timeout: ${this.options.timeout}ms`);
    console.log(`   Reporter: ${this.options.reporter}`);
    console.log(`   Output Dir: ${this.options.outputDir}`);
    console.log(`   Base URL: ${this.options.baseUrl}`);
    console.log('');
  }

  private async setupEnvironment(): Promise<void> {
    console.log('🔧 Setting up test environment...');
    
    // Create output directory
    if (this.options.outputDir && !existsSync(this.options.outputDir)) {
      mkdirSync(this.options.outputDir, { recursive: true });
      console.log(`📁 Created output directory: ${this.options.outputDir}`);
    }

    // Validate languages
    const invalidLanguages = this.options.languages?.filter(
      lang => !this.supportedLanguages.includes(lang)
    ) || [];
    
    if (invalidLanguages.length > 0) {
      console.warn(`⚠️ Unsupported languages: ${invalidLanguages.join(', ')}`);
      console.warn(`   Supported: ${this.supportedLanguages.join(', ')}`);
    }

    // Validate browsers
    const invalidBrowsers = this.options.browsers?.filter(
      browser => !this.supportedBrowsers.includes(browser)
    ) || [];
    
    if (invalidBrowsers.length > 0) {
      console.warn(`⚠️ Unsupported browsers: ${invalidBrowsers.join(', ')}`);
      console.warn(`   Supported: ${this.supportedBrowsers.join(', ')}`);
    }

    // Check if application is running
    try {
      const response = await fetch(this.options.baseUrl!);
      if (response.ok) {
        console.log(`✅ Application is accessible at ${this.options.baseUrl}`);
      } else {
        console.warn(`⚠️ Application returned status ${response.status} at ${this.options.baseUrl}`);
      }
    } catch (error) {
      console.warn(`⚠️ Could not reach application at ${this.options.baseUrl}: ${error}`);
      console.warn('   Make sure the application is running before starting tests');
    }

    console.log('');
  }

  private async runTests(): Promise<void> {
    console.log('🚀 Running multilingual e2e tests...');
    
    const playwrightArgs = this.buildPlaywrightArgs();
    
    return new Promise((resolve, reject) => {
      const childProcess = spawn('npx', ['playwright', 'test', ...playwrightArgs], {
        stdio: 'inherit',
        shell: true, // Add shell: true to help find npx in PATH
        env: {
          ...process.env,
          MULTILINGUAL_LANGUAGES: this.options.languages?.join(','),
          MULTILINGUAL_VERBOSE: this.options.verbose ? 'true' : 'false',
          MULTILINGUAL_DEBUG: this.options.debug ? 'true' : 'false'
        }
      });

      childProcess.on('close', (code: number) => {
        if (code === 0) {
          console.log('✅ All tests passed');
          resolve();
        } else {
          console.error(`❌ Tests failed with exit code ${code}`);
          reject(new Error(`Tests failed with exit code ${code}`));
        }
      });

      childProcess.on('error', (error: Error) => {
        console.error(`❌ Failed to start test process: ${error}`);
        reject(error);
      });
    });
  }

  private buildPlaywrightArgs(): string[] {
    const args: string[] = [];

    // Use absolute path for the config file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const configPath = join(__dirname, 'playwright.multilingual.config.ts');
    args.push('--config', configPath);

    // Test files are specified via testMatch in playwright.multilingual.config.ts, so no need to push here.

    // Browser selection
    if (this.options.browsers && this.options.browsers.length > 0) {
      this.options.browsers.forEach(browser => {
        args.push('--project', browser);
      });
    }

    // Headless mode
    if (this.options.headless) {
      args.push('--headed');
    }

    // Parallel execution
    if (!this.options.parallel) {
      args.push('--workers', '1');
    }

    // Retries
    if (this.options.retries !== undefined) {
      args.push('--retries', this.options.retries.toString());
    }

    // Timeout
    if (this.options.timeout !== undefined) {
      args.push('--timeout', this.options.timeout.toString());
    }

    // Reporter
    if (this.options.reporter) {
      args.push('--reporter', this.options.reporter);
    }

    // Output directory
    if (this.options.outputDir) {
      args.push('--output', this.options.outputDir);
    }

    // Debug mode
    if (this.options.debug) {
      args.push('--debug');
    }

    // Verbose mode (removed as Playwright's 'test' command does not support it directly)

    return args;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options: TestRunOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--languages':
        options.languages = nextArg?.split(',') || [];
        i++;
        break;
      case '--browsers':
        options.browsers = nextArg?.split(',') || [];
        i++;
        break;
      case '--headless':
        options.headless = nextArg !== 'false';
        i++;
        break;
      case '--parallel':
        options.parallel = nextArg !== 'false';
        i++;
        break;
      case '--retries':
        options.retries = parseInt(nextArg) || 1;
        i++;
        break;
      case '--timeout':
        options.timeout = parseInt(nextArg) || 60000;
        i++;
        break;
      case '--reporter':
        options.reporter = nextArg;
        i++;
        break;
      case '--output-dir':
        options.outputDir = nextArg;
        i++;
        break;
      case '--base-url':
        options.baseUrl = nextArg;
        i++;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--debug':
        options.debug = true;
        break;
      case '--skip-setup':
        options.skipSetup = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
    }
  }

  try {
    const runner = new MultilingualTestRunner(options);
    await runner.run();
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
🌐 Multilingual E2E Test Runner

Usage: node run-multilingual-tests.ts [options]

Options:
  --languages <list>     Comma-separated list of language codes to test
                        Default: en-US,es-ES,ar-SA
                        Available: en-US,es-ES,fr-FR,de-DE,ar-SA,zh-CN,hi-IN,ja-JP,ur-PK,ru-RU

  --browsers <list>      Comma-separated list of browsers to test
                        Default: chromium-multilingual
                        Available: chromium-multilingual,firefox-multilingual,webkit-multilingual,
                                  RTL Testing - Arabic,RTL Testing - Urdu,
                                  CJK Testing - Chinese,CJK Testing - Japanese

  --headless <bool>      Run tests in headless mode (default: true)
  --parallel <bool>      Run tests in parallel (default: true)
  --retries <number>     Number of retries for failed tests (default: 1)
  --timeout <number>     Test timeout in milliseconds (default: 60000)
  --reporter <type>      Test reporter (default: html)
  --output-dir <path>    Output directory for test results (default: test-results/multilingual)
  --base-url <url>       Base URL for the application (default: http://localhost:5173)
  --verbose              Enable verbose output
  --debug                Enable debug mode
  --skip-setup           Skip environment setup
  --help                 Show this help message

Examples:
  # Run tests for specific languages
  node run-multilingual-tests.ts --languages en-US,es-ES,ar-SA

  # Run tests in debug mode
  node run-multilingual-tests.ts --debug --headless false

  # Run RTL-specific tests
  node run-multilingual-tests.ts --languages ar-SA,ur-PK --browsers "RTL Testing - Arabic"

  # Run comprehensive test suite
  node run-multilingual-tests.ts --languages en-US,es-ES,fr-FR,ar-SA,zh-CN --parallel true
`);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { MultilingualTestRunner, TestRunOptions };