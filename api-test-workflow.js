#!/usr/bin/env node

/**
 * L4H API Testing Workflow
 *
 * This script provides a comprehensive API testing workflow using CURL commands.
 * RULE: Always test APIs with CURL before making UI code changes!
 *
 * Usage:
 * 1. Start the API server first: dotnet run --project src/api
 * 2. Run this script: node api-test-workflow.js
 */

const { execSync } = require('child_process');

// API Configuration
const API_BASE_URL = 'http://localhost:8765';
const TEST_CREDENTIALS = {
  adminEmail: 'dcann@cannlaw.com',
  testEmail: 'abu@testing.com',
  password: 'SecureTest123!'
};

let authToken = null;

// Utility functions
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function runCurl(command, description) {
  log(`Testing: ${description}`);
  console.log(`Command: ${command}`);
  try {
    const result = execSync(command, { encoding: 'utf8', timeout: 10000 });
    console.log(`Response: ${result}`);
    console.log('✅ Success\n');
    return result;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    if (error.stdout) console.log(`Response: ${error.stdout}`);
    console.log('');
    return null;
  }
}

function testApiPing() {
  const command = `curl -X GET "${API_BASE_URL}/v1/ping" -w "\\nHTTP Status: %{http_code}\\n" --connect-timeout 5`;
  return runCurl(command, 'API Ping endpoint');
}

function testHealthCheck() {
  const command = `curl -X GET "${API_BASE_URL}/api/health" -w "\\nHTTP Status: %{http_code}\\n" --connect-timeout 5`;
  return runCurl(command, 'Health check endpoint');
}

function testSwaggerEndpoint() {
  const command = `curl -X GET "${API_BASE_URL}/swagger/index.html" -w "\\nHTTP Status: %{http_code}\\n" --connect-timeout 5`;
  return runCurl(command, 'Swagger UI endpoint');
}

function testLogin() {
  const command = `curl -X POST "${API_BASE_URL}/api/v1/auth/login" ` +
    `-H "Content-Type: application/json" ` +
    `-d '{"email":"${TEST_CREDENTIALS.adminEmail}","password":"${TEST_CREDENTIALS.password}"}' ` +
    `-w "\\nHTTP Status: %{http_code}\\n"`;

  const result = runCurl(command, 'Admin login');

  if (result) {
    try {
      const parsed = JSON.parse(result.split('\n')[0]);
      if (parsed.token) {
        authToken = parsed.token;
        log(`✅ Auth token obtained: ${authToken.substring(0, 20)}...`);
      }
    } catch (e) {
      log('⚠️ Could not parse login response for token');
    }
  }

  return result;
}

function testProtectedEndpoint() {
  if (!authToken) {
    log('❌ No auth token available, skipping protected endpoint test');
    return null;
  }

  const command = `curl -X GET "${API_BASE_URL}/api/v1/admin/users" ` +
    `-H "Authorization: Bearer ${authToken}" ` +
    `-w "\\nHTTP Status: %{http_code}\\n"`;

  return runCurl(command, 'Admin users list (protected endpoint)');
}

function testCountriesEndpoint() {
  const command = `curl -X GET "${API_BASE_URL}/api/v1/countries" ` +
    `-w "\\nHTTP Status: %{http_code}\\n"`;

  return runCurl(command, 'Countries list endpoint');
}

function testVisaTypesEndpoint() {
  const command = `curl -X GET "${API_BASE_URL}/api/v1/visa-types" ` +
    `-w "\\nHTTP Status: %{http_code}\\n"`;

  return runCurl(command, 'Visa types list endpoint');
}

function testPricingEndpoint() {
  const command = `curl -X GET "${API_BASE_URL}/api/v1/pricing/packages" ` +
    `-w "\\nHTTP Status: %{http_code}\\n"`;

  return runCurl(command, 'Pricing packages endpoint');
}

function testRegistration() {
  const testUser = {
    email: `test.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User'
  };

  const command = `curl -X POST "${API_BASE_URL}/api/v1/auth/register" ` +
    `-H "Content-Type: application/json" ` +
    `-d '${JSON.stringify(testUser)}' ` +
    `-w "\\nHTTP Status: %{http_code}\\n"`;

  return runCurl(command, 'User registration');
}

function main() {
  console.log('='.repeat(80));
  console.log('L4H API Testing Workflow');
  console.log('Fixed Ports: API=8765, Law4Hire=5175, Cannlaw=5174, Upload=7070');
  console.log('='.repeat(80));

  // Test basic connectivity
  log('Phase 1: Basic Connectivity Tests');
  const pingResult = testApiPing();

  if (!pingResult) {
    console.log('');
    console.log('❌ API Server is not running!');
    console.log('');
    console.log('To start the API server, run:');
    console.log('  cd src/api');
    console.log('  export ConnectionStrings__SqlServer="Server=localhost,14333;Database=L4H;User Id=sa;Password=SecureTest123!;TrustServerCertificate=True;"');
    console.log('  export Auth__Jwt__SigningKey="CHANGE_ME_DEV_ONLY"');
    console.log('  export Auth__Jwt__Issuer="L4H"');
    console.log('  export Auth__Jwt__Audience="L4H"');
    console.log('  export ADMIN_SEED_PASSWORD="SecureTest123!"');
    console.log('  export ASPNETCORE_ENVIRONMENT="Development"');
    console.log('  dotnet run');
    console.log('');
    console.log('Then run this test script again.');
    return;
  }

  // Test other endpoints
  testHealthCheck();
  testSwaggerEndpoint();

  console.log('');
  log('Phase 2: Authentication Tests');
  testLogin();
  testProtectedEndpoint();

  console.log('');
  log('Phase 3: Public API Tests');
  testCountriesEndpoint();
  testVisaTypesEndpoint();
  testPricingEndpoint();

  console.log('');
  log('Phase 4: Registration Test');
  testRegistration();

  console.log('');
  console.log('='.repeat(80));
  log('API Testing Complete!');
  console.log('='.repeat(80));

  // Summary of manual CURL commands for reference
  console.log('');
  console.log('MANUAL CURL COMMANDS FOR REFERENCE:');
  console.log('');
  console.log('# Test API ping');
  console.log(`curl -X GET "${API_BASE_URL}/v1/ping"`);
  console.log('');
  console.log('# Admin login');
  console.log(`curl -X POST "${API_BASE_URL}/api/v1/auth/login" -H "Content-Type: application/json" -d '{"email":"${TEST_CREDENTIALS.adminEmail}","password":"${TEST_CREDENTIALS.password}"}'`);
  console.log('');
  console.log('# Test protected endpoint (replace TOKEN with actual token)');
  console.log(`curl -X GET "${API_BASE_URL}/api/v1/admin/users" -H "Authorization: Bearer TOKEN"`);
  console.log('');
  console.log('# Get countries');
  console.log(`curl -X GET "${API_BASE_URL}/api/v1/countries"`);
  console.log('');
  console.log('# Get visa types');
  console.log(`curl -X GET "${API_BASE_URL}/api/v1/visa-types"`);
  console.log('');
}

if (require.main === module) {
  main();
}

module.exports = {
  testApiPing,
  testLogin,
  testProtectedEndpoint,
  API_BASE_URL,
  TEST_CREDENTIALS
};