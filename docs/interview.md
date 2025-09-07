# Interview & Recommendation

_Last updated: 2025-08-31_

## Overview
Visa recommendation via **AI + rules**. Client may **re-run** interview until an **appointment is scheduled**. Post-appointment changes to visa type require staff action and client approval.

## Decisions
- Persist Q/A trail for audit.
- Once appointment is scheduled, only legal staff can propose a **visa change**.
- **VisaChangeRequest** expires after **7 days** if client does not approve; staged deltas are auto-reverted and both parties notified.

## Flows
- Start: POST `/v1/interview/start`
- Answer step: POST `/v1/interview/answer`
- Re-run (until scheduled): POST `/v1/interview/rerun`
- Lock on schedule
- Staff proposes change: POST `/v1/cases/{id}/visa-change`
- Client approves: POST `/v1/visa-change/{reqId}/approve`

## Data Model
- **InterviewSession** with **InterviewQA** items.
- **VisaRecommendation**: userId, visaTypeId, lockedAt.
- **VisaChangeRequest**: caseId, oldVisaTypeId, newVisaTypeId, status {pending|approved|expired|rejected}, expiresAt=+7d, deltaAmount.
