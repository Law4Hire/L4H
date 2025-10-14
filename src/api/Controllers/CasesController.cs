using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using System.Security.Claims;
using System.Text.Json;
using System.Globalization;

namespace L4H.Api.Controllers;

[ApiController]
[Route("v1/cases")]
[Authorize]
[Tags("Cases")]
public class CasesController : ControllerBase
{
    private readonly L4HDbContext _context;
    private readonly IStringLocalizer<Shared> _localizer;

    public CasesController(L4HDbContext context, IStringLocalizer<Shared> localizer)
    {
        _context = context;
        _localizer = localizer;
    }

    /// <summary>
    /// Get the current user's cases (default endpoint)
    /// </summary>
    /// <returns>List of user's cases</returns>
    [HttpGet]
    [ProducesResponseType(typeof(CaseResponse[]), StatusCodes.Status200OK)]
    public async Task<ActionResult<CaseResponse[]>> GetCases()
    {
        return await GetMyCases().ConfigureAwait(false);
    }

    /// <summary>
    /// Get the current user's cases
    /// </summary>
    /// <returns>List of user's cases</returns>
    [HttpGet("mine")]
    [ProducesResponseType(typeof(CaseResponse[]), StatusCodes.Status200OK)]
    public async Task<ActionResult<CaseResponse[]>> GetMyCases()
    {
        var userId = GetCurrentUserId();
        
        var cases = await _context.Cases
            .Include(c => c.VisaType)
            .Include(c => c.Package)
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.LastActivityAt)
            .ToListAsync().ConfigureAwait(false);

        var response = cases.Select(c => new CaseResponse
        {
            Id = c.Id.Value,
            Status = c.Status,
            LastActivityAt = c.LastActivityAt,
            VisaTypeCode = c.VisaType?.Code,
            VisaTypeName = c.VisaType?.Name,
            PackageCode = c.Package?.Code,
            PackageDisplayName = c.Package?.DisplayName,
            CreatedAt = c.CreatedAt
        }).ToArray();

        // Audit log for case access
        await LogAuditAsync("case", "list_mine", "Case", "multiple", new { count = cases.Count }).ConfigureAwait(false);

        return Ok(response);
    }

    /// <summary>
    /// Get a specific case by ID
    /// </summary>
    /// <param name="id">Case ID</param>
    /// <returns>Case details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(CaseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<CaseResponse>> GetCase(Guid id)
    {
        var caseId = new CaseId(id);
        var userId = GetCurrentUserId();
        var isAdmin = IsAdmin();

        var caseEntity = await _context.Cases
            .Include(c => c.VisaType)
            .Include(c => c.Package)
            .Include(c => c.PriceSnapshots.OrderByDescending(p => p.CreatedAt))
            .FirstOrDefaultAsync(c => c.Id == caseId).ConfigureAwait(false);

        if (caseEntity == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Not Found",
                Detail = _localizer["Cases.NotFound"]
            });
        }

        // Check access: owner or admin
        if (caseEntity.UserId != userId && !isAdmin)
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Cases.Forbidden"]
            });
        }

        var response = new CaseResponse
        {
            Id = caseEntity.Id.Value,
            Status = caseEntity.Status,
            LastActivityAt = caseEntity.LastActivityAt,
            VisaTypeCode = caseEntity.VisaType?.Code,
            VisaTypeName = caseEntity.VisaType?.Name,
            PackageCode = caseEntity.Package?.Code,
            PackageDisplayName = caseEntity.Package?.DisplayName,
            CreatedAt = caseEntity.CreatedAt,
            LatestPriceSnapshot = caseEntity.PriceSnapshots.FirstOrDefault() != null 
                ? new PriceSnapshotResponse
                {
                    Id = caseEntity.PriceSnapshots.First().Id,
                    VisaTypeCode = caseEntity.PriceSnapshots.First().VisaTypeCode,
                    PackageCode = caseEntity.PriceSnapshots.First().PackageCode,
                    CountryCode = caseEntity.PriceSnapshots.First().CountryCode,
                    Total = caseEntity.PriceSnapshots.First().Total,
                    Currency = caseEntity.PriceSnapshots.First().Currency,
                    CreatedAt = caseEntity.PriceSnapshots.First().CreatedAt
                }
                : null
        };

        // Audit log for case access
        await LogAuditAsync("case", "view", "Case", id.ToString(), new { status = caseEntity.Status }).ConfigureAwait(false);

        return Ok(response);
    }

    /// <summary>
    /// Update case status with guarded transitions
    /// </summary>
    /// <param name="id">Case ID</param>
    /// <param name="request">Status update request</param>
    /// <returns>Success message</returns>
    [HttpPatch("{id}/status")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<MessageResponse>> UpdateCaseStatus(Guid id, [FromBody] UpdateCaseStatusRequest request)
    {
        var caseId = new CaseId(id);
        var userId = GetCurrentUserId();
        var isAdmin = IsAdmin();

        var caseEntity = await _context.Cases.FirstOrDefaultAsync(c => c.Id == caseId).ConfigureAwait(false);
        if (caseEntity == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Not Found",
                Detail = _localizer["Cases.NotFound"]
            });
        }

        // Check access: owner or admin
        if (caseEntity.UserId != userId && !isAdmin)
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Cases.Forbidden"]
            });
        }

        // Validate transition
        if (!IsValidTransition(caseEntity.Status, request.Status))
        {
            return StatusCode(409, new ProblemDetails
            {
                Title = "Invalid Transition",
                Detail = _localizer["Cases.InvalidTransition"]
            });
        }

        var oldStatus = caseEntity.Status;
        caseEntity.Status = request.Status;
        caseEntity.LastActivityAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Audit log for status change
        await LogAuditAsync("case", "status_change", "Case", id.ToString(), 
            new { oldStatus, newStatus = request.Status }).ConfigureAwait(false);

        return Ok(new MessageResponse
        {
            Message = _localizer["Cases.TransitionApplied"]
        });
    }

    private static bool IsValidTransition(string currentStatus, string newStatus)
    {
        return currentStatus.ToLower(CultureInfo.InvariantCulture) switch
        {
            "pending" => newStatus.ToLower(CultureInfo.InvariantCulture) is "paid" or "inactive",
            "paid" => newStatus.ToLower(CultureInfo.InvariantCulture) is "active" or "inactive", 
            "active" => newStatus.ToLower(CultureInfo.InvariantCulture) is "closed" or "denied" or "inactive",
            "inactive" => newStatus.ToLower(CultureInfo.InvariantCulture) is "paid",
            "closed" or "denied" => false, // Terminal states
            _ => false
        };
    }

    private UserId GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (Guid.TryParse(userIdClaim, out var userId))
        {
            return new UserId(userId);
        }
        throw new UnauthorizedAccessException("User ID not found in claims");
    }

    private bool IsAdmin()
    {
        return User.HasClaim("is_admin", "True") || User.IsInRole("Admin");
    }

    private async Task LogAuditAsync(string category, string action, string targetType, string targetId, object details)
    {
        var userId = GetCurrentUserId();
        var auditLog = new AuditLog
        {
            Category = category,
            ActorUserId = userId,
            Action = action,
            TargetType = targetType,
            TargetId = targetId,
            DetailsJson = JsonSerializer.Serialize(details),
            CreatedAt = DateTime.UtcNow
        };

        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync().ConfigureAwait(false);
    }

    /// <summary>
    /// Reset the visa type for a case (allows user to retake interview)
    /// </summary>
    /// <param name="id">Case ID</param>
    /// <returns>Success response</returns>
    [HttpPost("{id}/reset-visa-type")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ResetVisaType(Guid id)
    {
        var caseId = new CaseId(id);
        var userId = GetCurrentUserId();

        var caseEntity = await _context.Cases
            .FirstOrDefaultAsync(c => c.Id == caseId && c.UserId == userId)
            .ConfigureAwait(false);

        if (caseEntity == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Not Found",
                Detail = "Case not found or you don't have permission to access it"
            });
        }

        // Reset visa type
        caseEntity.VisaTypeId = null;
        caseEntity.LastActivityAt = DateTimeOffset.UtcNow;

        // Remove all interview sessions and recommendations for this case
        var sessionsToRemove = await _context.InterviewSessions
            .Where(s => s.CaseId == caseId)
            .ToListAsync()
            .ConfigureAwait(false);

        var recommendationsToRemove = await _context.VisaRecommendations
            .Where(r => r.CaseId == caseId)
            .ToListAsync()
            .ConfigureAwait(false);

        _context.InterviewSessions.RemoveRange(sessionsToRemove);
        _context.VisaRecommendations.RemoveRange(recommendationsToRemove);

        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Audit log
        await LogAuditAsync("case", "reset_visa_type", "Case", caseId.Value.ToString(),
            new { caseId = caseId.Value }).ConfigureAwait(false);

        return Ok(new { message = "Visa type reset successfully" });
    }
}

// DTOs
public class CaseResponse
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset LastActivityAt { get; set; }
    public string? VisaTypeCode { get; set; }
    public string? VisaTypeName { get; set; }
    public string? PackageCode { get; set; }
    public string? PackageDisplayName { get; set; }
    public DateTime CreatedAt { get; set; }
    public PriceSnapshotResponse? LatestPriceSnapshot { get; set; }
}

public class PriceSnapshotResponse
{
    public int Id { get; set; }
    public string VisaTypeCode { get; set; } = string.Empty;
    public string PackageCode { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string Currency { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class UpdateCaseStatusRequest
{
    public string Status { get; set; } = string.Empty;
}

