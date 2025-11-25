using L4H.Api.DTOs.Interview;
using L4H.Infrastructure.Services.Interview;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace L4H.Api.Controllers;

/// <summary>
/// Handles anonymous interview flow - no authentication required
/// </summary>
[ApiController]
[Route("api/interview/anonymous")]
[AllowAnonymous]
public class AnonymousInterviewController : ControllerBase
{
    private readonly IInterviewOrchestrator _orchestrator;
    private readonly ILogger<AnonymousInterviewController> _logger;

    public AnonymousInterviewController(
        IInterviewOrchestrator orchestrator,
        ILogger<AnonymousInterviewController> logger)
    {
        _orchestrator = orchestrator;
        _logger = logger;
    }

    /// <summary>
    /// Starts a new anonymous interview session
    /// </summary>
    [HttpPost("start")]
    public async Task<ActionResult<StartInterviewResponse>> StartInterview(
        [FromBody] StartInterviewRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        var result = await _orchestrator.StartAnonymousInterviewAsync(request.LanguageCode);
        return Ok(result.ToStartResponse());
    }

    /// <summary>
    /// Resumes an existing interview session
    /// </summary>
    [HttpPost("resume")]
    public async Task<ActionResult<ResumeInterviewResponse>> ResumeInterview(
        [FromBody] ResumeInterviewRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        try
        {
            var result = await _orchestrator.ResumeInterviewAsync(request.SessionToken);
            return Ok(result.ToResumeResponse());
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Session not found: {SessionToken}", request.SessionToken);
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Submits an answer and gets the next question
    /// </summary>
    [HttpPost("answer")]
    public async Task<ActionResult<SubmitAnswerResponse>> SubmitAnswer(
        [FromBody] SubmitAnswerRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        try
        {
            var result = await _orchestrator.SubmitAnswerAsync(
                request.SessionToken,
                request.QuestionKey,
                request.Answer);

            return Ok(result.ToSubmitResponse());
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Session not found: {SessionToken}", request.SessionToken);
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Completes the interview and generates visa evaluations
    /// </summary>
    [HttpPost("complete")]
    public async Task<ActionResult<CompleteInterviewResponse>> CompleteInterview(
        [FromBody] CompleteInterviewRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        try
        {
            var result = await _orchestrator.CompleteInterviewAsync(request.SessionToken);
            return Ok(result.ToCompleteResponse());
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Session not found: {SessionToken}", request.SessionToken);
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Gets visa evaluation results for a session
    /// </summary>
    [HttpGet("evaluations/{sessionToken}")]
    public async Task<ActionResult<List<VisaEvaluationDTO>>> GetEvaluations(Guid sessionToken)
    {
        try
        {
            var results = await _orchestrator.GetVisaEvaluationsAsync(sessionToken);
            return Ok(results.Select(r => r.ToDTO()).ToList());
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Session not found: {SessionToken}", sessionToken);
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>
    /// User selects their preferred visa
    /// </summary>
    [HttpPost("select-visa")]
    public async Task<ActionResult> SelectVisa([FromBody] SelectVisaRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        try
        {
            await _orchestrator.SelectVisaAsync(request.SessionToken, request.VisaTypeId);
            return Ok(new { success = true });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Error selecting visa for session {SessionToken}", request.SessionToken);
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Creates user account and converts anonymous session to authenticated
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<RegisterWithInterviewResponse>> RegisterWithInterview(
        [FromBody] RegisterWithInterviewRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        try
        {
            var session = await _orchestrator.RegisterWithInterviewAsync(
                request.AnonymousToken,
                request.Email,
                request.Password,
                request.FirstName,
                request.LastName);

            return Ok(new RegisterWithInterviewResponse
            {
                SessionId = session.Id,
                UserId = session.UserId!.Value.Value,
                Email = request.Email,
                Success = true
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Error registering with interview for token {AnonymousToken}",
                request.AnonymousToken);
            return BadRequest(new RegisterWithInterviewResponse
            {
                Success = false,
                ErrorMessage = ex.Message
            });
        }
    }
}
