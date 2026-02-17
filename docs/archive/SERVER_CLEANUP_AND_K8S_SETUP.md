# Server Cleanup and Kubernetes Setup Report

**Date**: 2025-10-31
**Server**: 74.208.77.43 (law4hire-prod)
**Status**: ✅ **SERVER CLEANED - READY FOR KUBERNETES**

---

## Phase 1: Production Server Cleanup ✅ COMPLETED

### What Was Removed

#### Docker Containers (14 removed)
- `ops-caddy-1` - Caddy reverse proxy
- `ops-api-1` - Law4Hire API
- `ops-sqlserver-1` - SQL Server 2022
- `ops-upload-gateway-1` - Upload gateway service
- `ops-scraper-1` - Web scraper service
- `l4h-web-prod` - Law4Hire web frontend
- `l4h-api-prod` - Law4Hire API (old)
- `l4h-sqlserver-prod` - SQL Server (old)
- `cannlaw-web-prod` - Cannlaw web frontend
- `law4hire-web-prod` - Law4Hire web (very old)
- `law4hire-api-prod` - Law4Hire API (very old)
- `law4hire-sqlserver-prod` - SQL Server (very old)
- `nginx-proxy` - Nginx reverse proxy
- `aspire-dashboard` - .NET Aspire dashboard

#### Docker Images (30+ removed)
- All `ghcr.io/law4hire/l4h-*` images (multiple versions/SHAs)
- All `ghcr.io/law4hire/legalenvironment/*` images
- Local build images (`l4h-law4hire`, `l4h-api`, `l4h-cannlaw`)
- Supporting images (Caddy, Nginx, older SQL Server)
- ⚠️ Kept: `mcr.microsoft.com/mssql/server:2022-latest` (may be useful)

#### Docker Volumes (60+ removed)
- `ops_*` volumes (caddy-config, caddy-data, mssql-data, uploads-data, web-l4h, web-cannlaw)
- `l4h_*` volumes (sqlserver_data, web-cannlaw, web-l4h)
- `deploy_sqlserver_data`
- `caddy_*` volumes
- 50+ unnamed volumes

#### Docker Networks (2 removed)
- `l4h_l4h-network`
- `ops_default`
- `deploy_legalenv`
- Kept: Default Docker networks (bridge, host, none)

#### Directories Removed
- `~/law4hire-web/` - Law4Hire web source code
- `~/law4hire-api/` - Law4Hire API source code
- `~/cannlaw-web/` - Cannlaw web source code
- `~/aspire/` - .NET Aspire deployment
- `~/ops/` - Operations/deployment scripts
- `~/aspire-deployment-updated.tar.gz` - 58MB archive

#### System Cleanup
- Ran `docker system prune -af --volumes`
- Reclaimed **2.758 GB** of disk space
- Build cache cleared

---

## Current Server State

### System Information
- **OS**: Debian 6.1.0-37-amd64
- **Kernel**: 6.1.140-1 (2025-05-22)
- **Architecture**: x86_64

### Docker Installation ✅
- **Docker Engine**: 28.3.3 (latest)
- **Docker Compose**: v2.39.1 (latest)
- **containerd**: 1.7.27
- **runc**: 1.2.5
- **Storage Driver**: overlay2
- **Cgroup Version**: 2 (modern)

### Disk Space
- **Total**: 237 GB
- **Used**: 31 GB (13%)
- **Available**: 196 GB (83%)
- **Status**: ✅ Plenty of space for Kubernetes

### Docker State (Clean)
- **Containers**: 0 running, 0 stopped
- **Images**: 1 (SQL Server 2022)
- **Volumes**: 0
- **Networks**: 3 (default only: bridge, host, none)

---

## Phase 2: Kubernetes Installation Plan

### Server Setup (Production)

#### Option 1: K3s (Recommended)
**Why K3s**:
- Lightweight Kubernetes (40MB binary vs 1GB+ for full K8s)
- Perfect for single-node or small clusters
- Production-ready, CNCF certified
- Built-in ingress controller (Traefik)
- Minimal resource footprint
- Easy installation and management

**Installation**:
```bash
curl -sfL https://get.k3s.io | sh -
```

**Features**:
- Automatic SQLite datastore (or can use external DB)
- Built-in Helm controller
- Built-in local path provisioner
- Service load balancer (Klipper)
- Embedded network policy controller

#### Option 2: Kubeadm (Full Kubernetes)
**Why Kubeadm**:
- Full-featured Kubernetes
- More complex but more flexible
- Better for multi-node clusters
- Requires more resources

**Requirements**:
- 2 GB RAM minimum (4 GB recommended)
- 2 CPUs minimum
- Network connectivity between nodes
- Unique hostname, MAC address, product_uuid

### Local Setup (WSL)

#### Prerequisites
- WSL2 enabled
- Ubuntu or Debian distribution
- systemd enabled (required for K8s)

#### Options

**Option 1: K3d (K3s in Docker)**
- Runs K3s cluster in Docker containers
- Perfect for local development
- Fast startup/teardown
- Multiple clusters on same machine

**Option 2: Minikube**
- Full Kubernetes experience locally
- Multiple driver options
- Add-ons for common services
- Good for learning/testing

**Option 3: Kind (Kubernetes in Docker)**
- Lightweight
- Good for CI/CD testing
- Multi-node support

---

## Phase 3: Tool Installation

### kubectl (Kubernetes CLI)
**Installation (Linux/WSL)**:
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
```

**Installation (Windows)**:
```powershell
choco install kubernetes-cli
```

### Helm (Kubernetes Package Manager)
**Installation (Linux/WSL)**:
```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

**Installation (Windows)**:
```powershell
choco install kubernetes-helm
```

### k9s (Terminal UI for Kubernetes) - Optional but Recommended
```bash
curl -sS https://webinstall.dev/k9s | bash
```

### kubectx/kubens (Context/Namespace Switcher) - Optional
```bash
sudo git clone https://github.com/ahmetb/kubectx /opt/kubectx
sudo ln -s /opt/kubectx/kubectx /usr/local/bin/kubectx
sudo ln -s /opt/kubectx/kubens /usr/local/bin/kubens
```

---

## Phase 4: Configuration

### Server Configuration
1. Install K3s on production server
2. Copy kubeconfig from `/etc/rancher/k3s/k3s.yaml`
3. Configure firewall rules (if applicable)
4. Test cluster health

### Local Configuration
1. Install K3d/Minikube on WSL
2. Start local cluster
3. Configure kubectl contexts for both local and production
4. Test connectivity

### kubectl Context Setup
```bash
# Add production cluster context
kubectl config set-cluster prod-cluster --server=https://74.208.77.43:6443 --certificate-authority=...
kubectl config set-credentials prod-admin --client-certificate=... --client-key=...
kubectl config set-context production --cluster=prod-cluster --user=prod-admin
kubectl config use-context production

# Add local cluster context
kubectl config set-context local --cluster=k3d-local --user=k3d-local
kubectl config use-context local

# Switch between contexts
kubectl config use-context production  # Use prod
kubectl config use-context local       # Use local
```

---

## Security Considerations

### Production Server
1. **Firewall Configuration**:
   - Open port 6443 (Kubernetes API) - restrict to your IP
   - Open port 80/443 (Ingress traffic) - public
   - Close all other ports

2. **RBAC**:
   - Create service accounts with minimal permissions
   - Never use cluster-admin in production
   - Use namespaces for isolation

3. **Secrets Management**:
   - Use Kubernetes secrets for sensitive data
   - Consider external secret management (Vault, Sealed Secrets)
   - Never commit kubeconfig to git

4. **Network Policies**:
   - Implement network policies to restrict pod-to-pod communication
   - Use ingress controllers with TLS

### Local Development
1. Use separate kubeconfigs for local/prod
2. Set context-specific aliases to prevent accidents
3. Use namespace isolation even locally

---

## Next Steps

### Immediate (Today)
1. ✅ Server cleanup - COMPLETED
2. ✅ Install K3s on production server - COMPLETED
3. ✅ Install K3d on local WSL - COMPLETED
4. ✅ Install kubectl and Helm locally - COMPLETED
5. ✅ Configure kubectl contexts - COMPLETED
6. ✅ Verify cluster health - COMPLETED

### Short-term (This Week)
1. Deploy test application to verify setup
2. Configure ingress controller
3. Set up persistent storage
4. Configure monitoring (Prometheus/Grafana)
5. Set up logging (Loki or ELK)

### Long-term (Next Month)
1. Migrate Law4Hire to Kubernetes
2. Implement CI/CD for K8s deployments
3. Set up backup/disaster recovery
4. Implement auto-scaling
5. Set up service mesh (optional)

---

## Verification Checklist

### Server Cleanup ✅
- [x] All Law4Hire containers stopped and removed
- [x] All Cannlaw containers stopped and removed
- [x] All Docker volumes removed
- [x] All Docker images removed (except SQL Server base image)
- [x] All custom Docker networks removed
- [x] All deployment directories removed
- [x] Docker system pruned
- [x] Docker installation verified
- [x] Disk space verified (196 GB available)

### Kubernetes Installation ✅
- [x] K3s installed on production server (v1.33.5+k3s1)
- [x] K3s running and healthy
- [x] kubectl installed locally (v1.34.1)
- [x] Helm installed locally (v3.19.0)
- [x] Local Kubernetes cluster available (Docker Desktop + K3d)
- [x] kubectl contexts configured (docker-desktop, law4hire-prod)
- [x] Production cluster verified (node ready, 7 system pods running)
- [x] Local cluster operational
- [x] Cluster health verified (nodes ready)
- [⚠️] Remote access to production cluster (requires firewall configuration at hosting provider level)

---

## Recommendations

### Production Setup
1. **Use K3s**: Perfect for your single-server setup
2. **Enable High Availability**: When ready to scale, add more nodes
3. **Use Let's Encrypt**: For automatic SSL certificates
4. **Implement Backup Strategy**: Regular etcd backups
5. **Monitor from Day 1**: Install Prometheus/Grafana early

### Local Development
1. **Use K3d**: Fast, lightweight, Docker-based
2. **Mirror Production**: Use same K8s version as production
3. **Use Skaffold**: For continuous development
4. **Use Tilt**: Alternative to Skaffold, very powerful

### Migration Strategy
1. **Start Small**: Deploy a test app first
2. **Parallel Run**: Run Docker and K8s side-by-side initially
3. **Service by Service**: Migrate one service at a time
4. **Database Last**: Keep database on Docker until everything else works
5. **Monitor Closely**: Watch metrics during and after migration

---

## Troubleshooting

### Common Issues

**K3s won't start**:
```bash
# Check logs
sudo journalctl -u k3s -f

# Check system requirements
sudo k3s check-config
```

**kubectl can't connect**:
```bash
# Check kubeconfig
kubectl cluster-info

# Check server is reachable
curl -k https://74.208.77.43:6443
```

**Pods won't start**:
```bash
# Check pod status
kubectl get pods -A

# Check pod logs
kubectl logs -n <namespace> <pod-name>

# Describe pod for events
kubectl describe pod -n <namespace> <pod-name>
```

---

## Resources

### Official Documentation
- K3s: https://docs.k3s.io/
- Kubernetes: https://kubernetes.io/docs/
- Helm: https://helm.sh/docs/
- kubectl: https://kubernetes.io/docs/reference/kubectl/

### Learning Resources
- Kubernetes the Hard Way: https://github.com/kelseyhightower/kubernetes-the-hard-way
- K3s Tutorial: https://docs.k3s.io/quick-start
- Helm Getting Started: https://helm.sh/docs/intro/quickstart/

### Community
- Kubernetes Slack: https://slack.k8s.io/
- K3s GitHub: https://github.com/k3s-io/k3s
- r/kubernetes: https://reddit.com/r/kubernetes

---

**Server Status**: ✅ Clean and Ready
**Docker Status**: ✅ Operational
**Kubernetes Status**: ✅ Installed and Operational
**Local Tools**: ✅ kubectl (v1.34.1) + Helm (v3.19.0) + K3d (v5.8.3)
**Production K3s**: ✅ Running (v1.33.5+k3s1, 1 node, 7 system pods)
**Next Phase**: Deploy first application to Kubernetes
**Completion Date**: 2025-10-31

