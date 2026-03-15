# Specification: Strip out multilingual components to enforce English ONLY

## Goal
Remove all multilingual and localization components across the application and testing suite to enforce an English-only experience, reducing complexity and maintenance overhead.

## Scope
- Remove references to RTL, CJK, and other languages from E2E testing scripts (e.g., `package.json` test scripts).
- Remove localization dictionaries or multi-language support configurations in the React application (e.g., i18next).
- Remove any backend API endpoints, database columns, or middleware dedicated to resolving user language preferences.

## Requirements
- The application must default to and only support English (`en-US`).
- All tests specific to other languages must be removed.
- Dependency on translation libraries must be removed if no longer necessary.