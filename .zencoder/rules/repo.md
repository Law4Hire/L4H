---
description: Repository Information Overview
alwaysApply: true
---

# L4H Platform Repository Information

## Repository Summary
Modern legal services platform built with .NET 9, React, and TypeScript. The system is containerized with Docker and uses SQL Server 2022 for data storage. The platform consists of a backend API, web clients, and supporting services.

## Repository Structure
- **src/api**: ASP.NET Core API backend (.NET 9)
- **src/infrastructure**: Data access and shared infrastructure
- **src/shared**: Shared domain models and utilities
- **src/scraper**: Worker service for scraping legal information
- **src/upload-gateway**: File upload service
- **web/l4h**: Main client application (React/TypeScript)
- **web/cannlaw**: Admin client application (React/TypeScript)
- **web/shared-ui**: Shared UI components library
- **tests**: Test projects for all components
- **ops**: DevOps configuration and deployment scripts
- **docs**: Project documentation
- **SpecSQL**: SQL scripts for database setup

## Projects

### Backend API
**Configuration File**: src/api/L4H.Api.csproj

#### Language & Runtime
**Language**: C#
**Version**: .NET 9.0
**Build System**: MSBuild/dotnet CLI
**Package Manager**: NuGet

#### Dependencies
**Main Dependencies**:
- Microsoft.AspNetCore.Authentication.JwtBearer (9.0.8)
- Microsoft.AspNetCore.OpenApi (9.0.0)
- Microsoft.EntityFrameworkCore (9.0.8)
- Microsoft.Graph (5.91.0)
- Serilog.AspNetCore (8.0.3)
- Swashbuckle.AspNetCore (7.0.0)

#### Build & Installation
```bash
dotnet restore
dotnet build src/api/L4H.Api.csproj
```

#### Docker
**Dockerfile**: src/api/Dockerfile
**Image**: Custom build
**Configuration**: Exposed on port 8080, requires SQL Server connection

#### Testing
**Framework**: xUnit
**Test Location**: tests/api.tests, tests/L4H.Api.Tests
**Run Command**:
```bash
dotnet test tests/api.tests
```

### Infrastructure Library
**Configuration File**: src/infrastructure/L4H.Infrastructure.csproj

#### Language & Runtime
**Language**: C#
**Version**: .NET 9.0
**Build System**: MSBuild/dotnet CLI

#### Dependencies
**Main Dependencies**:
- Microsoft.EntityFrameworkCore.SqlServer (9.0.8)
- Microsoft.Extensions.Hosting.Abstractions (9.0.8)
- Microsoft.Extensions.Localization.Abstractions (9.0.8)

### Scraper Service
**Configuration File**: src/scraper/L4H.ScraperWorker.csproj

#### Language & Runtime
**Language**: C#
**Version**: .NET 9.0
**Build System**: MSBuild/dotnet CLI

#### Dependencies
**Main Dependencies**:
- Microsoft.Extensions.Hosting (9.0.8)
- AngleSharp (1.1.2)
- System.Security.Cryptography.Algorithms (4.3.1)

#### Docker
**Dockerfile**: src/scraper/Dockerfile
**Configuration**: Background worker service with configurable intervals

### Upload Gateway
**Configuration File**: src/upload-gateway/L4H.UploadGateway.csproj

#### Language & Runtime
**Language**: C#
**Version**: .NET 9.0
**Build System**: MSBuild/dotnet CLI

#### Dependencies
**Main Dependencies**:
- Microsoft.AspNetCore.OpenApi (9.0.0)
- Swashbuckle.AspNetCore (7.1.0)

#### Docker
**Dockerfile**: src/upload-gateway/Dockerfile
**Configuration**: Exposed on port 7070, handles secure file uploads

### L4H Web Client
**Configuration File**: web/l4h/package.json

#### Language & Runtime
**Language**: TypeScript
**Version**: TypeScript 5.3.3
**Build System**: Vite 7.1.5
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- React 18.2.0
- React Router 6.20.1
- React Query 5.8.4
- i18next 25.5.2
- zod 3.22.4
- @l4h/shared-ui (local package)

**Development Dependencies**:
- Vite 7.1.5
- Vitest 3.2.4
- TypeScript 5.3.3
- Tailwind CSS 3.3.6
- ESLint 8.54.0

#### Build & Installation
```bash
cd web/l4h
npm install
npm run build
```

#### Docker
**Dockerfile**: web/l4h/Dockerfile
**Configuration**: Static site served via Caddy

#### Testing
**Framework**: Vitest
**Test Location**: web/l4h/src/**/*.test.tsx
**Run Command**:
```bash
cd web/l4h
npm run test:run
```

### CannLaw Admin Client
**Configuration File**: web/cannlaw/package.json

#### Language & Runtime
**Language**: TypeScript
**Version**: TypeScript 5.3.3
**Build System**: Vite 7.1.5
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- React 18.2.0
- React Router 6.20.1
- React Query 5.8.4
- i18next 25.5.2
- @l4h/shared-ui (local package)

#### Build & Installation
```bash
cd web/cannlaw
npm install
npm run build
```

#### Docker
**Dockerfile**: web/cannlaw/Dockerfile
**Configuration**: Static site served via Caddy

#### Testing
**Framework**: Vitest
**Test Location**: web/cannlaw/src/**/*.test.tsx
**Run Command**:
```bash
cd web/cannlaw
npm run test:run
```

### Shared UI Library
**Configuration File**: web/shared-ui/package.json

#### Language & Runtime
**Language**: TypeScript
**Version**: TypeScript 5.3.3
**Build System**: TypeScript compiler
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- React 18.2.0
- React Router 6.20.1
- React Query 5.87.1
- i18next 23.7.6

#### Build & Installation
```bash
cd web/shared-ui
npm install
npm run build
```

## DevOps Configuration

### Docker Compose
**Development**: ops/compose.dev.yml
**Production**: ops/compose.prod.yml
**Services**:
- sqlserver: SQL Server 2022
- api: Backend API
- scraper: Data scraper service
- upload-gateway: File upload service

### CI/CD
**Workflow**: .github/workflows/ci.yml
**Steps**:
- Build and test .NET projects
- Build Docker images
- Run unit and integration tests
- Run E2E tests with Playwright