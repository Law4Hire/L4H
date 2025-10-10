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
    private readonly IStringLocalizer<Shared> _localizer;
    private readonly ILogger<InterviewController> _logger;

    public InterviewController(
        L4HDbContext context,
        IInterviewRecommender recommender,
        IAdaptiveInterviewService adaptiveInterview,
        IStringLocalizer<Shared> localizer,
        ILogger<InterviewController> logger)
    {
        _context = context;
        _recommender = recommender;
        _adaptiveInterview = adaptiveInterview;
        _localizer = localizer;
        _logger = logger;
    }

    private UserId GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user ID in token");
        }
        return new UserId(userId);
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
    public async Task<IActionResult> Start([FromBody] InterviewStartRequest request)
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

        // Check if there's already an active session and clear it for fresh testing
        var existingSession = await _context.InterviewSessions
            .FirstOrDefaultAsync(s => s.CaseId == request.CaseId && s.Status == "active").ConfigureAwait(false);

        if (existingSession != null)
        {
            // Clear existing session data for fresh testing
            var existingQAs = await _context.InterviewQAs
                .Where(qa => qa.SessionId == existingSession.Id)
                .ToListAsync().ConfigureAwait(false);

            _context.InterviewQAs.RemoveRange(existingQAs);
            _context.InterviewSessions.Remove(existingSession);
            await _context.SaveChangesAsync().ConfigureAwait(false);
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
        var userId = GetCurrentUserId();

        // Get session with case
        var session = await _context.InterviewSessions
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

        // Upsert the answer by QuestionKey (not StepNumber) to prevent overwriting different questions
        var existingQA = await _context.InterviewQAs
            .FirstOrDefaultAsync(q => q.SessionId == request.SessionId && q.QuestionKey == request.QuestionKey).ConfigureAwait(false);

        if (existingQA != null)
        {
            existingQA.QuestionKey = request.QuestionKey;
            existingQA.AnswerValue = request.AnswerValue;
            existingQA.AnsweredAt = DateTime.UtcNow;
        }
        else
        {
            // Get the next step number for this session
            var maxStepNumber = await _context.InterviewQAs
                .Where(q => q.SessionId == request.SessionId)
                .Select(q => (int?)q.StepNumber)
                .MaxAsync().ConfigureAwait(false) ?? 0;

            var newQA = new InterviewQA
            {
                Id = Guid.NewGuid(),
                SessionId = request.SessionId,
                StepNumber = maxStepNumber + 1,
                QuestionKey = request.QuestionKey,
                AnswerValue = request.AnswerValue,
                AnsweredAt = DateTime.UtcNow
            };
            _context.InterviewQAs.Add(newQA);
        }

        // Update case activity
        session.Case.LastActivityAt = DateTimeOffset.UtcNow;
        
        await _context.SaveChangesAsync().ConfigureAwait(false);

        return Ok(new InterviewAnswerResponse
        {
            SessionId = request.SessionId,
            StepNumber = request.StepNumber,
            QuestionKey = request.QuestionKey,
            AnswerValue = request.AnswerValue,
            AnsweredAt = DateTime.UtcNow
        });
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
    public async Task<IActionResult> GetNextQuestion([FromBody] InterviewNextQuestionRequest request)
    {
        var userId = GetCurrentUserId();

        // Get session with QAs and user data
        var session = await _context.InterviewSessions
            .Include(s => s.QAs)
            .Include(s => s.Case)
            .Include(s => s.User) // Include user data for profile information
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

        // Build current answers from session
        var answers = session.QAs.ToDictionary(qa => qa.QuestionKey, qa => qa.AnswerValue);

        // Get next question from adaptive service
        var nextQuestion = await _adaptiveInterview.GetNextQuestionAsync(answers, session.User).ConfigureAwait(false);

        // Check if interview is complete
        var isComplete = await _adaptiveInterview.IsCompleteAsync(answers, session.User).ConfigureAwait(false);

        if (isComplete)
        {
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

            // Get visa type name for response
            var visaType = await _context.VisaTypes.FindAsync(recommendation.VisaTypeId).ConfigureAwait(false);

            _logger.LogInformation("Returning recommendation: VisaTypeId={VisaTypeId}, Code={Code}, Name={Name}",
                recommendation.VisaTypeId, visaType?.Code, visaType?.Name);

            return Ok(new InterviewNextQuestionResponse
            {
                IsComplete = true,
                Question = null,
                Recommendation = new InterviewRecommendation
                {
                    VisaType = visaType?.Code ?? "Unknown",  // Return Code (L-1A, L-1B) not Name
                    Rationale = recommendation.Rationale
                }
            });
        }

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
}