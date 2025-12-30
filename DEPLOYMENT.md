# 🚀 Deployment Guide

## Overview

This project uses a **two-environment deployment strategy**:

| Environment | Namespace | URLs | Deployment |
|-------------|-----------|------|------------|
| **TEST** | `l4h` | l4h.74-208-77-43.nip.io<br>cannlaw.74-208-77-43.nip.io | Automatic on merge to `master` |
| **PROD** | `l4h-prod` | l4h-prod.74-208-77-43.nip.io<br>cannlaw-prod.74-208-77-43.nip.io | Manual, versioned releases only |

---

## 🔄 Deployment Workflows

### TEST Environment (Automatic)

**Trigger:** Push to `master` branch

**What happens:**
1. Code is pushed/merged to `master`
2. GitHub Actions automatically:
   - Builds Docker images with `test-latest` tag
   - Deploys to Kubernetes namespace `l4h`
   - Updates TEST URLs

**No action required** - deployments happen automatically.

**Access TEST:**
- https://l4h.74-208-77-43.nip.io
- https://cannlaw.74-208-77-43.nip.io
- https://api.74-208-77-43.nip.io

---

### PRODUCTION Environment (Manual Only)

**🚨 CRITICAL: PROD deployments require explicit approval and versioning.**

**Prerequisites:**
1. All changes must be tested in TEST environment first
2. Version number must follow semantic versioning: `vX.Y.Z`
3. Confirmation text must be exact: `DEPLOY TO PROD`

#### Deploying to PROD

**Option 1: Using GitHub UI**

1. Go to **Actions** → **Deploy to PRODUCTION**
2. Click **Run workflow**
3. Enter version (e.g., `v1.0.7`)
4. Enter confirmation: `DEPLOY TO PROD`
5. Click **Run workflow**

**Option 2: Using CLI Script**

```bash
cd ops/scripts
./deploy-prod.sh v1.0.7
```

**Access PROD:**
- https://l4h-prod.74-208-77-43.nip.io
- https://cannlaw-prod.74-208-77-43.nip.io
- https://api-prod.74-208-77-43.nip.io

---

## 📋 Version Management

Follow **semantic versioning**: `vMAJOR.MINOR.PATCH`

- `vX.0.0` - Major release (breaking changes)
- `vX.Y.0` - Minor release (new features)
- `vX.Y.Z` - Patch release (bug fixes)

---

## 🔄 Rollback Procedure

```bash
cd ops/scripts
./rollback-prod.sh v1.0.6  # Previous working version
```

---

## 🗄️ Database Migrations

**⚠️ Database migrations must be:**
- **Idempotent** - Can run multiple times safely
- **Reversible** - Have a rollback strategy
- **Tested** - Validated in TEST environment first

---

**Last Updated:** 2025-01-01
