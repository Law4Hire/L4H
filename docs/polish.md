# Polish Plan

## Goal

Move the project from "mostly framed" to "polished and reliable" by removing duplicated data entry, unifying intake logic, fixing broken edge-case routing, and standardizing user-visible behavior across interview, signup, login, and case creation.

## Guiding Principle

If we ask the user for a piece of information once, we should persist it and reuse it later instead of asking again.

Preferred persistence order:

1. Store durable identity and profile data in the database once confirmed.
2. Store in-flight interview data in the interview session so later steps can consume it.
3. Use client cache/session storage only as a temporary bridge, never as the primary source of truth.

Examples of data that should be reused automatically:

- Legal name as shown on passport
- Date of birth
- Country of citizenship / nationality
- Passport metadata
- Family/adoption/case facts already entered during intake
- Selected visa or service path

## P0 Now

### 1. Replace hard-stop country hold behavior with consult/prep routing

Status:

- Complete on 2026-03-20. Verified locally in browser against `http://127.0.0.1:4174/service-fit`.

Problem:

- The service-fit flow currently terminates users from hold countries instead of letting them continue to consultation or paperwork-prep options.

Required change:

- Replace `TERMINATED` outcomes for administrative hold questions with a consultation-ready path.
- Preserve the hold finding as a case/interview flag so staff can see it.
- Offer "prepare paperwork anyway" or "schedule attorney review" instead of dead-ending the user.

Evidence:

- [ServiceFitPage.tsx#L43](/C:/programming/L4HProject/web/l4h/src/pages/ServiceFitPage.tsx#L43)
- [ServiceFitPage.tsx#L83](/C:/programming/L4HProject/web/l4h/src/pages/ServiceFitPage.tsx#L83)
- [ServiceFitPage.tsx#L140](/C:/programming/L4HProject/web/l4h/src/pages/ServiceFitPage.tsx#L140)
- [ServiceFitPage.tsx#L368](/C:/programming/L4HProject/web/l4h/src/pages/ServiceFitPage.tsx#L368)

Acceptance criteria:

- Hold-country users can still create an account or book a consultation.
- The system records why automated processing is limited.
- Staff can distinguish "not automatable" from "not worth taking."

### 2. Unify interview identity capture and registration

Status:

- Complete on 2026-03-20. Verified locally through anonymous interview prefill API and registration UI prefill.

Problem:

- The interview collects the user’s legal full name as shown on passport, but registration asks for first and last name again.
- This creates duplicate entry and breaks for names that do not fit a simple first/last split.

Required change:

- Treat interview identity fields as the primary source when present.
- Pre-fill registration from interview answers.
- Add a single canonical legal name field, and derive first/last only if truly required downstream.
- Avoid asking again unless the user explicitly edits the data.

Evidence:

- [DecisionTreeQuestionEngineV2.cs#L517](/C:/programming/L4HProject/src/infrastructure/Services/Interview/DecisionTreeQuestionEngineV2.cs#L517)
- [SinglePageRegistration.tsx#L105](/C:/programming/L4HProject/web/l4h/src/pages/SinglePageRegistration.tsx#L105)
- [SinglePageRegistration.tsx#L106](/C:/programming/L4HProject/web/l4h/src/pages/SinglePageRegistration.tsx#L106)

Acceptance criteria:

- Interview-collected identity appears automatically on account creation.
- Users are not forced to retype their name.
- Passport-style names remain intact through the workflow.

### 3. Make registration produce a real signed-in, usable user state

Status:

- Complete on 2026-03-20. Verified locally through API signup plus browser signup flow that retained JWT and reached dashboard without re-login.

Problem:

- Normal signup returns a token, but the page does not use it to establish session state.
- Interview-based registration does not return a token at all and still routes users toward protected pages.

Required change:

- Make both signup paths return the same auth/session contract.
- Set the JWT and refresh the auth context immediately after successful registration.
- Do not route users to protected pages without a valid authenticated session.

Evidence:

- [SinglePageRegistration.tsx#L44](/C:/programming/L4HProject/web/l4h/src/pages/SinglePageRegistration.tsx#L44)
- [SinglePageRegistration.tsx#L65](/C:/programming/L4HProject/web/l4h/src/pages/SinglePageRegistration.tsx#L65)
- [InterviewDTOs.cs#L88](/C:/programming/L4HProject/src/api/DTOs/Interview/InterviewDTOs.cs#L88)
- [AnonymousInterviewController.cs#L163](/C:/programming/L4HProject/src/api/Controllers/AnonymousInterviewController.cs#L163)

Acceptance criteria:

- After signup, the user is either signed in and routed correctly, or clearly told they must verify first.
- No route-guard churn after registration.
- Both signup paths behave the same from the user’s perspective.

### 4. Make interview registration create the same downstream records as normal signup

Status:

- Complete on 2026-03-20. Verified locally through interview registration API returning a token and a dashboard-ready case.

Problem:

- The interview-based registration path creates a user and converts the session, but does not create the case scaffolding normal signup creates.

Required change:

- Refactor account creation so both signup paths use the same service.
- Ensure interview-based registration creates a case, attaches the session, and preserves visa/interview context.

Evidence:

- [AgentOrchestrator.cs#L354](/C:/programming/L4HProject/src/infrastructure/Services/Interview/AgentOrchestrator.cs#L354)
- [AgentOrchestrator.cs#L372](/C:/programming/L4HProject/src/infrastructure/Services/Interview/AgentOrchestrator.cs#L372)
- [AuthService.cs#L88](/C:/programming/L4HProject/src/infrastructure/Services/AuthService.cs#L88)
- [LoginPage.tsx#L35](/C:/programming/L4HProject/web/l4h/src/pages/LoginPage.tsx#L35)

Acceptance criteria:

- Users created from interview flow have a valid case and dashboard-ready state.
- No "No case found" failure after interview-based registration.

## P1 This Sprint

### 5. Repair email verification so blocked users have a real path forward

Problem:

- Email verification is enforced at login, but standard signup only logs the token instead of delivering it.
- Interview registration creates unverified users and does not create/send verification in that flow.

Required change:

- Generate and deliver verification consistently from all account-creation flows.
- Add resend verification support.
- Make the blocked-login experience user-friendly and actionable.

Evidence:

- [AuthController.cs#L103](/C:/programming/L4HProject/src/api/Controllers/AuthController.cs#L103)
- [AuthController.cs#L109](/C:/programming/L4HProject/src/api/Controllers/AuthController.cs#L109)
- [AgentOrchestrator.cs#L362](/C:/programming/L4HProject/src/infrastructure/Services/Interview/AgentOrchestrator.cs#L362)
- [AuthController.cs#L204](/C:/programming/L4HProject/src/api/Controllers/AuthController.cs#L204)

Acceptance criteria:

- Unverified users receive a real verification path.
- Login failure explains what to do next in plain English.
- Interview registration and standard signup follow the same verification rules.

### 6. Standardize API error shapes and user-facing error presentation

Problem:

- Some endpoints return `ProblemDetails`, others return `{ error: ... }`.
- The frontend parses them inconsistently, which is likely contributing to raw/ugly JSON-style user errors.

Required change:

- Standardize on one error contract for all frontend-consumed endpoints.
- Update the client wrapper to normalize server errors once.
- Replace raw error dumps with friendly messages plus structured logging.

Evidence:

- [AuthController.cs#L101](/C:/programming/L4HProject/src/api/Controllers/AuthController.cs#L101)
- [AuthController.cs#L390](/C:/programming/L4HProject/src/api/Controllers/AuthController.cs#L390)
- [AnonymousInterviewController.cs#L141](/C:/programming/L4HProject/src/api/Controllers/AnonymousInterviewController.cs#L141)
- [api-client.ts#L217](/C:/programming/L4HProject/web/shared-ui/src/api-client.ts#L217)

Acceptance criteria:

- Users never see raw JSON blobs.
- Login, signup, interview, and verification errors render consistently.

### 7. Fix interview retake/reset so it preserves the intended session type

Problem:

- One reset path starts an authenticated interview, then navigates without the token.
- The interview page only looks for `token`, so it falls back to a new anonymous interview.

Required change:

- Make authenticated and anonymous resume/start behavior explicit and consistent.
- Remove query-string mismatches between dashboard and interview page.

Evidence:

- [DashboardPage.tsx#L97](/C:/programming/L4HProject/web/l4h/src/pages/DashboardPage.tsx#L97)
- [DashboardPage.tsx#L100](/C:/programming/L4HProject/web/l4h/src/pages/DashboardPage.tsx#L100)
- [InterviewPage.tsx#L105](/C:/programming/L4HProject/web/l4h/src/pages/InterviewPage.tsx#L105)
- [InterviewPage.tsx#L109](/C:/programming/L4HProject/web/l4h/src/pages/InterviewPage.tsx#L109)

Acceptance criteria:

- Retake interview preserves correct case/session context.
- No silent fallback to anonymous mode.

### 8. Fix interview completion state to reflect actual stored results

Problem:

- Interview completion checks for `VisaRecommendations`, but completion stores `VisaEvaluations`.

Required change:

- Align completion logic with the actual persistence model.
- Ensure dashboard and auth state correctly recognize completed interviews.

Evidence:

- [AuthService.cs#L331](/C:/programming/L4HProject/src/infrastructure/Services/AuthService.cs#L331)
- [AuthService.cs#L337](/C:/programming/L4HProject/src/infrastructure/Services/AuthService.cs#L337)
- [AgentOrchestrator.cs#L283](/C:/programming/L4HProject/src/infrastructure/Services/Interview/AgentOrchestrator.cs#L283)

Acceptance criteria:

- Completed interviews are recognized everywhere they matter.
- No false "incomplete" state after a finished interview.

### 9. Fix broken staff dashboard API paths

Problem:

- The professional workspace mixes correct shared-client paths like `/v1/...` with raw fetch calls and `fetchJson` calls that include an extra `/api/v1/...` prefix.
- In runtime, this produces 404s after successful login.

Required change:

- Normalize all dashboard data calls through the shared API client.
- Remove double-prefixed `/api/v1/...` calls from shared-ui pages.

Evidence:

- [ProfessionalWorkspace.tsx#L33](/C:/programming/L4HProject/web/shared-ui/src/pages/dashboards/ProfessionalWorkspace.tsx#L33)
- [ProfessionalWorkspace.tsx#L36](/C:/programming/L4HProject/web/shared-ui/src/pages/dashboards/ProfessionalWorkspace.tsx#L36)
- [ProfessionalWorkspace.tsx#L37](/C:/programming/L4HProject/web/shared-ui/src/pages/dashboards/ProfessionalWorkspace.tsx#L37)
- [ProfessionalWorkspace.tsx#L48](/C:/programming/L4HProject/web/shared-ui/src/pages/dashboards/ProfessionalWorkspace.tsx#L48)

Acceptance criteria:

- Staff dashboard loads without console 404s after login.
- Workbasket and assigned messages use valid API endpoints in every environment.

## P2 Polish Backlog

### 10. Persist and reuse more registration data instead of dropping it

Problem:

- The form asks for DOB, phone, and country/citizenship, but the normal signup branch ignores those values.

Required change:

- Persist these values at account creation or immediately after via one unified profile completion call.
- Pre-fill them from interview answers if already known.

Evidence:

- [SinglePageRegistration.tsx#L14](/C:/programming/L4HProject/web/l4h/src/pages/SinglePageRegistration.tsx#L14)
- [SinglePageRegistration.tsx#L44](/C:/programming/L4HProject/web/l4h/src/pages/SinglePageRegistration.tsx#L44)
- [SinglePageRegistration.tsx#L109](/C:/programming/L4HProject/web/l4h/src/pages/SinglePageRegistration.tsx#L109)

Acceptance criteria:

- Data users enter is not silently discarded.
- The system reuses stored profile data later in forms and document prep.

### 11. Normalize auth infrastructure URLs

Problem:

- Some auth refresh/logout calls use hardcoded relative URLs instead of the configured API base.

Required change:

- Route all frontend auth calls through the same API-base-aware client.

Evidence:

- [api-client.ts#L151](/C:/programming/L4HProject/web/shared-ui/src/api-client.ts#L151)
- [App.tsx#L57](/C:/programming/L4HProject/web/l4h/src/App.tsx#L57)
- [api-client.ts#L39](/C:/programming/L4HProject/web/shared-ui/src/api-client.ts#L39)

Acceptance criteria:

- Auth flows behave the same in local, Kubernetes, and deployed environments.

### 12. Finish incomplete case-bound user surfaces

Problem:

- Uploads still uses placeholder case IDs and stubbed actions.

Required change:

- Bind uploads and related features to the active case/session.
- Remove stubbed actions before calling the surface production-ready.

Evidence:

- [UploadsPage.tsx#L26](/C:/programming/L4HProject/web/l4h/src/pages/UploadsPage.tsx#L26)
- [UploadsPage.tsx#L40](/C:/programming/L4HProject/web/l4h/src/pages/UploadsPage.tsx#L40)
- [UploadsPage.tsx#L299](/C:/programming/L4HProject/web/l4h/src/pages/UploadsPage.tsx#L299)

Acceptance criteria:

- Document actions operate on real case context.
- No placeholder IDs remain in end-user flows.

### 13. Fix adoption routing and interview specialization

Problem:

- Foreign adoption can route into citizenship/naturalization territory because adoption is grouped under citizenship intent, while adoption-specific workflow coverage is documented as missing/incomplete.

Required change:

- Give adoption its own complete path and evaluation logic.
- Make interview questions identify who the subject is: adoptive parent, child, or both.
- Persist child-specific data separately from applicant data.
- Ensure adoption never falls through to naturalization logic by default.

Evidence:

- [DecisionTreeQuestionEngineV2.cs#L171](/C:/programming/L4HProject/src/infrastructure/Services/Interview/DecisionTreeQuestionEngineV2.cs#L171)
- [DecisionTreeQuestionEngineV2.cs#L339](/C:/programming/L4HProject/src/infrastructure/Services/Interview/DecisionTreeQuestionEngineV2.cs#L339)
- [VisaEvaluationEngine.cs#L157](/C:/programming/L4HProject/src/infrastructure/Services/Interview/VisaEvaluationEngine.cs#L157)
- [tests/e2e/ui.e2e/IMPLEMENTATION_STATUS.md](/C:/programming/L4HProject/tests/e2e/ui.e2e/IMPLEMENTATION_STATUS.md)

Acceptance criteria:

- Foreign adoption selects adoption-specific visas and questions.
- Child identity data is collected as child data, not mixed into petitioner identity.
- Naturalization recommendations do not appear unless explicitly supported by the answers.

## P3 Cleanup

### 14. Remove production hygiene risks and debug leftovers

Problem:

- The global exception handler returns raw exception messages.
- The repo still contains temp/debug artifacts.

Required change:

- Replace raw exception detail in production responses with safe text and log the real exception server-side.
- Remove or quarantine `.tmp` and debug output artifacts from active source paths.

Evidence:

- [GlobalExceptionHandler.cs#L33](/C:/programming/L4HProject/src/api/Infrastructure/GlobalExceptionHandler.cs#L33)
- [GuardianController.cs.tmp](/C:/programming/L4HProject/src/api/Controllers/GuardianController.cs.tmp)
- [dev_output.txt](/C:/programming/L4HProject/web/l4h/dev_output.txt)

Acceptance criteria:

- No stack/exception internals leak to end users.
- Source tree no longer contains misleading inactive controller/debug artifacts in active app paths.

## Suggested Implementation Order

1. Unify account creation and post-registration auth state.
2. Fix duplicate-data capture by mapping interview answers into account/profile storage.
3. Convert hold-country dead ends into attorney/prep routing.
4. Standardize API errors and verification flow.
5. Repair interview session continuity and completion state.
6. Implement adoption-specific routing and child-subject data handling.

## Runtime Validation Checklist

After fixes, manually validate these flows:

1. Hold-country user can still register, consult, and prepare paperwork.
2. Interview-collected legal name auto-fills account creation.
3. New user registration signs the user in or clearly blocks for verification with actionable next steps.
4. Interview-based registration lands on a dashboard with a valid case.
5. Unverified login shows clean UI text, never raw JSON.
6. Interview retake preserves case/session context.
7. Foreign adoption stays on adoption-specific questions and recommendations.
8. Previously entered profile data is reused in later forms and document workflows.

## Runtime Observations

Updated on 2026-03-20 after P0 implementation and local verification:

- Local API was verified at `http://127.0.0.1:8767` using the Kubernetes SQL tunnel and the cluster-compatible SQL connection string.
- Local frontend was verified at `http://127.0.0.1:4174` against that API.
- Verified locally: standard signup now returns a usable JWT and the user can continue to dashboard without being bounced to login.
- Verified locally: interview registration now creates a usable JWT and a case-backed account.
- Verified locally: interview registration prefill endpoint returns name, DOB, citizenship, and phone from previously stored interview answers.
- Verified locally: the registration page accepts `sessionToken` from router state or query string and preloads the captured interview values.
- Verified locally: hold-country answers in `service-fit` now route to an attorney-review/prep screen instead of a hard dead end.

Observed on 2026-03-19:

- Local Kubernetes context exists as `k3d-l4h-local`.
- After Docker Desktop was started, the cluster came up and core L4H pods were reachable.
- The `api` pod was `Running` but temporarily `0/1 Ready`; logs showed normal startup, migrations, and seed activity, so this appeared to be a readiness-delay/timing issue rather than a crash.
- The deployed L4H dev site still reproduces the hold-country dead end in `service-fit`: users reach a "We're Sorry" screen with "Country-wide hold prevents processing" and are sent back home instead of being routed to consult/prep.
- The deployed L4H dev registration page still asks for `First Name`, `Last Name`, `Date of Birth`, `Country of Citizenship`, and `Phone Number` as a fresh entry flow.
- The deployed L4H adoption interview branch currently goes from:
  1. `Citizenship, Adoption & Naturalization`
  2. `Adoption - Bring an adopted child to the United States`
  3. directly into `What is your full legal name? (As it appears on your passport)`
- Existing user login was successful with `abu@testing.com`, but the resulting professional dashboard emitted browser 404s and logged `Error loading professional workspace`.
- Fresh signup succeeded, but the post-signup flow did not establish an authenticated session.
- Clicking `Not Now` after signup routed the user to `/login`, and `localStorage.jwt_token` was not set.
- Fresh unverified-user login rendered the raw JSON error body directly into the page:
  `{"title":"Email Verification Required","status":401,"detail":"Please verify your email address before logging in."}`

Implication:

- The live build confirms that adoption still lacks child-subject-specific intake and that the system is still centered on the adult applicant identity even in an adoption branch.
- The live build also confirms that the account-creation and login experience is currently fragmented: signup success does not equal signed-in state, and verification failures are still leaking raw API payloads into the UI.
