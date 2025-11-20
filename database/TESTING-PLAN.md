# Decision Tree Interview System - Comprehensive Testing Plan

## Overview

This document outlines the complete testing strategy for the refactored decision tree interview system. The system implements a hierarchical interview flow: Location → Status → Category → Subcategory → Checklist → Evaluation → Contact.

## Test Environment Setup

### Prerequisites
- API running on port 8765
- Frontend running on port 5175
- Database seeded with all visa types and questions
- Clean session state for each test

### Tools Required
- CURL for API testing
- Browser DevTools for frontend testing
- Postman/Thunder Client (optional)
- Database query tool for validation

## Testing Phases

### Phase 1: API Endpoint Testing

#### 1.1 Interview Start Endpoint
**Endpoint**: POST `/api/interview/anonymous/start`

**Test Cases**:
```bash
# TC-1.1.1: Start interview without language code
curl -X POST http://localhost:8765/api/interview/anonymous/start \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected Response:
# - sessionToken (GUID)
# - sessionId (GUID)
# - firstQuestion.key = "location"
# - firstQuestion.category = "status"
# - firstQuestion.inputType = "radio"
# - firstQuestion.options contains: inside_us, outside_us

# TC-1.1.2: Start interview with language code
curl -X POST http://localhost:8765/api/interview/anonymous/start \
  -H "Content-Type: application/json" \
  -d '{"languageCode":"es"}'

# Expected Response:
# - Same structure as TC-1.1.1
# - Session created with Spanish language preference
```

**Validation**:
- ✅ Session created in database with unique GUID
- ✅ AnonymousToken is set and matches sessionToken in response
- ✅ First question is always "location"
- ✅ CreatedAt timestamp is set

#### 1.2 Answer Submission Endpoint
**Endpoint**: POST `/api/interview/anonymous/answer`

**Test Cases**:

```bash
# TC-1.2.1: Submit location answer
TOKEN="[SESSION_TOKEN_FROM_START]"
curl -X POST http://localhost:8765/api/interview/anonymous/answer \
  -H "Content-Type: application/json" \
  -d "{\"sessionToken\":\"$TOKEN\",\"questionKey\":\"location\",\"answer\":\"inside_us\"}"

# Expected Response:
# - isComplete = false
# - nextQuestion.key = "status"
# - totalAnswers = 1

# TC-1.2.2: Submit status answer (immigrant)
curl -X POST http://localhost:8765/api/interview/anonymous/answer \
  -H "Content-Type: application/json" \
  -d "{\"sessionToken\":\"$TOKEN\",\"questionKey\":\"status\",\"answer\":\"immigrant\"}"

# Expected Response:
# - isComplete = false
# - nextQuestion.key = "category"
# - nextQuestion.options contains: employment_based, family_based, diversity

# TC-1.2.3: Submit category answer (employment_based)
curl -X POST http://localhost:8765/api/interview/anonymous/answer \
  -H "Content-Type: application/json" \
  -d "{\"sessionToken\":\"$TOKEN\",\"questionKey\":\"category\",\"answer\":\"employment_based\"}"

# Expected Response:
# - isComplete = false
# - nextQuestion.key = "subcategory"
# - nextQuestion.options contains: eb1_extraordinary, eb2_niw, eb3_skilled

# TC-1.2.4: Submit subcategory answer (eb2_niw)
curl -X POST http://localhost:8765/api/interview/anonymous/answer \
  -H "Content-Type: application/json" \
  -d "{\"sessionToken\":\"$TOKEN\",\"questionKey\":\"subcategory\",\"answer\":\"eb2_niw\"}"

# Expected Response:
# - isComplete = false
# - nextQuestion.key = "checklist_advanced_degree"
# - nextQuestion.category = "checklist"
# - Checklist questions begin for EB-2 NIW

# TC-1.2.5: Submit all checklist answers
# (Continue submitting checklist_* answers until all 8 EB-2 NIW questions answered)

# TC-1.2.6: Last checklist answer
# Expected Response:
# - isComplete = false
# - isChecklistComplete = true
# - checklistProgress = 8
# - checklistTotal = 8
# - evaluation object present with:
#   - visaType = "EB-2 NIW"
#   - status (Recommended/Possible/Not Recommended)
#   - matchScore (0-100)
#   - explanation
#   - strengths, concerns, nextSteps
#   - showContactForm = true

# TC-1.2.7: Submit contact information
curl -X POST http://localhost:8765/api/interview/anonymous/answer \
  -H "Content-Type: application/json" \
  -d "{\"sessionToken\":\"$TOKEN\",\"questionKey\":\"full_name\",\"answer\":\"John Doe\"}"

# TC-1.2.8: Complete all contact questions
# Expected final response:
# - isComplete = true
# - nextQuestion = null
```

**Validation**:
- ✅ Each answer is saved to InterviewAnswers table
- ✅ AnsweredAt timestamp is set
- ✅ Question progression follows decision tree logic
- ✅ Checklist completion triggers evaluation
- ✅ Evaluation includes all required fields
- ✅ Contact questions appear after evaluation

#### 1.3 Session Resume Endpoint
**Endpoint**: POST `/api/interview/anonymous/resume`

**Test Cases**:

```bash
# TC-1.3.1: Resume incomplete session (mid-checklist)
curl -X POST http://localhost:8765/api/interview/anonymous/resume \
  -H "Content-Type: application/json" \
  -d "{\"sessionToken\":\"$TOKEN\"}"

# Expected Response:
# - sessionId matches
# - previousAnswers array contains all submitted answers
# - nextQuestion is the next unanswered question in sequence
# - isComplete = false

# TC-1.3.2: Resume completed session
# Expected Response:
# - isComplete = true
# - evaluations array present with final results
# - nextQuestion = null
```

**Validation**:
- ✅ All previous answers returned in order
- ✅ Next question calculated correctly based on current state
- ✅ Session state persists across resume calls

### Phase 2: Visa Path Integration Testing

Test complete end-to-end flows for all major visa types.

#### 2.1 H-1B Specialty Occupation (Work Visa)
**Path**: Location (inside_us) → Status (nonimmigrant) → Category (work_visas) → Subcategory (h1b_specialty)

**Checklist Questions** (6 total):
1. bachelor_degree
2. specialized_job_offer
3. employer_sponsorship
4. specialized_occupation
5. prevailing_wage
6. cap_timing

**Test Script**:
```bash
# Start session
RESPONSE=$(curl -s -X POST http://localhost:8765/api/interview/anonymous/start -H "Content-Type: application/json" -d '{}')
TOKEN=$(echo $RESPONSE | jq -r '.sessionToken')

# Answer sequence
curl -X POST http://localhost:8765/api/interview/anonymous/answer -H "Content-Type: application/json" -d "{\"sessionToken\":\"$TOKEN\",\"questionKey\":\"location\",\"answer\":\"inside_us\"}"
curl -X POST http://localhost:8765/api/interview/anonymous/answer -H "Content-Type: application/json" -d "{\"sessionToken\":\"$TOKEN\",\"questionKey\":\"status\",\"answer\":\"nonimmigrant\"}"
curl -X POST http://localhost:8765/api/interview/anonymous/answer -H "Content-Type: application/json" -d "{\"sessionToken\":\"$TOKEN\",\"questionKey\":\"category\",\"answer\":\"work_visas\"}"
curl -X POST http://localhost:8765/api/interview/anonymous/answer -H "Content-Type: application/json" -d "{\"sessionToken\":\"$TOKEN\",\"questionKey\":\"subcategory\",\"answer\":\"h1b_specialty\"}"

# Checklist answers
curl -X POST http://localhost:8765/api/interview/anonymous/answer -H "Content-Type: application/json" -d "{\"sessionToken\":\"$TOKEN\",\"questionKey\":\"checklist_bachelor_degree\",\"answer\":\"yes\"}"
curl -X POST http://localhost:8765/api/interview/anonymous/answer -H "Content-Type: application/json" -d "{\"sessionToken\":\"$TOKEN\",\"questionKey\":\"checklist_specialized_job_offer\",\"answer\":\"yes\"}"
curl -X POST http://localhost:8765/api/interview/anonymous/answer -H "Content-Type: application/json" -d "{\"sessionToken\":\"$TOKEN\",\"questionKey\":\"checklist_employer_sponsorship\",\"answer\":\"yes\"}"
curl -X POST http://localhost:8765/api/interview/anonymous/answer -H "Content-Type: application/json" -d "{\"sessionToken\":\"$TOKEN\",\"questionKey\":\"checklist_specialized_occupation\",\"answer\":\"yes\"}"
curl -X POST http://localhost:8765/api/interview/anonymous/answer -H "Content-Type: application/json" -d "{\"sessionToken\":\"$TOKEN\",\"questionKey\":\"checklist_prevailing_wage\",\"answer\":\"yes\"}"

# Last checklist answer - should trigger evaluation
EVAL_RESPONSE=$(curl -s -X POST http://localhost:8765/api/interview/anonymous/answer -H "Content-Type: application/json" -d "{\"sessionToken\":\"$TOKEN\",\"questionKey\":\"checklist_cap_timing\",\"answer\":\"yes\"}")

echo "Evaluation Response:"
echo $EVAL_RESPONSE | jq '.'

# Verify evaluation present
echo $EVAL_RESPONSE | jq '.evaluation'

# Contact information
curl -X POST http://localhost:8765/api/interview/anonymous/answer -H "Content-Type: application/json" -d "{\"sessionToken\":\"$TOKEN\",\"questionKey\":\"full_name\",\"answer\":\"John Doe\"}"
curl -X POST http://localhost:8765/api/interview/anonymous/answer -H "Content-Type: application/json" -d "{\"sessionToken\":\"$TOKEN\",\"questionKey\":\"email\",\"answer\":\"john@example.com\"}"
curl -X POST http://localhost:8765/api/interview/anonymous/answer -H "Content-Type: application/json" -d "{\"sessionToken\":\"$TOKEN\",\"questionKey\":\"phone\",\"answer\":\"+1-555-123-4567\"}"
curl -X POST http://localhost:8765/api/interview/anonymous/answer -H "Content-Type: application/json" -d "{\"sessionToken\":\"$TOKEN\",\"questionKey\":\"current_country\",\"answer\":\"United States\"}"

# Foreign address question should be skipped since location=inside_us
FINAL_RESPONSE=$(curl -s -X POST http://localhost:8765/api/interview/anonymous/answer -H "Content-Type: application/json" -d "{\"sessionToken\":\"$TOKEN\",\"questionKey\":\"preferred_language\",\"answer\":\"English\"}")

echo "Final Response:"
echo $FINAL_RESPONSE | jq '.'
```

**Validation**:
- ✅ All 6 checklist questions presented in sequence
- ✅ Evaluation triggered after last checklist answer
- ✅ Evaluation shows "Recommended" status (all yes answers)
- ✅ Contact questions follow evaluation
- ✅ Session marked complete after all contact info
- ✅ Foreign address skipped for inside_us location

#### 2.2 EB-2 NIW (Employment-Based Green Card)
**Path**: Location (inside_us) → Status (immigrant) → Category (employment_based) → Subcategory (eb2_niw)

**Checklist Questions** (8 total):
1. advanced_degree
2. exceptional_ability
3. substantial_merit
4. national_importance
5. well_positioned
6. waiver_benefit
7. achievements
8. publications

**Test Script**: Similar to H-1B but with EB-2 NIW path

**Validation**:
- ✅ All 8 checklist questions presented
- ✅ Evaluation accounts for advanced degree and exceptional ability
- ✅ Match score higher for candidates with publications and achievements
- ✅ Missing information identified for weak areas

#### 2.3 F-1 Student Visa
**Path**: Location (outside_us) → Status (nonimmigrant) → Category (student_visas) → Subcategory (f1_academic)

**Checklist Questions** (7 total):
1. accepted_school
2. sevis_form
3. financial_proof
4. ties_home_country
5. english_proficiency
6. intent_return
7. no_immigrant_intent

**Test Script**: F-1 specific path

**Validation**:
- ✅ Foreign address question appears (location=outside_us)
- ✅ Evaluation emphasizes ties to home country
- ✅ Financial proof requirements clearly stated

#### 2.4 Family-Based Immigration (IR-1 Immediate Relative)
**Path**: Location (inside_us) → Status (immigrant) → Category (family_based) → Subcategory (ir1_spouse)

**Checklist Questions** (6 total):
1. us_citizen_spouse
2. valid_marriage
3. no_prior_fraud
4. financial_support
5. medical_exam
6. police_clearance

**Test Script**: IR-1 specific path

**Validation**:
- ✅ Relationship verification emphasized
- ✅ Financial support requirements calculated
- ✅ Processing time estimates provided

#### 2.5 B-1/B-2 Visitor Visa
**Path**: Location (outside_us) → Status (nonimmigrant) → Category (visitor_visas) → Subcategory (b2_tourist)

**Checklist Questions** (5 total):
1. purpose_visit
2. return_ticket
3. ties_home_country
4. financial_ability
5. no_immigrant_intent

**Test Script**: B-2 tourist visa path

**Validation**:
- ✅ Temporary visit intent verified
- ✅ Ties to home country emphasized
- ✅ Financial ability assessed

### Phase 3: Edge Case Testing

#### 3.1 Incomplete Checklist
**Test**: Submit some but not all checklist questions

**Expected Behavior**:
- Continue button disabled until all checklist questions answered
- Progress indicator shows X/Y questions completed
- Evaluation NOT triggered until all answered

#### 3.2 Back Button Navigation
**Test**: Use browser back button at various stages

**Expected Behavior**:
- Session state preserved
- Previous answers visible
- Can change previous answers
- Forward navigation updates answers

#### 3.3 Session Timeout
**Test**: Leave session inactive for extended period

**Expected Behavior**:
- Session remains valid (no timeout currently implemented)
- Resume works correctly
- All answers preserved

#### 3.4 Invalid Session Token
**Test**: Submit answer with non-existent session token

```bash
curl -X POST http://localhost:8765/api/interview/anonymous/answer \
  -H "Content-Type: application/json" \
  -d '{"sessionToken":"00000000-0000-0000-0000-000000000000","questionKey":"location","answer":"inside_us"}'
```

**Expected Behavior**:
- 400 Bad Request or 404 Not Found
- Error message: "Session not found"

#### 3.5 Invalid Question Key
**Test**: Submit answer for non-existent question

```bash
curl -X POST http://localhost:8765/api/interview/anonymous/answer \
  -H "Content-Type: application/json" \
  -d "{\"sessionToken\":\"$TOKEN\",\"questionKey\":\"invalid_question\",\"answer\":\"test\"}"
```

**Expected Behavior**:
- Error handling in question engine
- Clear error message returned

#### 3.6 Invalid Answer Value
**Test**: Submit answer not in allowed options

```bash
curl -X POST http://localhost:8765/api/interview/anonymous/answer \
  -H "Content-Type: application/json" \
  -d "{\"sessionToken\":\"$TOKEN\",\"questionKey\":\"location\",\"answer\":\"invalid_value\"}"
```

**Expected Behavior**:
- Validation error
- List of valid options in error message

### Phase 4: Status Category Testing

Test all 6 status categories to ensure proper category/subcategory options:

#### 4.1 Immigrant Status
**Categories Available**:
- employment_based (EB-1, EB-2 NIW, EB-3)
- family_based (IR-1, IR-2, F2A, F2B)
- diversity (DV Lottery)

#### 4.2 Nonimmigrant Status
**Categories Available**:
- work_visas (H-1B, L-1, O-1, TN)
- student_visas (F-1, M-1, J-1)
- visitor_visas (B-1, B-2)
- exchange_visas (J-1)

#### 4.3 US Citizen Status
**Categories Available**:
- family_petition (helping family member)

#### 4.4 Investor Status
**Categories Available**:
- eb5_investor (EB-5 program)

#### 4.5 Asylum/Refugee Status
**Categories Available**:
- asylum (affirmative, defensive)

#### 4.6 Undocumented Status
**Categories Available**:
- daca, tps, cancellation_removal

**Test Each Path**:
```bash
# Template for each status
curl -X POST http://localhost:8765/api/interview/anonymous/answer \
  -H "Content-Type: application/json" \
  -d "{\"sessionToken\":\"$TOKEN\",\"questionKey\":\"status\",\"answer\":\"[STATUS]\"}"
```

**Validation**:
- ✅ Category options match status
- ✅ Subcategories correctly filtered by category
- ✅ Checklists appropriate for visa type

### Phase 5: Database Validation

After completing each test path, validate database state:

```sql
-- Verify session created
SELECT * FROM InterviewSessions WHERE Id = '[SESSION_ID]';

-- Verify all answers saved
SELECT * FROM InterviewAnswers WHERE SessionId = '[SESSION_ID]' ORDER BY AnsweredAt;

-- Verify evaluation created (if complete)
SELECT * FROM VisaEvaluations WHERE SessionId = '[SESSION_ID]';

-- Count answers by category
SELECT
    CASE
        WHEN QuestionKey = 'location' THEN 'Location'
        WHEN QuestionKey = 'status' THEN 'Status'
        WHEN QuestionKey = 'category' THEN 'Category'
        WHEN QuestionKey = 'subcategory' THEN 'Subcategory'
        WHEN QuestionKey LIKE 'checklist_%' THEN 'Checklist'
        ELSE 'Contact'
    END AS QuestionType,
    COUNT(*) AS AnswerCount
FROM InterviewAnswers
WHERE SessionId = '[SESSION_ID]'
GROUP BY CASE
    WHEN QuestionKey = 'location' THEN 'Location'
    WHEN QuestionKey = 'status' THEN 'Status'
    WHEN QuestionKey = 'category' THEN 'Category'
    WHEN QuestionKey = 'subcategory' THEN 'Subcategory'
    WHEN QuestionKey LIKE 'checklist_%' THEN 'Checklist'
    ELSE 'Contact'
END;
```

### Phase 6: Frontend Integration Testing

#### 6.1 UI Component Testing
- ✅ Interview page loads without errors
- ✅ First question displays correctly
- ✅ Radio buttons render for single-choice questions
- ✅ Progress indicator updates
- ✅ Continue button enables/disables appropriately
- ✅ Back button navigates to previous question
- ✅ Evaluation summary displays after checklist
- ✅ Contact form appears after evaluation
- ✅ Success page displays on completion

#### 6.2 State Management
- ✅ Session token stored in state/localStorage
- ✅ Answers cached locally during session
- ✅ Browser refresh preserves session
- ✅ Back navigation updates state correctly

#### 6.3 Error Handling
- ✅ Network errors display user-friendly message
- ✅ API errors show specific error message
- ✅ Loading states prevent double-submission
- ✅ Retry mechanism for failed requests

### Phase 7: Performance Testing

#### 7.1 Response Time
- ✅ Start interview: <500ms
- ✅ Submit answer: <300ms
- ✅ Resume session: <500ms
- ✅ Complete interview: <1s

#### 7.2 Concurrent Users
- Test 10 simultaneous interview sessions
- Verify no session cross-contamination
- Check database connection pool handling

#### 7.3 Large Dataset
- Test with 100+ completed sessions
- Verify query performance
- Check for N+1 query issues

## Test Execution Checklist

### Pre-Testing
- [ ] Database seeded with all visa types
- [ ] API running on port 8765
- [ ] Frontend running on port 5175
- [ ] All dependencies installed
- [ ] Test data scripts ready

### API Testing
- [ ] TC-1.1.1: Start interview (no language)
- [ ] TC-1.1.2: Start interview (with language)
- [ ] TC-1.2.1-1.2.8: Complete H-1B path
- [ ] TC-1.3.1-1.3.2: Resume session tests

### Visa Path Testing
- [ ] 2.1: H-1B complete path
- [ ] 2.2: EB-2 NIW complete path
- [ ] 2.3: F-1 Student complete path
- [ ] 2.4: IR-1 Family complete path
- [ ] 2.5: B-2 Visitor complete path

### Status Category Testing
- [ ] 4.1: Immigrant status paths
- [ ] 4.2: Nonimmigrant status paths
- [ ] 4.3: US Citizen paths
- [ ] 4.4: Investor paths
- [ ] 4.5: Asylum paths
- [ ] 4.6: Undocumented paths

### Edge Case Testing
- [ ] 3.1: Incomplete checklist handling
- [ ] 3.2: Back button navigation
- [ ] 3.3: Session timeout
- [ ] 3.4: Invalid session token
- [ ] 3.5: Invalid question key
- [ ] 3.6: Invalid answer value

### Database Validation
- [ ] 5.x: All database queries verified

### Frontend Testing
- [ ] 6.1: UI component rendering
- [ ] 6.2: State management
- [ ] 6.3: Error handling

### Performance Testing
- [ ] 7.1: Response time benchmarks
- [ ] 7.2: Concurrent user testing
- [ ] 7.3: Large dataset queries

## Bug Tracking Template

```
BUG ID: [UNIQUE-ID]
Test Case: [TC-X.X.X]
Severity: [Critical/High/Medium/Low]
Status: [Open/In Progress/Fixed/Closed]

Description:
[What went wrong]

Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Expected Result:
[What should happen]

Actual Result:
[What actually happened]

Environment:
- API Version: [version]
- Database: [version]
- Browser: [if frontend issue]

Notes:
[Additional context]
```

## Success Criteria

The testing phase is complete when:
- ✅ All 6 major visa paths work end-to-end
- ✅ All 6 status categories tested
- ✅ All edge cases handled gracefully
- ✅ Database state validates correctly
- ✅ Frontend integrates without errors
- ✅ Performance benchmarks met
- ✅ Zero critical bugs
- ✅ All high/medium bugs resolved or documented

## Test Results Summary

| Test Area | Total Tests | Passed | Failed | Pending |
|-----------|-------------|--------|--------|---------|
| API Endpoints | 15 | 0 | 0 | 15 |
| Visa Paths | 5 | 0 | 0 | 5 |
| Status Categories | 6 | 0 | 0 | 6 |
| Edge Cases | 6 | 0 | 0 | 6 |
| Database Validation | 10 | 0 | 0 | 10 |
| Frontend Integration | 12 | 0 | 0 | 12 |
| Performance | 3 | 0 | 0 | 3 |
| **TOTAL** | **57** | **0** | **0** | **57** |

---

**Document Status**: Created
**Last Updated**: 2025-01-20
**Next Review**: After initial test execution
