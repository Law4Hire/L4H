# Messaging & Notifications

_Last updated: 2025-08-31_

## Overview
In-app case threads with read receipts. Outbound email via **generic/anonymous mailbox** using Microsoft Graph (configurable in Admin). Replies are ingested to keep a single thread.

## Decisions
- Daily email digest: **≤1 email/day/user**; aggregate events into one message.
- Desktop/mobile push notifications supported (web push + native OS).

## API
- `POST /v1/messages` (compose; send via mailbox; persist in thread)
- `POST /v1/messages/ingest-graph` (ingest replies via Graph delta)
- Daily digest job composes and sends one email/day.

## Data Model
- **MessageThread/Message**: caseId, participants, channel{in-app|email}, readReceipts, exchangeMessageId.
- **DailyDigestQueue**: userId, items[], lastSentAt.
