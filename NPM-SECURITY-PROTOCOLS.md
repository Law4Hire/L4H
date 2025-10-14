# NPM Security Protocols
**Established**: 2025-09-17
**Status**: MANDATORY for all NPM operations

## 🚨 SECURITY-FIRST RULES

### Before ANY NPM Operations
1. **ALWAYS run NPM audit first**
   ```bash
   npm audit
   ```
2. **Review all vulnerabilities** before proceeding
3. **Document findings** in security log
4. **Test updates in isolation** before applying to production

### NPM Package Management Protocol

#### 1. Installing New Packages
```bash
# Step 1: Check package reputation
npm info [package-name]

# Step 2: Audit before install
npm audit

# Step 3: Install with exact version
npm install [package-name]@[exact-version] --save-exact

# Step 4: Audit after install
npm audit

# Step 5: Test functionality
npm run build && npm run test
```

#### 2. Updating Existing Packages
```bash
# Step 1: Check current state
npm audit
npm outdated

# Step 2: Update specific package (NOT all)
npm update [specific-package]

# Step 3: Audit after update
npm audit

# Step 4: Test compatibility
npm run build && npm run test
```

#### 3. Security Vulnerability Response
```bash
# Step 1: Immediate assessment
npm audit

# Step 2: Categorize severity
# - HIGH/CRITICAL: Fix immediately
# - MODERATE: Fix within 24 hours
# - LOW: Fix within 1 week

# Step 3: Isolated testing
npm audit fix --dry-run  # See what would change

# Step 4: Controlled fix
npm audit fix  # Try non-breaking first
# If breaking changes required:
npm audit fix --force  # Only after testing

# Step 5: Verification
npm audit  # Should show 0 vulnerabilities
```

### Cache Management Protocol

#### Weekly Cache Maintenance
```bash
# Every Monday morning:
npm cache verify
npm cache clean --force  # If issues found
```

#### Emergency Cache Flush
```bash
# When security threats detected:
npm cache clean --force
npm cache verify
# Reinstall all dependencies:
rm -rf node_modules package-lock.json
npm install
```

### Development Environment Security

#### Dev Server Hardening
- Run only on localhost (never 0.0.0.0)
- Use firewall rules to block external access
- Regular security audits (weekly minimum)
- Monitor for unusual network activity

#### Production vs Development
- NEVER use development packages in production
- Separate package.json devDependencies properly
- Regular production build testing

### Monitoring & Alerts

#### Daily Checks
- [ ] NPM audit on all projects
- [ ] Check for security advisories
- [ ] Monitor package update notifications

#### Weekly Tasks
- [ ] Full dependency review
- [ ] Cache maintenance
- [ ] Security protocol review
- [ ] Update security log

#### Monthly Tasks
- [ ] Complete security audit
- [ ] Dependency cleanup
- [ ] Protocol effectiveness review

### Red Flags - Immediate Action Required

🚨 **STOP ALL OPERATIONS** if you detect:
- Unknown packages in package.json
- Unexpected network requests during build
- File system access outside project directory
- Cryptocurrency mining processes
- Unusual CPU usage during development
- Modified package-lock.json without explicit updates

### Emergency Response Plan

#### If Compromise Suspected:
1. **IMMEDIATELY** stop all dev servers
2. **ISOLATE** the machine from network
3. **BACKUP** current project state
4. **SCAN** with updated antivirus
5. **AUDIT** all recent package changes
6. **CLEAN** NPM cache completely
7. **REBUILD** from known good state

### Approved Package Sources
- **PRIMARY**: npmjs.com registry only
- **NEVER**: unofficial registries, GitHub packages without verification
- **VERIFICATION**: Always check package author, download counts, recent activity

### Documentation Requirements
Every NPM operation must be logged:
- Date/time of operation
- Package(s) affected
- Security scan results
- Testing verification
- Any issues encountered

---

## Current Security Status
- **Last Audit**: 2025-09-17
- **Vulnerabilities**: 0 across all projects ✅
- **Vite Version**: 7.1.5 (updated for security)
- **Cache Status**: Cleaned and verified ✅

## Security Audit History
- **2025-09-17**: Found 4 moderate vulnerabilities, fixed with Vite upgrade
  - esbuild <=0.24.2 → FIXED
  - Affected all 3 projects → ALL SECURED

---
*These protocols are MANDATORY and must be followed without exception*
*Security compromises will result in immediate project isolation*