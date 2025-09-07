# Payments & Invoices

_Last updated: 2025-08-31_

## Overview
Stripe for payments and refunds. Invoices are sequential and emailed as PDFs. A signed **intakeGuid** (10m TTL) enables handoff to Cannlaw checkout.

## Decisions
- Invoice numbering: `INV-{YYYY}-{####}` (sequential per year).
- Line items include: package, FX/conversion surcharge, taxes/fees, and **delta** items for visa changes.
- Refunds for visa-type changes: **Admin approval** required; Stripe executes after approval.
- Stripe webhooks: idempotent handling; masked payload logging.

## Flows
- Create invoice: POST `/v1/invoices`
- Stripe checkout session: POST `/v1/payments/stripe/session`
- Webhook processing: POST `/v1/payments/stripe/webhook`
- Refund: POST `/v1/refunds/{paymentId}` (admin-gated)

## Data Model
- **Invoice**: number, caseId, total, currency=USD, pdfUrl, lineItems[] (type {package|fx|tax|delta|refund}), stripeInvoiceId.
- **Payment**: invoiceId, stripePaymentIntentId, status, amount, timestamps.
- **Refund**: paymentId, amount, status, reason, approvedBy, approvedAt.
- **IntakeLink**: guid, userId, expiresAt(10m), signature.
