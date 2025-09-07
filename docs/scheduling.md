# Scheduling

_Last updated: 2025-08-31_

## Overview
Scheduling uses Exchange calendars via Microsoft Graph, manual blocks, and a **30-minute buffer after** each appointment. Payment gating for scheduling is **TBD (client decision)**.

## Decisions
- Reschedules: max **2** per side → escalation to Admin.
- No-show: default **1 grace**; Admin-configurable to 1/2/3 or fee.
- Time zones: client sees **client TZ**; staff see **their TZ**.

## Flows
- Create appointment: POST `/v1/appointments` → Graph write to Outlook.
- Staff reschedule: POST `/v1/appointments/{id}/reschedule` with **3 options** → client chooses.
- Client reschedule request: create request → staff proposes **3 options** → client chooses via POST `/v1/appointments/{id}/options/choose`.

## Data Model
- **Appointment**: caseId, staffId, start, end, timezoneUser, timezoneStaff, status, rescheduleCountUser, rescheduleCountStaff.
- **RescheduleProposal**: appointmentId, proposer{staff|client}, options[3], expiresAt, chosenOption.
- **AvailabilityBlock**: staffId, start, end, source{manual|exchange}, reason.
