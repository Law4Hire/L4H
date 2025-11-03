#!/bin/bash
set -e

# Kubernetes Deployment Script for L4H Project
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh prod

ENVIRONMENT=${1:-prod}
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
K8S_DIR="$SCRIPT_DIR/.."
BASE_DIR="$K8S_DIR/base"

echo "🚀 Deploying L4H to Kubernetes (${ENVIRONMENT})..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl first."
    exit 1
fi

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

echo "✅ Connected to Kubernetes cluster"

# Create namespace if it doesn't exist
echo "📦 Creating namespace..."
kubectl apply -f "$BASE_DIR/namespace.yaml"

# Check if secrets exist
if ! kubectl get secret l4h-secrets -n l4h &> /dev/null; then
    echo "⚠️  Secrets not found! You need to create secrets first."
    echo "   Run: ./create-secrets.sh"
    exit 1
fi

echo "✅ Secrets found"

# Apply all Kubernetes manifests
echo "📝 Applying Kubernetes manifests..."
kubectl apply -k "$BASE_DIR"

# Wait for deployments to be ready
echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s \
    deployment/sqlserver \
    deployment/api \
    deployment/upload-gateway \
    deployment/scraper \
    deployment/web \
    -n l4h

echo "✅ All deployments are ready!"

# Display service URLs
echo ""
echo "🌐 Your services are available at:"
echo "   Law4Hire:  https://l4h.74-208-77-43.nip.io"
echo "   Cannlaw:   https://cannlaw.74-208-77-43.nip.io"
echo "   API:       https://api.74-208-77-43.nip.io"
echo ""

# Show pod status
echo "📊 Pod Status:"
kubectl get pods -n l4h

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Useful commands:"
echo "  kubectl get pods -n l4h           # View pod status"
echo "  kubectl logs -f <pod-name> -n l4h # View logs"
echo "  kubectl describe pod <pod-name> -n l4h  # Debug issues"
