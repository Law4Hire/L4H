# GitHub Issues for New Interview System

This file contains all the remaining work items for the new interview system implementation. Each section represents a GitHub issue that should be created.

---

## Issue 1: API Endpoints - Update InterviewController for new eligibility service

**Labels**: `backend`, `enhancement`, `high-priority`

**Estimated Effort**: 4-6 hours

### Description

Update the InterviewController to use the new DecisionTreeVisaEligibilityService and support the new multi-visa eligibility flow.

### Context

The backend foundation has been implemented:
- ✅ DecisionTreeVisaEligibilityService created
- ✅ VisaEligibilityResult entity added
- ✅ Attorney lock-in fields added to Case entity

This issue covers connecting the new service to the API layer.

### Tasks

- [ ] Update InterviewController to inject DecisionTreeVisaEligibilityService
- [ ] Create endpoint for unauthenticated interview start (cookie-based session)
- [ ] Create endpoint for submitting answers (update cookie)
- [ ] Create endpoint for getting next question based on answers
- [ ] Create endpoint for completing interview and getting all eligible visas
- [ ] Create endpoint for fetching multiple visa results for a session
- [ ] Create endpoint for attorney to lock visa selection
- [ ] Create endpoint for checking lock status before retake
- [ ] Update registration flow to support post-interview signup (transfer cookie data to DB)
- [ ] Add DTO models for multi-visa results (eligible vs potential)
- [ ] Update response models to include match scores and rationales
- [ ] Add proper error handling for edge cases (no eligible visas, etc.)

### Acceptance Criteria

- [ ] Unauthenticated users can start interview and progress is stored in cookies
- [ ] Interview returns multiple eligible/potential visas instead of single recommendation
- [ ] Results include eligibility status (Eligible/Potential), match score, and rationale
- [ ] Attorney can lock a visa selection for a case
- [ ] Locked cases show warning when user attempts retake
- [ ] Registration transfers cookie data to database correctly
- [ ] All endpoints have proper error handling and validation
- [ ] API documentation updated (if applicable)

### Technical Notes

- Cookie structure: `{ interviewProgress: { answers: {}, currentStep: 0, startedAt: ISO, expiresAt: ISO } }`
- Cookie expiration: 24 hours
- Store VisaEligibilityResults in database after interview completion

### Dependencies

- **Depends on**: Backend foundation (completed in PR #XXX)
- **Blocks**: Frontend Interview Wizard, Results Page

### Related Files

- `/home/user/L4H/src/api/Controllers/InterviewController.cs`
- `/home/user/L4H/src/infrastructure/Services/DecisionTreeVisaEligibilityService.cs`
- `/home/user/L4H/DECISION_TREE_DESIGN.md`

---

## Issue 2: Frontend - Interview Wizard Component with Cookie State

**Labels**: `frontend`, `enhancement`, `high-priority`

**Estimated Effort**: 8-12 hours

### Description

Create a new step-by-step interview wizard component that implements the decision tree flow with forward/back navigation and cookie-based state persistence.

### Context

The decision tree design has been completed with all question flows defined. This component will replace the existing interview page to support the new multi-visa eligibility approach.

### Tasks

- [ ] Create new `InterviewWizardPage.tsx` component
- [ ] Implement cookie-based state management for interview progress
  - [ ] Create `useInterviewCookie` hook for reading/writing cookie
  - [ ] Handle 24-hour expiration
  - [ ] Auto-restore progress on page reload
- [ ] Build step-by-step navigation
  - [ ] Forward button (validates current answer)
  - [ ] Back button (preserves previous answers)
  - [ ] Progress indicator showing current question number
- [ ] Create question components for all question types:
  - [ ] Radio button questions
  - [ ] Checkbox questions (for eligibility checklists)
  - [ ] Text input questions
  - [ ] Date picker questions
  - [ ] Dropdown/select questions
- [ ] Implement question branching logic based on decision tree
  - [ ] Q1: Current location (Inside/Outside US)
  - [ ] Q2: Immigration intent (Nonimmigrant/Immigrant/US Citizen/Investor)
  - [ ] Branch to appropriate question set based on answers
- [ ] Add visual progress tracking
  - [ ] Show remaining visa types count
  - [ ] Display visa chips that update as questions are answered
- [ ] Handle unauthenticated user flow
  - [ ] Allow interview without login
  - [ ] Redirect to results page on completion
- [ ] Add mobile-responsive design
- [ ] Integrate with API endpoints for question fetching

### Acceptance Criteria

- [ ] Unauthenticated users can complete entire interview
- [ ] Interview progress persists in cookies (survives page refresh)
- [ ] Forward/back navigation works correctly
- [ ] Questions branch appropriately based on previous answers
- [ ] Progress indicator shows current position
- [ ] All question types render correctly
- [ ] Mobile and desktop layouts work properly
- [ ] Answers are validated before allowing forward navigation
- [ ] Cookie expires after 24 hours
- [ ] Interview state transfers to results page on completion

### Technical Notes

- Use `js-cookie` or similar library for cookie management
- Cookie key: `l4h_interview_progress`
- Question flow defined in `DECISION_TREE_DESIGN.md`
- Reuse existing UI components from shared-ui where possible

### Dependencies

- **Depends on**: API Endpoints (Issue #1)
- **Blocks**: Results Page (can work in parallel)

### Related Files

- `/home/user/L4H/web/l4h/src/pages/InterviewPage.tsx` (existing, to be replaced)
- `/home/user/L4H/DECISION_TREE_DESIGN.md`
- `/home/user/L4H/web/l4h/public/locales/en-US/interview.json`

---

## Issue 3: Frontend - Visa Results Page with Eligible/Potential Distinction

**Labels**: `frontend`, `enhancement`, `high-priority`

**Estimated Effort**: 4-6 hours

### Description

Create a new results page that displays multiple eligible and potentially eligible visa types with visual distinction (green for eligible, yellow for potential).

### Context

After completing the interview, users should see all visas they qualify for, not just a single recommendation. This page will show:
- Eligible visas (green badge) - meet all requirements
- Potentially eligible visas (yellow badge) - meet most requirements but need review

### Tasks

- [ ] Create new `VisaResultsPage.tsx` component
- [ ] Display eligible visas section
  - [ ] Green badge/indicator for each visa
  - [ ] Visa code and name
  - [ ] Match score (0-100)
  - [ ] Rationale text
  - [ ] Met requirements list
  - [ ] "Apply for this visa" button
- [ ] Display potentially eligible visas section
  - [ ] Yellow badge/indicator for each visa
  - [ ] Visa code and name
  - [ ] Match score (0-100)
  - [ ] Rationale text
  - [ ] Met requirements list
  - [ ] Unmet requirements list (what needs review)
  - [ ] "Consult about this visa" button
- [ ] Handle "no eligible visas" case
  - [ ] Show appropriate message
  - [ ] Suggest contacting attorney directly
  - [ ] No registration form shown
- [ ] Add sorting options
  - [ ] Sort by match score (default)
  - [ ] Sort by visa type category
  - [ ] Sort alphabetically
- [ ] Add call-to-action buttons
  - [ ] "Continue to Registration" (if eligible visas exist)
  - [ ] "Schedule Consultation" (for all cases)
  - [ ] "Retake Interview" (start over)
- [ ] Add expandable details for each visa
  - [ ] Processing time estimate
  - [ ] Basic requirements summary
  - [ ] Next steps
- [ ] Integrate with registration flow
  - [ ] Pass selected visas to registration
  - [ ] Store results in database after registration
- [ ] Add mobile-responsive design
- [ ] Add print/export functionality

### Acceptance Criteria

- [ ] Eligible visas displayed with green visual indicator
- [ ] Potentially eligible visas displayed with yellow visual indicator
- [ ] Match scores shown for all visas
- [ ] Rationales clearly explain why each visa was recommended
- [ ] Met and unmet requirements displayed appropriately
- [ ] "No eligible visas" case handled gracefully
- [ ] Results can be sorted by different criteria
- [ ] Mobile and desktop layouts work properly
- [ ] Registration flow initiated correctly
- [ ] Results stored in database after registration

### Technical Notes

- Use color-blind friendly green/yellow (consider icons in addition to color)
- Default sort: Eligible visas first (by match score), then potential visas (by match score)
- Store all visa results in VisaEligibilityResult table after registration

### Dependencies

- **Depends on**: API Endpoints (Issue #1)
- **Works with**: Interview Wizard (Issue #2) - can be developed in parallel
- **Blocks**: Single-Page Registration (Issue #4)

### Related Files

- `/home/user/L4H/web/l4h/src/pages/InterviewPage.tsx` (for reference)
- `/home/user/L4H/DECISION_TREE_DESIGN.md`

---

## Issue 4: Frontend - Single-Page Registration Form (Mobile Optimized)

**Labels**: `frontend`, `enhancement`, `high-priority`

**Estimated Effort**: 6-8 hours

### Description

Redesign the registration flow as a single-page form that combines email/password/name with profile information, optimized for both web and mobile layouts.

### Context

Currently registration is a multi-step process (register → profile completion). The new design should:
- Combine all fields in one form
- Be mobile-friendly (React Native compatible)
- Transfer cookie interview data to database
- Only show after user sees interview results

### Tasks

- [ ] Create new `SinglePageRegistrationPage.tsx` component
- [ ] Design responsive form layout
  - [ ] Single column on mobile
  - [ ] Two-column on desktop (where appropriate)
  - [ ] Logical grouping of fields
- [ ] Implement all registration fields:
  - [ ] Full legal name (First, Middle, Last)
  - [ ] Email address
  - [ ] Password (with strength indicator)
  - [ ] Phone number with country code selector
  - [ ] Date of birth (date picker)
  - [ ] Gender
  - [ ] Marital status
  - [ ] Country of citizenship/passport issuance
- [ ] Implement address fields:
  - [ ] Current location (country dropdown)
  - [ ] If in US:
    - [ ] Street address
    - [ ] City
    - [ ] State (dropdown)
    - [ ] ZIP code
    - [ ] Address type selector (Own-mortgage, Rent, Family member, Friend)
  - [ ] If outside US:
    - [ ] Foreign address fields
    - [ ] City
    - [ ] Country
- [ ] Add field validation
  - [ ] Required field validation
  - [ ] Email format validation
  - [ ] Password strength requirements
  - [ ] Phone number format validation
  - [ ] Date of birth validation (age requirements)
- [ ] Implement cookie data transfer
  - [ ] Read interview answers from cookie
  - [ ] Include in registration API call
  - [ ] Clear cookie after successful registration
- [ ] Add guardian email collection (if user is under 18)
  - [ ] Up to 4 guardian emails
  - [ ] Guardian invitation flow
- [ ] Implement error handling
  - [ ] Display validation errors inline
  - [ ] Handle API errors gracefully
  - [ ] Prevent duplicate submissions
- [ ] Add loading states
  - [ ] Show spinner during submission
  - [ ] Disable form during processing
- [ ] Redirect to dashboard after successful registration
- [ ] Add terms of service acceptance checkbox
- [ ] Ensure React Native compatibility (no browser-specific code)

### Acceptance Criteria

- [ ] All fields render correctly on mobile and desktop
- [ ] Form is usable on small screens (320px width)
- [ ] Validation works for all fields
- [ ] Interview cookie data is transferred to database
- [ ] Registration creates user account and stores profile data
- [ ] Interview results (VisaEligibilityResults) saved to database
- [ ] Guardian flow works for users under 18
- [ ] Error messages are clear and helpful
- [ ] Form works without JavaScript errors in React Native WebView
- [ ] Successful registration redirects to dashboard
- [ ] Failed registration shows appropriate error message

### Technical Notes

- Use Formik or React Hook Form for form management
- Country code selector: use `react-phone-number-input` or similar
- Date picker: use native HTML5 date input for mobile compatibility
- Address type: RadioGroup component
- Transfer all cookie data in single API call to minimize requests
- Clear cookie only after successful database write

### Dependencies

- **Depends on**: API Endpoints (Issue #1), Results Page (Issue #3)
- **Works with**: Localization (Issue #7)

### Related Files

- `/home/user/L4H/web/l4h/src/pages/RegisterPage.tsx` (existing)
- `/home/user/L4H/web/l4h/src/pages/ProfileCompletionPage.tsx` (existing)
- `/home/user/L4H/DECISION_TREE_DESIGN.md`

---

## Issue 5: Attorney Lock-In Workflow and UI

**Labels**: `frontend`, `backend`, `enhancement`, `medium-priority`

**Estimated Effort**: 4-6 hours

### Description

Implement the attorney lock-in feature that allows legal professionals to select and lock a specific visa type for a client after consultation, with warnings on retake attempts.

### Context

After reviewing interview results with a client, attorneys need to be able to:
- Select a specific visa type from the eligible/potential list
- Lock this selection to prevent accidental changes
- Record who made the selection and when
- Display warnings if client tries to retake interview

### Tasks

#### Backend
- [ ] Add endpoint: `POST /api/v1/case/{caseId}/lock-visa`
  - [ ] Accepts: visaTypeId, staffId
  - [ ] Sets: AttorneySelectedVisaTypeId, IsVisaLockedByAttorney, VisaLockedAt, VisaLockedByStaffId
  - [ ] Returns updated case
  - [ ] Requires attorney/staff authentication
- [ ] Add endpoint: `POST /api/v1/case/{caseId}/unlock-visa`
  - [ ] Clears lock fields
  - [ ] Requires admin authentication
  - [ ] Logs unlock action in audit log
- [ ] Add endpoint: `GET /api/v1/case/{caseId}/lock-status`
  - [ ] Returns lock status and details
  - [ ] Used before allowing retake

#### Frontend - Admin Interface
- [ ] Create visa selection UI in admin/staff dashboard
  - [ ] Show all eligible/potential visas for a case
  - [ ] "Select and Lock" button for each visa
  - [ ] Confirmation modal before locking
  - [ ] Display current lock status if already locked
- [ ] Add unlock capability (admin only)
  - [ ] Show unlock button if visa is locked
  - [ ] Require confirmation
  - [ ] Log reason for unlock
- [ ] Display lock metadata
  - [ ] Who locked the visa
  - [ ] When it was locked
  - [ ] Which visa type was selected

#### Frontend - Client Interface
- [ ] Add lock status check before retake
  - [ ] Call lock-status endpoint
  - [ ] Show warning modal if locked
- [ ] Create warning modal component
  - [ ] Clear warning message
  - [ ] Show selected visa type
  - [ ] Explain consequences (additional fees, delays)
  - [ ] Require explicit confirmation to proceed
  - [ ] "Cancel" and "Yes, Retake Interview" buttons
- [ ] Update dashboard to show lock status
  - [ ] Display locked visa type prominently
  - [ ] Show "Selected by attorney" badge
  - [ ] Lock icon indicator

### Acceptance Criteria

- [ ] Attorneys can select and lock a visa type from client's results
- [ ] Lock action records attorney ID, timestamp, and visa type
- [ ] Locked cases cannot be modified without warning
- [ ] Warning modal displays before client retakes interview
- [ ] Warning clearly explains consequences
- [ ] Admins can unlock visa selections with audit trail
- [ ] Dashboard shows lock status clearly
- [ ] Lock status persists across sessions
- [ ] Lock action logged in audit log

### Technical Notes

- Only attorneys and staff can lock visas (role check required)
- Only admins can unlock visas
- Lock is stored in Case table (IsVisaLockedByAttorney flag)
- Warning modal should be modal dialog that cannot be dismissed accidentally
- Consider adding email notification to attorney when client retakes after lock

### Dependencies

- **Depends on**: API Endpoints (Issue #1), Dashboard Updates (Issue #6)
- **Independent**: Can be implemented separately from other issues

### Related Files

- `/home/user/L4H/src/api/Controllers/CaseController.cs`
- `/home/user/L4H/src/infrastructure/Entities/Case.cs`
- `/home/user/L4H/web/l4h/src/pages/Dashboard.tsx`

---

## Issue 6: Dashboard Updates - Show Interview Results and Retake Option

**Labels**: `frontend`, `enhancement`, `medium-priority`

**Estimated Effort**: 3-4 hours

### Description

Update the user dashboard to display interview results with eligible/potential visas and provide a clear "Retake Interview" option.

### Context

After completing registration, users should see their interview results on the dashboard. This provides a central place to:
- Review eligible and potential visa types
- See match scores and rationales
- Access retake option
- View attorney-selected visa (if locked)

### Tasks

- [ ] Add interview results section to dashboard
  - [ ] Fetch VisaEligibilityResults for current user
  - [ ] Display eligible visas (green badges)
  - [ ] Display potentially eligible visas (yellow badges)
  - [ ] Show match scores
  - [ ] Show brief rationales
- [ ] Add "Retake Interview" button
  - [ ] Check lock status before allowing retake
  - [ ] Show warning modal if visa is locked by attorney
  - [ ] Clear previous interview data if retake confirmed
  - [ ] Redirect to interview wizard
- [ ] Display attorney-selected visa (if locked)
  - [ ] Prominent card showing selected visa type
  - [ ] "Selected by your attorney" badge
  - [ ] Lock icon and metadata (locked date, attorney name)
  - [ ] Explanation text about locked selection
- [ ] Add "Schedule Consultation" call-to-action
  - [ ] Button to schedule appointment with attorney
  - [ ] Link to scheduling page
- [ ] Add "View All Visa Details" expandable section
  - [ ] Full list of met requirements per visa
  - [ ] Full list of unmet requirements per visa
  - [ ] Processing time estimates
  - [ ] Next steps for each visa
- [ ] Handle "no interview completed" state
  - [ ] Show "Start Interview" button if no results
  - [ ] Helpful text explaining interview process
- [ ] Handle "no eligible visas" state
  - [ ] Show appropriate message
  - [ ] Suggest consultation
  - [ ] Option to retake interview
- [ ] Add loading states
  - [ ] Show skeleton loaders while fetching results
- [ ] Make mobile responsive

### Acceptance Criteria

- [ ] Dashboard shows all eligible and potential visas
- [ ] Visa cards include match scores and rationales
- [ ] "Retake Interview" button is prominent and functional
- [ ] Lock warning shows before retake if visa is locked
- [ ] Attorney-selected visa is clearly highlighted
- [ ] No-interview-completed state handled gracefully
- [ ] No-eligible-visas state handled appropriately
- [ ] Schedule consultation option is available
- [ ] Mobile and desktop layouts work properly
- [ ] Loading states provide good UX

### Technical Notes

- Fetch results on dashboard mount
- Cache results in component state or context
- Use same green/yellow visual indicators as results page
- Ensure retake button checks lock status before redirect
- Consider adding analytics tracking for retake actions

### Dependencies

- **Depends on**: API Endpoints (Issue #1), Results Page (Issue #3)
- **Works with**: Attorney Lock-In (Issue #5)

### Related Files

- `/home/user/L4H/web/l4h/src/pages/Dashboard.tsx` (or wherever dashboard is located)
- `/home/user/L4H/DECISION_TREE_DESIGN.md`

---

## Issue 7: Localization - Translate Interview Content to 22 Languages

**Labels**: `i18n`, `enhancement`, `low-priority`

**Estimated Effort**: 10-15 hours

### Description

Add localization keys for all new interview content and translate to all 22 supported languages (in addition to English).

### Context

The application supports 23 languages via JSON localization files:
- English, Japanese, German, French, Spanish, Arabic, Chinese, Portuguese, Russian, Indonesian, Vietnamese, Turkish, Polish, Hindi, Tamil, Telugu, Marathi, Bengali, Urdu, Tagalog, Korean, Italian

All new interview questions, visa descriptions, error messages, and UI text need to be translated.

### Tasks

#### English JSON Files (Create Keys)
- [ ] Update `interview.json` with all decision tree questions
  - [ ] Q1: Current location questions
  - [ ] Q2: Immigration intent questions
  - [ ] All nonimmigrant visa questions
  - [ ] All immigrant visa questions
  - [ ] All citizenship questions
  - [ ] Results page strings
  - [ ] Progress indicators
  - [ ] Error messages specific to interview
- [ ] Update `visaLibrary.json` with visa descriptions
  - [ ] All visa type codes (B-1, B-2, H-1B, etc.)
  - [ ] Short descriptions
  - [ ] Processing time estimates
  - [ ] Basic requirements summaries
- [ ] Update `forms.json` with new form labels
  - [ ] Single-page registration field labels
  - [ ] Address type options
  - [ ] Validation messages
- [ ] Update `errors.json` with new error messages
  - [ ] Interview-specific errors
  - [ ] Cookie expiration messages
  - [ ] Lock-related warnings
  - [ ] No-eligible-visas messages
- [ ] Update `auth.json` with registration strings
  - [ ] Single-page registration text
  - [ ] Terms of service text
  - [ ] Success messages
- [ ] Update `common.json` with shared strings
  - [ ] "Retake Interview"
  - [ ] "Schedule Consultation"
  - [ ] "Eligible", "Potentially Eligible"
  - [ ] "Match Score"

#### Translation to 22 Languages
For each of the 22 non-English languages:
- [ ] Translate `interview.json` additions
- [ ] Translate `visaLibrary.json` additions
- [ ] Translate `forms.json` additions
- [ ] Translate `errors.json` additions
- [ ] Translate `auth.json` additions
- [ ] Translate `common.json` additions

Languages to translate:
- [ ] Japanese (ja-JP)
- [ ] German (de-DE)
- [ ] French (fr-FR)
- [ ] Spanish (es-ES)
- [ ] Arabic (ar-SA)
- [ ] Chinese (zh-CN)
- [ ] Portuguese (pt-BR)
- [ ] Russian (ru-RU)
- [ ] Indonesian (id-ID)
- [ ] Vietnamese (vi-VN)
- [ ] Turkish (tr-TR)
- [ ] Polish (pl-PL)
- [ ] Hindi (hi-IN)
- [ ] Tamil (ta-IN)
- [ ] Telugu (te-IN)
- [ ] Marathi (mr-IN)
- [ ] Bengali (bn-BD)
- [ ] Urdu (ur-PK)
- [ ] Tagalog (tl-PH)
- [ ] Korean (ko-KR)
- [ ] Italian (it-IT)

#### Testing
- [ ] Verify all keys are used in components
- [ ] Test language switching in interview flow
- [ ] Verify RTL support for Arabic
- [ ] Check for missing translations
- [ ] Verify interpolation works (e.g., match scores, visa codes)

### Acceptance Criteria

- [ ] All interview questions available in all 23 languages
- [ ] All visa descriptions translated
- [ ] All form labels and validation messages translated
- [ ] All error messages and warnings translated
- [ ] No missing translation keys
- [ ] Language switching works throughout interview flow
- [ ] RTL layout works for Arabic
- [ ] Interpolated values (numbers, visa codes) display correctly
- [ ] No English text visible when using non-English locale

### Technical Notes

- Use professional translation service or AI translation with human review
- Maintain consistent terminology across all languages
- Test with actual speakers of each language if possible
- Some visa codes (like "H-1B") may remain in English
- Country names should use native language where appropriate
- Consider cultural appropriateness of phrasing

### Translation Strategy Options

1. **Professional Translation Service** (Recommended)
   - Most accurate
   - Most expensive
   - 1-2 weeks turnaround

2. **AI Translation + Human Review**
   - Use GPT-4 or similar for initial translation
   - Human reviewers verify accuracy
   - Balance of cost and quality

3. **Community Translation**
   - Recruit native speakers
   - More time-consuming
   - May have inconsistencies

### Dependencies

- **Depends on**: All frontend components completed (Issues #2, #3, #4, #6)
- **Independent**: Can be done after features work in English

### Related Files

- `/home/user/L4H/web/l4h/public/locales/*/interview.json`
- `/home/user/L4H/web/l4h/public/locales/*/visaLibrary.json`
- `/home/user/L4H/web/l4h/public/locales/*/forms.json`
- `/home/user/L4H/web/l4h/public/locales/*/errors.json`
- `/home/user/L4H/web/l4h/public/locales/*/auth.json`
- `/home/user/L4H/web/l4h/public/locales/*/common.json`

---

## Issue 8: Testing - Comprehensive Test Coverage for New Interview System

**Labels**: `testing`, `quality`, `medium-priority`

**Estimated Effort**: 8-12 hours

### Description

Create comprehensive test coverage for the new interview system including unit tests, integration tests, and end-to-end tests.

### Tasks

#### Unit Tests - Backend
- [ ] DecisionTreeVisaEligibilityService tests
  - [ ] Test each visa evaluation method (B-1, H-1B, EB-1, etc.)
  - [ ] Test eligibility scoring algorithm
  - [ ] Test met/unmet requirements tracking
  - [ ] Test edge cases (no answers, incomplete data)
  - [ ] Test VWP country checking
  - [ ] Test treaty country checking
  - [ ] Test age calculations
- [ ] Database entity tests
  - [ ] VisaEligibilityResult CRUD operations
  - [ ] Case attorney lock-in fields
  - [ ] VisaRecommendation eligibility status

#### Integration Tests - API
- [ ] Interview flow endpoints
  - [ ] Start interview (unauthenticated)
  - [ ] Submit answers
  - [ ] Get next question
  - [ ] Complete interview
  - [ ] Get results
- [ ] Cookie handling
  - [ ] Cookie creation and expiration
  - [ ] Cookie data transfer to database
- [ ] Attorney lock-in endpoints
  - [ ] Lock visa selection
  - [ ] Unlock visa selection
  - [ ] Get lock status
  - [ ] Lock status enforcement
- [ ] Registration flow
  - [ ] Transfer cookie data
  - [ ] Create user and profile
  - [ ] Store visa results

#### Unit Tests - Frontend
- [ ] Interview wizard component
  - [ ] Cookie state management
  - [ ] Forward/back navigation
  - [ ] Answer validation
  - [ ] Question branching logic
- [ ] Results page component
  - [ ] Eligible visa rendering
  - [ ] Potential visa rendering
  - [ ] No-eligible-visas handling
  - [ ] Sorting functionality
- [ ] Registration form component
  - [ ] Field validation
  - [ ] Address type switching (US/foreign)
  - [ ] Guardian email collection (under 18)
  - [ ] Form submission
- [ ] Dashboard component
  - [ ] Results display
  - [ ] Retake button functionality
  - [ ] Lock warning modal

#### Integration Tests - Frontend
- [ ] Interview to results flow
  - [ ] Complete interview
  - [ ] View results
  - [ ] Multiple visa display
- [ ] Results to registration flow
  - [ ] Continue from results
  - [ ] Cookie data transfer
  - [ ] Registration success
- [ ] Dashboard retake flow
  - [ ] Check lock status
  - [ ] Show warning if locked
  - [ ] Clear data and restart

#### End-to-End Tests
- [ ] Complete user journey (unauthenticated)
  - [ ] Start interview
  - [ ] Answer all questions
  - [ ] View results
  - [ ] Register account
  - [ ] See results on dashboard
- [ ] Retake interview journey
  - [ ] Login as existing user
  - [ ] Click retake on dashboard
  - [ ] Complete new interview
  - [ ] See updated results
- [ ] Attorney lock-in journey
  - [ ] Attorney locks visa for client
  - [ ] Client attempts retake
  - [ ] Warning modal appears
  - [ ] Client confirms retake
  - [ ] Interview completes
  - [ ] Lock is cleared
- [ ] No eligible visas journey
  - [ ] Answer questions leading to no eligibility
  - [ ] See "cannot assist" message
  - [ ] No registration form shown
  - [ ] Retake option available

#### Localization Tests
- [ ] Test all 23 languages
  - [ ] Interview questions display in correct language
  - [ ] Visa descriptions display in correct language
  - [ ] Error messages display in correct language
  - [ ] Number formatting appropriate for locale
- [ ] RTL layout test for Arabic
- [ ] Language switching mid-interview

#### Mobile Tests
- [ ] Interview wizard on mobile
  - [ ] Small screen layout (320px)
  - [ ] Touch interactions
  - [ ] Keyboard behavior
- [ ] Results page on mobile
- [ ] Registration form on mobile
- [ ] Dashboard on mobile

#### Performance Tests
- [ ] Interview wizard load time
- [ ] Results page load time with many visas
- [ ] Database query performance for eligibility evaluation
- [ ] Cookie read/write performance

### Acceptance Criteria

- [ ] Unit test coverage ≥ 80% for new code
- [ ] All critical paths have integration tests
- [ ] All user journeys have E2E tests
- [ ] All 23 locales tested
- [ ] Mobile responsiveness verified
- [ ] Performance benchmarks met
- [ ] No flaky tests
- [ ] Tests run in CI/CD pipeline
- [ ] Test documentation complete

### Technical Notes

#### Testing Stack
- Backend: xUnit, Moq, FluentAssertions
- Frontend: Jest, React Testing Library
- E2E: Playwright or Cypress
- API: Postman/Newman or REST Client

#### Test Data
- Create seed data for all visa types
- Mock user profiles with various demographics
- Sample interview answer sets for different scenarios

#### CI/CD Integration
- Run unit tests on every commit
- Run integration tests on PR
- Run E2E tests nightly or before deployment
- Fail build if coverage drops below threshold

### Dependencies

- **Depends on**: All other issues (Issues #1-7)
- **Should be done**: Incrementally alongside feature development

### Related Files

- `/home/user/L4H/src/infrastructure/Services/DecisionTreeVisaEligibilityService.cs`
- `/home/user/L4H/src/api/Controllers/InterviewController.cs`
- `/home/user/L4H/web/l4h/src/pages/InterviewWizardPage.tsx`
- All test files to be created in `tests/` directories

---

## Summary

These 8 issues represent the complete remaining work for the new interview system implementation:

1. **Issue #1**: API Endpoints (4-6 hours) - HIGH PRIORITY
2. **Issue #2**: Interview Wizard Frontend (8-12 hours) - HIGH PRIORITY
3. **Issue #3**: Results Page Frontend (4-6 hours) - HIGH PRIORITY
4. **Issue #4**: Single-Page Registration (6-8 hours) - HIGH PRIORITY
5. **Issue #5**: Attorney Lock-In (4-6 hours) - MEDIUM PRIORITY
6. **Issue #6**: Dashboard Updates (3-4 hours) - MEDIUM PRIORITY
7. **Issue #7**: Localization (10-15 hours) - LOW PRIORITY
8. **Issue #8**: Testing (8-12 hours) - MEDIUM PRIORITY

**Total Estimated Effort**: 47-69 hours

### Recommended Implementation Order

1. Issue #1 (API Endpoints) - Blocks everything else
2. Issue #2 (Interview Wizard) + Issue #3 (Results Page) - Can work in parallel
3. Issue #4 (Registration) - Depends on #3
4. Issue #6 (Dashboard) - Depends on #3
5. Issue #5 (Attorney Lock-In) - Can be done anytime after #1
6. Issue #7 (Localization) - Can be done last
7. Issue #8 (Testing) - Should be done incrementally throughout

### Branch Strategy

Each issue should be developed in its own feature branch:
- `feature/interview-api-endpoints`
- `feature/interview-wizard-frontend`
- `feature/visa-results-page`
- `feature/single-page-registration`
- `feature/attorney-lock-in`
- `feature/dashboard-updates`
- `feature/interview-localization`
- `feature/interview-testing`

Each branch should:
1. Branch from `main` or development branch
2. Have a corresponding PR
3. Be reviewed before merging
4. Include tests (especially for Issues #1-6)
5. Update documentation as needed
