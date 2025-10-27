#!/bin/bash
# Force redeployment script - clears all caches and pulls fresh images

set -e

echo "🔄 Starting forced redeployment..."

# Navigate to ops directory
cd ~/ops || exit 1

# Stop all services
echo "⏸️  Stopping services..."
docker compose --env-file .env.prod -f compose.prod.yml down

# Remove old images (force bypass cache)
echo "🗑️  Removing old images..."
docker rmi -f $(docker images 'ghcr.io/*/l4h-api' -q) 2>/dev/null || echo "No API images to remove"
docker rmi -f $(docker images 'ghcr.io/*/l4h-upload-gateway' -q) 2>/dev/null || echo "No upload-gateway images to remove"
docker rmi -f $(docker images 'ghcr.io/*/l4h-scraper' -q) 2>/dev/null || echo "No scraper images to remove"

# Pull fresh images with no cache
echo "⬇️  Pulling fresh images..."
docker compose --env-file .env.prod -f compose.prod.yml pull --no-cache

# Start services
echo "🚀 Starting services..."
docker compose --env-file .env.prod -f compose.prod.yml up -d

# Wait for health checks
echo "⏳ Waiting for services to become healthy..."
sleep 30

# Check status
echo "📊 Service status:"
docker compose --env-file .env.prod -f compose.prod.yml ps

# Show recent API logs
echo ""
echo "📋 Recent API logs:"
docker compose --env-file .env.prod -f compose.prod.yml logs --tail=50 api

echo ""
echo "✅ Forced redeployment complete!"
echo "🌐 Check your site to verify the updates are live"
