using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Services;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace L4H.Infrastructure.Services.Interview;

/// <summary>
/// Orchestrates the complete interview process, coordinating all interview services
/// </summary>
public class AgentOrchestrator : IAgentOrchestrator
{
    private readonly ISessionManager _sessionManager;
    private readonly IQuestionEngine _questionEngine;
    private readonly IVisaEvaluationEngine _evaluationEngine;
    private readonly IAuthService _authService;
    private readonly L4H.Infrastructure.Interfaces.IAIService _aiService;
    private readonly L4HDbContext _context;

    public AgentOrchestrator(
        ISessionManager sessionManager,
        IQuestionEngine questionEngine,
        IVisaEvaluationEngine evaluationEngine,
        IAuthService authService,
        L4H.Infrastructure.Interfaces.IAIService aiService,
        L4HDbContext context)
    {
        _sessionManager = sessionManager;
        _questionEngine = questionEngine;
        _evaluationEngine = evaluationEngine;
        _authService = authService;
        _aiService = aiService;
        _context = context;
    }

    public async Task<InterviewStartResult> StartAnonymousInterviewAsync(Dictionary<string, string>? initialAnswers = null, Guid? existingSessionId = null)
    {
        InterviewSession? session = null;
        List<InterviewQA> answeredQuestions = new List<InterviewQA>();

        if (existingSessionId.HasValue)
        {
            session = await _sessionManager.GetSessionByTokenAsync(existingSessionId.Value);
            if (session != null)
            {
                // Upgrade from FastPath to full interview
                session.IsFastPath = false;
                answeredQuestions = (await _sessionManager.GetSessionAnswersAsync(session.Id)).ToList();
            }
        }

        if (session == null)
        {
            // Create new anonymous session
            session = await _sessionManager.CreateAnonymousSessionAsync();
        }

        // Persist initial answers if provided (e.g. from FastPath quiz)
        // and add to answeredQuestions list if not already there
        if (initialAnswers != null && initialAnswers.Any())
        {
            foreach (var initial in initialAnswers)
            {
                if (!answeredQuestions.Any(q => q.QuestionKey.Equals(initial.Key, StringComparison.OrdinalIgnoreCase)))
                {
                    var qa = await _sessionManager.SaveAnswerAsync(session.Id, initial.Key, initial.Value);
                    answeredQuestions.Add(qa);
                }
            }
        }

        // Get first question - try AI first to ensure AI-driven flow from the start
        var firstQuestion = await _aiService.GetNextAIQuestionAsync(session, answeredQuestions, new List<VisaType>());

        if (firstQuestion == null)
        {
            firstQuestion = await _questionEngine.GetNextQuestionAsync(session, answeredQuestions);
        }

        if (firstQuestion == null)
        {
            throw new InvalidOperationException("No questions available to start interview");
        }

        return new InterviewStartResult
        {
            SessionToken = session.AnonymousToken!.Value,
            SessionId = session.Id,
            FirstQuestion = firstQuestion
        };
    }

    public async Task<InterviewStartResult> StartAuthenticatedInterviewAsync(CaseId caseId, UserId userId, Dictionary<string, string>? initialAnswers = null)
    {
        // Create new authenticated session
        var session = await _sessionManager.CreateAuthenticatedSessionAsync(caseId, userId);

        // Persist initial answers if provided (e.g. from FastPath quiz)
        var answeredQuestions = new List<InterviewQA>();
        if (initialAnswers != null && initialAnswers.Any())
        {
            foreach (var initial in initialAnswers)
            {
                var qa = await _sessionManager.SaveAnswerAsync(session.Id, initial.Key, initial.Value);
                answeredQuestions.Add(qa);
            }
        }

        // Get first question - try AI first to ensure AI-driven flow from the start
        var firstQuestion = await _aiService.GetNextAIQuestionAsync(session, answeredQuestions, new List<VisaType>());

        if (firstQuestion == null)
        {
            firstQuestion = await _questionEngine.GetNextQuestionAsync(session, answeredQuestions);
        }


        if (firstQuestion == null)
        {
            throw new InvalidOperationException("No questions available to start interview");
        }

        return new InterviewStartResult
        {
            SessionToken = session.Id, // For authenticated sessions, we use the ID as token since they are already secure
            SessionId = session.Id,
            FirstQuestion = firstQuestion
        };
    }

    public async Task<InterviewResumeResult> ResumeInterviewAsync(Guid anonymousToken)
    {
        var session = await _sessionManager.GetSessionByTokenAsync(anonymousToken);
        if (session == null)
        {
            throw new InvalidOperationException($"Session with token {anonymousToken} not found");
        }

        var answers = await _sessionManager.GetSessionAnswersAsync(session.Id);
        var remainingVisas = await _evaluationEngine.GetRemainingVisasAsync(answers);
        var isComplete = await _questionEngine.IsCompleteAsync(remainingVisas, answers.Count, answers);

        InterviewQuestion? nextQuestion = null;
        List<VisaEvaluationResult>? evaluations = null;

        if (isComplete)
        {
            // If complete, return evaluations
            var evalResults = await _evaluationEngine.EvaluateAllVisasAsync(answers);
            evaluations = evalResults;
        }
        else
        {
            // Otherwise, get next question
            nextQuestion = await _questionEngine.GetNextQuestionAsync(session, answers);
        }

        return new InterviewResumeResult
        {
            SessionId = session.Id,
            PreviousAnswers = answers,
            NextQuestion = nextQuestion,
            IsComplete = isComplete,
            Evaluations = evaluations
        };
    }

    public async Task<InterviewProgressResult> SubmitAnswerAsync(
        Guid sessionToken,
        string questionKey,
        string answer)
    {
        var session = await _sessionManager.GetSessionByTokenAsync(sessionToken);
        if (session == null)
        {
            throw new InvalidOperationException($"Session with token {sessionToken} not found");
        }

        // Save the answer
        await _sessionManager.SaveAnswerAsync(session.Id, questionKey, answer);

        // Get updated answers
        var answers = await _sessionManager.GetSessionAnswersAsync(session.Id);

        // Rules-engine-first: structural questions (intent, location, education, employment,
        // educational_goals, category, subcategory, checklists) must all be answered before
        // the AI is allowed to take over for refinement. This prevents the AI from intercepting
        // mid-checklist and skipping mandatory eligibility questions.
        var nextQuestion = await _questionEngine.GetNextQuestionAsync(session, answers);

        // AI refinement: only fires after the rules engine has no more structural questions
        if (nextQuestion == null)
        {
            var remainingVisasForAI = await _evaluationEngine.GetRemainingVisasAsync(answers);
            nextQuestion = await _aiService.GetNextAIQuestionAsync(session, answers, remainingVisasForAI);
        }

        // If there's still no next question, the interview is complete
        // Guardrail: Cannot be complete unless 'location' is verified
        var answersDict = answers.ToDictionary(qa => qa.QuestionKey, qa => qa.AnswerValue, StringComparer.OrdinalIgnoreCase);
        
        // Trace Logging for Logic Debugging
        string intent = answersDict.TryGetValue("intent_type", out var i) ? i : "None";
        string category = answersDict.TryGetValue("category", out var c) ? c : "None";
        string pendingFields = nextQuestion?.Key ?? "Complete";
        Console.WriteLine($"Current Path: {intent} -> {category} -> {pendingFields}");

        var isComplete = nextQuestion == null && answersDict.ContainsKey("location");

        // Check if we just completed a checklist
        bool isChecklistComplete = false;
        int? checklistProgress = null;
        int? checklistTotal = null;
        VisaEvaluationResult? evaluation = null;

        // If the current question was a checklist question, calculate progress
        if (questionKey.StartsWith("checklist_"))
        {
            // Count checklist answers
            var checklistAnswers = answersDict.Where(kvp => kvp.Key.StartsWith("checklist_")).ToList();
            checklistProgress = checklistAnswers.Count;

            // Try to determine total from subcategory (requires question engine method)
            // For now, we'll check if the next question is NOT a checklist question
            isChecklistComplete = nextQuestion != null && nextQuestion.Category != "checklist";

            if (isChecklistComplete && checklistProgress.HasValue)
            {
                checklistTotal = checklistProgress;
            }
        }

        return new InterviewProgressResult
        {
            IsComplete = isComplete,
            NextQuestion = nextQuestion,
            TotalAnswers = answers.Count,
            IsChecklistComplete = isChecklistComplete,
            ChecklistProgress = checklistProgress,
            ChecklistTotal = checklistTotal,
            Evaluation = evaluation
        };
    }

    public async Task<InterviewCompletionResult> CompleteInterviewAsync(Guid sessionToken)
    {
        var session = await _sessionManager.GetSessionByTokenAsync(sessionToken);
        if (session == null)
        {
            throw new InvalidOperationException($"Session with token {sessionToken} not found");
        }

        // Get all answers
        var answers = await _sessionManager.GetSessionAnswersAsync(session.Id);

        // Run AI-driven eligibility analysis
        var evaluationResults = await _aiService.AnalyzeEligibilityAsync(answers);

        // If AI results are empty, fallback to rules engine
        if (evaluationResults == null || evaluationResults.Count == 0)
        {
            evaluationResults = await _evaluationEngine.EvaluateAllVisasAsync(answers);
        }

        // Convert to VisaEvaluation entities
        var evaluationEntities = evaluationResults.Select(result => new VisaEvaluation
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            VisaTypeId = result.VisaType.Id,
            Status = result.Status,
            MatchScore = result.MatchScore,
            Rank = result.Rank,
            Explanation = result.Explanation,
            MissingInformation = string.Join("; ", result.MissingInformation),
            RequiredDocuments = result.RequiredDocuments,
            IsUserSelected = false,
            IsAttorneyLocked = false
        }).ToList();

        // Save evaluations and mark session as complete
        await _sessionManager.CompleteSessionAsync(session.Id, evaluationEntities);

        return new InterviewCompletionResult
        {
            SessionId = session.Id,
            Evaluations = evaluationResults,
            TotalQuestionsAnswered = answers.Count
        };
    }

    public async Task<List<VisaEvaluationResult>> GetVisaEvaluationsAsync(Guid sessionToken)
    {
        var session = await _sessionManager.GetSessionByTokenAsync(sessionToken);
        if (session == null)
        {
            throw new InvalidOperationException($"Session with token {sessionToken} not found");
        }

        // If session already has evaluations, return those
        if (session.VisaEvaluations.Count > 0)
        {
            return session.VisaEvaluations
                .OrderBy(ve => ve.Rank)
                .Select(ve => new VisaEvaluationResult
                {
                    VisaType = ve.VisaType,
                    Status = ve.Status,
                    MatchScore = ve.MatchScore,
                    Rank = ve.Rank,
                    Explanation = ve.Explanation,
                    MissingInformation = string.IsNullOrEmpty(ve.MissingInformation)
                        ? new List<string>()
                        : ve.MissingInformation.Split("; ", StringSplitOptions.RemoveEmptyEntries).ToList(),
                    RequiredDocuments = ve.RequiredDocuments,
                    KeyBenefits = new List<string>() // Could be enhanced to store in DB
                })
                .ToList();
        }

        // Otherwise, evaluate on the fly
        var answers = await _sessionManager.GetSessionAnswersAsync(session.Id);
        return await _evaluationEngine.EvaluateAllVisasAsync(answers);
    }

    public async Task SelectVisaAsync(Guid sessionToken, int visaTypeId)
    {
        var session = await _sessionManager.GetSessionByTokenAsync(sessionToken);
        if (session == null)
        {
            throw new InvalidOperationException($"Session with token {sessionToken} not found");
        }

        await _sessionManager.SelectVisaAsync(session.Id, visaTypeId);
    }

    public async Task<InterviewSession> RegisterWithInterviewAsync(Guid anonymousToken, SignupRequest request)
    {
        var signupResult = await _authService.SignupAsync(request);
        if (!signupResult.IsSuccess || signupResult.Value?.UserId is not { } userId)
        {
            throw new InvalidOperationException(signupResult.Error ?? "Unable to create account from interview.");
        }

        var createdCase = await _context.Cases
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (createdCase == null)
        {
            throw new InvalidOperationException("Account was created, but no case could be found.");
        }

        // Convert anonymous session to authenticated
        var session = await _sessionManager.ConvertToAuthenticatedSessionAsync(
            anonymousToken,
            userId,
            createdCase.Id);

        return session;
    }

    public async Task<InterviewRegistrationPrefillResult> GetRegistrationPrefillAsync(Guid anonymousToken)
    {
        var session = await _sessionManager.GetSessionByTokenAsync(anonymousToken);
        if (session == null)
        {
            throw new InvalidOperationException($"Session with token {anonymousToken} not found");
        }

        var answers = await _sessionManager.GetSessionAnswersAsync(session.Id);
        var answerLookup = answers
            .GroupBy(answer => answer.QuestionKey, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.Last().AnswerValue, StringComparer.OrdinalIgnoreCase);

        var fullName = GetAnswer(answerLookup, "doc_prefill_full_name");
        var (firstName, lastName) = SplitFullName(fullName);
        var nationality = GetAnswer(answerLookup, "doc_prefill_nationality");

        return new InterviewRegistrationPrefillResult
        {
            FullName = fullName,
            FirstName = firstName,
            LastName = lastName,
            PhoneNumber = GetAnswer(answerLookup, "phone"),
            DateOfBirth = TryParseDate(GetAnswer(answerLookup, "doc_prefill_dob")),
            Nationality = nationality,
            Citizenship = nationality,
            Country = GetAnswer(answerLookup, "current_country")
        };
    }

    private static string? GetAnswer(IReadOnlyDictionary<string, string> answers, string key)
        => answers.TryGetValue(key, out var value) ? value : null;

    private static DateTime? TryParseDate(string? value)
        => DateTime.TryParse(value, out var parsed) ? parsed.Date : null;

    private static (string FirstName, string LastName) SplitFullName(string? fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            return (string.Empty, string.Empty);
        }

        var parts = fullName
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (parts.Length == 1)
        {
            return (parts[0], parts[0]);
        }

        return (parts[0], string.Join(' ', parts.Skip(1)));
    }

    public async Task LockVisaForSessionAsync(
        Guid sessionId,
        int visaTypeId,
        UserId lockedByUserId,
        string reason)
    {
        await _sessionManager.LockVisaAsync(sessionId, visaTypeId, lockedByUserId, reason);
    }

    public async Task UnlockVisaForSessionAsync(
        Guid sessionId,
        int visaTypeId,
        string reason)
    {
        await _sessionManager.UnlockVisaAsync(sessionId, visaTypeId, reason);
    }

    public async Task<VisaEvaluationResult?> RunEvaluationBeforeContactAsync(Guid sessionToken)
    {
        var session = await _sessionManager.GetSessionByTokenAsync(sessionToken);
        if (session == null)
        {
            throw new InvalidOperationException($"Session with token {sessionToken} not found");
        }

        // Get all answers so far
        var answers = await _sessionManager.GetSessionAnswersAsync(session.Id);
        var answersDict = answers.ToDictionary(qa => qa.QuestionKey, qa => qa.AnswerValue);

        // Determine the visa type from subcategory answer
        if (!answersDict.TryGetValue("subcategory", out var subcategory))
        {
            return null; // No subcategory selected yet
        }

        // Get checklist answers to include in evaluation
        var checklistAnswers = answersDict.Where(kvp => kvp.Key.StartsWith("checklist_")).ToList();
        if (checklistAnswers.Count == 0)
        {
            return null; // No checklist answers yet
        }

        // Run evaluation for this specific visa type
        var evaluationResults = await _evaluationEngine.EvaluateAllVisasAsync(answers);

        // Find the evaluation for the selected subcategory
        // The evaluation engine will need to match the subcategory to a visa type
        // For now, return the top-ranked evaluation
        return evaluationResults.FirstOrDefault();
    }

    public async Task<SessionLockStatusResult> GetSessionLockStatusAsync(Guid sessionId)
    {
        var session = await _context.InterviewSessions
            .Include(s => s.Case)
            .ThenInclude(c => c!.AttorneySelectedVisaType)
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        if (session?.Case == null)
        {
            // If there's no case, it can't be locked.
            return new SessionLockStatusResult { IsLocked = false };
        }

        var caseEntity = session.Case;
        return new SessionLockStatusResult
        {
            IsLocked = caseEntity.IsVisaLockedByAttorney,
            LockedVisaTypeId = caseEntity.AttorneySelectedVisaTypeId,
            LockedVisaName = caseEntity.AttorneySelectedVisaType?.Name,
            LockedByStaffId = caseEntity.VisaLockedByStaffId,
            LockedAt = caseEntity.VisaLockedAt
        };
    }
}
