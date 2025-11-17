# Law4Hire Interview System Refactor Plan

**Date:** November 14, 2025
**Objective:** Simplify and unify the interview process, inspired by Boundless.com's approach, while supporting multiple visa types and professional locking capabilities.

---

## Executive Summary

### Current State
- **2,118-line monolithic controller** with conflicting flows
- **Three different visa evaluation systems** producing inconsistent results
- **Duplicate code** between authenticated and anonymous flows
- **Mixed completion paths** creating database inconsistencies
- **Feature creep** with adoption/citizenship embedded in main controller

### Proposed Solution
A clean, Boundless-inspired interview system that:
- Starts with a **simple, adaptive questionnaire** (5-10 minutes)
- Generates **multiple visa eligibility options** with clear explanations
- Allows users to **explore visa details** before committing
- Enables **legal professionals to lock** a specific visa recommendation
- Maintains **single source of truth** for all visa evaluations

### Success Metrics
- Reduce controller from 2,118 lines to <400 lines
- Eliminate all duplicate logic
- Single visa evaluation engine with consistent results
- Anonymous users can complete full interview without registration
- Legal professionals can review and lock recommendations
- 100% test coverage for core flows

---

## Part 1: Current State Analysis

### Major Problems Identified

#### **Problem 1: Conflicting Completion Flows**

**Current:** Three different ways to complete an interview:
```
Path A: POST /interview/complete → Creates VisaRecommendation (single)
Path B: POST /interview/next-question (when complete) → Creates VisaRecommendation (single)
Path C: POST /interview/results → Creates VisaEligibilityResult[] (multiple)
```

**Result:**
- Same session can have BOTH single recommendation AND multiple eligibility results
- Unclear which is "official"
- Confusion for case management, attorney dashboard, invoicing

#### **Problem 2: Three Different Visa Evaluation Systems**

```
System 1: AdaptiveInterviewService.GetRemainingVisaTypesAsync()
  Purpose: Filter visas for question progression
  Output: List<VisaType>
  Logic: Profile + answers → filter

System 2: InterviewRecommender.GetRecommendationAsync()
  Purpose: Final single recommendation
  Output: RecommendationResult (one visa)
  Logic: Rule-based (IF purpose=X THEN visa=Y)

System 3: DecisionTreeVisaEligibilityService.EvaluateEligibilityAsync()
  Purpose: Multi-visa evaluation
  Output: List<VisaEligibilityResult> with scores
  Logic: Decision tree with scoring
```

**Problem:** These three systems can recommend DIFFERENT visas for the same user answers!

#### **Problem 3: Duplicate Answer Logic**

70+ lines of identical code in:
- `POST /interview/answer` (authenticated) - lines 464-565
- `POST /interview/unauth/answer` (unauthenticated) - lines 330-452

#### **Problem 4: Session Management Chaos**

Three different cleanup approaches:
- `/start` deletes old sessions
- `/reset` cancels and creates new
- `/rerun` cancels all active sessions

#### **Problem 5: Multiple Lock States**

```csharp
session.Case.IsInterviewLocked = true;
latestRecommendation.LockedAt = DateTime.UtcNow;
caseEntity.IsVisaLockedByAttorney = true;
caseEntity.VisaLockedAt = DateTime.UtcNow;
```

**Problem:** Which lock takes precedence? How do they interact?

---

## Part 2: Boundless.com Insights

### What Boundless Does Well

1. **Simple 5-Minute Questionnaire**
   - Clean, progressive questions
   - No registration required to start
   - Adaptive based on previous answers

2. **Eligibility Determination**
   - Clear "you qualify" or "you don't qualify" message
   - Explanation of why you qualify
   - Multiple visa options if applicable

3. **Customized Path Generation**
   - Forms needed based on answers
   - Document checklist tailored to situation
   - Next steps clearly outlined

4. **Service Tiers**
   - DIY (forms only)
   - Essential (guided support)
   - Premium (attorney review)

5. **Progressive Enhancement**
   - Start free/anonymous
   - Upgrade to paid support when ready
   - Attorney involvement only when needed

### Key Principles to Adopt

1. **Simplicity First**: 5-10 minute questionnaire, not 20-30 minutes
2. **Anonymous by Default**: No login required until commitment
3. **Multiple Options**: Show all eligible visas, not just one
4. **Clear Value Proposition**: Why each visa fits their situation
5. **Professional Oversight**: Attorney can review/lock recommendation
6. **Progressive Disclosure**: Show complexity only when needed

---

## Part 3: Proposed New Architecture

### Design Philosophy

**Boundless-Inspired Flow:**
```
1. Anonymous User Arrives
   ↓
2. Simple Adaptive Interview (5-10 questions)
   ↓
3. Multi-Visa Eligibility Results
   - Show ALL eligible visa types
   - Sort by "best fit" score
   - Explain why each visa matches
   ↓
4. User Explores Options
   - Read visa details
   - Compare options
   - See required documents
   ↓
5. User Selects Preferred Visa
   ↓
6. Create Account & Case
   ↓
7. Attorney Reviews & Can Lock Recommendation
   ↓
8. Proceed to Service Package Selection
```

### New System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Interview System                          │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌──────────────────┐                  ┌──────────────────┐
│  Controllers     │                  │  Services Layer  │
└──────────────────┘                  └──────────────────┘
│                                     │
├─ InterviewController                ├─ InterviewOrchestrator
│  (Main interview flow)              │  (Coordinates all operations)
│  • Start                            │
│  • Answer                           ├─ QuestionEngine
│  • Results                          │  (Determines next question)
│  • Select Visa                      │
│                                     ├─ VisaEvaluationEngine
├─ InterviewAdminController           │  (Single source of truth)
│  (Attorney/admin operations)        │  • Filters visas by profile
│  • Review recommendations           │  • Scores visa matches
│  • Lock visa selection              │  • Generates recommendations
│  • Unlock visa selection            │
│  • View history                     ├─ SessionManager
│                                     │  (Session lifecycle)
├─ AdoptionController                 │  • Create/cleanup sessions
│  (Adoption-specific flow)           │  • Manage state
│  • Moved out of interview           │
│                                     └─ DocumentRequirements
├─ CitizenshipController                 (Document checklist)
│  (Citizenship-specific flow)           • Per visa type
│  • Moved out of interview              • Per user situation
└─────────────────────────────────────────────────────────────┘
```

### New Database Schema

**Simplified and Unified:**

```sql
-- Core Session (unchanged)
InterviewSession
  - Id (Guid, PK)
  - UserId (nullable, for anonymous)
  - CaseId (nullable, until registration)
  - Status (active, completed, expired)
  - StartedAt, CompletedAt
  - AnonymousToken (Guid, for tracking anonymous users)

-- Q&A Storage (unchanged)
InterviewQA
  - Id (Guid, PK)
  - SessionId (FK)
  - QuestionKey (string)
  - AnswerValue (string)
  - AnsweredAt

-- UNIFIED Visa Evaluation (NEW - replaces both VisaRecommendation and VisaEligibilityResult)
VisaEvaluation
  - Id (Guid, PK)
  - SessionId (FK)
  - VisaTypeId (FK)
  - EligibilityStatus (Eligible, Potential, NotEligible)
  - MatchScore (decimal, 0-100)
  - Rank (int, 1=best match)
  - Explanation (text, why this visa matches)
  - RequiredDocuments (JSON array)
  - IsUserSelected (bool, user chose this one)
  - IsAttorneyLocked (bool, attorney locked this one)
  - LockedByUserId (nullable FK to User)
  - LockedAt (nullable DateTime)
  - UnlockedAt (nullable DateTime)
  - CreatedAt

-- Remove these tables (consolidate into VisaEvaluation):
-- ❌ VisaRecommendation (old single recommendation)
-- ❌ VisaEligibilityResult (old multi-visa results)
```

**Key Changes:**
- **Single table** for all visa evaluations (no more confusion)
- **Both user selection and attorney locking** in same entity
- **Explanation and documents** stored with each evaluation
- **Clear status hierarchy**: NotEligible < Potential < Eligible

---

## Part 4: New Flow Details

### Flow 1: Anonymous Interview (Primary Path)

```
POST /api/v1/interview/start-anonymous
  → Returns: { sessionId, anonymousToken, firstQuestion }

POST /api/v1/interview/answer
  Body: { sessionId, anonymousToken, questionKey, answerValue }
  → Returns: { nextQuestion, remainingVisaCount, progress }

  Logic:
    1. Validate anonymousToken matches session
    2. Store answer
    3. Run VisaEvaluationEngine to filter visas
    4. Check if enough info gathered (remainingVisas ≤ 3 OR questions ≥ 8)
    5. If complete → return { completed: true }
    6. If not → return next question

POST /api/v1/interview/results
  Body: { sessionId, anonymousToken }
  → Returns: {
      eligibleVisas: [
        { visaType, matchScore, rank, explanation, documents }
      ],
      potentialVisas: [...],
      notEligibleVisas: [...]
    }

  Logic:
    1. Run VisaEvaluationEngine.EvaluateAll(answers)
    2. Create VisaEvaluation records for all results
    3. Mark session as completed
    4. Return sorted results (Eligible → Potential → NotEligible)

POST /api/v1/interview/select-visa
  Body: { sessionId, anonymousToken, visaTypeId }
  → Returns: { success: true, nextStep: "register" }

  Logic:
    1. Validate visa is in eligible or potential list
    2. Set IsUserSelected = true for chosen visa
    3. Return registration prompt

POST /api/v1/interview/register-with-interview
  Body: { sessionId, anonymousToken, email, password, firstName, lastName }
  → Returns: { userId, caseId, jwtToken }

  Logic:
    1. Create user account
    2. Create case
    3. Link session to user & case
    4. Transfer all interview data
    5. Return JWT for authenticated session
```

### Flow 2: Attorney Review & Lock

```
GET /api/v1/interview/admin/pending-reviews
  → Returns: List of completed interviews awaiting attorney review

GET /api/v1/interview/admin/review/{sessionId}
  → Returns: Full interview details, answers, and visa evaluations

POST /api/v1/interview/admin/lock-visa
  Body: { sessionId, visaTypeId, lockReason }
  → Returns: { success: true }

  Logic:
    1. Verify requester is attorney/admin
    2. Set IsAttorneyLocked = true for selected visa
    3. Set IsAttorneyLocked = false for all others
    4. Record LockedByUserId and LockedAt
    5. Notify user of locked recommendation
    6. Update case status to "recommendation_locked"

POST /api/v1/interview/admin/unlock-visa
  Body: { sessionId, unlockReason }
  → Returns: { success: true }

  Logic:
    1. Verify requester is admin (higher privilege)
    2. Set IsAttorneyLocked = false
    3. Record UnlockedAt
    4. Allow user to re-select
```

### Flow 3: Authenticated User (Existing Client)

```
POST /api/v1/interview/start
  Headers: Authorization: Bearer <jwt>
  Body: { caseId }
  → Returns: { sessionId, firstQuestion }

  (Flow continues same as anonymous, but no anonymousToken needed)
```

---

## Part 5: Implementation Plan

### Phase 1: Foundation (Week 1)

**Goal:** Create new service layer without touching existing controller

#### Tasks:

1. **Create New Services**
   - `InterviewOrchestrator.cs` (main coordinator)
   - `QuestionEngine.cs` (determines next question)
   - `VisaEvaluationEngine.cs` (unified visa evaluation)
   - `SessionManager.cs` (session lifecycle)
   - `DocumentRequirements.cs` (document checklists)

2. **Create New Models**
   - `VisaEvaluation` entity
   - Simplified request/response DTOs
   - Clear separation: Anonymous vs Authenticated

3. **Database Migration**
   - Add `VisaEvaluation` table
   - Add `AnonymousToken` to `InterviewSession`
   - Add indexes for performance
   - Keep old tables for now (data preservation)

4. **Unit Tests**
   - Test QuestionEngine logic
   - Test VisaEvaluationEngine with known answer sets
   - Test SessionManager cleanup logic

**Deliverables:**
- ✅ New service layer fully tested
- ✅ Database schema updated
- ✅ Old system still works (no breaking changes)

---

### Phase 2: New Controller (Week 2)

**Goal:** Create parallel interview controller with new architecture

#### Tasks:

1. **Create InterviewV2Controller**
   - `/api/v2/interview/*` endpoints
   - Clean implementation using new services
   - Anonymous-first design
   - Comprehensive error handling

2. **Create InterviewAdminController**
   - `/api/v1/interview/admin/*` endpoints
   - Attorney review operations
   - Visa locking operations
   - Reporting endpoints

3. **API Documentation**
   - Swagger/OpenAPI for all endpoints
   - Example requests/responses
   - Error codes and handling

4. **Integration Tests**
   - Full flow: anonymous interview → results → registration
   - Attorney locking flow
   - Session expiration handling
   - Concurrent session handling

**Deliverables:**
- ✅ V2 controller fully functional
- ✅ Admin controller for attorneys
- ✅ Full API documentation
- ✅ Integration tests passing

---

### Phase 3: Frontend Refactor (Week 3)

**Goal:** Update React UI to use new V2 APIs

#### Tasks:

1. **Update InterviewPage.tsx**
   - Use V2 endpoints
   - Simplify state management
   - Add multi-visa results display
   - Add visa comparison UI
   - Improve error recovery

2. **Create New Components**
   - `VisaResultsCard.tsx` (display single visa option)
   - `VisaComparison.tsx` (compare multiple options)
   - `AttorneyReviewBadge.tsx` (show if locked by attorney)
   - `DocumentChecklist.tsx` (show required documents)

3. **Update Registration Flow**
   - Pass sessionId and anonymousToken
   - Auto-link interview data on registration
   - Seamless transition to authenticated state

4. **Attorney Dashboard**
   - List pending reviews
   - Review interview details
   - Lock/unlock recommendations
   - View history

**Deliverables:**
- ✅ Updated interview UI using V2 APIs
- ✅ New components for multi-visa display
- ✅ Attorney dashboard functional
- ✅ E2E tests for full user journey

---

### Phase 4: Migration & Cleanup (Week 4)

**Goal:** Migrate existing data and deprecate old system

#### Tasks:

1. **Data Migration Script**
   - Convert `VisaRecommendation` → `VisaEvaluation`
   - Convert `VisaEligibilityResult` → `VisaEvaluation`
   - Set rank and scores for historical data
   - Preserve all locked recommendations

2. **Deprecate Old Endpoints**
   - Add deprecation warnings to V1 endpoints
   - Update API documentation
   - Add redirect headers to V2 endpoints

3. **Extract Adoption/Citizenship**
   - Create `AdoptionController`
   - Create `CitizenshipController`
   - Move related services
   - Update frontend to use new endpoints

4. **Remove Old Code**
   - Delete old InterviewController (2,118 lines → 0)
   - Delete old services (InterviewRecommender, duplicate logic)
   - Remove old database tables
   - Clean up unused models

5. **Final Testing**
   - Full regression test suite
   - Performance testing
   - Load testing (100 concurrent users)
   - Security audit

**Deliverables:**
- ✅ All data migrated to new schema
- ✅ Old system removed
- ✅ Adoption/citizenship in separate controllers
- ✅ All tests passing
- ✅ Performance validated

---

## Part 6: Detailed Service Designs

### Service 1: VisaEvaluationEngine

**Responsibility:** Single source of truth for visa eligibility

```csharp
public interface IVisaEvaluationEngine
{
    // Main evaluation method
    Task<List<VisaEvaluationResult>> EvaluateAllVisasAsync(
        List<InterviewQA> answers,
        User user = null);

    // Get visas still in contention (for question progression)
    Task<List<VisaType>> GetRemainingVisasAsync(
        List<InterviewQA> answers,
        User user = null);

    // Check if we have enough info to complete
    Task<bool> HasSufficientInformationAsync(
        List<InterviewQA> answers,
        List<VisaType> remainingVisas);
}

public class VisaEvaluationEngine : IVisaEvaluationEngine
{
    private readonly IVisaRepository _visaRepo;
    private readonly IProfileFilter _profileFilter;
    private readonly IAnswerEvaluator _answerEvaluator;
    private readonly IVisaScorer _scorer;

    public async Task<List<VisaEvaluationResult>> EvaluateAllVisasAsync(
        List<InterviewQA> answers,
        User user = null)
    {
        // 1. Get all visa types
        var allVisas = await _visaRepo.GetAllActiveVisasAsync();

        // 2. Filter by user profile (age, nationality, marital status)
        var profileFiltered = _profileFilter.FilterByProfile(allVisas, user);

        // 3. Evaluate each visa against answers
        var evaluated = new List<VisaEvaluationResult>();
        foreach (var visa in profileFiltered)
        {
            var eligibility = _answerEvaluator.EvaluateVisa(visa, answers);
            var score = _scorer.CalculateMatchScore(visa, answers, eligibility);

            evaluated.Add(new VisaEvaluationResult
            {
                VisaType = visa,
                Status = eligibility.Status, // Eligible, Potential, NotEligible
                MatchScore = score,
                Explanation = eligibility.Explanation,
                MissingInfo = eligibility.MissingInfo,
                RequiredDocuments = visa.RequiredDocuments
            });
        }

        // 4. Sort by status (Eligible first) then score
        return evaluated
            .OrderBy(v => v.Status)
            .ThenByDescending(v => v.MatchScore)
            .Select((v, index) => { v.Rank = index + 1; return v; })
            .ToList();
    }
}
```

**Key Design Decisions:**

1. **Single evaluation method** eliminates conflicts
2. **Profile filtering first** (fast disqualification)
3. **Scoring system** provides clear ranking
4. **Explanation generation** helps users understand
5. **Missing info tracking** enables progressive questions

---

### Service 2: QuestionEngine

**Responsibility:** Determine next question adaptively

```csharp
public interface IQuestionEngine
{
    Task<InterviewQuestion> GetNextQuestionAsync(
        InterviewSession session,
        List<InterviewQA> answeredQuestions);

    Task<bool> IsCompleteAsync(
        List<VisaType> remainingVisas,
        int questionsAnswered);
}

public class QuestionEngine : IQuestionEngine
{
    private readonly IQuestionRepository _questionRepo;
    private readonly IVisaEvaluationEngine _evaluationEngine;

    public async Task<InterviewQuestion> GetNextQuestionAsync(
        InterviewSession session,
        List<InterviewQA> answeredQuestions)
    {
        // 1. Get remaining visas
        var remainingVisas = await _evaluationEngine
            .GetRemainingVisasAsync(answeredQuestions, session.User);

        // 2. Check if we can complete
        var canComplete = await IsCompleteAsync(remainingVisas, answeredQuestions.Count);
        if (canComplete)
        {
            return null; // Signal completion
        }

        // 3. Get all available questions
        var allQuestions = await _questionRepo.GetAllQuestionsAsync();

        // 4. Filter already answered
        var answeredKeys = answeredQuestions.Select(q => q.QuestionKey).ToHashSet();
        var unanswered = allQuestions.Where(q => !answeredKeys.Contains(q.Key)).ToList();

        // 5. Prioritize questions by category
        var prioritized = PrioritizeQuestions(unanswered, remainingVisas);

        // 6. Return highest priority
        return prioritized.FirstOrDefault();
    }

    private List<InterviewQuestion> PrioritizeQuestions(
        List<InterviewQuestion> questions,
        List<VisaType> remainingVisas)
    {
        // Priority order:
        // 1. Critical questions (purpose, eligibility)
        // 2. Visa-specific questions (if specific visa types remain)
        // 3. Refinement questions (for scoring)

        return questions
            .OrderBy(q => q.Category switch
            {
                "critical" => 1,
                "purpose" => 2,
                "employment" => 3,
                "family" => 4,
                "duration" => 5,
                "investment" => 6,
                "refinement" => 7,
                _ => 99
            })
            .ThenBy(q => q.Order)
            .ToList();
    }

    public async Task<bool> IsCompleteAsync(
        List<VisaType> remainingVisas,
        int questionsAnswered)
    {
        // Complete if:
        // - 3 or fewer visas remain (clear direction)
        // - OR 8+ questions answered (enough info)
        // - OR only NotEligible visas remain

        if (remainingVisas.Count <= 3) return true;
        if (questionsAnswered >= 8) return true;
        if (!remainingVisas.Any(v => v.IsCommerciallyAvailable)) return true;

        return false;
    }
}
```

**Key Design Decisions:**

1. **Adaptive termination** (don't ask unnecessary questions)
2. **Priority-based questioning** (most important first)
3. **Visa-aware** (ask citizenship questions only if N-400/N-600 remain)
4. **User-friendly** (stop at 8 questions unless needed)

---

### Service 3: InterviewOrchestrator

**Responsibility:** Coordinate the entire interview flow

```csharp
public interface IInterviewOrchestrator
{
    // Start interview
    Task<InterviewStartResult> StartAnonymousInterviewAsync();
    Task<InterviewStartResult> StartAuthenticatedInterviewAsync(Guid userId, Guid caseId);

    // Answer questions
    Task<AnswerResult> SubmitAnswerAsync(SubmitAnswerRequest request);

    // Get results
    Task<MultiVisaResults> GetResultsAsync(Guid sessionId);

    // User selection
    Task<SelectionResult> SelectVisaAsync(Guid sessionId, Guid visaTypeId);

    // Registration
    Task<RegistrationResult> RegisterWithInterviewAsync(RegisterRequest request);
}

public class InterviewOrchestrator : IInterviewOrchestrator
{
    private readonly ISessionManager _sessionManager;
    private readonly IQuestionEngine _questionEngine;
    private readonly IVisaEvaluationEngine _evaluationEngine;
    private readonly IUserService _userService;

    public async Task<AnswerResult> SubmitAnswerAsync(SubmitAnswerRequest request)
    {
        // 1. Validate session
        var session = await _sessionManager.GetActiveSessionAsync(request.SessionId);
        if (session == null)
            throw new InterviewException("Session not found or expired");

        // 2. Store answer
        await _sessionManager.RecordAnswerAsync(
            session.Id,
            request.QuestionKey,
            request.AnswerValue);

        // 3. Get all answers so far
        var allAnswers = await _sessionManager.GetAnswersAsync(session.Id);

        // 4. Get next question
        var nextQuestion = await _questionEngine.GetNextQuestionAsync(session, allAnswers);

        // 5. If no next question, mark complete
        if (nextQuestion == null)
        {
            await _sessionManager.CompleteSessionAsync(session.Id);
            return new AnswerResult
            {
                IsComplete = true,
                Message = "Interview complete! Click 'View Results' to see your visa options."
            };
        }

        // 6. Get remaining visas for progress tracking
        var remainingVisas = await _evaluationEngine.GetRemainingVisasAsync(
            allAnswers,
            session.User);

        // 7. Return next question with progress
        return new AnswerResult
        {
            IsComplete = false,
            NextQuestion = MapToDto(nextQuestion),
            Progress = new ProgressInfo
            {
                TotalQuestions = allAnswers.Count + 1,
                RemainingVisaCount = remainingVisas.Count,
                RemainingVisaNames = remainingVisas.Take(5).Select(v => v.DisplayName).ToList()
            }
        };
    }

    public async Task<MultiVisaResults> GetResultsAsync(Guid sessionId)
    {
        // 1. Get session and answers
        var session = await _sessionManager.GetSessionAsync(sessionId);
        var answers = await _sessionManager.GetAnswersAsync(sessionId);

        // 2. Run evaluation
        var evaluations = await _evaluationEngine.EvaluateAllVisasAsync(
            answers,
            session.User);

        // 3. Store evaluations in database
        await _sessionManager.StoreEvaluationsAsync(sessionId, evaluations);

        // 4. Return grouped results
        return new MultiVisaResults
        {
            EligibleVisas = evaluations
                .Where(e => e.Status == EligibilityStatus.Eligible)
                .Select(MapToDto)
                .ToList(),
            PotentialVisas = evaluations
                .Where(e => e.Status == EligibilityStatus.Potential)
                .Select(MapToDto)
                .ToList(),
            NotEligibleVisas = evaluations
                .Where(e => e.Status == EligibilityStatus.NotEligible)
                .Select(MapToDto)
                .ToList()
        };
    }
}
```

---

## Part 7: Frontend Design

### Updated InterviewPage.tsx

**Key Changes:**

1. **Multi-Visa Results Display**
```tsx
{isComplete && visaResults && (
  <div className="visa-results">
    <h2>Your Visa Options</h2>

    {/* Eligible Visas */}
    {visaResults.eligibleVisas.length > 0 && (
      <section className="eligible-section">
        <h3>You Qualify For:</h3>
        {visaResults.eligibleVisas.map(visa => (
          <VisaResultCard
            key={visa.visaTypeId}
            visa={visa}
            onSelect={() => handleSelectVisa(visa.visaTypeId)}
            onLearnMore={() => handleLearnMore(visa.visaTypeId)}
          />
        ))}
      </section>
    )}

    {/* Potential Visas */}
    {visaResults.potentialVisas.length > 0 && (
      <section className="potential-section">
        <h3>You Might Qualify For:</h3>
        {visaResults.potentialVisas.map(visa => (
          <VisaResultCard
            key={visa.visaTypeId}
            visa={visa}
            variant="potential"
            onSelect={() => handleSelectVisa(visa.visaTypeId)}
            onLearnMore={() => handleLearnMore(visa.visaTypeId)}
          />
        ))}
      </section>
    )}
  </div>
)}
```

2. **VisaResultCard Component**
```tsx
interface VisaResultCardProps {
  visa: VisaEligibilityDto
  variant?: 'eligible' | 'potential'
  onSelect: () => void
  onLearnMore: () => void
}

export const VisaResultCard: React.FC<VisaResultCardProps> = ({
  visa,
  variant = 'eligible',
  onSelect,
  onLearnMore
}) => {
  return (
    <div className={`visa-card visa-card-${variant}`}>
      {/* Header */}
      <div className="visa-header">
        <h4>{visa.visaTypeName}</h4>
        <span className="match-score">{visa.matchScore}% Match</span>
      </div>

      {/* Explanation */}
      <p className="explanation">{visa.explanation}</p>

      {/* Key Benefits */}
      <ul className="benefits">
        {visa.keyBenefits.map(benefit => (
          <li key={benefit}>{benefit}</li>
        ))}
      </ul>

      {/* Attorney Lock Badge */}
      {visa.isAttorneyLocked && (
        <div className="attorney-badge">
          <Icon name="lock" />
          Recommended by Attorney
        </div>
      )}

      {/* Required Documents */}
      <details className="documents-section">
        <summary>Required Documents ({visa.requiredDocuments.length})</summary>
        <ul>
          {visa.requiredDocuments.map(doc => (
            <li key={doc}>{doc}</li>
          ))}
        </ul>
      </details>

      {/* Actions */}
      <div className="actions">
        <Button variant="outline" onClick={onLearnMore}>
          Learn More
        </Button>
        <Button variant="primary" onClick={onSelect}>
          Select This Visa
        </Button>
      </div>
    </div>
  )
}
```

3. **Attorney Dashboard Component**
```tsx
export const AttorneyReviewDashboard: React.FC = () => {
  const [pendingReviews, setPendingReviews] = useState<InterviewReview[]>([])
  const [selectedReview, setSelectedReview] = useState<InterviewReview | null>(null)

  return (
    <div className="attorney-dashboard">
      <h2>Pending Interview Reviews</h2>

      {/* List of pending reviews */}
      <div className="review-list">
        {pendingReviews.map(review => (
          <ReviewCard
            key={review.sessionId}
            review={review}
            onClick={() => setSelectedReview(review)}
          />
        ))}
      </div>

      {/* Detailed review panel */}
      {selectedReview && (
        <ReviewPanel
          review={selectedReview}
          onLockVisa={(visaTypeId, reason) => handleLockVisa(visaTypeId, reason)}
          onRequestMoreInfo={() => handleRequestMoreInfo()}
        />
      )}
    </div>
  )
}
```

---

## Part 8: Testing Strategy

### Unit Tests

```csharp
// VisaEvaluationEngine Tests
[Fact]
public async Task EvaluateAllVisas_WithTourismPurpose_ReturnsB2Visa()
{
    // Arrange
    var answers = new List<InterviewQA>
    {
        new() { QuestionKey = "purpose", AnswerValue = "tourism" }
    };

    // Act
    var results = await _engine.EvaluateAllVisasAsync(answers, null);

    // Assert
    var topResult = results.First();
    Assert.Equal("B-2", topResult.VisaType.Code);
    Assert.Equal(EligibilityStatus.Eligible, topResult.Status);
    Assert.True(topResult.MatchScore >= 85);
}

// QuestionEngine Tests
[Fact]
public async Task GetNextQuestion_AfterPurpose_AsksDuration()
{
    // Arrange
    var session = CreateTestSession();
    var answers = new List<InterviewQA>
    {
        new() { QuestionKey = "purpose", AnswerValue = "work" }
    };

    // Act
    var nextQuestion = await _questionEngine.GetNextQuestionAsync(session, answers);

    // Assert
    Assert.NotNull(nextQuestion);
    Assert.Contains(new[] { "duration", "employer_sponsor" },
        new[] { nextQuestion.Key });
}
```

### Integration Tests

```csharp
[Fact]
public async Task FullInterviewFlow_AnonymousToRegistration_Success()
{
    // 1. Start anonymous interview
    var startResponse = await _client.PostAsync("/api/v2/interview/start-anonymous", null);
    var startData = await startResponse.Content.ReadAsAsync<InterviewStartResponse>();

    // 2. Answer questions
    var answers = new[]
    {
        ("purpose", "work"),
        ("employer_sponsor", "yes"),
        ("duration", "permanent"),
        ("education_level", "bachelors")
    };

    foreach (var (key, value) in answers)
    {
        await _client.PostAsJsonAsync("/api/v2/interview/answer", new
        {
            sessionId = startData.SessionId,
            anonymousToken = startData.AnonymousToken,
            questionKey = key,
            answerValue = value
        });
    }

    // 3. Get results
    var resultsResponse = await _client.PostAsJsonAsync("/api/v2/interview/results", new
    {
        sessionId = startData.SessionId,
        anonymousToken = startData.AnonymousToken
    });
    var results = await resultsResponse.Content.ReadAsAsync<MultiVisaResults>();

    // 4. Select visa
    var selectedVisa = results.EligibleVisas.First();
    await _client.PostAsJsonAsync("/api/v2/interview/select-visa", new
    {
        sessionId = startData.SessionId,
        anonymousToken = startData.AnonymousToken,
        visaTypeId = selectedVisa.VisaTypeId
    });

    // 5. Register
    var registerResponse = await _client.PostAsJsonAsync("/api/v2/interview/register-with-interview", new
    {
        sessionId = startData.SessionId,
        anonymousToken = startData.AnonymousToken,
        email = "test@example.com",
        password = "Test123!",
        firstName = "John",
        lastName = "Doe"
    });
    var registerData = await registerResponse.Content.ReadAsAsync<RegistrationResult>();

    // Assert
    Assert.NotNull(registerData.UserId);
    Assert.NotNull(registerData.CaseId);
    Assert.NotNull(registerData.JwtToken);

    // Verify interview data transferred
    var caseResponse = await _client.GetAsync($"/api/v1/cases/{registerData.CaseId}",
        headers: new { Authorization = $"Bearer {registerData.JwtToken}" });
    var caseData = await caseResponse.Content.ReadAsAsync<CaseDto>();
    Assert.Equal(selectedVisa.VisaTypeId, caseData.SelectedVisaTypeId);
}
```

### E2E Tests (Playwright)

```typescript
test('Complete interview flow with visa selection', async ({ page }) => {
  // 1. Navigate to interview
  await page.goto('/interview')

  // 2. Answer questions
  await page.getByLabel('What is your purpose?').selectOption('Work')
  await page.getByRole('button', { name: 'Next' }).click()

  await page.getByLabel('Do you have an employer sponsor?').check()
  await page.getByRole('button', { name: 'Next' }).click()

  // ... more questions ...

  // 3. View results
  await expect(page.getByRole('heading', { name: 'Your Visa Options' })).toBeVisible()

  // 4. Verify multiple options shown
  const visaCards = page.locator('.visa-card')
  await expect(visaCards).toHaveCount(3)

  // 5. Select H-1B visa
  await page.getByRole('button', { name: 'Select This Visa' }).first().click()

  // 6. Register
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'Test123!')
  await page.fill('input[name="firstName"]', 'John')
  await page.fill('input[name="lastName"]', 'Doe')
  await page.getByRole('button', { name: 'Create Account' }).click()

  // 7. Verify dashboard redirect
  await expect(page).toHaveURL('/dashboard')
  await expect(page.getByText('H-1B Visa Application')).toBeVisible()
})
```

---

## Part 9: Migration Strategy

### Step 1: Data Backup

```sql
-- Backup existing recommendations
SELECT * INTO VisaRecommendation_BACKUP_20251114
FROM VisaRecommendation;

SELECT * INTO VisaEligibilityResult_BACKUP_20251114
FROM VisaEligibilityResult;
```

### Step 2: Migration Script

```csharp
public class MigrateToUnifiedEvaluationScript
{
    public async Task ExecuteAsync()
    {
        // 1. Migrate VisaRecommendation (single recommendations)
        var recommendations = await _context.VisaRecommendations
            .Include(r => r.InterviewSession)
            .ToListAsync();

        foreach (var rec in recommendations)
        {
            var evaluation = new VisaEvaluation
            {
                Id = Guid.NewGuid(),
                SessionId = rec.InterviewSessionId,
                VisaTypeId = rec.RecommendedVisaTypeId,
                EligibilityStatus = EligibilityStatus.Eligible,
                MatchScore = 100, // Was top recommendation
                Rank = 1,
                Explanation = rec.Reason ?? "Recommended based on your answers",
                RequiredDocuments = new List<string>(), // Populate from visa type
                IsUserSelected = true, // Was the recommendation
                IsAttorneyLocked = rec.LockedAt.HasValue,
                LockedAt = rec.LockedAt,
                CreatedAt = rec.CreatedAt
            };

            _context.VisaEvaluations.Add(evaluation);
        }

        // 2. Migrate VisaEligibilityResult (multi-visa results)
        var eligibilityResults = await _context.VisaEligibilityResults
            .Include(e => e.InterviewSession)
            .ToListAsync();

        var grouped = eligibilityResults.GroupBy(e => e.InterviewSessionId);

        foreach (var group in grouped)
        {
            var sessionId = group.Key;
            var results = group.OrderByDescending(r => r.Score).ToList();

            for (int i = 0; i < results.Count; i++)
            {
                var result = results[i];

                var evaluation = new VisaEvaluation
                {
                    Id = Guid.NewGuid(),
                    SessionId = sessionId,
                    VisaTypeId = result.VisaTypeId,
                    EligibilityStatus = MapStatus(result.Recommendation),
                    MatchScore = result.Score,
                    Rank = i + 1,
                    Explanation = result.Explanation ?? "",
                    RequiredDocuments = new List<string>(),
                    IsUserSelected = false,
                    IsAttorneyLocked = false,
                    CreatedAt = result.CreatedAt ?? DateTime.UtcNow
                };

                _context.VisaEvaluations.Add(evaluation);
            }
        }

        await _context.SaveChangesAsync();
    }

    private EligibilityStatus MapStatus(string recommendation)
    {
        return recommendation?.ToLower() switch
        {
            "strongly recommended" => EligibilityStatus.Eligible,
            "recommended" => EligibilityStatus.Eligible,
            "consider" => EligibilityStatus.Potential,
            "possible" => EligibilityStatus.Potential,
            _ => EligibilityStatus.NotEligible
        };
    }
}
```

### Step 3: Verification Queries

```sql
-- Verify migration counts
SELECT
    'VisaRecommendation' AS Source,
    COUNT(*) AS OriginalCount,
    (SELECT COUNT(*) FROM VisaEvaluation WHERE IsUserSelected = 1) AS MigratedCount
FROM VisaRecommendation_BACKUP_20251114

UNION ALL

SELECT
    'VisaEligibilityResult' AS Source,
    COUNT(*) AS OriginalCount,
    (SELECT COUNT(*) FROM VisaEvaluation WHERE IsUserSelected = 0) AS MigratedCount
FROM VisaEligibilityResult_BACKUP_20251114;

-- Verify no data loss
SELECT
    s.Id AS SessionId,
    COUNT(ve.Id) AS EvaluationCount
FROM InterviewSession s
LEFT JOIN VisaEvaluation ve ON ve.SessionId = s.Id
WHERE s.Status = 'completed'
GROUP BY s.Id
HAVING COUNT(ve.Id) = 0; -- Should return 0 rows
```

---

## Part 10: Timeline & Resource Estimate

### Timeline (4 Weeks)

| Phase | Week | Tasks | Deliverables |
|-------|------|-------|--------------|
| **Foundation** | 1 | Service layer, DB schema, unit tests | New services fully tested, schema updated |
| **Controllers** | 2 | V2 controller, admin controller, integration tests | New APIs functional, documented |
| **Frontend** | 3 | React updates, new components, E2E tests | UI using V2 APIs, attorney dashboard |
| **Migration** | 4 | Data migration, deprecation, cleanup, final testing | Old system removed, full regression |

### Resource Requirements

- **1 Backend Developer** (C#/.NET): 4 weeks full-time
- **1 Frontend Developer** (React/TypeScript): 3 weeks full-time (weeks 2-4)
- **1 QA Engineer**: 2 weeks part-time (weeks 3-4)
- **1 Attorney** (Requirements review): 4 hours (week 2)
- **1 Project Manager**: 1 week part-time (oversight)

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data migration errors | Medium | High | Comprehensive backups, rollback plan, verification queries |
| Attorney workflow disruption | Low | Medium | Parallel system during transition, training session |
| User confusion with new UI | Medium | Medium | Gradual rollout, in-app guidance, support documentation |
| Performance degradation | Low | High | Load testing, database indexing, caching strategy |
| Breaking changes for API consumers | High | Low | V1 compatibility layer, deprecation warnings, documentation |

---

## Part 11: Success Criteria

### Technical Metrics

- ✅ Controller LOC: 2,118 → <400 lines (80%+ reduction)
- ✅ Test coverage: >90% for new code
- ✅ API response time: <200ms (p95)
- ✅ Zero data loss during migration
- ✅ All E2E tests passing

### Business Metrics

- ✅ Interview completion rate: >80% (up from ~60%)
- ✅ Anonymous-to-registration conversion: >25%
- ✅ Attorney review time: <10 minutes per case
- ✅ User satisfaction: >4.5/5 stars
- ✅ Support tickets related to interview: -50%

### User Experience Metrics

- ✅ Average time to complete: 5-8 minutes
- ✅ Questions answered: 5-10 (down from 15-20)
- ✅ Users viewing multiple visa options: >60%
- ✅ Users selecting attorney-locked recommendation: >85%

---

## Part 12: Post-Launch Plan

### Month 1: Monitoring & Optimization

- Monitor error rates and performance
- Collect user feedback
- A/B test question variations
- Optimize VisaEvaluationEngine scoring

### Month 2: Enhancement

- Add visa comparison tool
- Implement document upload during interview
- Add interview resume capability
- Create attorney analytics dashboard

### Month 3: Advanced Features

- Multi-language interview support
- AI-powered explanation generation
- Predictive success scoring
- Integration with case management workflow

---

## Appendix A: API Endpoint Reference

### V2 Interview Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v2/interview/start-anonymous` | None | Start anonymous interview |
| POST | `/api/v2/interview/start` | JWT | Start authenticated interview |
| POST | `/api/v2/interview/answer` | Token/JWT | Submit answer |
| POST | `/api/v2/interview/results` | Token/JWT | Get visa evaluation results |
| POST | `/api/v2/interview/select-visa` | Token/JWT | User selects preferred visa |
| POST | `/api/v2/interview/register-with-interview` | Token | Create account with interview data |
| GET | `/api/v2/interview/session/{id}` | Token/JWT | Get session details |

### Admin Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/interview/admin/pending-reviews` | JWT (Attorney) | List pending reviews |
| GET | `/api/v1/interview/admin/review/{sessionId}` | JWT (Attorney) | Get review details |
| POST | `/api/v1/interview/admin/lock-visa` | JWT (Attorney) | Lock visa recommendation |
| POST | `/api/v1/interview/admin/unlock-visa` | JWT (Admin) | Unlock visa |
| GET | `/api/v1/interview/admin/history/{userId}` | JWT (Attorney) | User's interview history |

---

## Conclusion

This refactor plan transforms the Law4Hire interview system from a monolithic, conflicting implementation into a clean, Boundless-inspired experience that:

1. **Starts simple**: 5-10 minute questionnaire
2. **Provides clarity**: Multiple visa options with clear explanations
3. **Enables choice**: Users explore before committing
4. **Supports professionals**: Attorneys can review and lock recommendations
5. **Maintains quality**: Single source of truth for all visa evaluations

The 4-week timeline is aggressive but achievable with focused effort. The parallel implementation strategy (V2 alongside V1) minimizes risk while enabling a clean break from legacy code.

**Next Steps:**
1. Review and approve this plan
2. Schedule kickoff meeting
3. Set up project tracking
4. Begin Phase 1: Foundation

---

**Document Version:** 1.0
**Last Updated:** November 14, 2025
**Prepared By:** Claude
**Status:** Awaiting Approval
