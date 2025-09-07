# 🧪 Testing & Quality Strategy

## Overview

This document outlines the testing approach for all modules.

## Strategy

- TDD-first for all new code
- Unit + integration tests
- Snapshot testing for React components
- API contract tests via Postman / Swagger

## Tools

- xUnit (.NET)
- Jest (React)
- Detox (React Native)
- Docker-based test environments

## Coverage Goals

| Layer        | Target Coverage |
|--------------|------------------|
| Backend      | 90%+             |
| Frontend     | 85%+             |
| Mobile       | 80%+             |

## Next Steps

- Spin up SQL Server container for integration tests:
  ```bash
  docker-compose up -d sqlserver
  ```
- Set up CI pipeline
- Write baseline tests for intake module
- Begin coverage tracking