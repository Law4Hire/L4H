# Video Meetings

_Last updated: 2025-08-31_

## Overview
**Teams-first** video with the legal professional as host, **waiting room ON**, **recording ON** by default. One-time consent stored in the Case. Recordings and transcripts use **local storage** with auto-purge after **2 years**.

## API
- `POST /v1/meetings` (create; store consent if needed)
- Meeting links displayed per appointment.
- Background purge job deletes recordings/transcripts at retention.

## Data Model
- **Meeting/Recording**: caseId, provider=Teams, meetingId/link, waitingRoom=true, recording=true, consentAt, storageUrl, transcriptUrl, purgeAt.
