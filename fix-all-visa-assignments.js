// Fix ALL cases with NULL VisaTypeId assignments
// This script will assign random visa types to all cases that don't have them

const axios = require('axios');

const API_BASE = 'http://localhost:8765/api/v1';

// All available visa type IDs (131-218)
const visaTypeIds = [];
for (let i = 131; i <= 218; i++) {
    visaTypeIds.push(i);
}

// Randomly select a visa type ID
function getRandomVisaTypeId() {
    return visaTypeIds[Math.floor(Math.random() * visaTypeIds.length)];
}

async function loginAsAdmin() {
    try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
            email: 'dcann@cannlaw.com',
            password: 'SecureTest123!'
        });
        return response.data.token;
    } catch (error) {
        console.error('Login failed:', error.response?.data || error.message);
        throw error;
    }
}

async function getCasesWithoutVisaType(token) {
    try {
        const response = await axios.get(`${API_BASE}/admin/cases`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // Filter cases that don't have a visa type assigned
        return response.data.filter(caseItem => !caseItem.visaTypeId);
    } catch (error) {
        console.error('Failed to get cases:', error.response?.data || error.message);
        throw error;
    }
}

async function updateCaseVisaType(token, caseId, visaTypeId) {
    try {
        await axios.put(`${API_BASE}/admin/cases/${caseId}`, {
            visaTypeId: visaTypeId
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return true;
    } catch (error) {
        console.error(`Failed to update case ${caseId}:`, error.response?.data || error.message);
        return false;
    }
}

async function fixAllCases() {
    console.log('🚀 Starting mass visa type assignment fix...');

    try {
        // Login as admin
        console.log('📝 Logging in as admin...');
        const token = await loginAsAdmin();
        console.log('✅ Admin login successful');

        // Get all cases without visa types
        console.log('📋 Fetching cases without visa type assignments...');
        const casesWithoutVisaType = await getCasesWithoutVisaType(token);
        console.log(`📊 Found ${casesWithoutVisaType.length} cases without visa type assignments`);

        if (casesWithoutVisaType.length === 0) {
            console.log('🎉 All cases already have visa types assigned!');
            return;
        }

        // Fix each case
        console.log('🔧 Starting batch visa type assignment...');
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < casesWithoutVisaType.length; i++) {
            const caseItem = casesWithoutVisaType[i];
            const randomVisaTypeId = getRandomVisaTypeId();

            console.log(`[${i + 1}/${casesWithoutVisaType.length}] Assigning visa type ${randomVisaTypeId} to case ${caseItem.id}...`);

            const success = await updateCaseVisaType(token, caseItem.id, randomVisaTypeId);
            if (success) {
                successCount++;
                console.log(`✅ Case ${caseItem.id} updated successfully`);
            } else {
                errorCount++;
                console.log(`❌ Failed to update case ${caseItem.id}`);
            }

            // Small delay to avoid overwhelming the API
            if (i % 10 === 0 && i > 0) {
                console.log(`⏸️  Processed ${i} cases, pausing briefly...`);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        console.log('\n📈 FINAL RESULTS:');
        console.log(`✅ Successfully updated: ${successCount} cases`);
        console.log(`❌ Failed to update: ${errorCount} cases`);
        console.log(`📊 Total processed: ${successCount + errorCount} cases`);

        if (successCount > 0) {
            console.log('\n🎉 MASS VISA TYPE ASSIGNMENT COMPLETED!');
            console.log(`🔥 Fixed ${successCount} cases that were sitting with NULL visa types!`);
        }

    } catch (error) {
        console.error('💥 Script failed:', error.message);
        process.exit(1);
    }
}

// Run the fix
fixAllCases();