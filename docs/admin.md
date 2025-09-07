# Admin

_Last updated: 2025-08-31_

## Overview
Admin console for pricing, packages, mailbox config, no-show policy, scraping cadence, workflow review, audit export, and case reassignment.

## Settings
- Generic mailbox (Graph) & sender address.
- No-show policy: grace count (default **1**), optional fee (amount).
- Appointment buffer: **+30 minutes after**.
- Time rounding: **round up at stop**.
- Scraping cadence: every **3 days**.
- Retention windows (per policy).

## Screens
- **Pricing Editor**: per visa type; edit package prices, mark visa types inactive (hide unless filtered).
- **Workflow Review**: filter by visa type and/or country; see diffs since last scrape; approve updates (version bump).
- **Refund Approvals**: list delta refunds; approve to trigger Stripe refund.
- **Audit Logs**: category filters, sort, export CSV/JSON.
- **Case Management**: reassign cases; manage staff availability blocks.

## Data
- **AdminSettings**: mailbox, no-show, buffer, rounding, scraping cadence, retention.
- **WorkflowVersion**: visaTypeId, countryCode, version, approvedBy, approvedAt, notes.
