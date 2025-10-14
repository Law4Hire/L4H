#!/usr/bin/env pwsh

# Script to validate Cannlaw Client Billing System setup

Write-Host "Validating Cannlaw Client Billing System setup..." -ForegroundColor Green

# Navigate to the API project directory
$apiPath = Join-Path $PSScriptRoot ".." "src" "api"
Push-Location $apiPath

try {
    # Check if the application can start (compile check)
    Write-Host "Checking application compilation..." -ForegroundColor Yellow
    dotnet build --configuration Release --no-restore --verbosity quiet
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Application compilation failed!"
        exit 1
    }
    
    Write-Host "✓ Application compiles successfully" -ForegroundColor Green
    
    # Check if Entity Framework can generate migration script
    Write-Host "Checking Entity Framework migration..." -ForegroundColor Yellow
    $infraPath = Join-Path $PSScriptRoot ".." "src" "infrastructure"
    Push-Location $infraPath
    
    try {
        dotnet ef migrations list --no-build 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Entity Framework migrations are valid" -ForegroundColor Green
        } else {
            Write-Warning "Entity Framework migrations may have issues"
        }
    } catch {
        Write-Warning "Could not validate Entity Framework migrations: $_"
    } finally {
        Pop-Location
    }
    
    Write-Host "Validation completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run 'dotnet ef database update' to apply migrations" -ForegroundColor White
    Write-Host "2. Start the application to execute seeding" -ForegroundColor White
    Write-Host "3. Login with admin@cannlaw.com / Admin123! to test admin features" -ForegroundColor White
    
} catch {
    Write-Error "Validation failed: $_"
    exit 1
} finally {
    Pop-Location
}