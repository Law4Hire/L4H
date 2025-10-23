# L4H Development Environment Diagnostic Script

Write-Host "🔍 L4H Development Environment Diagnostics" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# Check current directory
$currentDir = Get-Location
Write-Host "📁 Current Directory: $currentDir" -ForegroundColor White

# Check for L4H directory
Write-Host ""
Write-Host "🔍 Checking for L4H project structure..." -ForegroundColor Yellow

$l4hPaths = @("web/l4h", "l4h", "./web/l4h")
$foundL4H = $false

foreach ($path in $l4hPaths) {
    if (Test-Path $path) {
        Write-Host "✅ Found L4H at: $path" -ForegroundColor Green
        $foundL4H = $true
        $l4hPath = $path
        break
    }
}

if (-not $foundL4H) {
    Write-Host "❌ L4H directory not found in any expected location" -ForegroundColor Red
    Write-Host "Expected locations:" -ForegroundColor Yellow
    foreach ($path in $l4hPaths) {
        Write-Host "  - $path" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "Please navigate to the correct directory and run again" -ForegroundColor Yellow
    exit 1
}

# Navigate to L4H directory for further checks
Push-Location $l4hPath

Write-Host ""
Write-Host "📋 L4H Project Files Check:" -ForegroundColor Yellow

# Check essential files
$essentialFiles = @(
    "package.json",
    "vite.config.ts", 
    "index.html",
    "src/main.tsx",
    "src/App.tsx"
)

foreach ($file in $essentialFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file (MISSING)" -ForegroundColor Red
    }
}

# Check node_modules
Write-Host ""
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules directory exists" -ForegroundColor Green
    
    # Check specific important packages
    $importantPackages = @("react", "react-dom", "vite", "@l4h/shared-ui")
    Write-Host "📦 Key Dependencies:" -ForegroundColor Yellow
    
    foreach ($package in $importantPackages) {
        if (Test-Path "node_modules/$package") {
            Write-Host "✅ $package" -ForegroundColor Green
        } else {
            Write-Host "❌ $package (MISSING)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ node_modules directory missing" -ForegroundColor Red
    Write-Host "   Run 'npm install' to install dependencies" -ForegroundColor Yellow
}

# Check shared-ui
Write-Host ""
Write-Host "🔗 Shared-UI Check:" -ForegroundColor Yellow
if (Test-Path "../shared-ui") {
    Write-Host "✅ shared-ui directory found" -ForegroundColor Green
    
    Push-Location "../shared-ui"
    if (Test-Path "dist") {
        Write-Host "✅ shared-ui is built (dist folder exists)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  shared-ui not built (no dist folder)" -ForegroundColor Yellow
        Write-Host "   Run 'npm run build' in shared-ui directory" -ForegroundColor Yellow
    }
    Pop-Location
} else {
    Write-Host "❌ shared-ui directory not found" -ForegroundColor Red
}

# Check for TypeScript errors
Write-Host ""
Write-Host "🔧 TypeScript Check:" -ForegroundColor Yellow
try {
    $tscOutput = & npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ No TypeScript errors" -ForegroundColor Green
    } else {
        Write-Host "❌ TypeScript errors found:" -ForegroundColor Red
        Write-Host $tscOutput -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Could not run TypeScript check" -ForegroundColor Yellow
}

# Check port availability
Write-Host ""
Write-Host "🌐 Port Check:" -ForegroundColor Yellow
$portInUse = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "⚠️  Port 5173 is in use" -ForegroundColor Yellow
    $processes = Get-NetTCPConnection -LocalPort 5173 | Select-Object -ExpandProperty OwningProcess -Unique
    Write-Host "   Processes using port: $($processes -join ', ')" -ForegroundColor Gray
} else {
    Write-Host "✅ Port 5173 is available" -ForegroundColor Green
}

# Summary and recommendations
Write-Host ""
Write-Host "📋 SUMMARY & RECOMMENDATIONS:" -ForegroundColor Cyan
Write-Host "=" * 40 -ForegroundColor Cyan

if (-not (Test-Path "node_modules")) {
    Write-Host "1. Install dependencies: npm install" -ForegroundColor Yellow
}

if (-not (Test-Path "../shared-ui/dist")) {
    Write-Host "2. Build shared-ui: cd ../shared-ui && npm run build" -ForegroundColor Yellow
}

if ($portInUse) {
    Write-Host "3. Kill processes on port 5173 or use different port" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 To start the development server:" -ForegroundColor Green
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Expected URL: http://localhost:5173" -ForegroundColor Cyan

Pop-Location