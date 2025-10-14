/**
 * CHECK VISA TYPES IN DATABASE
 * Verify what visa types are actually loaded
 */

const sql = require('mssql');

async function checkVisaTypes() {
  console.log('🔍 CHECKING VISA TYPES IN DATABASE');
  console.log('='.repeat(50));

  try {
    const config = {
      server: 'localhost',
      port: 14333,
      database: 'L4H',
      user: 'sa',
      password: 'SecureTest123!',
      options: { encrypt: false, trustServerCertificate: true }
    };

    await sql.connect(config);

    // Get all visa types (check schema first)
    const result = await sql.query`
      SELECT Id, Code, Name, IsActive
      FROM VisaTypes
      ORDER BY Code
    `;

    console.log(`📊 Total visa types in database: ${result.recordset.length}`);
    console.log('\n📋 All visa types:');

    result.recordset.forEach(visa => {
      console.log(`   ${visa.Code}: ${visa.Name} - Active: ${visa.IsActive}`);
    });

    // Check specific A visa types
    const aVisas = result.recordset.filter(v => v.Code.startsWith('A-'));
    console.log(`\n🎯 A-Series visa types: ${aVisas.length}`);
    aVisas.forEach(visa => {
      console.log(`   ${visa.Code}: ${visa.Name} - Active: ${visa.IsActive}`);
    });

    // Check if we have the first 5 visa types we're testing
    const testVisas = ['A-1', 'A-2', 'A-3', 'B-1', 'B-2'];
    console.log(`\n🧪 Test visa types status:`);
    testVisas.forEach(code => {
      const visa = result.recordset.find(v => v.Code === code);
      if (visa) {
        console.log(`   ✅ ${code}: ${visa.Name} - Active: ${visa.IsActive}`);
      } else {
        console.log(`   ❌ ${code}: NOT FOUND`);
      }
    });

    await sql.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkVisaTypes().catch(console.error);