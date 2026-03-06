using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Services.Interview;
using L4H.Shared.Models;
using System.Security.Claims;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/interview")]
[Authorize]
[Tags("Interview")]
public class InterviewController : ControllerBase
{
    private readonly IAgentOrchestrator _orchestrator;
    private readonly L4HDbContext _context;
    private readonly ILogger<InterviewController> _logger;

    public InterviewController(
        IAgentOrchestrator orchestrator,
        L4HDbContext context,
        ILogger<InterviewController> logger)
    {
        _orchestrator = orchestrator;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Start a new interview session for a case
    /// </summary>
    [HttpPost("start")]
    public async Task<IActionResult> StartInterview([FromBody] StartAuthenticatedInterviewRequest request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        try
        {
            // Verify case ownership
            var caseId = new CaseId(request.CaseId);
            var caseEntity = await _context.Cases.FindAsync(caseId);
            
            if (caseEntity == null)
            {
                return NotFound("Case not found");
            }

            if (caseEntity.UserId != new UserId(userId))
            {
                return Forbid();
            }

            // Start the interview using orchestrator
            var result = await _orchestrator.StartAuthenticatedInterviewAsync(caseId, new UserId(userId), request.InitialAnswers);
            
            return Ok(new { 
                sessionId = result.SessionId,
                sessionToken = result.SessionToken,
                firstQuestion = result.FirstQuestion
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting interview for case {CaseId}", request.CaseId);
            return StatusCode(500, "Internal server error");
        }
    }
}

public class StartAuthenticatedInterviewRequest
{
    public Guid CaseId { get; set; }
    public Dictionary<string, string>? InitialAnswers { get; set; }
}
