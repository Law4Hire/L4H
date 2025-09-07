# Guardians & Minors

_Last updated: 2025-08-31_

## Overview
Children may link up to **two** guardians (parents). Linking is **child-initiated only**; guardians cannot add children.

## Decisions
- Scope: Guardians see **all** child case data (messages, documents, invoices, recordings).
- Attestation: Guardian must **digitally attest** they are the child's parent.
- Turning 18: Email the child on birthday; include link to **remove guardians**.

## Flows
- Child invites guardian → POST `/v1/guardians/invite` (email).
- Guardian attests/signs → POST `/v1/guardians/attest` → link activated.
- On 18th birthday → email with one-click removal link → POST `/v1/guardians/remove`.

## Data Model
- **GuardianLink**: childUserId, guardianUserId, scope=Full, attestationId, status, createdAt.
