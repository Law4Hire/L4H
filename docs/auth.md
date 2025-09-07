# Auth

_Last updated: 2025-08-31_

## Overview
Authentication & session management for Law4Hire (web/mobile) and Cannlaw (web). Uses shared SQL Server 2022. Email verification will be enabled in a late phase.

## Decisions
- Password policy: **8/3/4** (min 8 chars; must include at least 3 of 4: lower, upper, digit, special). Feature-flag fallback to **min 8 + ≥1 special** if any jurisdiction requires it.
- Remember-me: **90 days**, refreshed on each successful login.
- Forgot Password: email reset link, token TTL **60 minutes**.
- Cross-site payment handoff: signed **intakeGuid**, **10-minute TTL**; expired links instruct users to restart from Law4Hire/US Immigration Help.
- Email verification: deferred til later; flows stubbed but not enforced.

## Flows

### Sign Up
1. POST `/v1/auth/signup` with email & password meeting policy.
2. Create **User**; create **Case** immediately after password set.
3. (Later) send verification email.

### Login
- POST `/v1/auth/login` → session tokens + optional **remember-me** cookie (90d). Refresh remember-me on each login.
- Rotate tokens on password reset.

### Forgot Password
1. POST `/v1/auth/forgot` → send reset email with token (TTL 60m).
2. POST `/v1/auth/reset` with token + new password → invalidate existing remember-me tokens.

## Data Model (auth-related)
- **User**: email, passwordHash, emailVerified(bool), rememberMeTokens[], passwordUpdatedAt, lockout counters.
- **PasswordResetToken**: userId, token, expiresAt(60m), usedAt.

## Security Notes
- Enforce 8/3/4; allow fallback by feature flag per-jurisdiction.
- Store password hashes with modern KDF (Argon2id or PBKDF2 with high iteration count).
- Rate-limiting not enforced during closed testing; toggleable later.
