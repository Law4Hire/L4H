#!/bin/bash
set -e

# Kubernetes Rollback Script for L4H Project
# Usage: ./rollback.sh [deployment-name]
# Example: ./rollback.sh api
#          ./rollback.sh all

DEPLOYMENT=${1:-all}
NAMESPACE="l4h"

echo "🔄 Rolling back L4H deployment..."

if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found"
    exit 1
fi

rollback_deployment() {
    local dep=$1
    echo "⏮️  Rolling back $dep..."

    if kubectl rollout undo deployment/$dep -n $NAMESPACE; then
        echo "✅ Rolled back $dep"
        kubectl rollout status deployment/$dep -n $NAMESPACE
    else
        echo "❌ Failed to rollback $dep"
        return 1
    fi
}

if [ "$DEPLOYMENT" == "all" ]; then
    echo "Rolling back all deployments..."
    DEPLOYMENTS=("api" "upload-gateway" "scraper" "web")

    for dep in "${DEPLOYMENTS[@]}"; do
        rollback_deployment "$dep"
    done

    # Note: sqlserver is not rolled back automatically to preserve data
    echo "⚠️  SQL Server not rolled back (data preservation)"
else
    rollback_deployment "$DEPLOYMENT"
fi

echo ""
echo "✅ Rollback complete!"
echo ""
echo "Current pod status:"
kubectl get pods -n $NAMESPACE
