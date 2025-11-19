# Database Scripts

This directory contains SQL scripts for manual database operations that need to be run in production.

## Scripts

### create-all-pricing-rules.sql

**Purpose**: Creates default pricing rules for all active visa types in the database.

**Pricing Structure**:
- Basic Package: $250
- Standard Package: $500
- Premium Package: $1000
- Enterprise Package: $2500

**Safety Features**:
- Only creates pricing rules that don't already exist (prevents duplicates)
- Only applies to active visa types
- Includes comprehensive verification queries
- Shows summary, missing rules, duplicates, and sample data

**How to Deploy**:

#### Local Development
```bash
# Using sqlcmd (SQL Server command-line tool)
sqlcmd -S localhost -d L4H -i create-all-pricing-rules.sql

# Or using Azure Data Studio / SQL Server Management Studio
# Open the file and execute it against the L4H database
```

#### Production (Azure SQL)
```bash
# Using sqlcmd with Azure SQL
sqlcmd -S <server>.database.windows.net -d L4H -U <username> -P <password> -i create-all-pricing-rules.sql

# Or via Azure Portal
# 1. Navigate to your Azure SQL Database
# 2. Open Query Editor
# 3. Copy and paste the script
# 4. Execute
```

#### Via SSH to Production Server
```bash
# Copy script to production server
scp create-all-pricing-rules.sql <user>@<production-server>:/tmp/

# SSH to production server
ssh <user>@<production-server>

# Run the script
sqlcmd -S <db-server> -d L4H -U <username> -P <password> -i /tmp/create-all-pricing-rules.sql
```

**Verification**:
The script includes several verification queries that will show:
1. Summary counts (visa types, packages, pricing rules)
2. Visa types without complete pricing (should be empty)
3. Pricing breakdown by package
4. Sample pricing for first 20 visa types
5. Duplicate check (should be empty)

**Expected Results**:
- For ~77 active visa types and 4 packages, expect ~308 pricing rules created
- All visa types should have exactly 4 pricing rules (one per package)
- No duplicates
- All rules should be active

## Best Practices

1. **Always test on development/staging first**
2. **Backup database before running production scripts**
3. **Review verification output carefully**
4. **Document execution in deployment logs**
5. **Keep scripts in version control**

## Notes

- These scripts are idempotent - safe to run multiple times
- They use conditional logic to prevent duplicates
- Always check verification queries output
- Report any anomalies before proceeding with production
