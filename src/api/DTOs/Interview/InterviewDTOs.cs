namespace L4H.Api.DTOs.Interview;

/// <summary>
/// Request to start a new anonymous interview
/// </summary>
public class StartInterviewRequest
{
    public Dictionary<string, string>? InitialAnswers { get; set; }
    public Guid? ExistingSessionId { get; set; }
}

/// <summary>
/// Response when starting a new interview
/// </summary>
public class StartInterviewResponse
{
    public Guid SessionToken { get; set; }
    public Guid SessionId { get; set; }
    public QuestionDTO FirstQuestion { get; set; } = null!;
}

/// <summary>
/// Request to submit an answer
/// </summary>
public class SubmitAnswerRequest
{
    public Guid SessionToken { get; set; }
    public string QuestionKey { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
}

/// <summary>
/// Response after submitting an answer
/// </summary>
public class SubmitAnswerResponse
{
    public bool IsComplete { get; set; }
    public QuestionDTO? NextQuestion { get; set; }
    public int TotalAnswers { get; set; }
    public bool IsChecklistComplete { get; set; }
    public int? ChecklistProgress { get; set; }
    public int? ChecklistTotal { get; set; }
    public EvaluationSummaryDTO? Evaluation { get; set; }
}

/// <summary>
/// Request to complete the interview
/// </summary>
public class CompleteInterviewRequest
{
    public Guid SessionToken { get; set; }
}

/// <summary>
/// Response when completing the interview
/// </summary>
public class CompleteInterviewResponse
{
    public Guid SessionId { get; set; }
    public List<VisaEvaluationDTO> Evaluations { get; set; } = new();
    public int TotalQuestionsAnswered { get; set; }
}

/// <summary>
/// Request to select a visa
/// </summary>
public class SelectVisaRequest
{
    public Guid SessionToken { get; set; }
    public int VisaTypeId { get; set; }
}

/// <summary>
/// Request to register with interview data
/// </summary>
public class RegisterWithInterviewRequest
{
    public Guid AnonymousToken { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Country { get; set; }
    public string? Nationality { get; set; }
    public string? Citizenship { get; set; }
}

/// <summary>
/// Response for registration
/// </summary>
public class RegisterWithInterviewResponse
{
    public Guid SessionId { get; set; }
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
}

/// <summary>
/// Registration prefill values from interview answers.
/// </summary>
public class RegistrationPrefillResponse
{
    public string FullName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Country { get; set; }
    public string? Nationality { get; set; }
    public string? Citizenship { get; set; }
}

/// <summary>
/// Request to resume an interview
/// </summary>
public class ResumeInterviewRequest
{
    public Guid SessionToken { get; set; }
}

/// <summary>
/// Response when resuming an interview
/// </summary>
public class ResumeInterviewResponse
{
    public Guid SessionId { get; set; }
    public List<AnswerDTO> PreviousAnswers { get; set; } = new();
    public QuestionDTO? NextQuestion { get; set; }
    public bool IsComplete { get; set; }
    public List<VisaEvaluationDTO>? Evaluations { get; set; }
}

/// <summary>
/// Question DTO for API responses
/// </summary>
public class QuestionDTO
{
    public string Key { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string InputType { get; set; } = "text";
    public List<QuestionOptionDTO> Options { get; set; } = new();
    public bool IsRequired { get; set; } = true;
    public int Order { get; set; }
    public Guid? ParentId { get; set; }
    public string? ParentOptionValue { get; set; }
}

/// <summary>
/// Question option DTO
/// </summary>
public class QuestionOptionDTO
{
    public string Value { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string? ActionType { get; set; }
    public Guid? TargetQuestionId { get; set; }
    public string? TargetPagePath { get; set; }
    public string? QualifiedVisaCodes { get; set; }
}

/// <summary>
/// Answer DTO for API responses
/// </summary>
public class AnswerDTO
{
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public DateTime AnsweredAt { get; set; }
}

/// <summary>
/// Visa evaluation DTO for API responses
/// </summary>
public class VisaEvaluationDTO
{
    public int VisaTypeId { get; set; }
    public string VisaCode { get; set; } = string.Empty;
    public string VisaName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // Eligible, Potential, NotEligible
    public decimal MatchScore { get; set; }
    public int Rank { get; set; }
    public string Explanation { get; set; } = string.Empty;
    public List<string> MissingInformation { get; set; } = new();
    public List<string> RequiredDocuments { get; set; } = new();
    public List<string> KeyBenefits { get; set; } = new();
    public bool IsUserSelected { get; set; }
    public bool IsAttorneyLocked { get; set; }
    public string? LockReason { get; set; }
}

/// <summary>
/// Request to lock a visa (attorney/professional action)
/// </summary>
public class LockVisaRequest
{
    public Guid SessionId { get; set; }
    public int VisaTypeId { get; set; }
    public string Reason { get; set; } = string.Empty;
}

/// <summary>
/// Request to unlock a visa
/// </summary>
public class UnlockVisaRequest
{
    public Guid SessionId { get; set; }
    public int VisaTypeId { get; set; }
    public string Reason { get; set; } = string.Empty;
}

/// <summary>
/// Checklist question DTO with yes/no options
/// </summary>
public class ChecklistQuestionDTO
{
    public string Id { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty; // "yes", "no", or empty if not answered
    public int Order { get; set; }
}

/// <summary>
/// Checklist answers DTO to store all yes/no responses
/// </summary>
public class ChecklistAnswersDTO
{
    public string VisaType { get; set; } = string.Empty;
    public List<ChecklistQuestionDTO> Questions { get; set; } = new();
    public int TotalQuestions { get; set; }
    public int AnsweredQuestions { get; set; }
    public bool IsComplete { get; set; }
}

/// <summary>
/// Evaluation summary DTO for mid-interview results (shown after checklist)
/// </summary>
public class EvaluationSummaryDTO
{
    public string VisaType { get; set; } = string.Empty;
    public string VisaName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // Eligible, Potential, NotEligible
    public decimal MatchScore { get; set; }
    public string Explanation { get; set; } = string.Empty;
    public List<string> Strengths { get; set; } = new();
    public List<string> Concerns { get; set; } = new();
    public List<string> NextSteps { get; set; } = new();
    public bool ShowContactForm { get; set; } = true;
}
