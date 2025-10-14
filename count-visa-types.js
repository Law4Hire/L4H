async function countVisaTypes() {
    console.log('🔢 COUNTING VISA TYPES IN SYSTEM vs DATABASE');
    console.log('==============================================');

    try {
        // Login to get access
        const loginResponse = await fetch('http://localhost:8765/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@testing.com',
                password: 'SecureTest123!'
            })
        });

        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log('✅ Login successful');

        // Get all visa types from database via API
        let dbVisaTypes = [];
        try {
            const visaTypesResponse = await fetch('http://localhost:8765/api/v1/visa-types', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (visaTypesResponse.ok) {
                dbVisaTypes = await visaTypesResponse.json();
                console.log(`📊 DATABASE: Found ${dbVisaTypes.length} visa types in database`);

                // Sort and show first 20 visa types
                const sortedTypes = dbVisaTypes.sort((a, b) => a.code.localeCompare(b.code));
                console.log('\n📋 First 20 Visa Types in Database:');
                sortedTypes.slice(0, 20).forEach((visa, index) => {
                    console.log(`${(index + 1).toString().padStart(2, ' ')}. ${visa.code.padEnd(8, ' ')} - ${visa.name}`);
                });

                if (dbVisaTypes.length > 20) {
                    console.log(`... and ${dbVisaTypes.length - 20} more`);
                }
            } else {
                console.log('❌ Could not fetch visa types from API');
            }
        } catch (error) {
            console.log('❌ Error fetching from API:', error.message);
        }

        // Count visa types implemented in the logic
        console.log('\n🧮 COUNTING IMPLEMENTED VISA TYPES IN CODE:');

        // Diplomatic series (A, G) - 5 types
        const diplomaticTypes = ['A-1', 'A-2', 'A-3', 'G-1', 'G-2'];
        console.log(`   Diplomatic (A/G): ${diplomaticTypes.length} types - ${diplomaticTypes.join(', ')}`);

        // Business/Tourist series (B) - 2 types
        const businessTypes = ['B-1', 'B-2'];
        console.log(`   Business/Tourist (B): ${businessTypes.length} types - ${businessTypes.join(', ')}`);

        // Transit series (C) - 3 types
        const transitTypes = ['C-1', 'C-2', 'C-3'];
        console.log(`   Transit (C): ${transitTypes.length} types - ${transitTypes.join(', ')}`);

        // Calculate totals
        const implementedCount = diplomaticTypes.length + businessTypes.length + transitTypes.length;
        console.log(`\n📈 TOTALS:`);
        console.log(`   Database visa types: ${dbVisaTypes.length}`);
        console.log(`   Implemented in code: ${implementedCount}`);
        console.log(`   Implementation rate: ${((implementedCount / dbVisaTypes.length) * 100).toFixed(1)}%`);

        // Status of working vs broken
        console.log(`\n🎯 IMPLEMENTATION STATUS:`);
        console.log(`   ✅ Working correctly: 7 types (A-1, A-2, A-3, G-1, G-2, B-1, B-2)`);
        console.log(`   ❌ Broken/Not working: 3 types (C-1, C-2, C-3)`);
        console.log(`   ⏸️  Not yet implemented: ${dbVisaTypes.length - implementedCount} types`);

        // Next logical types to implement
        if (dbVisaTypes.length > 0) {
            console.log(`\n🚀 SUGGESTED NEXT 5 TYPES TO IMPLEMENT:`);
            const remainingTypes = dbVisaTypes
                .filter(v => !['A-1', 'A-2', 'A-3', 'G-1', 'G-2', 'B-1', 'B-2', 'C-1', 'C-2', 'C-3'].includes(v.code))
                .sort((a, b) => a.code.localeCompare(b.code))
                .slice(0, 5);

            remainingTypes.forEach((visa, index) => {
                console.log(`   ${index + 1}. ${visa.code} - ${visa.name}`);
            });
        }

    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

countVisaTypes().catch(console.error);