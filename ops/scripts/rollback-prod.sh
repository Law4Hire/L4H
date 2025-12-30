#!/bin/bash
set -e

# Production Rollback Script
# This script rolls back PROD deployments to a previous version

PREVIOUS_VERSION=$1

if [ -z "$PREVIOUS_VERSION" ]; then
    echo "❌ Error: Previous version is required"
    echo "Usage: ./rollback-prod.sh v1.0.6"
    echo ""
    echo "Available versions:"
    gh release list --limit 10
    exit 1
fi

echo "🔄 Rolling back PRODUCTION to version: $PREVIOUS_VERSION"
echo "⚠️  This will rollback l4h-prod namespace"
echo ""
read -p "Are you sure you want to rollback PRODUCTION? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Rollback cancelled"
    exit 1
fi

# Get repository info
REPO_OWNER=$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\/.*\.git/\1/')
REPO_NAME=$(git config --get remote.origin.url | sed 's/.*\/\(.*\)\.git/\1/')
REPO_LOWER=$(echo "$REPO_OWNER/$REPO_NAME" | tr '[:upper:]' '[:lower:]')

echo "📦 Rolling back to Docker images with tag: $PREVIOUS_VERSION"

# SSH into production server and update images
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" << EOF
    set -e
    echo "🔄 Updating deployment images to $PREVIOUS_VERSION..."

    kubectl set image deployment/api-prod \
        api=ghcr.io/${REPO_LOWER}-api:${PREVIOUS_VERSION} \
        -n l4h-prod

    kubectl set image deployment/upload-gateway-prod \
        upload-gateway=ghcr.io/${REPO_LOWER}-upload-gateway:${PREVIOUS_VERSION} \
        -n l4h-prod

    kubectl set image deployment/scraper-prod \
        scraper=ghcr.io/${REPO_LOWER}-scraper:${PREVIOUS_VERSION} \
        -n l4h-prod

    echo "⏳ Waiting for rollout to complete..."
    kubectl rollout status deployment/api-prod -n l4h-prod --timeout=5m
    kubectl rollout status deployment/upload-gateway-prod -n l4h-prod --timeout=5m
    kubectl rollout status deployment/scraper-prod -n l4h-prod --timeout=5m

    echo "✅ Rollback complete!"
    kubectl get pods -n l4h-prod
EOF

echo "✅ PRODUCTION rollback to $PREVIOUS_VERSION completed successfully!"
