using L4H.Infrastructure.Entities;
using L4H.Shared.Models;

namespace L4H.Infrastructure.Services.Interview;

/// <summary>
/// Orchestrates the complete interview process, coordinating all interview services
/// </summary>
public interface IInterviewOrchestrator
{
    /// <summary>
    /// Starts a new anonymous interview session
    /// </summary>
    /// <returns>Session with first question</returns>
    Task<InterviewStartResult> StartAnonymousInterviewAsync(string? languageCode = null);

    /// <summary>
    /// Starts a new authenticated interview session linked to a case
    /// </summary>
    Task<InterviewStartResult> StartAuthenticatedInterviewAsync(CaseId caseId, UserId userId, string? languageCode = null);

    /// <summary>
    /// Resumes an existing interview session
    /// </summary>
    Task<InterviewResumeResult> ResumeInterviewAsync(Guid anonymousToken);

    /// <summary>
    /// Submits an answer and gets the next question
    /// </summary>
    Task<InterviewProgressResult> SubmitAnswerAsync(
        Guid sessionToken,
        string questionKey,
        string answer);

    /// <summary>
    /// Completes the interview and generates visa evaluations
    /// </summary>
    Task<InterviewCompletionResult> CompleteInterviewAsync(Guid sessionToken);

    /// <summary>
    /// Gets visa evaluation results for a session
    /// </summary>
    Task<List<VisaEvaluationResult>> GetVisaEvaluationsAsync(Guid sessionToken);

    /// <summary>
    /// User selects their preferred visa from the results
    /// </summary>
    Task SelectVisaAsync(Guid sessionToken, int visaTypeId);

    /// <summary>
    /// Creates user account with interview data
    /// </summary>
    Task<InterviewSession> RegisterWithInterviewAsync(
        Guid anonymousToken,
        string email,
        string password,
        string firstName,
        string lastName);

    /// <summary>
    /// Attorney/professional locks a specific visa for the session
    /// </summary>
    Task LockVisaForSessionAsync(
        Guid sessionId,
        int visaTypeId,
        UserId lockedByUserId,
        string reason);

    /// <summary>
    /// Attorney/professional unlocks a visa
    /// </summary>
    Task UnlockVisaForSessionAsync(
        Guid sessionId,
        int visaTypeId,
        string reason);

    /// <summary>
    /// Runs evaluation after checklist completion and before contact info collection
    /// </summary>
    Task<VisaEvaluationResult?> RunEvaluationBeforeContactAsync(Guid sessionToken);

    /// <summary>
    /// Gets the lock status for a session.
    /// </summary>
    Task<SessionLockStatusResult> GetSessionLockStatusAsync(Guid sessionId);
}

/// <summary>
/// Result of checking a session's lock status.
/// </summary>
public record SessionLockStatusResult
{
    public bool IsLocked { get; init; }
    public int? LockedVisaTypeId { get; init; }
    public string? LockedVisaName { get; init; }
    public Guid? LockedByStaffId { get; init; }
    public DateTime? LockedAt { get; init; }
}

/// <summary>
/// Result of starting a new interview
/// </summary>
public class InterviewStartResult
{
    public Guid SessionToken { get; set; }
    public Guid SessionId { get; set; }
    public InterviewQuestion FirstQuestion { get; set; } = null!;
}

/// <summary>
/// Result of resuming an interview
/// </summary>
public class InterviewResumeResult
{
    public Guid SessionId { get; set; }
    public List<InterviewQA> PreviousAnswers { get; set; } = new();
    public InterviewQuestion? NextQuestion { get; set; }
    public bool IsComplete { get; set; }
    public List<VisaEvaluationResult>? Evaluations { get; set; }
}

/// <summary>
/// Result of submitting an answer
/// </summary>
public class InterviewProgressResult
{
    public bool IsComplete { get; set; }
    public InterviewQuestion? NextQuestion { get; set; }
    public int TotalAnswers { get; set; }
    public bool IsChecklistComplete { get; set; }
    public int? ChecklistProgress { get; set; }
    public int? ChecklistTotal { get; set; }
    public VisaEvaluationResult? Evaluation { get; set; }
}

/// <summary>
/// Result of completing the interview
/// </summary>
public class InterviewCompletionResult
{
    public Guid SessionId { get; set; }
    public List<VisaEvaluationResult> Evaluations { get; set; } = new();
    public int TotalQuestionsAnswered { get; set; }
}
