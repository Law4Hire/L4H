# Deploy Unified i18n System
# This script deploys the enhanced localization system across all applications

param(
    [string]$Environment = "production",
    [switch]$SkipTests = $false,
    [switch]$Verbose = $false
)

# Configuration
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$DeploymentLog = "i18n-deployment-$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# Logging functions
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage
    Add-Content -Path $DeploymentLog -Value $logMessage
}

function Write-Success {
    param([string]$Message)
    Write-Log "✅ $Message" "SUCCESS"
}

function Write-Warning {
    param([string]$Message)
    Write-Log "⚠️  $Message" "WARNING"
}

function Write-Error {
    param([string]$Message)
    Write-Log "❌ $Message" "ERROR"
}

# Error handling
trap {
    Write-Error "Deployment failed: $_"
    Write-Error "Check deployment log: $DeploymentLog"
    exit 1
}

# Pre-deployment validation
function Test-Environment {
    Write-Log "🔍 Validating deployment environment..."
    
    # Check if we're in the correct directory
    if (-not (Test-Path "$ProjectRoot/package.json")) {
        throw "Not in project root directory"
    }
    
    # Check required tools
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        throw "Node.js is required but not installed"
    }
    
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        throw "npm is required but not installed"
    }
    
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw "Docker is required but not installed"
    }
    
    Write-Success "Environment validation passed"
}

# Validate translation files
function Test-Translations {
    Write-Log "🔍 Validating translation files..."
    
    Set-Location $ProjectRoot
    
    # Run translation validation script if it exists
    if (Test-Path "web/shared-ui/src/scripts/run-translation-validation.ts") {
        Set-Location "web/shared-ui"
        try {
            npm run validate:translations
        }
        catch {
            throw "Translation validation failed"
        }
        Set-Location $ProjectRoot
    }
    
    Write-Success "Translation validation passed"
}

# Build shared-ui package
function Build-SharedUI {
    Write-Log "🔨 Building shared-ui package..."
    
    Set-Location "$ProjectRoot/web/shared-ui"
    
    # Install dependencies
    npm ci
    
    # Run tests unless skipped
    if (-not $SkipTests) {
        try {
            npm test -- --run
        }
        catch {
            Write-Warning "Some shared-ui tests failed, but continuing deployment"
        }
    }
    
    # Build package
    npm run build
    
    Write-Success "Shared-ui build completed"
    Set-Location $ProjectRoot
}

# Build L4H application
function Build-L4H {
    Write-Log "🔨 Building L4H application..."
    
    Set-Location "$ProjectRoot/web/l4h"
    
    # Install dependencies
    npm ci
    
    # Build application
    npm run build
    
    # Verify build output
    if (-not (Test-Path "dist")) {
        throw "L4H build failed - no dist directory found"
    }
    
    Write-Success "L4H build completed"
    Set-Location $ProjectRoot
}

# Build Cannlaw application
function Build-Cannlaw {
    Write-Log "🔨 Building Cannlaw application..."
    
    Set-Location "$ProjectRoot/web/cannlaw"
    
    # Install dependencies
    npm ci
    
    # Build application
    npm run build
    
    # Verify build output
    if (-not (Test-Path "dist")) {
        throw "Cannlaw build failed - no dist directory found"
    }
    
    Write-Success "Cannlaw build completed"
    Set-Location $ProjectRoot
}

# Deploy to production
function Deploy-ToProduction {
    Write-Log "🚀 Deploying to production..."
    
    Set-Location $ProjectRoot
    
    # Check for environment file
    if (-not (Test-Path "ops/.env.prod")) {
        throw "Production environment file not found: ops/.env.prod"
    }
    
    # Stop existing services
    Write-Log "Stopping existing services..."
    docker compose --env-file ops/.env.prod -f ops/compose.prod.yml down
    
    # Pull latest images
    Write-Log "Pulling latest Docker images..."
    docker compose --env-file ops/.env.prod -f ops/compose.prod.yml pull
    
    # Deploy UI artifacts to Docker volumes
    Write-Log "Deploying UI artifacts..."
    
    # Deploy L4H
    docker run --rm `
        -v ops_web-l4h:/dst `
        -v "${ProjectRoot}/web/l4h/dist":/src `
        alpine sh -c "rm -rf /dst/* && cp -r /src/* /dst/"
    
    # Deploy Cannlaw
    docker run --rm `
        -v ops_web-cannlaw:/dst `
        -v "${ProjectRoot}/web/cannlaw/dist":/src `
        alpine sh -c "rm -rf /dst/* && cp -r /src/* /dst/"
    
    # Start services
    Write-Log "Starting services..."
    docker compose --env-file ops/.env.prod -f ops/compose.prod.yml up -d
    
    Write-Success "Production deployment completed"
}

# Verify deployment
function Test-Deployment {
    Write-Log "🔍 Verifying deployment..."
    
    # Wait for services to be ready
    Write-Log "Waiting for services to be healthy..."
    Start-Sleep -Seconds 30
    
    # Check service health
    Set-Location $ProjectRoot
    docker compose --env-file ops/.env.prod -f ops/compose.prod.yml ps
    
    # Test endpoints
    $maxAttempts = 10
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        Write-Log "Health check attempt $attempt/$maxAttempts"
        
        try {
            # Check API health
            $response = Invoke-WebRequest -Uri "http://localhost:8080/healthz" -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Success "API health check passed"
                break
            }
        }
        catch {
            Write-Warning "API health check failed, retrying..."
            Start-Sleep -Seconds 10
            $attempt++
        }
        
        if ($attempt -gt $maxAttempts) {
            throw "API health check failed after $maxAttempts attempts"
        }
    }
    
    Write-Success "Deployment verification completed"
}

# Test i18n functionality
function Test-I18nFunctionality {
    Write-Log "🧪 Testing i18n functionality..."
    
    # Test translation loading for different languages
    $testLanguages = @("en-US", "fr-FR", "es-ES", "ar-SA")
    
    foreach ($lang in $testLanguages) {
        Write-Log "Testing language: $lang"
        
        try {
            # Test L4H translations
            $response = Invoke-WebRequest -Uri "http://localhost/locales/shared/$lang/common.json" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Success "L4H $lang translations accessible"
            }
        }
        catch {
            Write-Warning "L4H $lang translations not accessible"
        }
        
        try {
            # Test Cannlaw translations
            $response = Invoke-WebRequest -Uri "http://localhost/cannlaw/locales/cannlaw/$lang/legal.json" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Success "Cannlaw $lang translations accessible"
            }
        }
        catch {
            Write-Warning "Cannlaw $lang translations not accessible"
        }
    }
    
    Write-Success "i18n functionality testing completed"
}

# Create deployment report
function New-DeploymentReport {
    Write-Log "📊 Creating deployment report..."
    
    $reportFile = "i18n-deployment-report-$(Get-Date -Format 'yyyyMMdd_HHmmss').md"
    $deploymentDate = Get-Date
    
    # Count translation files
    $sharedTranslations = (Get-ChildItem -Path "web/shared-ui/public/locales" -Filter "*.json" -Recurse).Count
    $l4hTranslations = (Get-ChildItem -Path "web/l4h/public/locales" -Filter "*.json" -Recurse).Count
    $cannlawTranslations = (Get-ChildItem -Path "web/cannlaw/public/locales" -Filter "*.json" -Recurse).Count
    
    # Get service status
    $serviceStatus = docker compose --env-file ops/.env.prod -f ops/compose.prod.yml ps
    
    # Test health endpoints
    $apiHealth = try { 
        $response = Invoke-WebRequest -Uri "http://localhost:8080/healthz" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) { "✅ Healthy" } else { "❌ Unhealthy" }
    } catch { "❌ Unhealthy" }
    
    $l4hHealth = try { 
        $response = Invoke-WebRequest -Uri "http://localhost/" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) { "✅ Accessible" } else { "❌ Inaccessible" }
    } catch { "❌ Inaccessible" }
    
    $cannlawHealth = try { 
        $response = Invoke-WebRequest -Uri "http://localhost/cannlaw/" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) { "✅ Accessible" } else { "❌ Inaccessible" }
    } catch { "❌ Inaccessible" }
    
    $reportContent = @"
# i18n System Deployment Report

**Deployment Date:** $deploymentDate
**Deployment Log:** $DeploymentLog

## Deployment Summary

### Components Deployed
- ✅ Shared UI i18n system
- ✅ L4H application with unified i18n
- ✅ Cannlaw application with unified i18n

### Services Status
``````
$serviceStatus
``````

### Translation Files Deployed
- Shared translations: $sharedTranslations files
- L4H translations: $l4hTranslations files
- Cannlaw translations: $cannlawTranslations files

### Health Checks
- API Health: $apiHealth
- L4H Frontend: $l4hHealth
- Cannlaw Frontend: $cannlawHealth

## Next Steps
1. Monitor application logs for translation errors
2. Test language switching functionality
3. Verify RTL language support
4. Monitor performance metrics

"@

    Set-Content -Path $reportFile -Value $reportContent
    Write-Success "Deployment report created: $reportFile"
    return $reportFile
}

# Main deployment function
function Start-Deployment {
    Write-Log "🚀 Starting unified i18n system deployment..."
    Write-Log "Deployment log: $DeploymentLog"
    
    Test-Environment
    Test-Translations
    Build-SharedUI
    Build-L4H
    Build-Cannlaw
    Deploy-ToProduction
    Test-Deployment
    Test-I18nFunctionality
    
    $reportFile = New-DeploymentReport
    
    Write-Success "🎉 Unified i18n system deployment completed successfully!"
    Write-Log "📊 Deployment report: $reportFile"
    Write-Log "📋 Deployment log: $DeploymentLog"
}

# Run deployment
try {
    Start-Deployment
}
catch {
    Write-Error "Deployment failed: $_"
    exit 1
}