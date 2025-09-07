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

public class InterviewHistoryResponse
{
    public List<InterviewSessionSummary> Sessions { get; set; } = new List<InterviewSessionSummary>();
    public VisaRecommendationSummary? LatestRecommendation { get; set; }
}