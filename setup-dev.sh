#!/bin/bash

# Development setup script for L4H Scraper + Workflow System
echo "Setting up L4H development environment..."

# Start services using docker-compose
echo "Starting SQL Server..."
docker-compose up -d sqlserver

# Wait for SQL Server to be ready
echo "Waiting for SQL Server to be ready..."
sleep 20

# Run migrations
echo "Running migrations..."
export ConnectionStrings__DefaultConnection="Server=localhost,14333;Database=L4H;User Id=sa;Password=SecureTest123!;TrustServerCertificate=True;"
export ADMIN_SEED_PASSWORD="SecureTest123!"
export ASPNETCORE_ENVIRONMENT="Development"
export Logging__LogLevel__Default="Information"

dotnet ef database update --project src/infrastructure --startup-project src/api

# Start API and Scraper
echo "Starting API and Scraper services..."
docker-compose up -d api scraper

echo "Development environment setup complete!"
echo ""
echo "Services available:"
echo "- API: http://localhost:5000"
echo "- SQL Server: localhost:14333 (sa/SecureTest123!)"
echo ""
echo "To run tests:"
echo "dotnet test"
echo ""
echo "To stop all services:"
echo "docker-compose down"
echo ""
echo "Manual test commands:"
echo ""
echo "# Test scraper (should create drafts with fake data):"
echo "curl -X POST http://localhost:5000/v1/admin/scraper/run"
echo ""
echo "# Get pending workflows for admin review:"
echo "curl http://localhost:5000/v1/admin/workflows/pending"
echo ""
echo "# Lookup approved workflow (after approval):"
echo "curl 'http://localhost:5000/v1/workflows?visaType=H1B&country=ES'"