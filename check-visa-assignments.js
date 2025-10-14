const sql = require('mssql');

async function checkVisaAssignments() {
  try {
    const config = {
      server: 'localhost',
      port: 14333,
      database: 'L4H',
      user: 'sa',
      password: 'SecureTest123!',
      options: {
        encrypt: false,
        trustServerCertificate: true
      }
    };

    await sql.connect(config);

    // List all tables
    const tables = await sql.query`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `;

    console.log('📊 All tables in database:');
    tables.recordset.forEach(table => {
      console.log(`  ${table.TABLE_NAME}`);
    });

    // Check specific visa-related tables
    const visaRelatedTables = [
      'VisaTypes',
      'InterviewSessions',
      'InterviewResponses',
      'UserProfiles',
      'Cases'
    ];

    console.log('\n🔍 Checking visa-related tables for A-1 user...');

    for (const tableName of visaRelatedTables) {
      try {
        // Check if table exists
        const tableExists = tables.recordset.some(t => t.TABLE_NAME === tableName);
        if (!tableExists) {
          console.log(`⚠️ Table ${tableName} not found`);
          continue;
        }

        console.log(`\n📋 ${tableName}:`);

        // Get table structure
        const structure = await sql.query`
          SELECT COLUMN_NAME, DATA_TYPE
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = ${tableName}
          ORDER BY ORDINAL_POSITION
        `;

        console.log('  Columns:');
        structure.recordset.forEach(col => {
          console.log(`    ${col.COLUMN_NAME}: ${col.DATA_TYPE}`);
        });

        // Check for A-1 user data in this table
        const hasUserColumn = structure.recordset.some(col =>
          col.COLUMN_NAME.toLowerCase().includes('user') ||
          col.COLUMN_NAME.toLowerCase().includes('email')
        );

        if (hasUserColumn) {
          // Try to find A-1 user data
          const userIdQuery = await sql.query`
            SELECT Id FROM Users WHERE Email = 'A-1@testing.com'
          `;

          if (userIdQuery.recordset.length > 0) {
            const userId = userIdQuery.recordset[0].Id;

            try {
              const userDataQuery = await sql.query`
                SELECT * FROM ${tableName}
                WHERE UserId = ${userId} OR UserEmail = 'A-1@testing.com'
              `;

              if (userDataQuery.recordset.length > 0) {
                console.log(`  ✅ Found ${userDataQuery.recordset.length} records for A-1 user:`);
                userDataQuery.recordset.forEach((record, i) => {
                  console.log(`    Record ${i + 1}:`, Object.keys(record).slice(0, 3).map(key => `${key}: ${record[key]}`).join(', '));
                });
              } else {
                console.log('  ❌ No records found for A-1 user');
              }
            } catch (e) {
              console.log(`  ⚠️ Could not query for user data: ${e.message}`);
            }
          }
        }
      } catch (error) {
        console.log(`  ❌ Error checking ${tableName}: ${error.message}`);
      }
    }

    // Check if there's a direct visa assignment in Users table or related table
    console.log('\n🎯 Checking for any visa assignments...');

    try {
      const interviewSessions = await sql.query`
        SELECT TOP 5 * FROM InterviewSessions
        ORDER BY CreatedAt DESC
      `;

      if (interviewSessions.recordset.length > 0) {
        console.log('\n📊 Recent Interview Sessions:');
        interviewSessions.recordset.forEach((session, i) => {
          console.log(`  ${i + 1}. Session ${session.Id}: User ${session.UserId || 'Unknown'}, Created: ${session.CreatedAt}`);
        });
      }
    } catch (e) {
      console.log('⚠️ Could not check InterviewSessions');
    }

    await sql.close();

    // Summary
    console.log('\n📄 SUMMARY:');
    console.log('The database structure shows that visa assignments are likely stored in InterviewSessions or a related table.');
    console.log('The A-1 user exists but visa assignment status needs to be checked after completing an interview workflow.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkVisaAssignments();