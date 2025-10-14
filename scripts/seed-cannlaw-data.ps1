#!/usr/bin/env pwsh

# Script to run Cannlaw Client Billing System database migration and seeding

Write-Host "Starting Cannlaw Client Billing System database setup..." -ForegroundColor Green

# Navigate to the infrastructure project directory
$infraPath = Join-Path $PSScriptRoot ".." "src" "infrastructure"
Push-Location $infraPath

try {
    # Check if migration exists and apply it
    Write-Host "Checking database migration status..." -ForegroundColor Yellow
    dotnet ef database update --verbose
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Database migration failed!"
        exit 1
    }
    
    Write-Host "Database migration completed successfully!" -ForegroundColor Green
    
    # Note: The seeding will be handled by the application startup
    # or through a separate seeding endpoint/command
    Write-Host "Database is ready. Run the application to execute seeding." -ForegroundColor Green
    
} catch {
    Write-Error "An error occurred: $_"
    exit 1
} finally {
    Pop-Location
}

Write-Host "Cannlaw Client Billing System database setup completed!" -ForegroundColor Green