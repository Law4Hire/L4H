# Time Tracking

_Last updated: 2025-08-31_

## Overview
Auto-start timer when opening a case; manual start supported (e.g., phone calls). **Idle prompt every 6 minutes**; round **up at stop**. Approval by Denise/Admins for internal reporting.

## API
- `POST /v1/time/start`
- `POST /v1/time/stop`
- `POST /v1/time/approve`

## Data Model
- **TimeEntry**: caseId, staffId, source{auto|manual}, start, stop, roundedMinutes, approvedBy?, approvedAt?.
- **AdminSettings**: rounding rules.
