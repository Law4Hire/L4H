# 🎯 DevOps Orchestration Quick Reference

## 🌍 Environment Structure

```
┌─────────────────────────────────────────────────┐
│                  CODEBASE                        │
│              (GitHub master branch)              │
└───────────────┬─────────────────┬───────────────┘
                │                 │
                ▼                 ▼
        ┌───────────────┐  ┌───────────────┐
        │  TEST (l4h)   │  │ PROD (l4h-prod)│
        │   Automatic   │  │    Manual      │
        └───────────────┘  └───────────────┘
```

---

## 🚦 Decision Tree: Where Does My Change Go?

```
Change Type?
│
├─ Bug Fix / Feature / UI Update
│  └─> 1. Commit to master
│      2. AUTO-DEPLOYS to TEST
│      3. Test thoroughly
│      4. When ready: Deploy to PROD (manual)
│
├─ Database Migration
│  └─> 1. Create migration
│      2. Test in TEST (auto)
│      3. Verify idempotent
│      4. Deploy to PROD with version
│
└─ Configuration Change
   └─> 1. Update TEST first
       2. Verify no issues
       3. Update PROD separately
```

---

## ⚡ Quick Commands

### Deploy to TEST (Automatic)
```bash
# Just merge to master - deployment is automatic
git push origin master
```

### Deploy to PROD (Manual)
```bash
# Option 1: CLI
cd ops/scripts
./deploy-prod.sh v1.0.7

# Option 2: GitHub UI
# Actions → Deploy to PRODUCTION → Run workflow
```

### Rollback PROD
```bash
cd ops/scripts
./rollback-prod.sh v1.0.6
```

### Check Status
```bash
# TEST
kubectl get pods -n l4h
kubectl logs -f deployment/api -n l4h

# PROD
kubectl get pods -n l4h-prod
kubectl logs -f deployment/api-prod -n l4h-prod
```

---

## 🔐 Environment Variables by Environment

| Variable | TEST | PROD |
|----------|------|------|
| SQL_SA_PASSWORD | `secrets.SQL_SA_PASSWORD` | `secrets.SQL_SA_PASSWORD_PROD` |
| JWT_SIGNING_KEY | `secrets.JWT_SIGNING_KEY` | `secrets.JWT_SIGNING_KEY_PROD` |
| DEPLOY_HOST | `secrets.DEPLOY_HOST` | `secrets.DEPLOY_HOST_PROD` |

---

## 📦 Component Deployment Matrix

| Component | TEST Namespace | PROD Namespace | Image Tag Format |
|-----------|----------------|----------------|------------------|
| l4h (web) | `l4h` | `l4h-prod` | `test-latest` / `vX.Y.Z` |
| cannlaw (web) | `l4h` | `l4h-prod` | `test-latest` / `vX.Y.Z` |
| sqlserver (db) | `l4h` | `l4h-prod` | SQL Server 2022 |
| API backend | `l4h` | `l4h-prod` | `test-latest` / `vX.Y.Z` |
| upload-gateway | `l4h` | `l4h-prod` | `test-latest` / `vX.Y.Z` |
| scraper | `l4h` | `l4h-prod` | `test-latest` / `vX.Y.Z` |

---

## 🎯 Workflow Files

| File | Purpose | Trigger |
|------|---------|---------|
| `.github/workflows/ci-cd.yml` | Build & test | Push, PR |
| `.github/workflows/deploy-test.yml` | Deploy to TEST | Push to master |
| `.github/workflows/deploy-prod.yml` | Deploy to PROD | Manual workflow_dispatch |

---

## 🔄 Typical Development Workflow

### 1. Feature Development
```bash
# Work on feature
git checkout -b feature/new-feature
# ... make changes ...
git commit -m "Add new feature"
git push origin feature/new-feature
```

### 2. Merge to Master (TEST Deployment)
```bash
# Create PR and merge
# TEST deployment happens automatically
# Verify at https://l4h.74-208-77-43.nip.io
```

### 3. Production Deployment
```bash
# When TEST is stable
cd ops/scripts
./deploy-prod.sh v1.1.0

# Verify at https://l4h-prod.74-208-77-43.nip.io
```

---

## 🚨 Emergency Procedures

### PROD Down - Quick Recovery

```bash
# 1. Check status
kubectl get pods -n l4h-prod

# 2. Rollback immediately
./ops/scripts/rollback-prod.sh v1.0.6

# 3. Verify recovery
curl https://l4h-prod.74-208-77-43.nip.io
```

### Database Migration Failed

```bash
# 1. Rollback application
./ops/scripts/rollback-prod.sh v1.0.6

# 2. Fix migration in code
# 3. Test in TEST environment
# 4. Redeploy to PROD with new version
```

---

## 🔍 Monitoring URLs

### TEST
- L4H: https://l4h.74-208-77-43.nip.io
- Cannlaw: https://cannlaw.74-208-77-43.nip.io
- API Health: https://api.74-208-77-43.nip.io/healthz

### PROD
- L4H: https://l4h-prod.74-208-77-43.nip.io
- Cannlaw: https://cannlaw-prod.74-208-77-43.nip.io
- API Health: https://api-prod.74-208-77-43.nip.io/healthz

---

## 🎓 Key Principles

1. **TEST First** - All changes must go through TEST before PROD
2. **Version Everything** - PROD deployments are versioned releases
3. **Idempotent Migrations** - Database changes can be run multiple times
4. **Manual PROD** - PROD never auto-deploys without explicit approval
5. **Rollback Ready** - Keep previous versions deployable

---

**Need Help?** See [DEPLOYMENT.md](../DEPLOYMENT.md) for full documentation.
