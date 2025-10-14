
        const sql = require('mssql');

        async function checkVisaAssignment() {
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

            // Query for user's assigned visa type
            const result = await sql.query`
              SELECT u.Email, c.VisaTypeId, vt.Code as VisaCode, vt.Name as VisaName
              FROM Users u
              LEFT JOIN Cases c ON u.Id = c.UserId
              LEFT JOIN VisaTypes vt ON c.VisaTypeId = vt.Id
              WHERE u.Email = ${'B-1@testing.com'}
            `;

            console.log('✅ DATABASE QUERY SUCCESS');

            if (result.recordset.length === 0) {
              console.log('❌ NO RECORDS: User not found in database');
              process.exit(1);
            }

            const userRecord = result.recordset[0];
            console.log('📄 User Record:', JSON.stringify(userRecord, null, 2));

            if (!userRecord.VisaCode) {
              console.log('❌ NO VISA ASSIGNED: User has no visa type assigned');
              process.exit(1);
            }

            if (userRecord.VisaCode === 'B-1') {
              console.log(`✅ CORRECT ASSIGNMENT: User has ${userRecord.VisaCode} visa assigned`);
              process.exit(0);
            } else {
              console.log(`❌ WRONG ASSIGNMENT: Expected B-1, got ${userRecord.VisaCode}`);
              process.exit(1);
            }

          } catch (error) {
            console.error('❌ DATABASE ERROR:', error.message);
            process.exit(1);
          }
        }

        checkVisaAssignment();
      