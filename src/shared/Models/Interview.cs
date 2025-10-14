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