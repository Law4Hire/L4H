# L4H Kubernetes Deployment

This directory contains the Kubernetes manifests and scripts for deploying the L4H project to a Kubernetes cluster.

## Architecture Overview

The L4H system is deployed as a set of microservices on Kubernetes:

- **SQL Server**: Database with 50Gi persistent storage
- **API**: Main backend API (2 replicas for high availability)
- **Upload Gateway**: File upload service (2 replicas)
- **Scraper**: Background job for data scraping (1 replica)
- **Web**: Nginx serving Law4Hire and Cannlaw frontends (2 replicas)
- **Ingress**: Traefik ingress with automatic HTTPS via Let's Encrypt

## Prerequisites

1. **Kubernetes Cluster**: K3s, K8s, or any compatible cluster
2. **kubectl**: Configured to connect to your cluster
3. **Storage**: Cluster must have a default storage class (K3s uses `local-path` by default)
4. **Ingress Controller**: Traefik (included with K3s) or any compatible ingress controller

## Directory Structure

```
ops/k8s/
├── base/                      # Base Kubernetes manifests
│   ├── namespace.yaml         # l4h namespace
│   ├── sqlserver.yaml         # SQL Server deployment + PVC
│   ├── api.yaml              # API deployment + ConfigMap + Service
│   ├── upload-gateway.yaml   # Upload gateway deployment
│   ├── scraper.yaml          # Scraper deployment
│   ├── web.yaml              # Web server (nginx) + PVCs
│   ├── ingress.yaml          # Ingress with nip.io domains
│   ├── secrets.template.yaml # Template for secrets (DO NOT COMMIT)
│   └── kustomization.yaml    # Kustomize config
├── scripts/                   # Deployment scripts
│   ├── deploy.sh             # Main deployment script
│   ├── create-secrets.sh     # Create Kubernetes secrets
│   └── rollback.sh           # Rollback deployments
└── README.md                 # This file

```

## Quick Start

### 1. Create Kubernetes Secrets

Secrets are **never** committed to git. You must create them before deploying:

```bash
# Set environment variables with your secrets
export SQL_SA_PASSWORD='your-strong-password'
export JWT_SIGNING_KEY='your-jwt-signing-key-min-32-chars'
export UPLOADS_TOKEN_SIGNING_KEY='your-uploads-key-min-32-chars'
export ADMIN_SEED_PASSWORD='your-admin-password'

# Run the create-secrets script
cd ops/k8s/scripts
./create-secrets.sh
```

### 2. Deploy to Kubernetes

```bash
# Run the deployment script
cd ops/k8s/scripts
./deploy.sh
```

This will:
- Create the `l4h` namespace
- Apply all Kubernetes manifests
- Wait for all deployments to be ready
- Display service URLs and pod status

### 3. Access Your Services

After deployment, your services will be available at:

- **Law4Hire**: https://l4h.74-208-77-43.nip.io
- **Cannlaw**: https://cannlaw.74-208-77-43.nip.io
- **API**: https://api.74-208-77-43.nip.io

HTTPS certificates are automatically provisioned by Traefik using Let's Encrypt.

## Manual Deployment Steps

If you prefer to deploy manually or need more control:

### Step 1: Create Namespace

```bash
kubectl apply -f ops/k8s/base/namespace.yaml
```

### Step 2: Create Secrets

```bash
kubectl create secret generic l4h-secrets \
  --from-literal=sql-sa-password='YOUR_PASSWORD' \
  --from-literal=jwt-signing-key='YOUR_KEY' \
  --from-literal=uploads-token-signing-key='YOUR_KEY' \
  --from-literal=admin-seed-password='YOUR_PASSWORD' \
  --namespace=l4h
```

### Step 3: Apply All Manifests

```bash
cd ops/k8s/base
kubectl apply -k .
```

### Step 4: Wait for Deployments

```bash
kubectl wait --for=condition=available --timeout=300s \
  deployment/sqlserver \
  deployment/api \
  deployment/upload-gateway \
  deployment/scraper \
  deployment/web \
  -n l4h
```

### Step 5: Check Status

```bash
kubectl get pods -n l4h
kubectl get services -n l4h
kubectl get ingress -n l4h
```

## Updating Deployments

### Update Docker Images

When new Docker images are pushed to the registry:

```bash
# Update API
kubectl set image deployment/api \
  api=ghcr.io/the_real/l4h-api:NEW_TAG \
  -n l4h

# Update Upload Gateway
kubectl set image deployment/upload-gateway \
  upload-gateway=ghcr.io/the_real/l4h-upload-gateway:NEW_TAG \
  -n l4h

# Update Scraper
kubectl set image deployment/scraper \
  scraper=ghcr.io/the_real/l4h-scraper:NEW_TAG \
  -n l4h
```

### Update Web UI Files

To update the frontend files (L4H and Cannlaw):

```bash
# Copy new files to l4h PVC
kubectl run copy-l4h --image=alpine --restart=Never -n l4h \
  --overrides='{"spec":{"containers":[{"name":"copy-l4h","image":"alpine","command":["sleep","300"],"volumeMounts":[{"name":"l4h-data","mountPath":"/data"}]}],"volumes":[{"name":"l4h-data","persistentVolumeClaim":{"claimName":"web-l4h-pvc"}}]}}'
kubectl wait --for=condition=Ready pod/copy-l4h -n l4h --timeout=60s
kubectl cp /path/to/web/l4h/dist/. l4h/copy-l4h:/data/
kubectl delete pod copy-l4h -n l4h

# Copy new files to cannlaw PVC
kubectl run copy-cannlaw --image=alpine --restart=Never -n l4h \
  --overrides='{"spec":{"containers":[{"name":"copy-cannlaw","image":"alpine","command":["sleep","300"],"volumeMounts":[{"name":"cannlaw-data","mountPath":"/data"}]}],"volumes":[{"name":"cannlaw-data","persistentVolumeClaim":{"claimName":"web-cannlaw-pvc"}}]}}'
kubectl wait --for=condition=Ready pod/copy-cannlaw -n l4h --timeout=60s
kubectl cp /path/to/web/cannlaw/dist/. l4h/copy-cannlaw:/data/
kubectl delete pod copy-cannlaw -n l4h

# Restart web deployment
kubectl rollout restart deployment/web -n l4h
```

## Rollback

If a deployment fails or causes issues, you can rollback:

### Rollback a Specific Deployment

```bash
cd ops/k8s/scripts
./rollback.sh api          # Rollback API only
./rollback.sh upload-gateway  # Rollback upload gateway only
./rollback.sh scraper      # Rollback scraper only
./rollback.sh web          # Rollback web only
```

### Rollback All Deployments

```bash
cd ops/k8s/scripts
./rollback.sh all
```

Note: SQL Server is never rolled back automatically to preserve data.

### Manual Rollback

```bash
kubectl rollout undo deployment/api -n l4h
kubectl rollout status deployment/api -n l4h
```

## Monitoring and Troubleshooting

### View Pod Status

```bash
kubectl get pods -n l4h
```

### View Pod Logs

```bash
# View logs for a specific pod
kubectl logs <pod-name> -n l4h

# Follow logs in real-time
kubectl logs -f <pod-name> -n l4h

# View logs for all pods in a deployment
kubectl logs -l app=api -n l4h --all-containers=true
```

### Describe a Pod (for debugging)

```bash
kubectl describe pod <pod-name> -n l4h
```

### Check Deployment Status

```bash
kubectl get deployments -n l4h
kubectl rollout status deployment/api -n l4h
```

### Check Service Endpoints

```bash
kubectl get services -n l4h
kubectl get endpoints -n l4h
```

### Check Ingress

```bash
kubectl get ingress -n l4h
kubectl describe ingress l4h-ingress -n l4h
```

### Access a Pod Shell

```bash
kubectl exec -it <pod-name> -n l4h -- /bin/bash
```

### View Events

```bash
kubectl get events -n l4h --sort-by='.lastTimestamp'
```

## Storage Management

### View Persistent Volumes

```bash
kubectl get pvc -n l4h
kubectl get pv
```

### Check Storage Usage

```bash
# Access a pod and check disk usage
kubectl exec -it <pod-name> -n l4h -- df -h
```

## Scaling

### Scale a Deployment

```bash
# Scale API to 3 replicas
kubectl scale deployment/api --replicas=3 -n l4h

# Scale web to 4 replicas
kubectl scale deployment/web --replicas=4 -n l4h
```

### Auto-scaling (HPA)

To enable horizontal pod autoscaling:

```bash
kubectl autoscale deployment/api --cpu-percent=70 --min=2 --max=10 -n l4h
```

## Backup and Restore

### Backup SQL Server Database

```bash
# Access SQL Server pod
kubectl exec -it <sqlserver-pod-name> -n l4h -- /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P 'YOUR_PASSWORD' \
  -Q "BACKUP DATABASE L4H TO DISK = '/var/opt/mssql/backup/l4h.bak'"

# Copy backup file from pod
kubectl cp l4h/<sqlserver-pod-name>:/var/opt/mssql/backup/l4h.bak ./l4h-backup.bak
```

### Restore SQL Server Database

```bash
# Copy backup file to pod
kubectl cp ./l4h-backup.bak l4h/<sqlserver-pod-name>:/var/opt/mssql/backup/l4h.bak

# Restore database
kubectl exec -it <sqlserver-pod-name> -n l4h -- /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P 'YOUR_PASSWORD' \
  -Q "RESTORE DATABASE L4H FROM DISK = '/var/opt/mssql/backup/l4h.bak' WITH REPLACE"
```

## CI/CD Integration

The GitHub Actions workflow automatically deploys to Kubernetes when code is pushed to `main` or `master` branch.

### GitHub Secrets Required

The following secrets must be configured in your GitHub repository:

- `DEPLOY_HOST`: Server IP or hostname
- `DEPLOY_USER`: SSH username
- `DEPLOY_KEY`: SSH private key
- `SQL_SA_PASSWORD`: SQL Server SA password
- `JWT_SIGNING_KEY`: JWT signing key (min 32 chars)
- `UPLOADS_TOKEN_SIGNING_KEY`: Upload token signing key (min 32 chars)
- `ADMIN_SEED_PASSWORD`: Admin user password

### Workflow Process

1. Build and test .NET solution
2. Build Docker images
3. Push images to GitHub Container Registry
4. Copy Kubernetes manifests to server
5. Create/update secrets
6. Apply manifests
7. Update deployment images with new SHA
8. Copy UI artifacts to PVCs
9. Run health checks

## Security Best Practices

1. **Secrets Management**: Never commit secrets to git. Use Kubernetes secrets or external secret managers.
2. **RBAC**: Implement Role-Based Access Control for cluster access.
3. **Network Policies**: Consider implementing network policies to restrict pod-to-pod communication.
4. **Image Security**: Regularly scan Docker images for vulnerabilities.
5. **TLS**: All external traffic uses HTTPS via Traefik and Let's Encrypt.
6. **Resource Limits**: All deployments have resource limits to prevent resource exhaustion.

## Resource Requirements

### Minimum Cluster Requirements

- **CPU**: 4 cores minimum (6-8 cores recommended)
- **Memory**: 8Gi minimum (16Gi recommended)
- **Storage**: 200Gi minimum for persistent volumes

### Per-Deployment Resource Allocation

| Service | CPU Request | CPU Limit | Memory Request | Memory Limit | Storage |
|---------|-------------|-----------|----------------|--------------|---------|
| SQL Server | 500m | 2000m | 2Gi | 4Gi | 50Gi |
| API | 250m | 1000m | 512Mi | 2Gi | 100Gi (shared) |
| Upload Gateway | 100m | 500m | 256Mi | 1Gi | 100Gi (shared) |
| Scraper | 100m | 500m | 256Mi | 1Gi | - |
| Web | 100m | 500m | 128Mi | 512Mi | 2Gi (1Gi each for l4h and cannlaw) |

## nip.io DNS

This deployment uses [nip.io](https://nip.io) for DNS resolution. nip.io provides wildcard DNS for any IP address.

Format: `<subdomain>.<IP-with-dashes>.nip.io`

For IP `74.208.77.43`:
- `l4h.74-208-77-43.nip.io` → 74.208.77.43
- `cannlaw.74-208-77-43.nip.io` → 74.208.77.43
- `api.74-208-77-43.nip.io` → 74.208.77.43

Benefits:
- Zero DNS configuration required
- Automatic domain resolution
- Works immediately without DNS propagation
- Perfect for development and testing

## Troubleshooting Common Issues

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n l4h

# Describe the pod to see events
kubectl describe pod <pod-name> -n l4h

# Check logs
kubectl logs <pod-name> -n l4h
```

Common causes:
- Image pull errors (check image name and registry credentials)
- Resource constraints (check node resources)
- Failed health checks (check application logs)
- Missing secrets or ConfigMaps

### Ingress Not Working

```bash
# Check ingress status
kubectl get ingress -n l4h
kubectl describe ingress l4h-ingress -n l4h

# Check Traefik logs (if using K3s)
kubectl logs -n kube-system -l app.kubernetes.io/name=traefik
```

Common causes:
- Ingress controller not running
- Wrong host configuration
- Certificate not provisioned yet (wait 1-2 minutes)
- DNS not resolving (check nip.io domain)

### Database Connection Issues

```bash
# Check SQL Server pod
kubectl get pods -n l4h -l app=sqlserver

# Check SQL Server logs
kubectl logs -n l4h -l app=sqlserver

# Test database connectivity from API pod
kubectl exec -it <api-pod-name> -n l4h -- curl http://sqlserver:1433
```

Common causes:
- SQL Server not ready yet (check logs for startup messages)
- Wrong connection string in ConfigMap
- Missing secrets
- Network policy blocking connection

### Storage Issues

```bash
# Check PVC status
kubectl get pvc -n l4h

# Check PV status
kubectl get pv
```

Common causes:
- No storage class available
- Insufficient disk space on node
- PVC not bound to PV

## Support and Documentation

For more information:
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [K3s Documentation](https://docs.k3s.io/)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [nip.io Documentation](https://nip.io/)

## License

This deployment configuration is part of the L4H project.
