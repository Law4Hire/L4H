#!/bin/bash
set -e

# Script to create Kubernetes secrets for L4H
# This script will be used by CI/CD and can be run manually

echo "🔐 Creating Kubernetes secrets..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found"
    exit 1
fi

# Check for required environment variables (from GitHub Secrets or manual input)
REQUIRED_VARS=("SQL_SA_PASSWORD" "JWT_SIGNING_KEY" "UPLOADS_TOKEN_SIGNING_KEY" "ADMIN_SEED_PASSWORD")
MISSING_VARS=()

for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        MISSING_VARS+=("$VAR")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    printf '   - %s\n' "${MISSING_VARS[@]}"
    echo ""
    echo "Please set these environment variables before running this script:"
    echo "  export SQL_SA_PASSWORD='your-password'"
    echo "  export JWT_SIGNING_KEY='your-key'"
    echo "  export UPLOADS_TOKEN_SIGNING_KEY='your-key'"
    echo "  export ADMIN_SEED_PASSWORD='your-password'"
    exit 1
fi

# Create or update the secret
echo "Creating/updating secret in Kubernetes..."

kubectl create secret generic l4h-secrets \
    --from-literal=sql-sa-password="$SQL_SA_PASSWORD" \
    --from-literal=jwt-signing-key="$JWT_SIGNING_KEY" \
    --from-literal=uploads-token-signing-key="$UPLOADS_TOKEN_SIGNING_KEY" \
    --from-literal=admin-seed-password="$ADMIN_SEED_PASSWORD" \
    --namespace=l4h \
    --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Secrets created/updated successfully!"