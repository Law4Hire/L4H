# CitizenPath Eligibility Workflow & Validation Report

## Overview
CitizenPath is a premier DIY immigration software platform designed to simplify the complex USCIS forms process. Their validation workflow relies on a form-first, intent-driven wizard. Instead of broadly asking "What do you want to do?", CitizenPath breaks down its paths by **Specific Immigration Goals** (e.g., Renew a Green Card, Apply for Citizenship, Petition for a Relative) and routes users into **Form-Specific Eligibility Quizzes** prior to payment or data collection.

This approach guarantees that a user is fully qualified for a specific legal path (and its associated USCIS form) before they spend time filling out their biographical data.

## Core Workflow Methodology
1. **Goal Selection:** The user selects a broad goal (e.g., "Citizenship", "Family Sponsorship", "Adjustment of Status").
2. **Form Pairing:** The system pairs that goal with a specific USCIS Form (e.g., N-400, I-130, I-485).
3. **Red-Flag Qualification (The Eligibility Quiz):** Before starting the actual form, the user must pass a rapid-fire quiz containing 5-15 "knock-out" questions.
4. **Approval & Onboarding:** If no red flags are hit, the user receives an "Eligible" status and proceeds to data entry. If a red flag is hit, the flow halts, providing an explanation of *why* they are ineligible and recommending they consult an attorney.

---

## 1. Naturalization & Citizenship (Form N-400)
**Goal:** Become a U.S. Citizen.

### Clarification & Validation Questions:
*   **Age Check:** Are you at least 18 years old? *(Must be Yes)*
*   **Residency Status:** Are you a Lawful Permanent Resident (Green Card holder)? *(Must be Yes)*
*   **Duration of Status:** Have you been a Permanent Resident for at least 5 years? (Or 3 years if married to a U.S. citizen?)
*   **Physical Presence:** Have you been physically present in the U.S. for at least 30 months out of the 5 years?
*   **Continuous Residence:** Have you taken any trips outside the U.S. lasting longer than 6 months? *(If Yes, potential break in continuous residence - triggers attorney warning).*
*   **Good Moral Character:** Have you ever been arrested, cited, or detained by law enforcement? *(If Yes, triggers an advanced questionnaire or attorney warning).*
*   **Tax Compliance:** Have you ever failed to file a required federal, state, or local tax return?

---

## 2. Family-Based Sponsorship (Form I-130)
**Goal:** Petition for an alien relative to immigrate to the U.S.

### Clarification & Validation Questions:
*   **Sponsor Status:** Are you a U.S. Citizen or a Lawful Permanent Resident? *(Must be Yes)*
*   **Relationship Type:** Who are you petitioning for? (Spouse, Child, Parent, Sibling)
    *   *Validation:* Permanent Residents can only petition for Spouses and Unmarried Children. U.S. Citizens can petition for Parents, Siblings, and Married Children. If a PR selects "Sibling", they are immediately halted.
*   **Age of Sponsor:** Are you at least 21 years old? *(Required for sibling or parent petitions).*
*   **Location of Relative:** Is your relative currently inside or outside the United States? *(Determines if I-485 or Consular Processing is required next).*
*   **Marriage Validity:** (If Spouse) Were you legally married, and was your previous marriage (if any) legally terminated?

---

## 3. Adjustment of Status (Form I-485)
**Goal:** Apply for a Green Card from *inside* the United States.

### Clarification & Validation Questions:
*   **Current Location:** Are you physically present in the United States right now? *(Must be Yes)*
*   **Lawful Entry:** Did you enter the U.S. lawfully (with a valid visa, border crossing card, or parole)? *(If No, usually ineligible for I-485, triggers attorney warning).*
*   **Underlying Petition:** Do you have an approved or concurrently filed immigrant petition (like I-130 or I-140)?
*   **Visa Availability:** Is a visa number currently available to you based on the Visa Bulletin? *(Immediate relatives of U.S. citizens bypass this; preference categories must wait).*
*   **Inadmissibility Checks:** 
    *   Have you ever worked in the U.S. without authorization?
    *   Have you overstayed your visa?
    *   *Note: Immediate relatives of U.S. citizens are forgiven for unauthorized work and overstays, but others are not. The engine branches based on the sponsor.*

---

## 4. Green Card Renewal / Replacement (Form I-90)
**Goal:** Renew an expiring 10-year Green Card or replace a lost/stolen one.

### Clarification & Validation Questions:
*   **Current Status:** Are you a Lawful Permanent Resident?
*   **Card Type:** Is your Green Card valid for 10 years or 2 years?
    *   *Validation:* If the user has a 2-year conditional Green Card, they are halted and redirected to **Form I-751** (Remove Conditions). I-90 cannot be used for 2-year cards.
*   **Reason for Filing:** Is your card expiring within 6 months, already expired, lost, stolen, or mutilated?
*   **Deportation History:** Are you currently in removal proceedings or have you ever been ordered removed?

---

## 5. DACA - Deferred Action for Childhood Arrivals (Form I-821D)
**Goal:** Renew DACA status (Note: Initial applications are currently frozen, so validation reflects renewal).

### Clarification & Validation Questions:
*   **Current Status:** Do you currently have DACA status, or did it expire less than 1 year ago? *(If expired > 1 year, requires initial application flow which is currently blocked).*
*   **Criminal History:** Since your last DACA approval, have you been convicted of a felony, a significant misdemeanor, or three or more other misdemeanors? *(If Yes, halts flow).*
*   **Departure:** Have you departed the U.S. without Advance Parole since your last DACA grant?

---

## Applying this to Law4Hire's Architecture
To align Law4Hire's engine with this rigorous, zero-hallucination workflow:

1.  **Prioritize Deep Intent over Broad Intent:** Just like CitizenPath forces a user to define their *exact* relationship (Spouse vs Sibling) before offering I-130, Law4Hire must prioritize the `subcategory` and `category` over generic `intent_type`.
2.  **Country/Embassy Restrictions (e.g., Algeria hold):** Add a geopolitical guard layer. Before suggesting a visa, check a configuration list for country-specific embargos, state-sponsor of terrorism designations, or processing halts.
3.  **Strict Knock-outs:** If a user says "I want a student visa" but then answers "No" to "Have you been accepted to a SEVP school?", the system shouldn't just lower the match score—it should mark them as **Not Eligible** for F-1.
4.  **No "Guessing":** CitizenPath doesn't guess. It asks explicit qualifying questions for the chosen path. If the path fails, it tells the user exactly which question caused the failure.