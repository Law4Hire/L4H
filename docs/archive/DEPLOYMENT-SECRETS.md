# Deployment Secrets Configuration

This document tracks the GitHub secrets configured for CI/CD deployment.

## Configured Secrets (as of 2025-10-15)

### Deployment SSH Access
- **DEPLOY_HOST**: `74.208.77.43` - Production server IP address
- **DEPLOY_USER**: `root` - SSH user for deployment
- **DEPLOY_KEY**: SSH private key (id_ed25519_law4hire)

### Domain Configuration
- **L4H_DOMAIN**: `law4hire.com` - Law4Hire application domain
- **CANNLAW_DOMAIN**: `cannlaw.com` - Cannlaw application domain
- **LE_EMAIL**: `usimmigrationhelp.law4hire@gmail.com` - Let's Encrypt certificate email

### Security Keys (Auto-generated)
- **SQL_SA_PASSWORD**: Randomly generated 32-byte base64 password for SQL Server SA account
- **JWT_SIGNING_KEY**: Randomly generated 64-byte base64 key for JWT token signing
- **ADMIN_SEED_PASSWORD**: Randomly generated 32-byte base64 password for admin user seeding
- **UPLOADS_TOKEN_SIGNING_KEY**: Randomly generated 64-byte base64 key for upload token signing

## Notes

- All security keys were generated using `openssl rand -base64` for cryptographic security
- The SSH key used is: `~/.ssh/id_ed25519_law4hire`
- Secrets are stored in GitHub repository settings under Settings > Secrets and variables > Actions
- The production environment is configured with no protection rules (can_admins_bypass: true)

## Viewing Secrets

To view the list of configured secrets:
```bash
gh secret list
```

## Updating Secrets

To update a secret:
```bash
gh secret set SECRET_NAME --body "new-value"
```

To update the SSH key:
```bash
cat ~/.ssh/id_ed25519_law4hire | gh secret set DEPLOY_KEY
```

## Security Warnings

⚠️ **IMPORTANT**:
- Never commit secrets to the repository
- Rotate security keys regularly
- Keep the SQL_SA_PASSWORD secure and backed up
- The ADMIN_SEED_PASSWORD should be changed after first deployment
