# L4H Development Rules & Protocols

## ⚠️ CRITICAL RULES - NO EXCEPTIONS

### 1. Database Protection Rules
- **NEVER DROP AND REBUILD THE DATABASE** under any circumstances
- Database changes must only be done through Entity Framework migrations
- Always test migrations on a backup before applying to development database
- Use `dotnet ef migrations add` for schema changes
- Use `dotnet ef database update` to apply migrations

### 2. Conditional Seeding
- All seeding processes **MUST** verify data exists before seeding
- Never re-seed existing data
- ✅ **IMPLEMENTED**: All current seeders properly check for existing data:
  - `AdminSeedService`: Uses `SeedUserIfNotExists`
  - `PricingSeedService`: Checks VisaTypes, Packages, PricingRules
  - `CountriesSeeder`: Counts existing records
  - `USSubdivisionsSeeder`: Checks existing subdivisions
  - `VisaClassesSeeder`: Verifies existing visa classes

### 3. API-First Testing Protocol
- **ALWAYS test APIs with CURL before making UI changes**
- Use the provided `api-test-workflow.js` script for comprehensive testing
- Never assume APIs work - verify with real requests
- Example test command: `node api-test-workflow.js`

### 4. Verification Before Implementation
- **Do not guess, presume, or assume anything "should" work**
- Test and verify every step
- Document actual behavior vs. expected behavior
- Use concrete evidence to guide decisions

### 5. Fixed Port Assignments
**These ports are FIXED and must NEVER be changed:**
- **API Backend**: Port 8765
- **Law4Hire Frontend**: Port 5173
- **Cannlaw Frontend**: Port 5174
- **Database**: Port 14333

### 6. API Endpoint Rules (STRICT ENFORCEMENT)
**BEFORE making ANY changes to ANY API call, ALWAYS refer to `API-ENDPOINT-RULES.md` for complete documentation.**

#### ❌ FORBIDDEN - Never use these patterns:
- Wrong ports: `localhost:3000`, `localhost:5000`, `localhost:5175` (frontend)
- Wrong routes: `/api/auth/login` (missing v1), `/auth/login` (missing api/v1)
- Missing headers: `Authorization: TOKEN` (missing "Bearer")

#### ✅ REQUIRED - Always use these patterns:
- **API Base URL**: `http://localhost:8765` (ONLY)
- **Public routes**: `/v1/` (no auth) - Example: `/v1/ping`, `/v1/countries`
- **Protected routes**: `/api/v1/` (requires Bearer token) - Example: `/api/v1/cases/mine`
- **Admin routes**: `/v1/admin/` (requires admin token) - Example: `/v1/admin/users`
- **Proper headers**: `Authorization: Bearer TOKEN`, `Content-Type: application/json`

#### Quick Test Commands:
```bash
# Test connectivity
curl -X GET http://localhost:8765/v1/ping

# Get auth token
curl -X POST http://localhost:8765/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dcann@cannlaw.com","password":"SecureTest123!"}'

# Use token for protected endpoints
curl -X GET http://localhost:8765/api/v1/cases/mine \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Development Workflow

### Starting the API Server
```bash
cd src/api

# Set required environment variables
export ConnectionStrings__SqlServer="Server=localhost,14333;Database=L4H;User Id=sa;Password=SecureTest123!;TrustServerCertificate=True;"
# DO NOT set Auth__Jwt__SigningKey - use the one from appsettings.Development.json instead!
export Auth__Jwt__Issuer="L4H"
export Auth__Jwt__Audience="L4H"
export ADMIN_SEED_PASSWORD="SecureTest123!"
export ASPNETCORE_ENVIRONMENT="Development"

# Start the API
dotnet run
```

### Testing APIs Before UI Development

1. **Start API server** (see commands above)
2. **Run comprehensive test suite**:
   ```bash
   node api-test-workflow.js
   ```
3. **Test specific endpoints manually**:
   ```bash
   # Test ping
   curl -X GET http://localhost:8765/v1/ping

   # Test login
   curl -X POST http://localhost:8765/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"dcann@cannlaw.com","password":"SecureTest123!"}'

   # Test protected endpoint (replace TOKEN)
   curl -X GET http://localhost:8765/api/v1/admin/users \
     -H "Authorization: Bearer TOKEN"
   ```

### Frontend Development Workflow

1. **Test APIs first** (see above)
2. **Start frontend servers**:
   ```bash
   # Law4Hire (port 5173)
   cd web/l4h
   npm run dev

   # Cannlaw (port 5174)
   cd web/cannlaw
   npm run dev
   ```

## Database Management

### ✅ Migration Commands (SAFE)
```bash
# Create new migration
dotnet ef migrations add MigrationName --project src/infrastructure --startup-project src/api

# Apply migrations
dotnet ef database update --project src/infrastructure --startup-project src/api

# View migration status
dotnet ef migrations list --project src/infrastructure --startup-project src/api
```

### ❌ FORBIDDEN Commands
```bash
# NEVER run these commands:
dotnet ef database drop     # FORBIDDEN - destroys data
dotnet ef migrations remove # Only use if migration not applied yet
```

## Verification Protocols

### Before Making Changes
1. **Document current state**: What works now?
2. **Test current APIs**: Run `node api-test-workflow.js`
3. **Identify specific issue**: What exactly is broken?
4. **Plan minimal fix**: Smallest change to fix the issue

### After Making Changes
1. **Test APIs again**: Ensure no regressions
2. **Test UI functionality**: Verify the fix works
3. **Check logs**: Look for any new errors or warnings
4. **Document the fix**: What was changed and why

### Daily Development Checklist
- [ ] API server running on port 8765
- [ ] Database migrations up to date
- [ ] CURL tests passing
- [ ] No database drops or rebuilds
- [ ] Environment variables properly set

## Emergency Procedures

### If Database Seems Corrupted
1. **STOP** - Do not drop the database
2. **Check migrations**: `dotnet ef migrations list`
3. **Check connection**: Verify connection string
4. **Check logs**: Look for specific error messages
5. **Backup current database** before any fixes
6. **Apply missing migrations** if needed

### If APIs Are Failing
1. **Run CURL tests**: `node api-test-workflow.js`
2. **Check API logs**: Look for startup errors
3. **Verify environment variables**: Are they set correctly?
4. **Check database connection**: Can API connect to database?
5. **Review recent changes**: What was modified last?

### If System Crashes Frequently
1. **Review recent changes**: Identify what changed
2. **Check resource usage**: Memory, CPU, disk space
3. **Verify port conflicts**: Are other apps using our ports?
4. **Test with minimal configuration**: Start with basic setup
5. **Gradually add complexity**: Add features one by one

## Code Quality Standards

### API Development
- Always implement proper error handling
- Use appropriate HTTP status codes
- Include proper logging at INFO and ERROR levels
- Test endpoints with CURL before frontend integration

### Frontend Development
- Test API connectivity before implementing UI features
- Handle API errors gracefully
- Use consistent error messaging
- Implement proper loading states

### Database Changes
- Always use EF migrations
- Test migrations on development database first
- Include rollback plan for complex changes
- Document migration purpose and effects

### 7. Command Usage Rules
**NEVER use these commands - they do not work:**
- `del` command in bash (use `rm` instead)
- `taskkill /F` flag (omit the /F flag)
- Use `taskkill /PID [number]` without /F

## Troubleshooting Quick Reference

| Issue | First Check | Solution |
|-------|-------------|----------|
| API not responding | Port 8765 availability | Restart API server |
| Database connection failed | Connection string | Check SQL Server status |
| Seeding errors | Existing data check | Review seeder logs |
| Frontend can't reach API | Proxy configuration | Check vite.config.ts |
| Auth token issues | JWT configuration | Verify environment variables |

---

**Remember**: The goal is stability and reliability. Following these rules prevents the crashes and rebuilds that destroyed our previous working system.

**Last Updated**: 2025-01-04
**Status**: Development Phase - Critical Rules Established