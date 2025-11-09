namespace L4H.Shared.Models;

public class InterviewStartRequest
{
    public CaseId CaseId { get; set; }
}

public class InterviewStartResponse
{
    public Guid SessionId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
}

public class InterviewAnswerRequest
{
    public Guid SessionId { get; set; }
    public int StepNumber { get; set; }
    public string QuestionKey { get; set; } = string.Empty;
    public string AnswerValue { get; set; } = string.Empty;
}

public class InterviewAnswerResponse
{
    public Guid SessionId { get; set; }
    public int StepNumber { get; set; }
    public string QuestionKey { get; set; } = string.Empty;
    public string AnswerValue { get; set; } = string.Empty;
    public DateTime AnsweredAt { get; set; }
}

public class InterviewCompleteRequest
{
    public Guid SessionId { get; set; }
}

public class InterviewCompleteResponse
{
    public string RecommendationVisaType { get; set; } = string.Empty;
    public string Rationale { get; set; } = string.Empty;
}

public class InterviewRerunRequest
{
    public CaseId CaseId { get; set; }
}

public class InterviewResetRequest
{
    public Guid SessionId { get; set; }
}

public class InterviewLockRequest
{
    public CaseId CaseId { get; set; }
}

public class InterviewSessionSummary
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
}

public class VisaRecommendationSummary
{
    public string VisaType { get; set; } = string.Empty;
    public string Rationale { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsLocked { get; set; }
}

// Adaptive interview models
public class InterviewNextQuestionRequest
{
    public Guid SessionId { get; set; }
}

public class InterviewNextQuestionResponse
{
    public bool IsComplete { get; set; }
    public InterviewQuestionDto? Question { get; set; }
    public InterviewRecommendation? Recommendation { get; set; }
}

public class InterviewQuestionDto
{
    public string Key { get; set; } = string.Empty;
    public string Question { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public List<InterviewOptionDto> Options { get; set; } = new();
    public bool Required { get; set; }
    public int RemainingVisaTypes { get; set; }
    public List<string> RemainingVisaCodes { get; set; } = new();
}

public class InterviewOptionDto
{
    public string Value { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class InterviewRecommendation
{
    public string VisaType { get; set; } = string.Empty;
    public string Rationale { get; set; } = string.Empty;
}

public class InterviewHistoryResponse
{
    public List<InterviewSessionSummary> Sessions { get; set; } = new List<InterviewSessionSummary>();
    public VisaRecommendationSummary? LatestRecommendation { get; set; }
}

public class SelectVisaTypeRequest
{
    public Guid SessionId { get; set; }
    public string VisaTypeCode { get; set; } = string.Empty;
}

public class InterviewProgressResponse
{
    public Guid SessionId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public int CurrentQuestionNumber { get; set; }
    public int TotalQuestionsAnswered { get; set; }
    public int EstimatedQuestionsRemaining { get; set; }
    public int CompletionPercentage { get; set; }
    public int RemainingVisaTypes { get; set; }
    public List<string> RemainingVisaCodes { get; set; } = new();
    public DateTime LastActivityAt { get; set; }
}

// New multi-visa eligibility models
public class VisaEligibilityDto
{
    public string VisaCode { get; set; } = string.Empty;
    public string VisaName { get; set; } = string.Empty;
    public string EligibilityStatus { get; set; } = string.Empty; // "Eligible" or "Potential"
    public int MatchScore { get; set; } // 0-100
    public string Rationale { get; set; } = string.Empty;
    public List<string> MetRequirements { get; set; } = new();
    public List<string> UnmetRequirements { get; set; } = new();
}

public class MultiVisaEligibilityResponse
{
    public Guid SessionId { get; set; }
    public List<VisaEligibilityDto> EligibleVisas { get; set; } = new();
    public List<VisaEligibilityDto> PotentialVisas { get; set; } = new();
    public int TotalEvaluated { get; set; }
    public DateTime EvaluatedAt { get; set; }
}

public class GetVisaResultsRequest
{
    public Guid SessionId { get; set; }
}

// Attorney lock-in models
public class LockVisaSelectionRequest
{
    public CaseId CaseId { get; set; }
    public int VisaTypeId { get; set; }
}

public class LockVisaSelectionResponse
{
    public bool Success { get; set; }
    public string VisaCode { get; set; } = string.Empty;
    public string VisaName { get; set; } = string.Empty;
    public DateTime LockedAt { get; set; }
    public Guid LockedByStaffId { get; set; }
}

public class UnlockVisaSelectionRequest
{
    public CaseId CaseId { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class CheckLockStatusRequest
{
    public CaseId CaseId { get; set; }
}

public class CheckLockStatusResponse
{
    public bool IsLocked { get; set; }
    public string? VisaCode { get; set; }
    public string? VisaName { get; set; }
    public DateTime? LockedAt { get; set; }
    public string? LockedByStaffName { get; set; }
}

// Unauthenticated interview models (cookie-based)
public class UnauthInterviewStartRequest
{
    // No fields needed - will create anonymous session
}

public class UnauthInterviewStartResponse
{
    public Guid SessionId { get; set; }
    public string CookieKey { get; set; } = "l4h_interview_progress";
    public DateTime ExpiresAt { get; set; }
}

public class UnauthInterviewAnswerRequest
{
    public Guid SessionId { get; set; }
    public string QuestionKey { get; set; } = string.Empty;
    public string AnswerValue { get; set; } = string.Empty;
}

public class RegisterWithInterviewDataRequest
{
    // User registration fields
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string MiddleName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string MaritalStatus { get; set; } = string.Empty;
    public string Nationality { get; set; } = string.Empty;

    // Address fields
    public string Country { get; set; } = string.Empty;
    public string StreetAddress { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string StateProvince { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string? AddressType { get; set; } // "own-mortgage", "rent", "family", "friend"

    // Guardian emails (if under 18)
    public List<string> GuardianEmails { get; set; } = new();

    // Interview session ID to transfer data from cookie
    public Guid? InterviewSessionId { get; set; }
}