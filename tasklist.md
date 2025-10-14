# Production Readiness Task List

This document outlines the prioritized tasks required to fix critical issues, complete core features, and bring the Law4Hire/Cannlaw project to a production-ready state.

---

##  Immediate Critical Fixes (P0 - Production Blocker)

*These tasks address the core reasons the system is currently failing and must be completed first.*

### 1. Fix the Failing Visa Interview Logic [COMPLETED]
**Problem:** The interview process is broken due to a conflict between a legacy frontend decision engine (`DecisionEngine.js`) and the new API-driven adaptive interview (`/interview/next-question`).

*   **Task 1.1: Unify Interview Logic.**
    *   **Action:** Officially deprecate the frontend `DecisionEngine.js` and the `routing_questions.csv` file. The single source of truth for all interview logic must be the .NET API.
    *   **Rationale:** A split-logic system is brittle, hard to maintain, and the root cause of the current failure. Centralizing this logic in the API ensures consistency and simplifies future updates.

*   **Task 1.2: Implement and Test API-Side Filtering.**
    *   **Action:** Enhance the `AdaptiveInterviewService` in the .NET API. This service, which powers the `/interview/next-question` endpoint, must correctly filter the list of `remainingVisaTypes` based on the user's profile data (age, country of residence/citizenship, marital status) and their answers to previous questions.
    *   **Testing:** Create a suite of unit tests for this service to validate the filtering logic against various user profiles and answer combinations.

*   **Task 1.3: Refactor the React Interview UI.**
    *   **Action:** Modify the Law4Hire React frontend to remove all dependencies on `DecisionEngine.js`. The UI must be refactored to exclusively call the API endpoints (`/interview/start`, `/interview/answer`, `/interview/next-question`) to drive the user experience.
    *   **State Management:** Use a robust state management solution (e.g., Redux, Zustand, or React Context) to handle the `sessionId`, current question, user answers, and loading/error states.

### 2. Implement the Email System [COMPLETED]
**Problem:** Critical email notifications (e.g., parent/guardian invitations) are not functional.

*   **Task 2.1: Configure .NET Mail Service.**
    *   **Action:** Implement a new `MailService` in the .NET API designed to connect to the specified Exchange server.
    *   **Best Practice:** Store server credentials (address, port, username, password) in environment variables or a secure configuration provider, not hardcoded in the source code.

*   **Task 2.2: Integrate Email for Parent/Guardian Notifications.**
    *   **Action:** In the API endpoint responsible for updating a user's profile (`PUT /auth/profile`), add logic to trigger the `MailService` to send invitation emails when a minor user adds guardian contact information.

---

## Core Feature Completion (P1 - Production Readiness)

*These tasks complete the essential user journey from registration to a functional dashboard, making the application feature-complete for launch.*

### 1. Complete the User Profile Flow [COMPLETED]
**Problem:** Required user data is missing from the registration and profile completion flow.

*   **Task 1.1: Add 'Gender' to Profile Completion.**
    *   **Action (API):** Ensure the `UpdateProfile` DTO and the handler for `PUT /auth/profile` accept and validate a `gender` field, as it is required by the database schema.
    *   **Action (Frontend):** Add a required `Gender` select input to the Profile Completion form in the Law4Hire React application.

### 2. Finalize Post-Interview Workflow [COMPLETED]
**Problem:** The user flow after completing the interview is incomplete. The dashboard and subsequent steps are not wired up.

*   **Task 2.1: Implement Dashboard Data Fetching.** [COMPLETED]
    *   **Action:** On the user's Dashboard page, fetch data from the `GET /api/v1/cases/mine` endpoint.
    *   **Action:** If a case exists, display the assigned `visaTypeName` and the current case `status`.
    *   **Action:** If a `visaTypeCode` is present, make a subsequent call to `GET /workflows?visaType={visaTypeCode}&country={countryCode}` to retrieve and display the "Next Steps" for the user.

*   **Task 2.2: Implement Pricing and Scheduling Flow.** [COMPLETED]
    *   **Action:** Create a "Pricing" page that fetches available packages from `GET /pricing?visaType={visaTypeCode}`.
    *   **Action:** Allow the user to select a package, which should trigger a call to `POST /v1/cases/{id}/package`.
    *   **Action:** After package selection, guide the user to a scheduling component to book their final interview. This will update the case status from `pending` to `active` or `paid` as per the documented business logic.

---

## Technical & Best Practices (P2 - Long-Term Stability)

*These tasks focus on improving the codebase's quality, security, and maintainability for long-term success.*

### 1. API & Backend Enhancements

*   **Task 1.1: Implement Robust Input Validation for Internationalization (i18n).** [COMPLETED]
    *   **Action:** Review all API Data Transfer Objects (DTOs) that accept string inputs (e.g., names, addresses). Use a library like `FluentValidation` to enforce reasonable length constraints and character validation to prevent injection attacks, while correctly handling non-ASCII characters from the 21 supported languages.

*   **Task 1.2: Secure Admin Endpoints.**
    *   **Action:** Audit every endpoint under the `/admin/` path to ensure a strict authorization policy is applied, requiring an `IsAdmin` claim.
    *   **Action:** Add integration tests to confirm that requests using non-admin tokens are rejected with a `403 Forbidden` status code.

### 2. Frontend & DevOps Improvements

*   **Task 2.1: Centralize API Calls in a Dedicated Service.** [COMPLETED]
    *   **Action:** Create a dedicated API client module (e.g., `apiClient.ts`) in both the Law4Hire and Cannlaw React projects. This service will be responsible for setting the base URL, attaching the JWT `Authorization` header to all necessary requests, and handling response parsing and error formatting.

*   **Task 2.2: Implement i18n in React Frontends.** [COMPLETED]
    *   **Action:** Integrate a library like `i18next` with `react-i18next`. Use the `GET /i18n/supported` endpoint as the source of truth for available languages.
    *   **Action:** Create translation JSON files for each of the 21 supported languages to store all UI strings, ensuring the frontends are fully localized.

*   **Task 2.3: Automate End-to-End (E2E) Testing.** [COMPLETED]
    *   **Action:** Integrate the existing test suites (`comprehensive-visa-test-suite.js`) into a CI/CD pipeline (e.g., GitHub Actions, Azure DevOps).
    *   **Action:** Configure the pipeline to run these E2E tests automatically on every pull request to the main branch to prevent regressions.
    *   **Action:** Fix the `comprehensive-visa-test-suite-fixed.js` script to correctly handle the new user workflow where profile completion occurs after the initial login.

