#!/usr/bin/env node

/**
 * L4H Development Setup Verification Script
 *
 * This script verifies that the development environment follows all established rules
 * and is ready for safe development work.
 *
 * Run this before starting any development work:
 * node verify-development-setup.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const REQUIRED_PORTS = {
  'API Backend': 8765,
  'Law4Hire Frontend': 5175,
  'Cannlaw Frontend': 5174,
  'Upload Gateway': 7070
};

const REQUIRED_ENV_VARS = [
  'ConnectionStrings__SqlServer',
  'Auth__Jwt__SigningKey',
  'Auth__Jwt__Issuer',
  'Auth__Jwt__Audience',
  'ASPNETCORE_ENVIRONMENT'
];

let verificationResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  critical: 0
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    'info': '🔍',
    'success': '✅',
    'warning': '⚠️',
    'error': '❌',
    'critical': '🚨'
  }[type];

  console.log(`[${timestamp}] ${prefix} ${message}`);

  // Track results
  switch (type) {
    case 'success':
      verificationResults.passed++;
      break;
    case 'warning':
      verificationResults.warnings++;
      break;
    case 'error':
      verificationResults.failed++;
      break;
    case 'critical':
      verificationResults.critical++;
      break;
  }
}

function runCommand(command, description, required = true) {
  try {
    const result = execSync(command, { encoding: 'utf8', timeout: 5000 });
    log(`${description}: Success`, 'success');
    return result;
  } catch (error) {
    const type = required ? 'error' : 'warning';
    log(`${description}: Failed - ${error.message}`, type);
    return null;
  }
}

function checkFileExists(filePath, description, required = true) {
  const exists = fs.existsSync(filePath);
  const type = exists ? 'success' : (required ? 'error' : 'warning');
  log(`${description}: ${exists ? 'Found' : 'Missing'}`, type);
  return exists;
}

function checkPortAvailability(port, description) {
  try {
    // Try to connect to the port to see if something is already running
    const result = execSync(`curl -s --connect-timeout 1 http://localhost:${port}`, { encoding: 'utf8' });
    log(`${description} (${port}): Port in use (possibly by our service)`, 'warning');
    return false;
  } catch (error) {
    // Port is available (curl failed to connect)
    log(`${description} (${port}): Port available`, 'success');
    return true;
  }
}

function checkEnvironmentVariables() {
  log('Checking required environment variables...', 'info');

  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar];
    if (value) {
      log(`Environment variable ${envVar}: Set`, 'success');
    } else {
      log(`Environment variable ${envVar}: NOT SET`, 'critical');
    }
  }
}

function checkDatabaseConnection() {
  log('Checking database connection...', 'info');

  // Check if SQL Server is accessible
  const connectionString = process.env.ConnectionStrings__SqlServer;
  if (!connectionString) {
    log('Database connection: Cannot test - connection string not set', 'critical');
    return;
  }

  // Try to run a simple EF command to test connectivity
  try {
    const result = runCommand(
      'dotnet ef migrations list --project src/infrastructure --startup-project src/api',
      'Database connectivity test',
      false
    );

    if (result) {
      log('Database connection: Verified', 'success');
    }
  } catch (error) {
    log('Database connection: Could not verify', 'warning');
  }
}

function checkProjectStructure() {
  log('Checking project structure...', 'info');

  const requiredPaths = [
    'src/api/Program.cs',
    'src/infrastructure/Data/L4HDbContext.cs',
    'web/l4h/vite.config.ts',
    'web/cannlaw/vite.config.ts',
    'DEVELOPMENT-RULES.md',
    'api-test-workflow.js'
  ];

  for (const filePath of requiredPaths) {
    checkFileExists(filePath, `Project file ${filePath}`);
  }
}

function checkPortConfiguration() {
  log('Checking port configuration...', 'info');

  // Check vite configs for correct ports
  try {
    const l4hConfig = fs.readFileSync('web/l4h/vite.config.ts', 'utf8');
    const cannlawConfig = fs.readFileSync('web/cannlaw/vite.config.ts', 'utf8');
    const apiConfig = fs.readFileSync('src/api/Properties/launchSettings.json', 'utf8');

    // Verify ports in configs
    if (l4hConfig.includes('port: 5175')) {
      log('Law4Hire port configuration: Correct (5175)', 'success');
    } else {
      log('Law4Hire port configuration: INCORRECT', 'error');
    }

    if (cannlawConfig.includes('port: 5174')) {
      log('Cannlaw port configuration: Correct (5174)', 'success');
    } else {
      log('Cannlaw port configuration: INCORRECT', 'error');
    }

    if (apiConfig.includes('localhost:8765')) {
      log('API port configuration: Correct (8765)', 'success');
    } else {
      log('API port configuration: INCORRECT', 'error');
    }

  } catch (error) {
    log('Port configuration check: Failed to read config files', 'error');
  }
}

function checkSeedingImplementation() {
  log('Checking seeding implementation...', 'info');

  const seedFiles = [
    'src/infrastructure/Services/AdminSeedService.cs',
    'src/api/Services/PricingSeedService.cs',
    'src/infrastructure/SeedData/CountriesSeeder.cs',
    'src/infrastructure/SeedData/USSubdivisionsSeeder.cs',
    'src/infrastructure/SeedData/VisaClassesSeeder.cs'
  ];

  for (const file of seedFiles) {
    if (checkFileExists(file, `Seeder ${path.basename(file)}`)) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Check for conditional seeding patterns
        const hasConditionalCheck = content.includes('Count') ||
                                   content.includes('Any()') ||
                                   content.includes('FirstOrDefault') ||
                                   content.includes('SeedUserIfNotExists');

        if (hasConditionalCheck) {
          log(`Conditional seeding in ${path.basename(file)}: Implemented`, 'success');
        } else {
          log(`Conditional seeding in ${path.basename(file)}: NOT IMPLEMENTED`, 'critical');
        }
      } catch (error) {
        log(`Could not verify seeding in ${file}`, 'warning');
      }
    }
  }
}

function checkGitStatus() {
  log('Checking git status...', 'info');

  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    const modifiedFiles = status.split('\n').filter(line => line.trim().length > 0);

    if (modifiedFiles.length === 0) {
      log('Git status: Clean working directory', 'success');
    } else {
      log(`Git status: ${modifiedFiles.length} modified files`, 'warning');
      log('Consider committing changes before major development work', 'info');
    }
  } catch (error) {
    log('Git status: Could not check', 'warning');
  }
}

function printSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('DEVELOPMENT SETUP VERIFICATION SUMMARY');
  console.log('='.repeat(80));

  console.log(`✅ Passed: ${verificationResults.passed}`);
  console.log(`⚠️  Warnings: ${verificationResults.warnings}`);
  console.log(`❌ Failed: ${verificationResults.failed}`);
  console.log(`🚨 Critical: ${verificationResults.critical}`);

  console.log('\n');

  if (verificationResults.critical > 0) {
    console.log('🚨 CRITICAL ISSUES FOUND!');
    console.log('Please resolve critical issues before development work.');
    console.log('See DEVELOPMENT-RULES.md for guidance.');
  } else if (verificationResults.failed > 0) {
    console.log('❌ ISSUES FOUND');
    console.log('Some checks failed. Review the errors above.');
  } else if (verificationResults.warnings > 0) {
    console.log('⚠️  WARNINGS FOUND');
    console.log('Environment ready with minor warnings.');
  } else {
    console.log('✅ ALL CHECKS PASSED');
    console.log('Development environment is ready!');
  }

  console.log('\nNext steps:');
  console.log('1. Review DEVELOPMENT-RULES.md');
  console.log('2. Start API: cd src/api && dotnet run');
  console.log('3. Test APIs: node api-test-workflow.js');
  console.log('4. Start frontend development');

  console.log('\n' + '='.repeat(80));
}

function main() {
  console.log('L4H Development Setup Verification');
  console.log('Starting verification process...\n');

  // Run all checks
  checkProjectStructure();
  console.log('');

  checkPortConfiguration();
  console.log('');

  checkEnvironmentVariables();
  console.log('');

  checkSeedingImplementation();
  console.log('');

  checkDatabaseConnection();
  console.log('');

  checkGitStatus();

  // Print final summary
  printSummary();
}

if (require.main === module) {
  main();
}

module.exports = {
  checkFileExists,
  checkPortAvailability,
  REQUIRED_PORTS,
  REQUIRED_ENV_VARS
};