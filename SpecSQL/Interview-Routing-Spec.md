# Interview Routing — Consolidated Categories, Canonical Questions, and CSV Schema (for Claude Coder)

This package reduces your interview to **9 top-level categories**, rewrites differentiating questions so they map cleanly to visa outcomes, and provides a **single CSV** that Claude Coder can ingest to generate the UI + decision engine.

## Why consolidate?
Your current draft reaches **30/88 visa types** and misses **58/88** (esp. H/J/K/L dependents, NATO, P/Q/R, T/U, TN/TPS/TWOV). This redesign targets those gaps with reusable routers (Dependents, Support Personnel, Program Qualifiers) instead of exploding categories. fileciteturn2file0L81-L99

---

## Consolidated Category Set (9)
1. **Visit & Transit** — B (Visit), C (Transit), D (Crew), **TWOV**
2. **Study & Exchange** — F/M (Students), **J** (Exchange), **Q** (Cultural)
3. **Work & Talent** — H (temporary workers), L (intracompany), O/P (extraordinary/athletes), R (religious), **I** (media), **TN** (USMCA), **E** (treaty/trade/invest)
4. **Family & Fiancé** — K, **V** (legacy) + *all derivatives via Dependent Router*
5. **Diplomatic, IO & NATO** — A, G (incl. **G‑3**), **NATO 1–7**
6. **Humanitarian & Law Enforcement** — **T** (trafficking), **U** (crime), **S** (informant), **TPS**
7. **Immigration (Permanent Residence)** — EB/*, family-based immigrant paths (for triage and handoff)
8. **Foreign Adoption** — IR/IH adoption flows (intake + attorney review)
9. **Citizenship (N‑400)** — naturalization intake (not a visa; separate flow)

> Note: “Immigration (Permanent Residence)” is maintained as a triage category even though your EB paths show good coverage. fileciteturn2file0L90-L101

---

## Canonical Question Style (short, unambiguous, visa‑aware)
Use crisp yes/no or single‑choice questions that **encode the differentiator** of the visa:
- **Specialty occupation? Degree required? → H‑1B**
- **Chile/Singapore nationality? → H‑1B1**
- **Non‑agricultural, temporary + sponsor? → H‑2B**
- **DS‑2019 in hand? → J‑1**
- **Media on assignment? → I**
- **Under NATO orders? → NATO series**
- **Dependent/spouse/child? → H‑4/L‑2/O‑3/P‑4/R‑2/J‑2/F‑2/M‑2/K‑2/K‑4... (via Dependent Router)**
- **Victim + cooperating with LE? → U / T**
- **TN citizen of Canada/Mexico + listed profession? → TN**
These map directly to many of your “Failed to reach” visas. fileciteturn2file5L57-L103

---

## CSV Schema (single file)
**File:** `routing_questions.csv`

Columns:
- `id` — unique string (reference across rows)
- `category` — one of the 9 categories or `global`
- `type` — `question` | `router` | `outcome`
- `text` — question text (blank for outcomes)
- `options_json` — JSON array of answer labels (e.g., `["Yes","No"]`) for `question/router`; blank for outcomes
- `route_expr_json` — JSON object describing routing/selection logic **or** the outcome object for `type=outcome`
  - For `question/router`: mapping of `answer`→`next_id` **or** a rule object (see examples)
  - For `outcome`: `{"visa_code":"H1B","notes":"...","attorney_flag":false}`
- `tags` — semicolon-delimited (e.g., `dependent;router`)
- `notes` — internal guidance (displayed to staff, not end users)

### Routing Patterns
- **Direct outcome:** set `next_id` to an `outcome` row id.
- **Dependent Router:** a router with `options_json` listing principal statuses; `route_expr_json` maps each principal → dependent outcome (e.g., `"H-1B":"H-4"`).
- **Program Qualifier Router:** e.g., DS‑2019 → J‑1; Chile/Singapore → H‑1B1; NATO Orders → NATO 1–7 sub‑router.

---

## How Claude Coder should consume this
1. Parse the CSV into a directed graph.
2. Render category selection as the root question.
3. Ask questions in order; evaluate `route_expr_json` to move to the next node or emit an `outcome`.
4. When an `outcome` is reached, return the **visa code** + rationale trail (the Q/A path).
5. For **derivatives** and **rare/legacy** (e.g., V‑class, H‑1C, Q‑2/Q‑3), still return the visa code but set `attorney_flag=true` so your UI can schedule attorney review.

---

## “Build the Tool” Prompt (paste into Claude Coder after the CSV is uploaded)
```
You are Claude Coder acting as a full-stack engineer.

Goal: Read `routing_questions.csv`, build a single-page decision UI (React or Blazor) that asks one question at a time and outputs a recommended visa code with the reasoning path.

Requirements:
- Parse CSV with columns: id, category, type, text, options_json, route_expr_json, tags, notes.
- Build a state-machine engine:
  - Root screen lists the 9 top-level categories from the CSV.
  - Advance by evaluating `route_expr_json` for the selected answer.
  - When `type=outcome`, show visa code, notes, and `attorney_flag` if present.
- Provide: Back/Next, restart, path breadcrumbs, and export of the chosen path as JSON.
- Make the engine data-driven so we can replace the CSV without code changes.
- Add simple theming and keyboard support (Enter to continue).
Deliverables:
- Source code for UI + a small library `interview-engine` to interpret the CSV.
```

---

## What’s included
- This markdown spec (you are reading it).
- A ready-to-ingest CSV with the consolidated categories, global routers, and enough differentiators to cover previously unreachable visas (H‑series core, NATO 1–7, G‑3/G‑5, I, J, K‑3, L‑2, O‑2/O‑3, P‑series, Q‑series, R‑series, S/T/U, TN, TPS, TWOV, V‑class). See the CSV for specific rows tied to each code. fileciteturn2file0L92-L101

---

## Next steps
- Review/approve wording.
- Tell me which rows to tweak. I can regenerate the CSV quickly.