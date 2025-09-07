#!/usr/bin/env pwsh

Write-Host "Starting L4H API development server..." -ForegroundColor Green

# Change to API directory
Set-Location -Path "src/api"

# Restore dependencies
Write-Host "Restoring dependencies..." -ForegroundColor Yellow
dotnet restore

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to restore dependencies" -ForegroundColor Red
    exit 1
}

# Build the project
Write-Host "Building project..." -ForegroundColor Yellow
dotnet build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed" -ForegroundColor Red
    exit 1
}

# Run the project
Write-Host "Starting API server..." -ForegroundColor Yellow
dotnet run