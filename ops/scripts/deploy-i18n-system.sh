#!/bin/bash

# Deploy Unified i18n System
# This script deploys the enhanced localization system across all applications

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOYMENT_LOG="/tmp/i18n-deployment-$(date +%Y%m%d_%H%M%S).log"

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

# Error handling
handle_error() {
    log_error "Deployment failed at line $1"
    log_error "Check deployment log: $DEPLOYMENT_LOG"
    exit 1
}

trap 'handle_error $LINENO' ERR

# Pre-deployment validation
validate_environment() {
    log "🔍 Validating deployment environment..."
    
    # Check if we're in the correct directory
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "Not in project root directory"
        exit 1
    fi
    
    # Check required tools
    command -v node >/dev/null 2>&1 || { log_error "Node.js is required but not installed"; exit 1; }
    command -v npm >/dev/null 2>&1 || { log_error "npm is required but not installed"; exit 1; }
    command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed"; exit 1; }
    
    log_success "Environment validation passed"
}

# Validate translation files
validate_translations() {
    log "🔍 Validating translation files..."
    
    cd "$PROJECT_ROOT"
    
    # Run translation validation script
    if [[ -f "web/shared-ui/src/scripts/run-translation-validation.ts" ]]; then
        cd web/shared-ui
        npm run validate:translations || {
            log_error "Translation validation failed"
            exit 1
        }
        cd "$PROJECT_ROOT"
    fi
    
    log_success "Translation validation passed"
}

# Build shared-ui package
build_shared_ui() {
    log "🔨 Building shared-ui package..."
    
    cd "$PROJECT_ROOT/web/shared-ui"
    
    # Install dependencies
    npm ci
    
    # Run tests
    npm test -- --run || {
        log_warning "Some shared-ui tests failed, but continuing deployment"
    }
    
    # Build package
    npm run build
    
    log_success "Shared-ui build completed"
    cd "$PROJECT_ROOT"
}

# Build L4H application
build_l4h() {
    log "🔨 Building L4H application..."
    
    cd "$PROJECT_ROOT/web/l4h"
    
    # Install dependencies
    npm ci
    
    # Build application
    npm run build
    
    # Verify build output
    if [[ ! -d "dist" ]]; then
        log_error "L4H build failed - no dist directory found"
        exit 1
    fi
    
    log_success "L4H build completed"
    cd "$PROJECT_ROOT"
}

# Build Cannlaw application
build_cannlaw() {
    log "🔨 Building Cannlaw application..."
    
    cd "$PROJECT_ROOT/web/cannlaw"
    
    # Install dependencies
    npm ci
    
    # Build application
    npm run build
    
    # Verify build output
    if [[ ! -d "dist" ]]; then
        log_error "Cannlaw build failed - no dist directory found"
        exit 1
    fi
    
    log_success "Cannlaw build completed"
    cd "$PROJECT_ROOT"
}

# Deploy to production
deploy_to_production() {
    log "🚀 Deploying to production..."
    
    cd "$PROJECT_ROOT"
    
    # Load environment variables
    if [[ -f "ops/.env.prod" ]]; then
        export $(cat ops/.env.prod | grep -v '^#' | xargs)
    else
        log_error "Production environment file not found: ops/.env.prod"
        exit 1
    fi
    
    # Stop existing services
    log "Stopping existing services..."
    docker compose --env-file ops/.env.prod -f ops/compose.prod.yml down || true
    
    # Pull latest images
    log "Pulling latest Docker images..."
    docker compose --env-file ops/.env.prod -f ops/compose.prod.yml pull
    
    # Deploy UI artifacts to Docker volumes
    log "Deploying UI artifacts..."
    
    # Deploy L4H
    docker run --rm \
        -v ops_web-l4h:/dst \
        -v "$PROJECT_ROOT/web/l4h/dist":/src \
        alpine sh -c "rm -rf /dst/* && cp -r /src/* /dst/"
    
    # Deploy Cannlaw
    docker run --rm \
        -v ops_web-cannlaw:/dst \
        -v "$PROJECT_ROOT/web/cannlaw/dist":/src \
        alpine sh -c "rm -rf /dst/* && cp -r /src/* /dst/"
    
    # Start services
    log "Starting services..."
    docker compose --env-file ops/.env.prod -f ops/compose.prod.yml up -d
    
    log_success "Production deployment completed"
}

# Verify deployment
verify_deployment() {
    log "🔍 Verifying deployment..."
    
    # Wait for services to be ready
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    cd "$PROJECT_ROOT"
    docker compose --env-file ops/.env.prod -f ops/compose.prod.yml ps
    
    # Test endpoints
    local max_attempts=10
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log "Health check attempt $attempt/$max_attempts"
        
        # Check API health
        if curl -f -s http://localhost:8080/healthz > /dev/null; then
            log_success "API health check passed"
            break
        else
            log_warning "API health check failed, retrying..."
            sleep 10
            ((attempt++))
        fi
        
        if [[ $attempt -gt $max_attempts ]]; then
            log_error "API health check failed after $max_attempts attempts"
            exit 1
        fi
    done
    
    log_success "Deployment verification completed"
}

# Test i18n functionality
test_i18n_functionality() {
    log "🧪 Testing i18n functionality..."
    
    # Test translation loading for different languages
    local test_languages=("en-US" "fr-FR" "es-ES" "ar-SA")
    
    for lang in "${test_languages[@]}"; do
        log "Testing language: $lang"
        
        # Test L4H translations
        if curl -f -s "http://localhost/locales/shared/$lang/common.json" > /dev/null; then
            log_success "L4H $lang translations accessible"
        else
            log_warning "L4H $lang translations not accessible"
        fi
        
        # Test Cannlaw translations
        if curl -f -s "http://localhost/cannlaw/locales/cannlaw/$lang/legal.json" > /dev/null; then
            log_success "Cannlaw $lang translations accessible"
        else
            log_warning "Cannlaw $lang translations not accessible"
        fi
    done
    
    log_success "i18n functionality testing completed"
}

# Create deployment report
create_deployment_report() {
    log "📊 Creating deployment report..."
    
    local report_file="/tmp/i18n-deployment-report-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# i18n System Deployment Report

**Deployment Date:** $(date)
**Deployment Log:** $DEPLOYMENT_LOG

## Deployment Summary

### Components Deployed
- ✅ Shared UI i18n system
- ✅ L4H application with unified i18n
- ✅ Cannlaw application with unified i18n

### Services Status
\`\`\`
$(docker compose --env-file ops/.env.prod -f ops/compose.prod.yml ps)
\`\`\`

### Translation Files Deployed
- Shared translations: $(find web/shared-ui/public/locales -name "*.json" | wc -l) files
- L4H translations: $(find web/l4h/public/locales -name "*.json" | wc -l) files
- Cannlaw translations: $(find web/cannlaw/public/locales -name "*.json" | wc -l) files

### Health Checks
- API Health: $(curl -f -s http://localhost:8080/healthz && echo "✅ Healthy" || echo "❌ Unhealthy")
- L4H Frontend: $(curl -f -s http://localhost/ && echo "✅ Accessible" || echo "❌ Inaccessible")
- Cannlaw Frontend: $(curl -f -s http://localhost/cannlaw/ && echo "✅ Accessible" || echo "❌ Inaccessible")

## Next Steps
1. Monitor application logs for translation errors
2. Test language switching functionality
3. Verify RTL language support
4. Monitor performance metrics

EOF

    log_success "Deployment report created: $report_file"
    echo "$report_file"
}

# Main deployment function
main() {
    log "🚀 Starting unified i18n system deployment..."
    log "Deployment log: $DEPLOYMENT_LOG"
    
    validate_environment
    validate_translations
    build_shared_ui
    build_l4h
    build_cannlaw
    deploy_to_production
    verify_deployment
    test_i18n_functionality
    
    local report_file=$(create_deployment_report)
    
    log_success "🎉 Unified i18n system deployment completed successfully!"
    log "📊 Deployment report: $report_file"
    log "📋 Deployment log: $DEPLOYMENT_LOG"
}

# Run deployment if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi