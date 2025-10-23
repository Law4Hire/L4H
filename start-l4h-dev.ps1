# L4H Development Server Startup Script
# This script will start the L4H development server with proper error handling

Write-Host "🚀 Starting L4H Development Server..." -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
$currentDir = Get-Location
Write-Host "Current directory: $currentDir" -ForegroundColor Cyan

# Navigate to L4H directory
if (Test-Path "web/l4h") {
    Write-Host "✅ Found web/l4h directory" -ForegroundColor Green
    Set-Location "web/l4h"
} elseif (Test-Path "l4h") {
    Write-Host "✅ Found l4h directory" -ForegroundColor Green
    Set-Location "l4h"
} elseif ((Split-Path -Leaf $currentDir) -eq "l4h") {
    Write-Host "✅ Already in l4h directory" -ForegroundColor Green
} else {
    Write-Host "❌ Cannot find L4H directory. Please run this script from:" -ForegroundColor Red
    Write-Host "   - Project root (where web/l4h exists)" -ForegroundColor Yellow
    Write-Host "   - Or from web/l4h directory directly" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📁 Working directory: $(Get-Location)" -ForegroundColor Cyan

# Check if package.json exists
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found in current directory" -ForegroundColor Red
    Write-Host "Please ensure you're in the correct L4H project directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found package.json" -ForegroundColor Green

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✅ Found node_modules" -ForegroundColor Green
}

# Build shared-ui if needed
Write-Host ""
Write-Host "🔧 Building shared-ui package..." -ForegroundColor Cyan
if (Test-Path "../shared-ui") {
    Push-Location "../shared-ui"
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to build shared-ui" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Write-Host "✅ shared-ui built successfully" -ForegroundColor Green
    Pop-Location
} else {
    Write-Host "⚠️  shared-ui directory not found, skipping build" -ForegroundColor Yellow
}

# Check for port conflicts
Write-Host ""
Write-Host "🔍 Checking for port conflicts on 5173..." -ForegroundColor Cyan
$portInUse = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "⚠️  Port 5173 is already in use" -ForegroundColor Yellow
    Write-Host "Attempting to kill processes on port 5173..." -ForegroundColor Yellow
    
    # Try to kill processes using the port
    $processes = Get-NetTCPConnection -LocalPort 5173 | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($processId in $processes) {
        try {
            Stop-Process -Id $processId -Force
            Write-Host "✅ Killed process $processId" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Could not kill process $processId" -ForegroundColor Yellow
        }
    }
    
    Start-Sleep -Seconds 2
} else {
    Write-Host "✅ Port 5173 is available" -ForegroundColor Green
}

# Start the development server
Write-Host ""
Write-Host "🌐 Starting Vite development server..." -ForegroundColor Green
Write-Host "The site will be available at: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Run the dev server
npm run dev