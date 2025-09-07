# Law4Hire Web Frontend

This directory contains the complete web frontend architecture for Law4Hire, implementing TDD-first development with i18n support and integration with the existing backend.

## Architecture

### Monorepo Structure
```
web/
├── shared-ui/          # Shared React + TypeScript library
├── l4h/               # Client site (Law4Hire)
├── cannlaw/           # Staff/admin site (Cannlaw)
└── README.md          # This file

tests/
├── ui.e2e/            # C# xUnit + Microsoft.Playwright .NET
└── ui.wrap/           # C# xUnit wrappers to run Vitest from dotnet
```

## Prerequisites

- **Node.js 18+** and npm
- **.NET 8.0 SDK**
- **Docker** (for backend services)

## Quick Start

### 1. Install Dependencies

```bash
# Install shared UI dependencies
cd web/shared-ui
npm ci

# Install L4H client dependencies
cd ../l4h
npm ci

# Install Cannlaw admin dependencies
cd ../cannlaw
npm ci
```

### 2. Start Backend Services

```bash
# Start SQL Server and Upload Gateway
docker compose -f ops/compose.dev.yml up -d sqlserver upload-gateway

# Start the API
dotnet run --project src/api
```

### 3. Start Frontend Development Servers

```bash
# Terminal 1: L4H Client (http://localhost:5173)
cd web/l4h
npm run dev

# Terminal 2: Cannlaw Admin (http://localhost:5174)
cd web/cannlaw
npm run dev
```

### 4. (Optional) Start Caddy for Pretty Hostnames

```bash
# Terminal 3: Caddy proxy
caddy run --config ops/caddy/Caddyfile
```

Then access:
- **L4H Client**: http://l4h.localhost
- **Cannlaw Admin**: http://cannlaw.localhost

## Testing

### Run All Tests

```bash
# Run all .NET tests (including UI wrappers)
dotnet test

# Run only UI wrapper tests
dotnet test tests/ui.wrap

# Run E2E tests (requires running applications)
$env:E2E_UI=1; dotnet test tests/ui.e2e
```

### Run JavaScript Unit Tests

```bash
# Shared UI tests
cd web/shared-ui
npm run test:run

# L4H client tests
cd web/l4h
npm run test:run

# Cannlaw admin tests
cd web/cannlaw
npm run test:run
```

## Features

### ✅ Implemented

- **Shared UI Library** with i18n, auth, and API clients
- **L4H Client Application** with login and dashboard
- **Cannlaw Admin Application** with schedule, cases, and admin pages
- **TDD-First Development** with Vitest and Playwright .NET
- **Internationalization** with 21 culture support
- **Authentication** with JWT and remember-me cookies
- **API Integration** with existing backend endpoints
- **Vite Development Servers** with proxy configuration
- **Caddy Configuration** for local hostnames

### 🔄 In Progress

- Additional page implementations (pricing, appointments, messages, uploads)
- Enhanced error handling and loading states
- Mobile responsiveness improvements

## API Integration

Both applications integrate with the existing backend:

- **API Base URL**: http://localhost:8765
- **Upload Gateway**: http://localhost:7070
- **Authentication**: JWT with remember-me cookies
- **Internationalization**: `/v1/i18n/supported` and `/v1/i18n/culture`

## Development

### Adding New Pages

1. Create the page component in `src/pages/`
2. Add route to `App.tsx`
3. Add i18n keys to `src/i18n.ts`
4. Write Vitest tests
5. Update navigation if needed

### Adding New API Endpoints

1. Add method to `ApiClient` in `shared-ui/src/Api.ts`
2. Add TypeScript interfaces for request/response types
3. Use in page components with proper error handling

### Internationalization

1. Add keys to both English and Spanish in `src/i18n.ts`
2. Use `useTranslation()` hook in components
3. Test with language switcher

## Troubleshooting

### Common Issues

**Login redirects loop**: Ensure API sets remember-me cookie and `remember()` is called on app init.

**i18n list is empty**: Verify `/v1/i18n/supported` CORS and dropdown uses `displayName`.

**Caddy can't bind l4h.localhost**: Ensure no conflicting entries and ports 5173/5174 are open.

**Tests fail**: Make sure all dependencies are installed with `npm ci` in each directory.

### Port Conflicts

- L4H Client: 5173
- Cannlaw Admin: 5174
- API: 8765
- Upload Gateway: 7070

If ports are in use, modify `vite.config.ts` files to use different ports.

## Production Deployment

This setup is designed for development. For production:

1. Build applications: `npm run build`
2. Configure production Caddy with proper SSL
3. Set up proper environment variables
4. Configure production API endpoints
5. Set up CI/CD pipelines for automated testing

## Contributing

1. Write tests first (TDD approach)
2. Use i18n for all user-facing strings
3. Follow existing code patterns
4. Ensure all tests pass before submitting
5. Update documentation as needed
