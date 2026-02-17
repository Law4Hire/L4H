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
/docs                     # Documentation
/src/api                  # ASP.NET Core API
/src/shared               # Shared domain library
/src/infrastructure       # Infrastructure services
/web/l4h                  # L4H client application
/web/cannlaw              # Cannlaw staff application
/web/shared-ui            # Shared UI components and i18n system
/ops                      # DevOps configuration
/tests                    # Test suites (API, UI, E2E)
/.github/workflows        # CI/CD
```

## Internationalization (i18n)

The platform supports 21 languages with comprehensive RTL support, robust error handling, and performance optimization.

### Supported Languages
- **Latin Script**: English, Spanish, French, German, Portuguese, Italian, Polish, Indonesian, Turkish, Vietnamese
- **RTL Languages**: Arabic, Urdu
- **Asian Languages**: Chinese, Japanese, Korean, Hindi, Bengali, Tamil, Telugu, Marathi
- **Cyrillic**: Russian

### Documentation
- **[i18n System Overview](web/shared-ui/I18N_SYSTEM_README.md)** - Complete system documentation
- **[Developer Guide](web/shared-ui/I18N_DEVELOPER_GUIDE.md)** - Development documentation
- **[User Guide](web/shared-ui/MULTILINGUAL_USER_GUIDE.md)** - User documentation
- **[Troubleshooting](web/shared-ui/I18N_TROUBLESHOOTING_GUIDE.md)** - Common issues and solutions

### Quick Start
```bash
# Run multilingual tests
npm run test:multilingual

# Validate translations
npm run validate-translations

# Add new language
npm run add-language -- --language pt-PT --name "Portuguese"
```
