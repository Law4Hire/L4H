const { execSync } = require('child_process');
const fs = require('fs');

console.log('🇫🇷 FRENCH USER O-1 VISA WORKFLOW - COMPLETE TEST SUITE');
console.log('======================================================');
console.log('This will run 3 comprehensive tests to prove the complete O-1 workflow:');
console.log('1. 📝 Registration Test: French user (35, married, French citizen) → Interview (NOT Dashboard)');
console.log('2. 🎯 Interview Test: Complete O-1 interview pathway → O-1 Recommendation');
console.log('3. 📋 Workflow Test: Access case status → View O-1 workflow with French doctors');
console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to start...\n');

// Wait 5 seconds before starting
await new Promise(resolve => setTimeout(resolve, 5000));

const tests = [
    {
        name: 'French User Registration',
        file: 'test-1-french-user-registration.js',
        description: 'Creates French user (Pierre Dubois, 35, married, French citizen) and verifies redirect to interview'
    },
    {
        name: 'O-1 Interview Completion',
        file: 'test-2-o1-interview-completion.js',
        description: 'Logs in as French user, completes interview with O-1 pathway, verifies O-1 recommendation'
    },
    {
        name: 'Case Workflow Verification',
        file: 'test-3-case-workflow-verification.js',
        description: 'Verifies O-1 workflow is accessible in dashboard with French panel physicians'
    }
];

let allPassed = true;
const results = [];

for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 RUNNING TEST ${i + 1}/3: ${test.name}`);
    console.log(`📄 Description: ${test.description}`);
    console.log(`📁 File: ${test.file}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
        // Run the test
        execSync(`node ${test.file}`, { stdio: 'inherit' });

        console.log(`\n✅ TEST ${i + 1} PASSED: ${test.name}\n`);
        results.push({ test: test.name, status: 'PASSED' });

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error) {
        console.log(`\n❌ TEST ${i + 1} FAILED: ${test.name}`);
        console.log(`Error: ${error.message}\n`);
        results.push({ test: test.name, status: 'FAILED', error: error.message });
        allPassed = false;
        break; // Stop on first failure since tests depend on each other
    }
}

console.log('\n' + '='.repeat(80));
console.log('🏁 FINAL RESULTS - FRENCH USER O-1 VISA WORKFLOW');
console.log('='.repeat(80));

results.forEach((result, i) => {
    const icon = result.status === 'PASSED' ? '✅' : '❌';
    console.log(`${icon} Test ${i + 1}: ${result.test} - ${result.status}`);
    if (result.error) {
        console.log(`   Error: ${result.error}`);
    }
});

if (allPassed) {
    console.log('\n🎉 🇫🇷 ALL TESTS PASSED! 🇫🇷 🎉');
    console.log('=====================================');
    console.log('✅ French user registration flows to interview (not dashboard)');
    console.log('✅ O-1 interview completes successfully with correct recommendation');
    console.log('✅ O-1 workflow with French doctors is accessible in dashboard');
    console.log('\n🏆 COMPLETE O-1 WORKFLOW FOR FRENCH USER VERIFIED!');

    // Clean up test files
    console.log('\n🧹 Cleaning up test data files...');
    try {
        if (fs.existsSync('./french-user-data.json')) fs.unlinkSync('./french-user-data.json');
        if (fs.existsSync('./o1-interview-result.json')) fs.unlinkSync('./o1-interview-result.json');
        console.log('✅ Test data files cleaned up');
    } catch (e) {
        console.log('⚠️  Could not clean up test files:', e.message);
    }

} else {
    console.log('\n💥 TESTS FAILED');
    console.log('==============');
    console.log('The French user O-1 workflow test suite failed.');
    console.log('Please review the errors above and fix the issues.');
    process.exit(1);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
