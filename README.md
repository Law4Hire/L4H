# L4H Platform

Modern legal services platform built with .NET 9, containerized with Docker, and reverse-proxied by Caddy.

## Stack

- **API**: ASP.NET Core Minimal API (.NET 9)
- **Database**: SQL Server 2022
- **Reverse Proxy**: Caddy
- **Containerization**: Docker Compose

## Quick Start

### Prerequisites

 - .NET 9 SDK
- Docker & Docker Compose
- SQL Server 2022 (separate host)

### Local Development

1. Clone and restore dependencies:
   ```bash
   dotnet restore
   ```

2. Set up environment variables:
   ```bash
   cp ops/env/.env.sample .env
   # Edit .env with your SQL Server connection string
   ```

3. Run the API locally:
   ```bash
   # Windows
   ./ops/scripts/dev-run.ps1
   
   # Unix
   ./ops/scripts/dev-run.sh
   ```

4. Or run with Docker Compose:
   ```bash
   docker compose -f ops/compose.dev.yml up
   ```

### Endpoints

- Health Check: `GET /healthz`
- API Ping: `GET /v1/ping`
- Swagger UI: `/swagger` (Development only)

## Testing

```bash
# Ensure SQL Server container is running for integration tests:
docker-compose up -d sqlserver

dotnet test
```

## Project Structure

```
/Docs                     # Documentation
/src/api                  # ASP.NET Core API
/src/shared               # Shared domain library
/ops                      # DevOps configuration
/tests/api.tests          # API tests
/.github/workflows        # CI/CD
```