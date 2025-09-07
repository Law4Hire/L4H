# Cases

_Last updated: 2025-08-31_

## Overview
Case is created immediately after password creation. Status reflects payment/consultation progress and lifecycle.

## Statuses
- **pending**: no consultation and no payment.
- **paid**: payment done, consult not yet completed.
- **active**: consult completed and paid.
- **inactive**: auto or admin; auto when **30 days** pass with no activity.
- **closed**: process finished successfully.
- **denied**: application denied / being redone.

## Assignment
- Auto-assigned to available professional; Admins may reassign after first video.

## Activity & Aging
- Background job sets **inactive** after **30 days** since last activity (message, payment, scheduling, upload, etc.).

## Data Model
- **Case**: userId, status, lastActivityAt, visaTypeId?, packageId?, assignedStaffId?, recommendationId?
