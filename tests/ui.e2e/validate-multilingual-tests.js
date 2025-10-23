#!/usr/bin/env node

/**
 * Validation script for multilingual e2e tests
 * 
 * This script validates that the multilingual test implementation is correct
 * without running the actual tests.
 */

const fs = require('fs');
const path = require('path');

console.log('🌐 Validating Multilingual E2E Test Implementation');
console.log('================================================');

const testFiles = [
  'multilingual-e2e.spec.ts',
  'playwright.multilingual.config.ts',
  'global-setup-multilingual.ts',
  'global-teardown-multilingual.ts',
  'run-multilingual-tests.ts',
  'utils/multilingual-test-utils.ts',
  'README-multilingual-testing.md'
];

const testDir = path.join(__dirname);

let allValid = true;

// Check if all required files exist
console.log('📁 Checking test files...');
for (const file of testFiles) {
  const filePath = path.join(testDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`❌ ${file} - Missing`);
    allValid = false;
  }
}

// Validate test structure
console.log('\n🔍 Validating test structure...');

try {
  const specContent = fs.readFileSync(path.join(testDir, 'multilingual-e2e.spec.ts'), 'utf8');
  
  // Check for required test suites
  const requiredSuites = [
    'Multilingual User Journey Tests',
    'Language Switching Workflow Tests',
    'RTL Language User Experience Tests',
    'Multilingual Accessibility Tests'
  ];
  
  for (const suite of requiredSuites) {
    if (specContent.includes(suite)) {
      console.log(`✅ Test suite: ${suite}`);
    } else {
      console.log(`❌ Missing test suite: ${suite}`);
      allValid = false;
    }
  }
  
  // Check for required test cases
  const requiredTests = [
    'Complete user journey in English',
    'Complete user journey in Spanish',
    'Complete user journey in Arabic (RTL)',
    'Complete user journey in Chinese',
    'Language switching during interview',
    'Language persistence across page reloads',
    'Performance of language switching',
    'RTL layout and text direction validation',
    'Screen reader compatibility across languages'
  ];
  
  for (const testCase of requiredTests) {
    if (specContent.includes(testCase)) {
      console.log(`✅ Test case: ${testCase}`);
    } else {
      console.log(`❌ Missing test case: ${testCase}`);
      allValid = false;
    }
  }
  
} catch (error) {
  console.log(`❌ Error reading test spec: ${error.message}`);
  allValid = false;
}

// Validate configuration
console.log('\n⚙️ Validating configuration...');

try {
  const configContent = fs.readFileSync(path.join(testDir, 'playwright.multilingual.config.ts'), 'utf8');
  
  const requiredConfigs = [
    'chromium-multilingual',
    'firefox-multilingual',
    'webkit-multilingual',
    'RTL Testing - Arabic',
    'CJK Testing - Chinese'
  ];
  
  for (const config of requiredConfigs) {
    if (configContent.includes(config)) {
      console.log(`✅ Browser config: ${config}`);
    } else {
      console.log(`❌ Missing browser config: ${config}`);
      allValid = false;
    }
  }
  
} catch (error) {
  console.log(`❌ Error reading config: ${error.message}`);
  allValid = false;
}

// Validate utilities
console.log('\n🛠️ Validating utilities...');

try {
  const utilsContent = fs.readFileSync(path.join(testDir, 'utils/multilingual-test-utils.ts'), 'utf8');
  
  const requiredUtils = [
    'MultilingualTestUtils',
    'switchLanguage',
    'validateLanguageDisplay',
    'validateRTLLayout',
    'measurePerformance',
    'validateAccessibility'
  ];
  
  for (const util of requiredUtils) {
    if (utilsContent.includes(util)) {
      console.log(`✅ Utility: ${util}`);
    } else {
      console.log(`❌ Missing utility: ${util}`);
      allValid = false;
    }
  }
  
} catch (error) {
  console.log(`❌ Error reading utils: ${error.message}`);
  allValid = false;
}

// Validate supported languages
console.log('\n🌍 Validating supported languages...');

const supportedLanguages = [
  'en-US', 'es-ES', 'fr-FR', 'de-DE', 'ar-SA',
  'zh-CN', 'hi-IN', 'ja-JP', 'ur-PK', 'ru-RU'
];

try {
  const utilsContent = fs.readFileSync(path.join(testDir, 'utils/multilingual-test-utils.ts'), 'utf8');
  
  for (const lang of supportedLanguages) {
    if (utilsContent.includes(lang)) {
      console.log(`✅ Language: ${lang}`);
    } else {
      console.log(`❌ Missing language: ${lang}`);
      allValid = false;
    }
  }
  
} catch (error) {
  console.log(`❌ Error validating languages: ${error.message}`);
  allValid = false;
}

// Check package.json scripts
console.log('\n📦 Validating package.json scripts...');

try {
  const packagePath = path.join(__dirname, '../../package.json');
  const packageContent = fs.readFileSync(packagePath, 'utf8');
  const packageJson = JSON.parse(packageContent);
  
  const requiredScripts = [
    'test:multilingual',
    'test:multilingual:quick',
    'test:multilingual:rtl',
    'test:multilingual:cjk',
    'test:multilingual:comprehensive'
  ];
  
  for (const script of requiredScripts) {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`✅ Script: ${script}`);
    } else {
      console.log(`❌ Missing script: ${script}`);
      allValid = false;
    }
  }
  
} catch (error) {
  console.log(`❌ Error reading package.json: ${error.message}`);
  allValid = false;
}

// Summary
console.log('\n📊 Validation Summary');
console.log('===================');

if (allValid) {
  console.log('✅ All multilingual e2e test components are valid!');
  console.log('\n🚀 Ready to run tests:');
  console.log('   npm run test:multilingual:quick');
  console.log('   npm run test:multilingual:rtl');
  console.log('   npm run test:multilingual:comprehensive');
  console.log('\n📖 See README-multilingual-testing.md for detailed usage instructions');
  process.exit(0);
} else {
  console.log('❌ Some components are missing or invalid');
  console.log('   Please review the errors above and fix the issues');
  process.exit(1);
}