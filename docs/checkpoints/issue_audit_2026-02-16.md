# GitHub Issue Audit: Law4Hire/L4H
**Date:** 2026-02-16
**Status:** Open Issues Summary

---

## [EPIC] Document Intelligence & Compliance (#24)
**Description:**
This Epic includes the "Sentinel" and "Parser" agents to ensure your library is always current and actionable.
**Goal:** Automate USCIS document version monitoring and PDF structural analysis to maintain an up-to-date, intelligent document library.

**Sub-tasks:**
- [Agent] The Sentinel Agent: USCIS Version Monitor (#25)
- [Agent] PDF AcroForm Extraction: agentic self-verifying logic (#26)
- [SUB-26.1] PDF "Discovery" & AcroForm Extraction (#30)
- [SUB-26.2] FormFieldMapping Registry & DB Schema (#31)
- [SUB-26.3] The "Ghost-to-Field" Injection Engine (#32)

**Acceptance Criteria:**
- A self-maintaining document library that automatically detects outdated forms, downloads new versions, and maps PDF fields to database schema for dynamic form generation.

---

## [Agent] The Sentinel Agent: USCIS Version Monitor (#25)
**Description:**
A daily background agent that audits the local document library against the live USCIS website.
**Tasks:**
- Scrape USCIS form pages daily to check for "Edition Date" updates
- Compare discovered edition dates against local database versions
- Log version discrepancies for review
- If a newer version exists (not in DB), download the PDF automatically
- Flag the old version as "Legacy" in the database
- Add newly discovered forms to the DB document pool automatically

**Acceptance Criteria:**
- [ ] Daily scheduled job runs successfully
- [ ] New form versions are detected and downloaded
- [ ] Legacy versions are flagged appropriately
- [ ] Staff receive notifications for new form versions

---

## [Agent] PDF AcroForm Extraction: agentic self-verifying logic (#26)
**Description:**
The parser agent is responsible for extracting AcroForm fields from PDFs (specifically USCIS documents) to map to the database schema.
**Tasks:**
- Refine and extend existing PDF parsing in `UscisParserService.cs`
- Ensure support for all current USCIS form field variations
- Log all extracted fields and detected anomalies
- Add/extend mapping registry for new/unmapped fields
- Implement field type validation (text, checkbox, date, etc.)

**Acceptance Criteria:**
- [ ] Agent extracts and logs ALL AcroForm fields from a sample PDF
- [ ] If a field is not mapped, it's added to the registry and flagged
- [ ] A JSON reconstruction map is generated accurately from parsed fields
- [ ] The code is unit tested using a mock PDF
- [ ] The agent verifies its own work by running a mock PDF through the extractor and logging results.

---

## [SUB-26.1] PDF "Discovery" & AcroForm Extraction (#30)
**Description:**
Goal: Create a service that takes any USCIS PDF and returns a raw JSON manifest of every fillable field.
**Tasks:**
- Write a C# service in L4H.Infrastructure that uses iText7 to extract all form fields from a byte array.

**Acceptance Criteria:**
- Implement IPdfFieldExtractor using iText or PdfSharp.
- Output should include: FieldID, FieldType (Textbox, Checkbox), and DefaultValue.

---

## [SUB-26.2] FormFieldMapping Registry & DB Schema (#31)
**Description:**
Goal: Build the "Translator" table that maps a PDF Field ID to a Foxlin Data Point.
**Tasks:**
- Create an EF Core migration for a FormFieldMappings table and a corresponding DTO in L4H.Shared.
- Search `src/shared/Models/` for existing Enums to reuse or justify new ones.

**Acceptance Criteria:**
- [ ] Status enum follows architecture guidelines
- [ ] DbContext includes FormFieldMapping DbSet
- [ ] Navigation properties configured correctly
- [ ] Indexing on FormId and PdfFieldId for performance

---

## [SUB-26.3] The "Ghost-to-Field" Injection Engine (#32)
**Description:**
Goal: The logic that takes a "Shadow Session" (Anonymous User) answer and injects it into the PDF.
**Tasks:**
- Implement service taking JSON dictionary of answers and a Template PDF.

**Acceptance Criteria:**
- Service must take a JSON dictionary of answers and a Template PDF.
- Output a flattened (non-editable) PDF stream.
- Handle "Checkbox" logic (mapping 'True' to the specific PDF 'Yes' value).

---

## Epic: Legal Staff & Case Orchestration (#27)
**Description:**
This Epic focuses on the "Office Staff" persona and the verification firewall between raw uploads and the user's dashboard.
**Goal:** Implement a secure workflow for document verification and case management that ensures legal professionals review and approve all documents before client access.

**Sub-tasks:**
- [Feature] The Verification Firewall & Document Pool (#28)
- [Feature] The Document Interview (Dashboard Integration) (#29)

**Acceptance Criteria:**
- A staff-managed document verification system with intelligent form filling capabilities that maintains compliance and quality control.

---

## [Feature] The Verification Firewall & Document Pool (#28)
**Description:**
Implements a "Holding Tank" for uploaded scans (from staff or government) that requires manual attorney verification before user release.
**Tasks:**
- Create a `VerificationStatus` enum for all new uploads
- Implement database schema changes to support verification workflow
- Build an Admin/Staff view for "Unassigned" documents
- Ensure documents are programmatically hidden from the User Dashboard until the `IsVerified` flag is set

**Acceptance Criteria:**
- [ ] All uploaded documents enter "Pending" status by default
- [ ] Staff can view, assign, and verify documents
- [ ] Clients cannot see unverified documents
- [ ] Audit trail captures all verification events

---

## [Feature] The Document Interview (Dashboard Integration) (#29)
**Description:**
A specialized UI that uses the "Reconstruction Map" from the PDF Parser Agent to ask only the questions needed for a specific form.
**Tasks:**
- Filter the questions based on the selected PDF
- Build a server-side service that takes the interview answers and injects data into the PDF template
- Flatten the PDF to prevent further editing

**Acceptance Criteria:**
- [ ] Interview dynamically loads questions based on selected form
- [ ] Only missing/required fields are presented to user
- [ ] Form validation matches USCIS requirements
- [ ] Completed PDF is generated and downloadable

---

## [EPIC] Admin Portal: Staff Identity & Profile Management (#23)
**Description:**
Develop the "back-office" infrastructure for Legal Professionals, including the state-driven profile photo manager.

**Acceptance Criteria:**
- [ ] State Machine: "Choose Picture" button is DISABLED unless an image is selected from the list.
- [ ] State Machine: "Upload Picture" is ALWAYS active.
- [ ] Storage: Images stored in /images/attorneys/ and mapped via AttorneyPictures DB table.
- [ ] Staff Roles: Implement logic to distinguish "Office Staff" from "Legal Professionals".

---

## [EPIC] Technical Debt: Test Consolidation & Documentation Audit (#22)
**Description:**
Consolidate 400+ floating tests (Selenium, Puppeteer, Playwright) and delete legacy artifacts to stabilize the rewrite environment.

**Acceptance Criteria:**
- [ ] Identify and move all active tests into /tests/e2e, /tests/integration, and /tests/unit.
- [ ] Delete all .Legacy.cs.bak and redundant .md files.
- [ ] Establish a single "Source of Truth" for E2E testing (e.g., Playwright).
- [ ] Update CI/CD paths to reflect the new directory structure.

---

## [Cleanup] Audit Empty Shared Services (#16)
**Description:**
The directory web/shared-ui/src/services is empty. Investigate if code was lost or if this folder should be deleted.

---

## [Frontend] Payment Integration Verification (#15)
**Description:**
Audit the Payment flow in web/l4h. Ensure it correctly calls the PaymentsController to create Stripe sessions and handles the success/cancel callbacks properly.

---

## [Docs] Update Architecture Documentation (#10)
**Description:**
Update documentation to reflect the new Epic structure. Mark this as complete when documentation covers Anonymous Intake Foundation and Agent Architecture & Orchestration.
**Status:** Complete (Ticket remains open for reference).
