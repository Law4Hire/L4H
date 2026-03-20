using L4H.Api.DTOs.Interview;
using L4H.Infrastructure.Services;
using L4H.Infrastructure.Services.Interview;
using L4H.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace L4H.Api.Controllers;

/// <summary>
/// Handles anonymous interview flow - no authentication required
/// </summary>
[ApiController]
[Route("api/v1/interview/anonymous")]
[AllowAnonymous]
public class AnonymousInterviewController : ControllerBase
{
    private readonly IAgentOrchestrator _orchestrator;
    private readonly IEmailVerificationService _emailVerificationService;
    private readonly ISessionManagementService _sessionManagementService;
    private readonly AuthConfig _authConfig;
    private readonly ILogger<AnonymousInterviewController> _logger;

    public AnonymousInterviewController(
        IAgentOrchestrator orchestrator,
        IEmailVerificationService emailVerificationService,
        ISessionManagementService sessionManagementService,
        IOptions<AuthConfig> authConfig,
        ILogger<AnonymousInterviewController> logger)
    {
        _orchestrator = orchestrator;
        _emailVerificationService = emailVerificationService;
        _sessionManagementService = sessionManagementService;
        _authConfig = authConfig.Value;
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

        var result = await _orchestrator.StartAnonymousInterviewAsync(request.InitialAnswers, request.ExistingSessionId);
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
    /// Returns registration prefill values captured during the interview.
    /// </summary>
    [HttpGet("registration-prefill/{anonymousToken}")]
    public async Task<ActionResult<RegistrationPrefillResponse>> GetRegistrationPrefill(Guid anonymousToken)
    {
        try
        {
            var result = await _orchestrator.GetRegistrationPrefillAsync(anonymousToken);
            return Ok(result.ToRegistrationPrefillResponse());
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Registration prefill not found for token {AnonymousToken}", anonymousToken);
            return NotFound(new ProblemDetails
            {
                Title = "Interview Session Not Found",
                Detail = ex.Message,
                Status = StatusCodes.Status404NotFound
            });
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
            var signupRequest = new SignupRequest
            {
                Email = request.Email,
                Password = request.Password,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber,
                DateOfBirth = request.DateOfBirth,
                Country = request.Country,
                Nationality = request.Nationality,
                Citizenship = request.Citizenship
            };
            var session = await _orchestrator.RegisterWithInterviewAsync(request.AnonymousToken, signupRequest);

            if (session.UserId is not { } userId)
            {
                throw new InvalidOperationException("Registration completed, but the interview session was not linked to the user.");
            }

            if (_authConfig.EmailVerification.Required)
            {
                var verificationToken = await _emailVerificationService.CreateVerificationTokenAsync(userId);
                _logger.LogInformation("Email verification token for {Email}: {Token}", request.Email, verificationToken);
            }

            await _sessionManagementService.CreateSessionAsync(
                userId,
                HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                Request.Headers.UserAgent.ToString() ?? string.Empty);

            var token = HttpContext.RequestServices
                .GetRequiredService<IJwtTokenService>()
                .GenerateAccessToken(session.User!);

            return Ok(new RegisterWithInterviewResponse
            {
                SessionId = session.Id,
                UserId = userId.Value,
                Email = request.Email,
                Token = token,
                Success = true
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Error registering with interview for token {AnonymousToken}",
                request.AnonymousToken);
            return BadRequest(new ProblemDetails
            {
                Title = "Interview Registration Failed",
                Detail = ex.Message,
                Status = StatusCodes.Status400BadRequest
            });
        }
    }
}
