#!/bin/bash
set -e

# Production Deployment Script
# This script triggers the PROD deployment workflow

VERSION=$1
CONFIRMATION="DEPLOY TO PROD"

if [ -z "$VERSION" ]; then
    echo "❌ Error: Version is required"
    echo "Usage: ./deploy-prod.sh v1.0.7"
    exit 1
fi

if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "❌ Error: Version must follow format: vX.Y.Z (e.g., v1.0.7)"
    exit 1
fi

echo "🚀 Triggering PRODUCTION deployment..."
echo "📦 Version: $VERSION"
echo "⚠️  This will deploy to PRODUCTION environment (l4h-prod namespace)"
echo ""
read -p "Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Trigger GitHub Actions workflow
gh workflow run deploy-prod.yml \
    -f version="$VERSION" \
    -f confirmation="$CONFIRMATION"

echo "✅ Deployment triggered successfully!"
echo "📊 Monitor progress: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
