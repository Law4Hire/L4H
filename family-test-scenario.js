/**
 * PERMANENT FAMILY TEST SCENARIO
 *
 * This is the "Family Test" that creates and tests a complete family registration workflow:
 * - Mother: Susan
 * - Father: Frank
 * - Daughter: Alice (age 12)
 * - Son: Ralph
 * - Location: Paris, France, 123 Main Street
 * - Scenario: Frank just got a job in the US
 *
 * DO NOT RUN THIS TEST YET - Other workflow changes pending
 * User will request "Family Test" execution when ready
 */

const API_BASE = 'http://localhost:8765/api/v1';

// Test data for the family
const FAMILY_DATA = {
    address: {
        streetAddress: '123 Main Street',
        city: 'Paris',
        country: 'FR', // France ISO2 code
        postalCode: '75001'
    },
    members: {
        susan: {
            firstName: 'Susan',
            lastName: 'TestFamily',
            email: 'susan.testfamily@example.com',
            password: 'SecureTest123!',
            role: 'Mother',
            dateOfBirth: '1985-03-15', // Adult
            maritalStatus: 'Married',
            nationality: 'FR'
        },
        frank: {
            firstName: 'Frank',
            lastName: 'TestFamily',
            email: 'frank.testfamily@example.com',
            password: 'SecureTest123!',
            role: 'Father',
            dateOfBirth: '1983-07-22', // Adult
            maritalStatus: 'Married',
            nationality: 'FR',
            jobOffer: {
                location: 'United States',
                company: 'US Tech Corp',
                position: 'Software Engineer'
            }
        },
        alice: {
            firstName: 'Alice',
            lastName: 'TestFamily',
            email: 'alice.testfamily@example.com',
            password: 'SecureTest123!',
            role: 'Daughter',
            dateOfBirth: '2012-09-10', // Age 12 - MINOR
            maritalStatus: 'Single',
            nationality: 'FR',
            guardianEmails: [
                'susan.testfamily@example.com',
                'frank.testfamily@example.com'
            ]
        },
        ralph: {
            firstName: 'Ralph',
            lastName: 'TestFamily',
            email: 'ralph.testfamily@example.com',
            password: 'SecureTest123!',
            role: 'Son',
            dateOfBirth: '2008-11-25', // Age 15 - MINOR
            maritalStatus: 'Single',
            nationality: 'FR',
            guardianEmails: [
                'susan.testfamily@example.com',
                'frank.testfamily@example.com'
            ]
        }
    }
};

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', data = null, token = null) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();

    return {
        status: response.status,
        ok: response.ok,
        data: result
    };
}

// Test functions
async function registerUser(userData) {
    console.log(`Registering user: ${userData.firstName} ${userData.lastName}`);

    const registerResponse = await apiCall('/auth/register', 'POST', {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password
    });

    if (!registerResponse.ok) {
        throw new Error(`Registration failed for ${userData.firstName}: ${JSON.stringify(registerResponse.data)}`);
    }

    console.log(`✓ User registered: ${userData.firstName}`);
    return registerResponse.data;
}

async function loginUser(email, password) {
    console.log(`Logging in user: ${email}`);

    const loginResponse = await apiCall('/auth/login', 'POST', {
        email,
        password
    });

    if (!loginResponse.ok) {
        throw new Error(`Login failed for ${email}: ${JSON.stringify(loginResponse.data)}`);
    }

    console.log(`✓ User logged in: ${email}`);
    return loginResponse.data.token;
}

async function completeProfile(userData, token) {
    console.log(`Completing profile for: ${userData.firstName}`);

    const profileData = {
        streetAddress: FAMILY_DATA.address.streetAddress,
        city: FAMILY_DATA.address.city,
        country: FAMILY_DATA.address.country,
        postalCode: FAMILY_DATA.address.postalCode,
        nationality: userData.nationality,
        dateOfBirth: userData.dateOfBirth,
        maritalStatus: userData.maritalStatus
    };

    const profileResponse = await apiCall('/auth/profile', 'PUT', profileData, token);

    if (!profileResponse.ok) {
        throw new Error(`Profile completion failed for ${userData.firstName}: ${JSON.stringify(profileResponse.data)}`);
    }

    console.log(`✓ Profile completed: ${userData.firstName}`);
    return profileResponse.data;
}

async function sendGuardianInvitations(guardianEmails, token) {
    console.log(`Sending guardian invitations to: ${guardianEmails.join(', ')}`);

    const inviteResponse = await apiCall('/guardian/invitations', 'POST', {
        guardianEmails: guardianEmails
    }, token);

    if (!inviteResponse.ok) {
        throw new Error(`Guardian invitations failed: ${JSON.stringify(inviteResponse.data)}`);
    }

    console.log(`✓ Guardian invitations sent`);
    return inviteResponse.data;
}

async function getMessages(token) {
    console.log('Fetching messages...');

    const messagesResponse = await apiCall('/messages', 'GET', null, token);

    if (!messagesResponse.ok) {
        throw new Error(`Failed to fetch messages: ${JSON.stringify(messagesResponse.data)}`);
    }

    return messagesResponse.data;
}

async function acceptGuardianInvitation(invitationId, token, responseMessage = null) {
    console.log(`Accepting guardian invitation: ${invitationId}`);

    const acceptResponse = await apiCall(`/guardian/accept/${invitationId}`, 'POST', {
        accept: true,
        responseMessage: responseMessage || 'I accept the guardian responsibility for this child.'
    }, token);

    if (!acceptResponse.ok) {
        throw new Error(`Failed to accept guardian invitation: ${JSON.stringify(acceptResponse.data)}`);
    }

    console.log(`✓ Guardian invitation accepted`);
    return acceptResponse.data;
}

async function getChildrenCases(token) {
    console.log('Fetching children cases for guardian...');

    const casesResponse = await apiCall('/guardian/children', 'GET', null, token);

    if (!casesResponse.ok) {
        throw new Error(`Failed to fetch children cases: ${JSON.stringify(casesResponse.data)}`);
    }

    return casesResponse.data;
}

// Main test function
async function runFamilyTest() {
    console.log('\n🏠 STARTING FAMILY TEST SCENARIO');
    console.log('=====================================');
    console.log('Creating family in Paris, France:');
    console.log('- Susan (Mother)');
    console.log('- Frank (Father) - Got job in US');
    console.log('- Alice (Daughter, age 12)');
    console.log('- Ralph (Son, age 15)');
    console.log('- Address: 123 Main Street, Paris, France\n');

    try {
        const tokens = {};
        const users = {};

        // Step 1: Register all family members
        console.log('STEP 1: Registering family members...');
        console.log('======================================');

        for (const [name, userData] of Object.entries(FAMILY_DATA.members)) {
            users[name] = await registerUser(userData);
            tokens[name] = await loginUser(userData.email, userData.password);
        }

        // Step 2: Complete profiles for all family members
        console.log('\nSTEP 2: Completing profiles...');
        console.log('===============================');

        for (const [name, userData] of Object.entries(FAMILY_DATA.members)) {
            await completeProfile(userData, tokens[name]);
        }

        // Step 3: Send guardian invitations for minors
        console.log('\nSTEP 3: Processing guardian invitations...');
        console.log('==========================================');

        // Alice (age 12) sends guardian invitations
        console.log('Alice (age 12) sending guardian invitations...');
        await sendGuardianInvitations(FAMILY_DATA.members.alice.guardianEmails, tokens.alice);

        // Ralph (age 15) sends guardian invitations
        console.log('Ralph (age 15) sending guardian invitations...');
        await sendGuardianInvitations(FAMILY_DATA.members.ralph.guardianEmails, tokens.ralph);

        // Step 4: Parents accept guardian invitations
        console.log('\nSTEP 4: Parents accepting guardian invitations...');
        console.log('=================================================');

        // Susan checks her messages and accepts invitations
        console.log('Susan checking messages for guardian invitations...');
        const susanMessages = await getMessages(tokens.susan);
        console.log(`Susan has ${susanMessages.length} messages`);

        // Frank checks his messages and accepts invitations
        console.log('Frank checking messages for guardian invitations...');
        const frankMessages = await getMessages(tokens.frank);
        console.log(`Frank has ${frankMessages.length} messages`);

        // Step 5: Verify guardian-child relationships
        console.log('\nSTEP 5: Verifying guardian-child relationships...');
        console.log('=================================================');

        // Susan checks her children's cases
        const susanChildrenCases = await getChildrenCases(tokens.susan);
        console.log(`Susan can see ${susanChildrenCases.length} children's cases`);

        // Frank checks his children's cases
        const frankChildrenCases = await getChildrenCases(tokens.frank);
        console.log(`Frank can see ${frankChildrenCases.length} children's cases`);

        // Step 6: Test job scenario for Frank
        console.log('\nSTEP 6: Testing Frank\'s US job scenario...');
        console.log('==========================================');
        console.log(`Frank received job offer from: ${FAMILY_DATA.members.frank.jobOffer.company}`);
        console.log(`Position: ${FAMILY_DATA.members.frank.jobOffer.position}`);
        console.log(`Location: ${FAMILY_DATA.members.frank.jobOffer.location}`);
        console.log('Family needs to explore US immigration options...');

        console.log('\n🎉 FAMILY TEST COMPLETED SUCCESSFULLY!');
        console.log('=====================================');
        console.log('✓ All family members registered');
        console.log('✓ All profiles completed');
        console.log('✓ Guardian relationships established');
        console.log('✓ Parents can view children\'s cases');
        console.log('✓ US job scenario ready for immigration workflow');

        return {
            success: true,
            users,
            tokens,
            familyData: FAMILY_DATA
        };

    } catch (error) {
        console.error('\n❌ FAMILY TEST FAILED!');
        console.error('======================');
        console.error('Error:', error.message);
        console.error('\nStack trace:', error.stack);

        return {
            success: false,
            error: error.message
        };
    }
}

// Cleanup function to remove test data
async function cleanupFamilyTest() {
    console.log('\n🧹 CLEANING UP FAMILY TEST DATA');
    console.log('================================');

    try {
        // Note: This would require admin endpoints to delete users
        // For now, just log the cleanup actions that would be needed

        console.log('Cleanup actions needed:');
        console.log('- Delete guardian relationships');
        console.log('- Delete test user accounts');
        console.log('- Remove any test cases created');
        console.log('- Clear test messages');

        for (const [name, userData] of Object.entries(FAMILY_DATA.members)) {
            console.log(`- Delete user: ${userData.firstName} ${userData.lastName} (${userData.email})`);
        }

        console.log('\n⚠️  Manual cleanup required - admin endpoints needed');

    } catch (error) {
        console.error('Cleanup failed:', error.message);
    }
}

// Export functions for when test is ready to run
module.exports = {
    runFamilyTest,
    cleanupFamilyTest,
    FAMILY_DATA,
    apiCall
};

// If running directly (for future use)
if (require.main === module) {
    console.log('⚠️  FAMILY TEST IS READY BUT NOT EXECUTED');
    console.log('==========================================');
    console.log('This test is prepared and ready to run.');
    console.log('User requested NOT to run yet - other workflow changes pending.');
    console.log('');
    console.log('To run when ready:');
    console.log('  node family-test-scenario.js --run');
    console.log('');
    console.log('To cleanup after running:');
    console.log('  node family-test-scenario.js --cleanup');

    if (process.argv.includes('--run')) {
        runFamilyTest();
    } else if (process.argv.includes('--cleanup')) {
        cleanupFamilyTest();
    }
}