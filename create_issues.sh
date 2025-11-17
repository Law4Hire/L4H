echo "Creating GitHub issues for new interview system..."

echo ""

# Issue 1: API Endpoints

echo "Creating Issue #1: API Endpoints..."

gh issue create --title "API Endpoints: Update InterviewController for new eligibility service" --label "backend,enhancement,high-priority" --body-file - <<'EOF'

## Overview
Update the InterviewController to use the new DecisionTreeVisaEligibilityService and support the new multi-visa eligibility flow.

## Context
The backend foundation has been implemented:
- ✅ DecisionTreeVisaEligibilityService created
- ✅ VisaEligibilityResult entity added
- ✅ Attorney lock-in fields added to Case entity

## Tasks
- [ ] Update InterviewController to inject DecisionTreeVisaEligibilityService
- [ ] Create endpoint for unauthenticated interview start (cookie-based session)
- [ ] Create endpoint for submitting answers (update cookie)
- [ ] Create endpoint for getting next question based on answers
- [ ] Create endpoint for completing interview and getting all eligible visas
- [ ] Create endpoint for fetching multiple visa results for a session
- [ ] Create endpoint for attorney to lock visa selection
- [ ] Create endpoint for checking lock status before retake
- [ ] Update registration flow to support post-interview signup
- [ ] Add DTO models for multi-visa results
- [ ] Update response models to include match scores and rationales
- [ ] Add proper error handling for edge cases
 
## Acceptance Criteria
- [ ] Unauthenticated users can start interview with cookie storage
- [ ] Returns multiple eligible/potential visas
- [ ] Includes eligibility status, match score, and rationale
- [ ] Attorney can lock visa selection
- [ ] Registration transfers cookie data to database
 
**Estimated Effort**: 4-6 hours
 
**Related Files**: `InterviewController.cs`, `DecisionTreeVisaEligibilityService.cs`
EOF
echo ""
# Issue 2: Interview Wizard
echo "Creating Issue #2: Interview Wizard..."
gh issue create --title "Frontend: Interview Wizard Component with Cookie State" --label "frontend,enhancement,high-priority" --body-file - <<'EOF'
## Overview
Create step-by-step interview wizard with forward/back navigation and cookie-based state persistence.
 
## Tasks
- [ ] Create InterviewWizardPage.tsx component
- [ ] Implement cookie-based state management (24-hour expiration)
- [ ] Build forward/back navigation with validation
- [ ] Create question components (radio, checkbox, text, date, select)
- [ ] Implement question branching logic from decision tree
- [ ] Add progress indicator
- [ ] Handle unauthenticated user flow
- [ ] Mobile-responsive design
 
## Acceptance Criteria
- [ ] Unauthenticated users can complete interview
- [ ] Progress persists in cookies across page refresh
- [ ] Forward/back navigation works correctly
- [ ] Questions branch based on answers
- [ ] Mobile and desktop layouts work
 
**Estimated Effort**: 8-12 hours
 
**Depends on**: API Endpoints (#1)
EOF
echo ""
# Issue 3: Results Page
echo "Creating Issue #3: Results Page..."
gh issue create --title "Frontend: Visa Results Page with Eligible/Potential Distinction" --label "frontend,enhancement,high-priority" --body-file - <<'EOF'
## Overview
Display multiple eligible (green) and potentially eligible (yellow) visa types with match scores and rationales.
 
## Tasks
- [ ] Create VisaResultsPage.tsx component
- [ ] Display eligible visas with green badges
- [ ] Display potentially eligible visas with yellow badges
- [ ] Show match scores and rationales
- [ ] Handle "no eligible visas" case
- [ ] Add sorting options (match score, category, alphabetical)
- [ ] Call-to-action buttons (Register, Schedule, Retake)
- [ ] Expandable visa details
- [ ] Mobile-responsive design
 
## Acceptance Criteria
- [ ] Eligible visas shown with green indicator
- [ ] Potential visas shown with yellow indicator
- [ ] Match scores and rationales displayed
- [ ] No-eligible-visas case handled gracefully
- [ ] Registration flow initiated correctly
 
**Estimated Effort**: 4-6 hours
 
**Depends on**: API Endpoints (#1)
EOF
echo ""
# Issue 4: Single-Page Registration
echo "Creating Issue #4: Single-Page Registration..."
gh issue create --title "Frontend: Single-Page Registration Form (Mobile Optimized)" --label "frontend,enhancement,high-priority" --body-file - <<'EOF'
## Overview
Redesign registration as single-page form combining email/password/name with profile, optimized for web and mobile.
 
## Tasks
- [ ] Create SinglePageRegistrationPage.tsx
- [ ] Design responsive form layout
- [ ] Implement all registration fields (name, email, password, phone, DOB, etc.)
- [ ] Implement address fields (US vs foreign)
- [ ] Add field validation
- [ ] Implement cookie data transfer to database
- [ ] Guardian email collection (if under 18)
- [ ] Error handling and loading states
- [ ] React Native compatibility
 
## Acceptance Criteria
- [ ] All fields render on mobile and desktop
- [ ] Form usable on 320px width
- [ ] Validation works for all fields
- [ ] Interview cookie data transferred to database
- [ ] Creates user and stores all data correctly
- [ ] Redirects to dashboard on success
 
**Estimated Effort**: 6-8 hours
 
**Depends on**: Results Page (#3)
EOF
echo ""
# Issue 5: Attorney Lock-In
echo "Creating Issue #5: Attorney Lock-In..."
gh issue create --title "Attorney Lock-In Workflow and UI" --label "frontend,backend,enhancement,medium-priority" --body-file - <<'EOF'
## Overview
Allow attorneys to select and lock a specific visa type, with warnings on client retake attempts.
 
## Tasks
### Backend
- [ ] Add lock/unlock visa endpoints
- [ ] Add lock status endpoint
- [ ] Require attorney authentication
- [ ] Audit logging
 
### Frontend - Admin
- [ ] Visa selection UI in admin dashboard
- [ ] Unlock capability (admin only)
- [ ] Display lock metadata
 
### Frontend - Client
- [ ] Lock status check before retake
- [ ] Warning modal if locked
- [ ] Dashboard lock status display
 
## Acceptance Criteria
- [ ] Attorneys can lock visa selection
- [ ] Lock persists with metadata (who, when)
- [ ] Warning shown before retake
- [ ] Admins can unlock with audit trail
 
**Estimated Effort**: 4-6 hours
EOF
echo ""
# Issue 6: Dashboard Updates
echo "Creating Issue #6: Dashboard Updates..."
gh issue create --title "Dashboard Updates: Show Interview Results and Retake Option" --label "frontend,enhancement,medium-priority" --body-file - <<'EOF'
## Overview
Update dashboard to display interview results with eligible/potential visas and "Retake Interview" option.
 
## Tasks
- [ ] Add interview results section
- [ ] Display eligible/potential visas with badges
- [ ] Add "Retake Interview" button with lock check
- [ ] Display attorney-selected visa (if locked)
- [ ] Add "Schedule Consultation" CTA
- [ ] Add expandable visa details
- [ ] Handle no-interview-completed state
- [ ] Handle no-eligible-visas state
- [ ] Mobile responsive
 
## Acceptance Criteria
- [ ] Shows all eligible and potential visas
- [ ] Retake button checks lock status
- [ ] Attorney-selected visa highlighted
- [ ] All states handled gracefully
 
**Estimated Effort**: 3-4 hours
 
**Depends on**: Results Page (#3)
EOF
echo ""
# Issue 7: Localization
echo "Creating Issue #7: Localization..."
gh issue create --title "Localization: Translate Interview Content to 22 Languages" --label "i18n,enhancement,low-priority" --body-file - <<'EOF'
## Overview
Add localization keys for all interview content and translate to all 22 supported languages.
 
## Tasks
- [ ] Update interview.json with all questions (23 languages)
- [ ] Update visaLibrary.json with visa descriptions (23 languages)
- [ ] Update forms.json with new labels (23 languages)
- [ ] Update errors.json with new errors (23 languages)
- [ ] Update auth.json with registration strings (23 languages)
- [ ] Update common.json with shared strings (23 languages)
- [ ] Test all languages
- [ ] Verify RTL support for Arabic
 
**Languages**: English, Japanese, German, French, Spanish, Arabic, Chinese, Portuguese, Russian, Indonesian, Vietnamese, Turkish, Polish, Hindi, Tamil, Telugu, Marathi, Bengali, Urdu, Tagalog, Korean, Italian
 
## Acceptance Criteria
- [ ] All content available in all 23 languages
- [ ] No missing translation keys
- [ ] Language switching works throughout flow
- [ ] RTL layout works for Arabic
 
**Estimated Effort**: 10-15 hours
EOF
echo ""
# Issue 8: Testing
echo "Creating Issue #8: Testing..."
gh issue create --title "Testing: Comprehensive Test Coverage for Interview System" --label "testing,quality,medium-priority" --body-file - <<'EOF'
## Overview
Create comprehensive test coverage including unit, integration, and E2E tests.
 
## Tasks
- [ ] Backend unit tests (eligibility service, entities)
- [ ] API integration tests (endpoints, cookie handling)
- [ ] Frontend unit tests (components, hooks)
- [ ] Frontend integration tests (flows)
- [ ] E2E tests (complete user journeys)
- [ ] Localization tests (all 23 languages)
- [ ] Mobile tests
- [ ] Performance tests
 
## Acceptance Criteria
- [ ] Unit test coverage ≥ 80%
- [ ] All critical paths have integration tests
- [ ] All user journeys have E2E tests
- [ ] All 23 locales tested
- [ ] Mobile responsiveness verified
- [ ] Tests run in CI/CD pipeline
 
**Estimated Effort**: 8-12 hours
 
**Should be done**: Incrementally alongside features
EOF
 
echo ""
echo "✅ All GitHub issues created successfully!"
echo ""
echo "View issues at: https://github.com/Law4Hire/L4H/issues"