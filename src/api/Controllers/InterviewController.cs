using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Localization;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Services;
using L4H.Shared.Models;
using System.Security.Claims;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/interview")]
[Tags("Interview")]
[Authorize]
public class InterviewController : ControllerBase
{
    private readonly L4HDbContext _context;
    private readonly IInterviewRecommender _recommender;
    private readonly IAdaptiveInterviewService _adaptiveInterview;
    private readonly IAdoptionCaseService _adoptionCaseService;
    private readonly ICitizenshipCaseService _citizenshipCaseService;
    private readonly IStringLocalizer<Shared> _localizer;
    private readonly ILogger<InterviewController> _logger;

    public InterviewController(
        L4HDbContext context,
        IInterviewRecommender recommender,
        IAdaptiveInterviewService adaptiveInterview,
        IAdoptionCaseService adoptionCaseService,
        ICitizenshipCaseService citizenshipCaseService,
        IStringLocalizer<Shared> localizer,
        ILogger<InterviewController> logger)
    {
        _context = context;
        _recommender = recommender;
        _adaptiveInterview = adaptiveInterview;
        _adoptionCaseService = adoptionCaseService;
        _citizenshipCaseService = citizenshipCaseService;
        _localizer = localizer;
        _logger = logger;
    }

    private UserId GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            _logger.LogWarning("Invalid user ID in token: {UserIdClaim}", userIdClaim);
            throw new UnauthorizedAccessException("Invalid user ID in token");
        }
        return new UserId(userId);
    }

    private async Task<(InterviewSession? session, IActionResult? errorResult)> ValidateSessionAsync(
        Guid sessionId, 
        UserId userId, 
        bool requireActive = true,
        bool checkLocked = true)
    {
        try
        {
            var session = await _context.InterviewSessions
                .Include(s => s.Case)
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == sessionId)
                .ConfigureAwait(false);

            if (session == null)
            {
                _logger.LogWarning("Session not found: {SessionId}", sessionId);
                return (null, NotFound(new ProblemDetails
                {
                    Title = _localizer["Interview.SessionNotFound"],
                    Detail = _localizer["Interview.SessionNotFoundDetail"],
                    Instance = $"/api/v1/interview/session/{sessionId}"
                }));
            }

            if (session.UserId != userId)
            {
                _logger.LogWarning("Unauthorized access to session {SessionId} by user {UserId}", sessionId, userId);
                return (null, Forbid());
            }

            if (requireActive && session.Status != "active")
            {
                _logger.LogInformation("Session {SessionId} is not active: {Status}", sessionId, session.Status);
                return (null, Conflict(new ProblemDetails
                {
                    Title = _localizer["Interview.SessionNotActive"],
                    Detail = _localizer["Interview.SessionNotActiveDetail", session.Status],
                    Instance = $"/api/v1/interview/session/{sessionId}"
                }));
            }

            if (checkLocked && session.Case.IsInterviewLocked)
            {
                _logger.LogInformation("Interview locked for case {CaseId}", session.CaseId);
                return (null, Conflict(new ProblemDetails
                {
                    Title = _localizer["Interview.Locked"],
                    Detail = _localizer["Interview.LockedDetail"],
                    Instance = $"/api/v1/interview/case/{session.CaseId}"
                }));
            }

            // Check for session expiration (24 hours)
            if (session.StartedAt.AddHours(24) < DateTime.UtcNow)
            {
                _logger.LogInformation("Session {SessionId} has expired", sessionId);
                
                // Auto-expire the session
                session.Status = "expired";
                session.FinishedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync().ConfigureAwait(false);

                return (null, Conflict(new ProblemDetails
                {
                    Title = _localizer["Interview.SessionExpired"],
                    Detail = _localizer["Interview.SessionExpiredDetail"],
                    Instance = $"/api/v1/interview/session/{sessionId}"
                }));
            }

            return (session, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating session {SessionId}", sessionId);
            return (null, StatusCode(500, new ProblemDetails
            {
                Title = _localizer["Common.InternalError"],
                Detail = _localizer["Common.InternalErrorDetail"],
                Instance = $"/api/v1/interview/session/{sessionId}"
            }));
        }
    }

    private async Task<(Case? caseEntity, IActionResult? errorResult)> ValidateCaseAsync(CaseId caseId, UserId userId)
    {
        try
        {
            var caseEntity = await _context.Cases
                .FirstOrDefaultAsync(c => c.Id == caseId && c.UserId == userId)
                .ConfigureAwait(false);

            if (caseEntity == null)
            {
                _logger.LogWarning("Case not found or access denied: {CaseId} for user {UserId}", caseId, userId);
                return (null, NotFound(new ProblemDetails
                {
                    Title = _localizer["Cases.NotFound"],
                    Detail = _localizer["Cases.NotFoundDetail"],
                    Instance = $"/api/v1/cases/{caseId}"
                }));
            }

            return (caseEntity, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating case {CaseId}", caseId);
            return (null, StatusCode(500, new ProblemDetails
            {
                Title = _localizer["Common.InternalError"],
                Detail = _localizer["Common.InternalErrorDetail"],
                Instance = $"/api/v1/cases/{caseId}"
            }));
        }
    }

    /// <summary>
    /// Start a new interview session
    /// </summary>
    /// <param name="request">Interview start request</param>
    /// <returns>Interview session details</returns>
    [HttpPost("start")]
    [ProducesResponseType<InterviewStartResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Start([FromBody] InterviewStartRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("Starting interview for case {CaseId} by user {UserId}", request.CaseId, userId);

            // Validate the case
            var (caseEntity, errorResult) = await ValidateCaseAsync(request.CaseId, userId).ConfigureAwait(false);
            if (errorResult != null)
            {
                return errorResult;
            }

            if (caseEntity!.IsInterviewLocked)
            {
                _logger.LogInformation("Interview locked for case {CaseId}", request.CaseId);
                return Conflict(new ProblemDetails
                {
                    Title = _localizer["Interview.Locked"],
                    Detail = _localizer["Interview.LockedDetail"],
                    Instance = $"/api/v1/interview/case/{request.CaseId}"
                });
            }

            // Check if there's already an active session and clean it up
            var existingSession = await _context.InterviewSessions
                .FirstOrDefaultAsync(s => s.CaseId == request.CaseId && s.Status == "active")
                .ConfigureAwait(false);

            if (existingSession != null)
            {
                _logger.LogInformation("Cleaning up existing active session {SessionId} for case {CaseId}", 
                    existingSession.Id, request.CaseId);

                // Clear existing session data for fresh start
                var existingQAs = await _context.InterviewQAs
                    .Where(qa => qa.SessionId == existingSession.Id)
                    .ToListAsync().ConfigureAwait(false);

                _context.InterviewQAs.RemoveRange(existingQAs);
                _context.InterviewSessions.Remove(existingSession);
            }

            // Create new session
            var session = new InterviewSession
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CaseId = request.CaseId,
                Status = "active",
                StartedAt = DateTime.UtcNow
            };

            _context.InterviewSessions.Add(session);

            // Update case activity
            caseEntity.LastActivityAt = DateTimeOffset.UtcNow;
            
            await _context.SaveChangesAsync().ConfigureAwait(false);

            _logger.LogInformation("Interview session {SessionId} started for case {CaseId}", session.Id, request.CaseId);

            return Ok(new InterviewStartResponse
            {
                SessionId = session.Id,
                Status = session.Status,
                StartedAt = session.StartedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting interview for case {CaseId}", request.CaseId);
            return StatusCode(500, new ProblemDetails
            {
                Title = _localizer["Common.InternalError"],
                Detail = _localizer["Common.InternalErrorDetail"],
                Instance = "/api/v1/interview/start"
            });
        }
    }

    /// <summary>
    /// Answer an interview question
    /// </summary>
    /// <param name="request">Interview answer request</param>
    /// <returns>Answer confirmation</returns>
    [HttpPost("answer")]
    [ProducesResponseType<InterviewAnswerResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Answer([FromBody] InterviewAnswerRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("Recording answer for session {SessionId}: {QuestionKey} = {AnswerValue}", 
                request.SessionId, request.QuestionKey, request.AnswerValue);

            // Validate input
            if (string.IsNullOrWhiteSpace(request.QuestionKey))
            {
                return BadRequest(new ProblemDetails
                {
                    Title = _localizer["Interview.InvalidQuestion"],
                    Detail = _localizer["Interview.InvalidQuestionDetail"],
                    Instance = "/api/v1/interview/answer"
                });
            }

            if (string.IsNullOrWhiteSpace(request.AnswerValue))
            {
                return BadRequest(new ProblemDetails
                {
                    Title = _localizer["Interview.InvalidAnswer"],
                    Detail = _localizer["Interview.InvalidAnswerDetail"],
                    Instance = "/api/v1/interview/answer"
                });
            }

            // Validate session
            var (session, errorResult) = await ValidateSessionAsync(request.SessionId, userId).ConfigureAwait(false);
            if (errorResult != null)
            {
                return errorResult;
            }

            // Upsert the answer by QuestionKey to prevent overwriting different questions
            var existingQA = await _context.InterviewQAs
                .FirstOrDefaultAsync(q => q.SessionId == request.SessionId && q.QuestionKey == request.QuestionKey)
                .ConfigureAwait(false);

            int stepNumber;
            if (existingQA != null)
            {
                _logger.LogInformation("Updating existing answer for question {QuestionKey} in session {SessionId}", 
                    request.QuestionKey, request.SessionId);
                
                existingQA.AnswerValue = request.AnswerValue;
                existingQA.AnsweredAt = DateTime.UtcNow;
                stepNumber = existingQA.StepNumber;
            }
            else
            {
                // Get the next step number for this session
                var maxStepNumber = await _context.InterviewQAs
                    .Where(q => q.SessionId == request.SessionId)
                    .Select(q => (int?)q.StepNumber)
                    .MaxAsync().ConfigureAwait(false) ?? 0;

                stepNumber = maxStepNumber + 1;

                var newQA = new InterviewQA
                {
                    Id = Guid.NewGuid(),
                    SessionId = request.SessionId,
                    StepNumber = stepNumber,
                    QuestionKey = request.QuestionKey,
                    AnswerValue = request.AnswerValue,
                    AnsweredAt = DateTime.UtcNow
                };
                
                _context.InterviewQAs.Add(newQA);
                
                _logger.LogInformation("Added new answer for question {QuestionKey} in session {SessionId} at step {StepNumber}", 
                    request.QuestionKey, request.SessionId, stepNumber);
            }

            // Update case activity
            session!.Case.LastActivityAt = DateTimeOffset.UtcNow;
            
            await _context.SaveChangesAsync().ConfigureAwait(false);

            return Ok(new InterviewAnswerResponse
            {
                SessionId = request.SessionId,
                StepNumber = stepNumber,
                QuestionKey = request.QuestionKey,
                AnswerValue = request.AnswerValue,
                AnsweredAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording answer for session {SessionId}", request.SessionId);
            return StatusCode(500, new ProblemDetails
            {
                Title = _localizer["Common.InternalError"],
                Detail = _localizer["Common.InternalErrorDetail"],
                Instance = "/api/v1/interview/answer"
            });
        }
    }

    /// <summary>
    /// Complete the interview and get recommendation
    /// </summary>
    /// <param name="request">Interview complete request</param>
    /// <returns>Visa recommendation</returns>
    [HttpPost("complete")]
    [ProducesResponseType<InterviewCompleteResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Complete([FromBody] InterviewCompleteRequest request)
    {
        var userId = GetCurrentUserId();

        // Get session with QAs and case
        var session = await _context.InterviewSessions
            .Include(s => s.QAs)
            .Include(s => s.Case)
            .FirstOrDefaultAsync(s => s.Id == request.SessionId).ConfigureAwait(false);

        if (session == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Session Not Found",
                Detail = _localizer["Interview.SessionNotFound"]
            });
        }

        if (session.UserId != userId)
        {
            return Forbid();
        }

        if (session.Status != "active")
        {
            return Conflict(new ProblemDetails
            {
                Title = "Session Not Active",
                Detail = _localizer["Interview.Locked"]
            });
        }

        if (session.Case.IsInterviewLocked)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Interview Locked",
                Detail = _localizer["Interview.Locked"]
            });
        }

        // Build answers dictionary for recommendation
        var answers = session.QAs.ToDictionary(qa => qa.QuestionKey, qa => qa.AnswerValue);

        // Get recommendation
        var recommendation = await _recommender.GetRecommendationAsync(answers).ConfigureAwait(false);

        // Create visa recommendation record
        var visaRecommendation = new VisaRecommendation
        {
            Id = Guid.NewGuid(),
            CaseId = session.CaseId,
            VisaTypeId = recommendation.VisaTypeId,
            Rationale = recommendation.Rationale,
            CreatedAt = DateTime.UtcNow
        };

        _context.VisaRecommendations.Add(visaRecommendation);

        // Mark session as completed
        session.Status = "completed";
        session.FinishedAt = DateTime.UtcNow;

        // Update case with assigned visa type
        session.Case.VisaTypeId = recommendation.VisaTypeId;
        session.Case.LastActivityAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Get visa type name for response
        var visaType = await _context.VisaTypes.FindAsync(recommendation.VisaTypeId).ConfigureAwait(false);
        
        return Ok(new InterviewCompleteResponse
        {
            RecommendationVisaType = visaType?.Name ?? "Unknown",
            Rationale = recommendation.Rationale
        });
    }

    /// <summary>
    /// Start a new interview session (rerun)
    /// </summary>
    /// <param name="request">Interview rerun request</param>
    /// <returns>New interview session details</returns>
    [HttpPost("rerun")]
    [ProducesResponseType<InterviewStartResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Rerun([FromBody] InterviewRerunRequest request)
    {
        var userId = GetCurrentUserId();

        // Verify the case exists and belongs to the user
        var caseEntity = await _context.Cases
            .FirstOrDefaultAsync(c => c.Id == request.CaseId && c.UserId == userId).ConfigureAwait(false);

        if (caseEntity == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Case Not Found",
                Detail = _localizer["Cases.NotFound"]
            });
        }

        if (caseEntity.IsInterviewLocked)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Interview Locked",
                Detail = _localizer["Interview.Locked"]
            });
        }

        // Cancel any active sessions for this case
        var activeSessions = await _context.InterviewSessions
            .Where(s => s.CaseId == request.CaseId && s.Status == "active")
            .ToListAsync().ConfigureAwait(false);

        foreach (var activeSession in activeSessions)
        {
            activeSession.Status = "cancelled";
            activeSession.FinishedAt = DateTime.UtcNow;
        }

        // Create new session
        var session = new InterviewSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CaseId = request.CaseId,
            Status = "active",
            StartedAt = DateTime.UtcNow
        };

        _context.InterviewSessions.Add(session);

        // Update case activity
        caseEntity.LastActivityAt = DateTimeOffset.UtcNow;
        
        await _context.SaveChangesAsync().ConfigureAwait(false);

        return Ok(new InterviewStartResponse
        {
            SessionId = session.Id,
            Status = session.Status,
            StartedAt = session.StartedAt
        });
    }

    /// <summary>
    /// Lock the interview for a case
    /// </summary>
    /// <param name="request">Interview lock request</param>
    /// <returns>Success response</returns>
    [HttpPost("lock")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Lock([FromBody] InterviewLockRequest request)
    {
        // For now, allow any authenticated user to lock - later restrict to staff/admin
        var userId = GetCurrentUserId();

        var caseEntity = await _context.Cases
            .FirstOrDefaultAsync(c => c.Id == request.CaseId && c.UserId == userId).ConfigureAwait(false);

        if (caseEntity == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Case Not Found",
                Detail = _localizer["Cases.NotFound"]
            });
        }

        // Lock the case
        caseEntity.IsInterviewLocked = true;

        // Lock the latest visa recommendation if exists
        var latestRecommendation = await _context.VisaRecommendations
            .Where(r => r.CaseId == request.CaseId)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync().ConfigureAwait(false);

        if (latestRecommendation != null)
        {
            latestRecommendation.LockedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync().ConfigureAwait(false);

        return NoContent();
    }

    /// <summary>
    /// Reset interview session (cancel current session and create a completely fresh one)
    /// </summary>
    /// <param name="request">Interview reset request</param>
    /// <returns>New interview session details</returns>
    [HttpPost("reset")]
    [ProducesResponseType<InterviewStartResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Reset([FromBody] InterviewResetRequest request)
    {
        var userId = GetCurrentUserId();

        // Verify the session exists and belongs to the user
        var session = await _context.InterviewSessions
            .Include(s => s.Case)
            .FirstOrDefaultAsync(s => s.Id == request.SessionId && s.UserId == userId).ConfigureAwait(false);

        if (session == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Session Not Found",
                Detail = _localizer["Interview.SessionNotFound"]
            });
        }

        if (session.Case.IsInterviewLocked)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Interview Locked",
                Detail = _localizer["Interview.Locked"]
            });
        }

        // COMPLETELY CANCEL the existing session instead of resetting it
        // This ensures no cached state or progress tracking issues
        session.Status = "cancelled";
        session.FinishedAt = DateTime.UtcNow;

        // Delete all Q&As for the old session
        var qasToDelete = await _context.InterviewQAs
            .Where(qa => qa.SessionId == request.SessionId)
            .ToListAsync().ConfigureAwait(false);

        _context.InterviewQAs.RemoveRange(qasToDelete);

        // Create a BRAND NEW session with a new ID
        var newSession = new InterviewSession
        {
            Id = Guid.NewGuid(), // Completely new session ID
            UserId = userId,
            CaseId = session.CaseId, // Same case, but fresh session
            Status = "active",
            StartedAt = DateTime.UtcNow
        };

        _context.InterviewSessions.Add(newSession);

        // Update case activity
        session.Case.LastActivityAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);

        _logger.LogInformation($"Interview reset: cancelled session {request.SessionId}, created new session {newSession.Id}");

        return Ok(new InterviewStartResponse
        {
            SessionId = newSession.Id, // Return the NEW session ID
            Status = newSession.Status,
            StartedAt = newSession.StartedAt
        });
    }

    /// <summary>
    /// Get interview session progress and status
    /// </summary>
    /// <param name="sessionId">Interview session ID</param>
    /// <returns>Session progress information</returns>
    [HttpGet("progress/{sessionId:guid}")]
    [ProducesResponseType<InterviewProgressResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProgress(Guid sessionId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var (session, errorResult) = await ValidateSessionAsync(sessionId, userId, requireActive: false, checkLocked: false).ConfigureAwait(false);
            
            if (errorResult != null)
            {
                return errorResult;
            }

            // Get all Q&As for this session
            var qas = await _context.InterviewQAs
                .Where(qa => qa.SessionId == sessionId)
                .OrderBy(qa => qa.StepNumber)
                .ToListAsync()
                .ConfigureAwait(false);

            // Build answers dictionary
            var answers = qas.ToDictionary(qa => qa.QuestionKey, qa => qa.AnswerValue);

            // Get remaining visa types from adaptive service
            var remainingVisaTypes = new List<string>();
            var estimatedQuestionsRemaining = 0;
            var completionPercentage = 0;

            if (session!.Status == "active")
            {
                try
                {
                    var nextQuestion = await _adaptiveInterview.GetNextQuestionAsync(answers, session.User).ConfigureAwait(false);
                    remainingVisaTypes = nextQuestion.RemainingVisaCodes;
                    
                    // Estimate completion percentage based on questions answered and remaining visa types
                    var totalQuestionsAnswered = qas.Count;
                    var maxExpectedQuestions = 8; // Typical interview length
                    completionPercentage = Math.Min(100, (totalQuestionsAnswered * 100) / maxExpectedQuestions);
                    
                    // Adjust based on remaining visa types
                    if (remainingVisaTypes.Count <= 3)
                    {
                        completionPercentage = Math.Max(completionPercentage, 80);
                    }
                    
                    estimatedQuestionsRemaining = Math.Max(0, maxExpectedQuestions - totalQuestionsAnswered);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error getting progress for session {SessionId}", sessionId);
                    // Continue with default values
                }
            }
            else if (session.Status == "completed")
            {
                completionPercentage = 100;
            }

            var response = new InterviewProgressResponse
            {
                SessionId = sessionId,
                Status = session.Status,
                StartedAt = session.StartedAt,
                FinishedAt = session.FinishedAt,
                CurrentQuestionNumber = qas.Count + 1,
                TotalQuestionsAnswered = qas.Count,
                EstimatedQuestionsRemaining = estimatedQuestionsRemaining,
                CompletionPercentage = completionPercentage,
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes,
                LastActivityAt = qas.LastOrDefault()?.AnsweredAt ?? session.StartedAt
            };

            _logger.LogInformation("Progress retrieved for session {SessionId}: {CompletionPercentage}% complete", 
                sessionId, completionPercentage);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting progress for session {SessionId}", sessionId);
            return StatusCode(500, new ProblemDetails
            {
                Title = _localizer["Common.InternalError"],
                Detail = _localizer["Common.InternalErrorDetail"],
                Instance = $"/api/v1/interview/progress/{sessionId}"
            });
        }
    }

    /// <summary>
    /// Get interview history for current user
    /// </summary>
    /// <returns>Interview history</returns>
    [HttpGet("history")]
    [ProducesResponseType<InterviewHistoryResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHistory()
    {
        var userId = GetCurrentUserId();

        // Get user's cases
        var userCases = await _context.Cases
            .Where(c => c.UserId == userId)
            .Select(c => c.Id)
            .ToListAsync().ConfigureAwait(false);

        // Get all sessions for user's cases
        var sessions = await _context.InterviewSessions
            .Where(s => userCases.Contains(s.CaseId))
            .OrderByDescending(s => s.StartedAt)
            .Select(s => new InterviewSessionSummary
            {
                Id = s.Id,
                Status = s.Status,
                StartedAt = s.StartedAt,
                FinishedAt = s.FinishedAt
            })
            .ToListAsync().ConfigureAwait(false);

        // Get latest recommendation
        var latestRecommendation = await _context.VisaRecommendations
            .Include(r => r.VisaType)
            .Where(r => userCases.Contains(r.CaseId))
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new VisaRecommendationSummary
            {
                VisaType = r.VisaType.Name,
                Rationale = r.Rationale ?? "",
                CreatedAt = r.CreatedAt,
                IsLocked = r.LockedAt.HasValue
            })
            .FirstOrDefaultAsync().ConfigureAwait(false);

        return Ok(new InterviewHistoryResponse
        {
            Sessions = sessions,
            LatestRecommendation = latestRecommendation
        });
    }

    /// <summary>
    /// Get the next question in an adaptive interview
    /// </summary>
    /// <param name="request">Next question request</param>
    /// <returns>Next interview question or completion status</returns>
    [HttpPost("next-question")]
    [ProducesResponseType<InterviewNextQuestionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GetNextQuestion([FromBody] InterviewNextQuestionRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            _logger.LogInformation("Getting next question for session {SessionId}", request.SessionId);

            // Validate session
            var (session, errorResult) = await ValidateSessionAsync(request.SessionId, userId).ConfigureAwait(false);
            if (errorResult != null)
            {
                return errorResult;
            }

            // Get session QAs
            var qas = await _context.InterviewQAs
                .Where(qa => qa.SessionId == request.SessionId)
                .OrderBy(qa => qa.StepNumber)
                .ToListAsync()
                .ConfigureAwait(false);

            // Build current answers from session
            var answers = qas.ToDictionary(qa => qa.QuestionKey, qa => qa.AnswerValue);
            
            _logger.LogInformation("Session {SessionId} has {AnswerCount} answers", request.SessionId, answers.Count);

            // Check if interview is complete first
            var isComplete = await _adaptiveInterview.IsCompleteAsync(answers, session!.User).ConfigureAwait(false);

            if (isComplete)
            {
                _logger.LogInformation("Interview complete for session {SessionId}, generating recommendation", request.SessionId);

                // Get recommendation
                var recommendation = await _adaptiveInterview.GetRecommendationAsync(answers, session.User).ConfigureAwait(false);

                // Create visa recommendation record
                var visaRecommendation = new VisaRecommendation
                {
                    Id = Guid.NewGuid(),
                    CaseId = session.CaseId,
                    VisaTypeId = recommendation.VisaTypeId,
                    Rationale = recommendation.Rationale,
                    CreatedAt = DateTime.UtcNow
                };

                _context.VisaRecommendations.Add(visaRecommendation);

                // Mark session as completed
                session.Status = "completed";
                session.FinishedAt = DateTime.UtcNow;

                // Update case with assigned visa type
                session.Case.VisaTypeId = recommendation.VisaTypeId;
                session.Case.LastActivityAt = DateTimeOffset.UtcNow;

                await _context.SaveChangesAsync().ConfigureAwait(false);

                // Get visa type for response
                var visaType = await _context.VisaTypes.FindAsync(recommendation.VisaTypeId).ConfigureAwait(false);

                _logger.LogInformation("Recommendation generated for session {SessionId}: VisaTypeId={VisaTypeId}, Code={Code}",
                    request.SessionId, recommendation.VisaTypeId, visaType?.Code);

                return Ok(new InterviewNextQuestionResponse
                {
                    IsComplete = true,
                    Question = null,
                    Recommendation = new InterviewRecommendation
                    {
                        VisaType = visaType?.Code ?? "Unknown",
                        Rationale = recommendation.Rationale
                    }
                });
            }

            // Get next question from adaptive service
            var nextQuestion = await _adaptiveInterview.GetNextQuestionAsync(answers, session.User).ConfigureAwait(false);

            _logger.LogInformation("Next question for session {SessionId}: {QuestionKey} with {OptionCount} options, {RemainingVisaTypes} visa types remaining",
                request.SessionId, nextQuestion.Key, nextQuestion.Options.Count, nextQuestion.RemainingVisaTypes);

            return Ok(new InterviewNextQuestionResponse
            {
                IsComplete = false,
                Question = new InterviewQuestionDto
                {
                    Key = nextQuestion.Key,
                    Question = nextQuestion.Question,
                    Type = nextQuestion.Type,
                    Options = nextQuestion.Options.Select(o => new InterviewOptionDto
                    {
                        Value = o.Value,
                        Label = o.Label,
                        Description = o.Description
                    }).ToList(),
                    Required = nextQuestion.Required,
                    RemainingVisaTypes = nextQuestion.RemainingVisaTypes,
                    RemainingVisaCodes = nextQuestion.RemainingVisaCodes
                },
                Recommendation = null
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting next question for session {SessionId}", request.SessionId);
            return StatusCode(500, new ProblemDetails
            {
                Title = _localizer["Common.InternalError"],
                Detail = _localizer["Common.InternalErrorDetail"],
                Instance = "/api/v1/interview/next-question"
            });
        }
    }

    /// <summary>
    /// Select a specific visa type directly (skip remaining interview questions)
    /// </summary>
    /// <param name="request">Session ID and selected visa type code</param>
    /// <returns>Confirmation with selected visa type</returns>
    [HttpPost("select-visa-type")]
    [ProducesResponseType<InterviewNextQuestionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SelectVisaType([FromBody] SelectVisaTypeRequest request)
    {
        var userId = GetCurrentUserId();

        // Get the session
        var session = await _context.InterviewSessions
            .Include(s => s.Case)
            .FirstOrDefaultAsync(s => s.Id == request.SessionId)
            .ConfigureAwait(false);

        if (session == null)
        {
            return NotFound(new ProblemDetails { Title = "Session not found" });
        }

        // Verify user owns this session
        if (session.Case.UserId != userId)
        {
            return Forbid();
        }

        // Get the visa type
        var visaType = await _context.VisaTypes
            .FirstOrDefaultAsync(v => v.Code == request.VisaTypeCode)
            .ConfigureAwait(false);

        if (visaType == null)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid visa type",
                Detail = $"Visa type {request.VisaTypeCode} not found"
            });
        }

        // Update the case with selected visa type
        session.Case.VisaTypeId = visaType.Id;
        session.Case.LastActivityAt = DateTimeOffset.UtcNow;

        // Mark session as completed
        session.Status = "completed";
        session.FinishedAt = DateTime.UtcNow;

        // Create a recommendation record
        var recommendation = new VisaRecommendation
        {
            CaseId = session.CaseId,
            VisaTypeId = visaType.Id,
            Rationale = $"User selected {visaType.Code} ({visaType.Name}) directly during the interview process. This is a suggested starting point for working with legal professionals.",
            CreatedAt = DateTime.UtcNow
        };

        _context.VisaRecommendations.Add(recommendation);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        _logger.LogInformation("User {UserId} selected visa type {VisaCode} for session {SessionId}",
            userId, visaType.Code, session.Id);

        return Ok(new InterviewNextQuestionResponse
        {
            IsComplete = true,
            Question = null,
            Recommendation = new InterviewRecommendation
            {
                VisaType = visaType.Code,
                Rationale = recommendation.Rationale
            }
        });
    }

    /// <summary>
    /// Create an adoption case for international adoption workflows
    /// </summary>
    /// <param name="request">Adoption case creation request</param>
    /// <returns>Created adoption case</returns>
    [HttpPost("adoption/create")]
    [ProducesResponseType<AdoptionCase>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateAdoptionCase([FromBody] AdoptionCaseRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();

            // Verify the case exists and belongs to the user
            var caseEntity = await _context.Cases
                .FirstOrDefaultAsync(c => c.Id == request.CaseId && c.UserId == userId)
                .ConfigureAwait(false);

            if (caseEntity == null)
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Case Not Found",
                    Detail = _localizer["Cases.NotFound"]
                });
            }

            // Check if adoption case already exists
            var existingAdoptionCase = await _adoptionCaseService.GetAdoptionCaseAsync(request.CaseId).ConfigureAwait(false);
            if (existingAdoptionCase != null)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Adoption Case Already Exists",
                    Detail = "An adoption case already exists for this case ID"
                });
            }

            var adoptionCase = await _adoptionCaseService.CreateAdoptionCaseAsync(request).ConfigureAwait(false);

            _logger.LogInformation("Created adoption case {AdoptionCaseId} for user {UserId} and case {CaseId}",
                adoptionCase.Id, userId, request.CaseId);

            return CreatedAtAction(nameof(GetAdoptionCase), new { caseId = request.CaseId }, adoptionCase);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating adoption case for CaseId {CaseId}", request.CaseId);
            return StatusCode(500, new ProblemDetails
            {
                Title = _localizer["Common.InternalError"],
                Detail = _localizer["Common.InternalErrorDetail"],
                Instance = "/api/v1/interview/adoption/create"
            });
        }
    }

    /// <summary>
    /// Get adoption case details
    /// </summary>
    /// <param name="caseId">Case ID</param>
    /// <returns>Adoption case details</returns>
    [HttpGet("adoption/{caseId:guid}")]
    [ProducesResponseType<AdoptionCase>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAdoptionCase(Guid caseId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var caseIdValue = new CaseId(caseId);

            // Verify the case belongs to the user
            var caseEntity = await _context.Cases
                .FirstOrDefaultAsync(c => c.Id == caseIdValue && c.UserId == userId)
                .ConfigureAwait(false);

            if (caseEntity == null)
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Case Not Found",
                    Detail = _localizer["Cases.NotFound"]
                });
            }

            var adoptionCase = await _adoptionCaseService.GetAdoptionCaseAsync(caseIdValue).ConfigureAwait(false);
            if (adoptionCase == null)
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Adoption Case Not Found",
                    Detail = "No adoption case found for this case ID"
                });
            }

            return Ok(adoptionCase);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving adoption case for CaseId {CaseId}", caseId);
            return StatusCode(500, new ProblemDetails
            {
                Title = _localizer["Common.InternalError"],
                Detail = _localizer["Common.InternalErrorDetail"],
                Instance = $"/api/v1/interview/adoption/{caseId}"
            });
        }
    }

    /// <summary>
    /// Get adoption recommendation based on case details
    /// </summary>
    /// <param name="caseId">Case ID</param>
    /// <returns>Adoption visa recommendation</returns>
    [HttpGet("adoption/{caseId:guid}/recommendation")]
    [ProducesResponseType<AdoptionRecommendationResult>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAdoptionRecommendation(Guid caseId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var caseIdValue = new CaseId(caseId);

            // Verify the case belongs to the user
            var caseEntity = await _context.Cases
                .FirstOrDefaultAsync(c => c.Id == caseIdValue && c.UserId == userId)
                .ConfigureAwait(false);

            if (caseEntity == null)
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Case Not Found",
                    Detail = _localizer["Cases.NotFound"]
                });
            }

            var recommendation = await _adoptionCaseService.GetAdoptionRecommendationAsync(caseIdValue).ConfigureAwait(false);

            _logger.LogInformation("Generated adoption recommendation for CaseId {CaseId}: {VisaType}",
                caseId, recommendation.RecommendedVisaType);

            return Ok(recommendation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating adoption recommendation for CaseId {CaseId}", caseId);
            return StatusCode(500, new ProblemDetails
            {
                Title = _localizer["Common.InternalError"],
                Detail = _localizer["Common.InternalErrorDetail"],
                Instance = $"/api/v1/interview/adoption/{caseId}/recommendation"
            });
        }
    }

    /// <summary>
    /// Get adoption documents for a case
    /// </summary>
    /// <param name="caseId">Case ID</param>
    /// <returns>List of adoption documents</returns>
    [HttpGet("adoption/{caseId:guid}/documents")]
    [ProducesResponseType<List<AdoptionDocument>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAdoptionDocuments(Guid caseId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var caseIdValue = new CaseId(caseId);

            // Verify the case belongs to the user
            var caseEntity = await _context.Cases
                .FirstOrDefaultAsync(c => c.Id == caseIdValue && c.UserId == userId)
                .ConfigureAwait(false);

            if (caseEntity == null)
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Case Not Found",
                    Detail = _localizer["Cases.NotFound"]
                });
            }

            var adoptionCase = await _adoptionCaseService.GetAdoptionCaseAsync(caseIdValue).ConfigureAwait(false);
            if (adoptionCase == null)
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Adoption Case Not Found",
                    Detail = "No adoption case found for this case ID"
                });
            }

            var documents = await _adoptionCaseService.GetAdoptionDocumentsAsync(adoptionCase.Id).ConfigureAwait(false);

            return Ok(documents);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving adoption documents for CaseId {CaseId}", caseId);
            return StatusCode(500, new ProblemDetails
            {
                Title = _localizer["Common.InternalError"],
                Detail = _localizer["Common.InternalErrorDetail"],
                Instance = $"/api/v1/interview/adoption/{caseId}/documents"
            });
        }
    }

    /// <summary>
    /// Add a document to an adoption case
    /// </summary>
    /// <param name="caseId">Case ID</param>
    /// <param name="document">Document to add</param>
    /// <returns>Created document</returns>
    [HttpPost("adoption/{caseId:guid}/documents")]
    [ProducesResponseType<AdoptionDocument>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddAdoptionDocument(Guid caseId, [FromBody] AdoptionDocument document)
    {
        try
        {
            var userId = GetCurrentUserId();
            var caseIdValue = new CaseId(caseId);

            // Verify the case belongs to the user
            var caseEntity = await _context.Cases
                .FirstOrDefaultAsync(c => c.Id == caseIdValue && c.UserId == userId)
                .ConfigureAwait(false);

            if (caseEntity == null)
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Case Not Found",
                    Detail = _localizer["Cases.NotFound"]
                });
            }

            var adoptionCase = await _adoptionCaseService.GetAdoptionCaseAsync(caseIdValue).ConfigureAwait(false);
            if (adoptionCase == null)
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Adoption Case Not Found",
                    Detail = "No adoption case found for this case ID"
                });
            }

            // Set the adoption case ID
            document.AdoptionCaseId = adoptionCase.Id;
            document.CreatedBy = userId.ToString();

            var createdDocument = await _adoptionCaseService.AddAdoptionDocumentAsync(document).ConfigureAwait(false);

            _logger.LogInformation("Added adoption document {DocumentType} for CaseId {CaseId}",
                document.DocumentType, caseId);

            return CreatedAtAction(nameof(GetAdoptionDocuments), new { caseId }, createdDocument);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding adoption document for CaseId {CaseId}", caseId);
            return StatusCode(500, new ProblemDetails
            {
                Title = _localizer["Common.InternalError"],
                Detail = _localizer["Common.InternalErrorDetail"],
                Instance = $"/api/v1/interview/adoption/{caseId}/documents"
            });
        }
    }

    /// <summary>
    /// Create a citizenship case for naturalization/citizenship workflows
    /// </summary>
    /// <param name="request">Citizenship case creation request</param>
    /// <returns>Created citizenship case</returns>
    [HttpPost("citizenship/create")]
    [ProducesResponseType<CitizenshipCase>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateCitizenshipCase([FromBody] CitizenshipApplicationRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();

            // Verify the case exists and belongs to the user
            var caseEntity = await _context.Cases
                .FirstOrDefaultAsync(c => c.Id == request.CaseId && c.UserId == userId)
                .ConfigureAwait(false);

            if (caseEntity == null)
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Case Not Found",
                    Detail = _localizer["Cases.NotFound"]
                });
            }

            // Check if citizenship case already exists
            var existingCitizenshipCase = await _citizenshipCaseService.GetCitizenshipCaseAsync(request.CaseId).ConfigureAwait(false);
            if (existingCitizenshipCase != null)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Citizenship Case Already Exists",
                    Detail = "A citizenship case already exists for this case ID"
                });
            }

            var citizenshipCase = await _citizenshipCaseService.CreateCitizenshipCaseAsync(request.CaseId, request).ConfigureAwait(false);

            _logger.LogInformation("Created citizenship case {CitizenshipCaseId} for user {UserId} and case {CaseId}",
                citizenshipCase.Id, userId, request.CaseId);

            return CreatedAtAction(nameof(GetCitizenshipCase), new { caseId = request.CaseId }, citizenshipCase);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating citizenship case for CaseId {CaseId}", request.CaseId);
            return StatusCode(500, new ProblemDetails
            {
                Title = _localizer["Common.InternalError"],
                Detail = _localizer["Common.InternalErrorDetail"],
                Instance = "/api/v1/interview/citizenship/create"
            });
        }
    }

    /// <summary>
    /// Get citizenship case details
    /// </summary>
    /// <param name="caseId">Case ID</param>
    /// <returns>Citizenship case details</returns>
    [HttpGet("citizenship/{caseId:guid}")]
    [ProducesResponseType<CitizenshipCase>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCitizenshipCase(Guid caseId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var caseIdValue = new CaseId(caseId);

            // Verify the case belongs to the user
            var caseEntity = await _context.Cases
                .FirstOrDefaultAsync(c => c.Id == caseIdValue && c.UserId == userId)
                .ConfigureAwait(false);

            if (caseEntity == null)
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Case Not Found",
                    Detail = _localizer["Cases.NotFound"]
                });
            }

            var citizenshipCase = await _citizenshipCaseService.GetCitizenshipCaseAsync(caseIdValue).ConfigureAwait(false);
            if (citizenshipCase == null)
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Citizenship Case Not Found",
                    Detail = "No citizenship case found for this case ID"
                });
            }

            return Ok(citizenshipCase);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving citizenship case for CaseId {CaseId}", caseId);
            return StatusCode(500, new ProblemDetails
            {
                Title = _localizer["Common.InternalError"],
                Detail = _localizer["Common.InternalErrorDetail"],
                Instance = $"/api/v1/interview/citizenship/{caseId}"
            });
        }
    }

    /// <summary>
    /// Get citizenship recommendation based on interview answers
    /// </summary>
    /// <param name="answers">Citizenship interview answers</param>
    /// <returns>Citizenship recommendation</returns>
    [HttpPost("citizenship/recommendation")]
    [ProducesResponseType<CitizenshipRecommendationResult>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetCitizenshipRecommendation([FromBody] CitizenshipInterviewAnswers answers)
    {
        try
        {
            var userId = GetCurrentUserId();

            var recommendation = await _citizenshipCaseService.GetCitizenshipRecommendationAsync(answers).ConfigureAwait(false);

            _logger.LogInformation("Generated citizenship recommendation for user {UserId}: {RecommendedApplication}, Eligible: {IsEligible}",
                userId, recommendation.RecommendedApplication, recommendation.IsEligible);

            return Ok(recommendation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating citizenship recommendation for user {UserId}", GetCurrentUserId());
            return StatusCode(500, new ProblemDetails
            {
                Title = _localizer["Common.InternalError"],
                Detail = _localizer["Common.InternalErrorDetail"],
                Instance = "/api/v1/interview/citizenship/recommendation"
            });
        }
    }

    /// <summary>
    /// Check citizenship eligibility based on interview answers
    /// </summary>
    /// <param name="answers">Citizenship interview answers</param>
    /// <returns>Eligibility status</returns>
    [HttpPost("citizenship/eligibility")]
    [ProducesResponseType<bool>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CheckCitizenshipEligibility([FromBody] CitizenshipInterviewAnswers answers)
    {
        try
        {
            var userId = GetCurrentUserId();

            var isEligible = await _citizenshipCaseService.IsEligibleForCitizenshipAsync(answers).ConfigureAwait(false);

            _logger.LogInformation("Checked citizenship eligibility for user {UserId}: {IsEligible}", userId, isEligible);

            return Ok(isEligible);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking citizenship eligibility for user {UserId}", GetCurrentUserId());
            return StatusCode(500, new ProblemDetails
            {
                Title = _localizer["Common.InternalError"],
                Detail = _localizer["Common.InternalErrorDetail"],
                Instance = "/api/v1/interview/citizenship/eligibility"
            });
        }
    }

    /// <summary>
    /// Get citizenship test requirements based on interview answers
    /// </summary>
    /// <param name="answers">Citizenship interview answers</param>
    /// <returns>Test requirements</returns>
    [HttpPost("citizenship/test-requirements")]
    [ProducesResponseType<CitizenshipTestInformation>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetCitizenshipTestRequirements([FromBody] CitizenshipInterviewAnswers answers)
    {
        try
        {
            var userId = GetCurrentUserId();

            var testRequirements = await _citizenshipCaseService.GetTestRequirementsAsync(answers).ConfigureAwait(false);

            _logger.LogInformation("Generated citizenship test requirements for user {UserId}: English={NeedsEnglish}, Civics={NeedsCivics}",
                userId, testRequirements.NeedsEnglishTest, testRequirements.NeedsCivicsTest);

            return Ok(testRequirements);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating citizenship test requirements for user {UserId}", GetCurrentUserId());
            return StatusCode(500, new ProblemDetails
            {
                Title = _localizer["Common.InternalError"],
                Detail = _localizer["Common.InternalErrorDetail"],
                Instance = "/api/v1/interview/citizenship/test-requirements"
            });
        }
    }

    /// <summary>
    /// Get required documents for a citizenship application type
    /// </summary>
    /// <param name="applicationType">Application type (N-400, N-600, etc.)</param>
    /// <returns>List of required documents</returns>
    [HttpGet("citizenship/documents/{applicationType}")]
    [ProducesResponseType<List<string>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetCitizenshipRequiredDocuments(CitizenshipApplicationType applicationType)
    {
        try
        {
            var userId = GetCurrentUserId();

            var requiredDocuments = await _citizenshipCaseService.GetRequiredDocumentsAsync(applicationType).ConfigureAwait(false);

            _logger.LogInformation("Retrieved required documents for user {UserId} and application type {ApplicationType}",
                userId, applicationType);

            return Ok(requiredDocuments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving required documents for application type {ApplicationType}", applicationType);
            return StatusCode(500, new ProblemDetails
            {
                Title = _localizer["Common.InternalError"],
                Detail = _localizer["Common.InternalErrorDetail"],
                Instance = $"/api/v1/interview/citizenship/documents/{applicationType}"
            });
        }
    }
}