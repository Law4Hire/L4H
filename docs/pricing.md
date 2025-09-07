# Pricing

_Last updated: 2025-08-31_

## Overview
Pricing combines **visa type × package × country**. Currency is USD; Stripe may apply FX conversion fees.

## Decisions
- Package tiers (examples): Self + Review; Legal Assistant Managed; Lawyer Completed; Guaranteed.
- Line items: base package price, FX/conversion surcharge, taxes/fees, **delta** for visa-type changes.
- Potential modifiers for prior denials/unlawful presence are **client-decision TBD**.

## API
- `GET /v1/pricing?visaType&country`
- `POST /v1/cases/{id}/package`

## Data
- **Package**
- **PricingRule**: visaTypeId, packageId, countryCode, basePrice, fxSurchargeMode, taxRate, active.
