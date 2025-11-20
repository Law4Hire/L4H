using L4H.Api.DTOs.Interview;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Services.Interview;
using L4H.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace L4H.Api.Controllers;

/// <summary>
/// Handles professional/attorney actions on interview sessions
/// </summary>
[ApiController]
[Route("api/interview/professional")]
[Authorize(Roles = "Attorney,LegalProfessional,Admin")]
public class ProfessionalInterviewController : ControllerBase
{
    private readonly IInterviewOrchestrator _orchestrator;
    private readonly L4HDbContext _context;
    private readonly ILogger<ProfessionalInterviewController> _logger;

    public ProfessionalInterviewController(
        IInterviewOrchestrator orchestrator,
        L4HDbContext context,
        ILogger<ProfessionalInterviewController> logger)
    {
        _orchestrator = orchestrator;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Locks a specific visa for a session (professional recommendation)
    /// </summary>
    [HttpPost("lock-visa")]
    public async Task<ActionResult> LockVisa([FromBody] LockVisaRequest request)
    {
        try
        {
            // Get user ID from claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userGuid))
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            var userId = new UserId(userGuid);

            await _orchestrator.LockVisaForSessionAsync(
                request.SessionId,
                request.VisaTypeId,
                userId,
                request.Reason);

            return Ok(new { success = true });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Error locking visa for session {SessionId}", request.SessionId);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error locking visa for session {SessionId}", request.SessionId);
            return StatusCode(500, new { error = "Failed to lock visa" });
        }
    }

    /// <summary>
    /// Unlocks a previously locked visa
    /// </summary>
    [HttpPost("unlock-visa")]
    public async Task<ActionResult> UnlockVisa([FromBody] UnlockVisaRequest request)
    {
        try
        {
            await _orchestrator.UnlockVisaForSessionAsync(
                request.SessionId,
                request.VisaTypeId,
                request.Reason);

            return Ok(new { success = true });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Error unlocking visa for session {SessionId}", request.SessionId);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unlocking visa for session {SessionId}", request.SessionId);
            return StatusCode(500, new { error = "Failed to unlock visa" });
        }
    }

    /// <summary>
    /// Gets all evaluations for a session (professional view)
    /// </summary>
    [HttpGet("session/{sessionId}/evaluations")]
    public async Task<ActionResult<List<VisaEvaluationDTO>>> GetSessionEvaluations(Guid sessionId)
    {
        try
        {
            // Note: This endpoint uses sessionId directly (not anonymous token)
            // For professional review of authenticated user sessions
            var results = await _orchestrator.GetVisaEvaluationsAsync(sessionId);
            return Ok(results.Select(r => r.ToDTO()).ToList());
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Session not found: {SessionId}", sessionId);
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting evaluations for session {SessionId}", sessionId);
            return StatusCode(500, new { error = "Failed to get evaluations" });
        }
    }

    /// <summary>
    /// Gets the lock status for a session.
    /// </summary>
    [HttpGet("session/{sessionId}/lock-status")]
    [AllowAnonymous] // Allow anonymous users to check status before retaking
    public async Task<ActionResult<SessionLockStatusResult>> GetSessionLockStatus(Guid sessionId)
    {
        try
        {
            var result = await _orchestrator.GetSessionLockStatusAsync(sessionId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting lock status for session {SessionId}", sessionId);
            return StatusCode(500, new { error = "Failed to get lock status" });
        }
    }
}
