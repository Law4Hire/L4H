# Audit & Retention

_Last updated: 2025-08-31_

## Overview
Comprehensive auditing with category filters and CSV/JSON export (Admins only). Retention enforces masking/deletion per data type.

## Decisions
- Retention: **PII/messages: 1y**; **recordings/worklogs: 2y**; **medical: 60d**; **high-sensitivity (SSN, blood type, etc.): 30d**.
- Mask high-sensitivity fields at cutoff; keep metadata and hashes.
- Export allowed for Admins.

## Categories (filterable)
auth, profile, interview, pricing, payment, schedule, docs, messaging, meeting, time, case, admin

## Data Model
- **AuditLog**: category, actor, targetType/id, before/after hashes, ip, userAgent, payloadRef (masked), createdAt.

## Jobs
- Mask/purge per schedule (per category & data class).
- Recording cleanup at 2 years.
