using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using System.Security.Claims;
using System.Globalization;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/time-tracking")]
[Route("api/v1/time-entries")]
[Authorize]
[Tags("Time Tracking")]
public class TimeTrackingController : ControllerBase
{
    private readonly L4HDbContext _context;
    private readonly ILogger<TimeTrackingController> _logger;

    public TimeTrackingController(L4HDbContext context, ILogger<TimeTrackingController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Start a new time tracking session
    /// </summary>
    [HttpPost("start")]
    [ProducesResponseType(typeof(TimeEntry), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<TimeEntry>> StartTimeTracking([FromBody] StartTimeTrackingRequest request)
    {
        var attorneyId = await GetCurrentAttorneyId();
        
        if (attorneyId == null)
        {
            var userIdClaim = User.FindFirst("sub")?.Value;
            return BadRequest($"Current user is not a registered attorney/staff member. User ID Claim: {userIdClaim}");
        }

        // Verify attorney exists and is active
        var attorney = await _context.Attorneys.FirstOrDefaultAsync(a => a.Id == attorneyId.Value && a.IsActive);
        if (attorney == null)
        {
            return BadRequest($"Attorney not found or inactive (ID: {attorneyId})");
        }

        // Resolve Case and User
        Case? caseEntity = null;
        User? clientUser = null;

        if (request.CaseId.HasValue)
        {
            var caseIdTyped = new CaseId(request.CaseId.Value);
            caseEntity = await _context.Cases
                .Include(c => c.User)
                .FirstOrDefaultAsync(c => c.Id == caseIdTyped);

            if (caseEntity == null)
            {
                return BadRequest("Case not found");
            }

            clientUser = caseEntity.User;
        }
        else if (request.ClientId.HasValue) // ClientId here is actually UserId (Guid)
        {
            var userId = new UserId(request.ClientId.Value);
            clientUser = await _context.Users.FindAsync(userId);
            
            if (clientUser != null)
            {
                // We MUST have a valid CaseId for the TimeEntry database constraint.
                caseEntity = await _context.Cases
                    .Where(c => c.UserId == userId)
                    .OrderByDescending(c => c.LastActivityAt)
                    .FirstOrDefaultAsync();
                
                if (caseEntity == null)
                {
                    return BadRequest($"User {clientUser.FirstName} {clientUser.LastName} has no active cases. Please create a case first.");
                }
            }
        }

        if (clientUser == null)
        {
            return BadRequest("Client user not found");
        }

        var isAdmin = User.HasClaim(c => c.Type == "is_admin" && c.Value.Equals("true", StringComparison.OrdinalIgnoreCase));
        
        // Access check - user must be assigned to attorney or admin
        if (!isAdmin && clientUser.AssignedAttorneyId != attorneyId)
        {
            // Also allow if they are working on a case assigned to them, even if client isn't
            if (caseEntity?.AssignedStaffId != attorneyId)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ProblemDetails 
                { 
                    Title = "Forbidden", 
                    Detail = $"You can only track time for your assigned clients or cases." 
                });
            }
        }

        // Check for existing active time tracking session
        var activeSession = await _context.TimeEntries
            .FirstOrDefaultAsync(te => te.AttorneyId == attorneyId && te.EndTime == null);

        if (activeSession != null)
        {
            return BadRequest("You already have an active time tracking session. Please stop it first.");
        }

        // Create new time entry
        var timeEntry = new TimeEntry
        {
            CaseId = caseEntity?.Id ?? default, 
            UserId = clientUser.Id,
            AttorneyId = attorneyId.Value,
            StartTime = DateTime.UtcNow,
            Description = request.Description ?? string.Empty,
            Notes = request.Notes ?? string.Empty,
            HourlyRate = attorney.DefaultHourlyRate,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = User.FindFirst(ClaimTypes.Email)?.Value ?? "system",
            UpdatedBy = User.FindFirst(ClaimTypes.Email)?.Value ?? "system",
            IsBillable = true, // Default to billable
            ServiceType = "Legal"
        };
        
        _context.TimeEntries.Add(timeEntry);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTimeEntry), new { id = timeEntry.Id }, timeEntry);
    }

    /// <summary>
    /// Stop an active time tracking session
    /// </summary>
    [HttpPost("stop/{id}")]
    [ProducesResponseType(typeof(TimeEntry), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<TimeEntry>> StopTimeTracking(int id, [FromBody] StopTimeTrackingRequest? request = null)
    {
        var attorneyId = await GetCurrentAttorneyId();
        if (attorneyId == null) return BadRequest("Invalid user");

        var timeEntry = await _context.TimeEntries
            .Include(te => te.User)
            .Include(te => te.Attorney)
            .FirstOrDefaultAsync(te => te.Id == id);

        if (timeEntry == null)
        {
            return NotFound();
        }

        // Verify ownership (unless admin)
        var isAdmin = User.HasClaim("is_admin", "true");
        if (!isAdmin && timeEntry.AttorneyId != attorneyId)
        {
            return Forbid();
        }

        if (timeEntry.EndTime != null)
        {
            return BadRequest("Time tracking session is already stopped");
        }

        // Stop the session
        timeEntry.EndTime = DateTime.UtcNow;
        
        // Update description and notes if provided
        if (request != null)
        {
            if (!string.IsNullOrWhiteSpace(request.Description))
            {
                timeEntry.Description = request.Description;
            }
            if (!string.IsNullOrWhiteSpace(request.Notes))
            {
                timeEntry.Notes = request.Notes;
            }
        }

        // Get site configuration for billing rules
        var config = await _context.SiteConfigurations.OrderBy(c => c.Id).FirstOrDefaultAsync();
        var roundUp = config?.RoundBillingUp ?? false;

        // Calculate duration and billing amount with rounding preference
        timeEntry.RoundDurationToSixMinuteIncrements(roundUp);
        
        timeEntry.UpdatedAt = DateTime.UtcNow;
        timeEntry.UpdatedBy = User.FindFirst(ClaimTypes.Email)?.Value ?? "system";

        await _context.SaveChangesAsync();

        return Ok(timeEntry);
    }

    /// <summary>
    /// Get active time tracking session for current user
    /// </summary>
    [HttpGet("active")]
    [ProducesResponseType(typeof(TimeEntry), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<ActionResult<TimeEntry>> GetActiveTimeTracking()
    {
        var attorneyId = await GetCurrentAttorneyId();
        if (attorneyId == null) return BadRequest("Invalid user");

        var activeSession = await _context.TimeEntries
            .Include(te => te.User)
            .Include(te => te.Attorney)
            .FirstOrDefaultAsync(te => te.AttorneyId == attorneyId && te.EndTime == null);

        if (activeSession == null)
        {
            return NoContent();
        }

        return Ok(activeSession);
    }

    /// <summary>
    /// Get a specific time entry
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(TimeEntry), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<TimeEntry>> GetTimeEntry(int id)
    {
        var attorneyId = await GetCurrentAttorneyId();
        if (attorneyId == null) return BadRequest("Invalid user");

        var query = _context.TimeEntries
            .Include(te => te.User)
            .Include(te => te.Attorney)
            .AsQueryable();

        // Role-based filtering
        var isAdmin = User.HasClaim("is_admin", "true");
        if (!isAdmin)
        {
            query = query.Where(te => te.AttorneyId == attorneyId);
        }

        var timeEntry = await query.FirstOrDefaultAsync(te => te.Id == id);

        if (timeEntry == null)
        {
            return NotFound();
        }

        return Ok(timeEntry);
    }

    /// <summary>
    /// Get time entries with filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(TimeEntry[]), StatusCodes.Status200OK)]
    public async Task<ActionResult<TimeEntry[]>> GetTimeEntries(
        [FromQuery] Guid? clientId = null,
        [FromQuery] int? attorneyId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] bool? isBilled = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var currentAttorneyId = await GetCurrentAttorneyId();
        if (currentAttorneyId == null) return BadRequest("Invalid user");

        var query = _context.TimeEntries
            .Include(te => te.User)
            .Include(te => te.Attorney)
            .AsQueryable();

        // Role-based filtering
        var isAdmin = User.HasClaim("is_admin", "true");
        if (!isAdmin)
        {
            // Legal professionals only see their own time entries
            query = query.Where(te => te.AttorneyId == currentAttorneyId);
        }

        // Apply filters
        if (clientId.HasValue)
        {
            var userId = new UserId(clientId.Value);
            query = query.Where(te => te.UserId == userId);
        }

        if (attorneyId.HasValue && isAdmin)
        {
            query = query.Where(te => te.AttorneyId == attorneyId.Value);
        }

        if (startDate.HasValue)
        {
            query = query.Where(te => te.StartTime >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(te => te.StartTime <= endDate.Value);
        }

        if (isBilled.HasValue)
        {
            query = query.Where(te => te.IsBilled == isBilled.Value);
        }

        // Only show completed time entries
        query = query.Where(te => te.EndTime != null);

        var totalCount = await query.CountAsync();
        var timeEntries = await query
            .OrderByDescending(te => te.StartTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToArrayAsync();

        Response.Headers.Append("X-Total-Count", totalCount.ToString());
        return Ok(timeEntries);
    }

    /// <summary>
    /// Update a time entry
    /// </summary>
    [HttpPut("{id}")]
    [HttpPut("entries/{id}")]
    public async Task<ActionResult> UpdateTimeEntry(int id, [FromBody] UpdateTimeEntryRequest request)
    {
        var attorneyId = await GetCurrentAttorneyId();
        if (attorneyId == null) return BadRequest("Invalid user");

        var timeEntry = await _context.TimeEntries.FirstOrDefaultAsync(te => te.Id == id);
        if (timeEntry == null)
        {
            return NotFound();
        }

        var isAdmin = User.HasClaim("is_admin", "true");
        if (!isAdmin && timeEntry.AttorneyId != attorneyId)
        {
            return Forbid();
        }

        if (timeEntry.IsBilled)
        {
            return BadRequest("Cannot edit billed time entries");
        }

        if (timeEntry.EndTime == null)
        {
            return BadRequest("Cannot edit active time tracking session. Stop it first.");
        }

        if (!string.IsNullOrWhiteSpace(request.Description))
        {
            timeEntry.Description = request.Description;
        }

        if (!string.IsNullOrWhiteSpace(request.Notes))
        {
            timeEntry.Notes = request.Notes;
        }

        if (request.StartTime.HasValue && request.EndTime.HasValue)
        {
            if (request.EndTime.Value <= request.StartTime.Value)
            {
                return BadRequest("End time must be after start time");
            }

            timeEntry.StartTime = request.StartTime.Value;
            timeEntry.EndTime = request.EndTime.Value;

            var config = await _context.SiteConfigurations.OrderBy(c => c.Id).FirstOrDefaultAsync();
            var roundUp = config?.RoundBillingUp ?? false;
            timeEntry.RoundDurationToSixMinuteIncrements(roundUp);
        }
        else if (request.Duration.HasValue)
        {
            if (request.Duration.Value <= 0)
            {
                return BadRequest("Duration must be greater than zero");
            }

            var config = await _context.SiteConfigurations.OrderBy(c => c.Id).FirstOrDefaultAsync();
            var roundUp = config?.RoundBillingUp ?? false;

            decimal roundedDuration;
            if (roundUp)
            {
                roundedDuration = Math.Ceiling(request.Duration.Value / 0.1m) * 0.1m;
            }
            else
            {
                roundedDuration = Math.Floor(request.Duration.Value / 0.1m) * 0.1m;
            }

            if (roundedDuration <= 0) roundedDuration = 0.1m;

            timeEntry.Duration = roundedDuration;
            timeEntry.BillableAmount = roundedDuration * timeEntry.HourlyRate;

            if (timeEntry.StartTime != default)
            {
                timeEntry.EndTime = timeEntry.StartTime.AddHours((double)roundedDuration);
            }
        }
        
        timeEntry.UpdatedAt = DateTime.UtcNow;
        timeEntry.UpdatedBy = User.FindFirst(ClaimTypes.Email)?.Value ?? "system";

        await _context.SaveChangesAsync();
        return Ok(timeEntry);
    }

    /// <summary>
    /// Delete a time entry
    /// </summary>
    [HttpDelete("{id}")]
    [HttpDelete("entries/{id}")]
    public async Task<ActionResult> DeleteTimeEntry(int id)
    {
        var attorneyId = await GetCurrentAttorneyId();
        if (attorneyId == null) return BadRequest("Invalid user");

        var timeEntry = await _context.TimeEntries.FirstOrDefaultAsync(te => te.Id == id);
        if (timeEntry == null)
        {
            return NotFound();
        }

        var isAdmin = User.HasClaim("is_admin", "true");
        if (!isAdmin && timeEntry.AttorneyId != attorneyId)
        {
            return Forbid();
        }

        if (timeEntry.IsBilled)
        {
            return BadRequest("Cannot delete billed time entries");
        }

        _context.TimeEntries.Remove(timeEntry);
        await _context.SaveChangesAsync();

        return Ok();
    }
    
    /// <summary>
    /// Get time tracking statistics
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(TimeTrackingStats), StatusCodes.Status200OK)]
    public async Task<ActionResult<TimeTrackingStats>> GetStats()
    {
        var attorneyId = await GetCurrentAttorneyId();
        if (attorneyId == null) return BadRequest("Invalid user");

        var now = DateTime.UtcNow;
        var today = now.Date;
        var startOfWeek = today.AddDays(-(int)today.DayOfWeek);

        var query = _context.TimeEntries.Where(te => te.AttorneyId == attorneyId);

        var hoursToday = await query
            .Where(te => te.StartTime >= today)
            .SumAsync(te => te.Duration);

        var hoursThisWeek = await query
            .Where(te => te.StartTime >= startOfWeek)
            .SumAsync(te => te.Duration);

        var unbilledAmount = await query
            .Where(te => !te.IsBilled)
            .SumAsync(te => te.BillableAmount);

        return Ok(new TimeTrackingStats
        {
            HoursToday = hoursToday,
            HoursThisWeek = hoursThisWeek,
            UnbilledAmount = unbilledAmount
        });
    }

    private async Task<int?> GetCurrentAttorneyId()
    {
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return null;
        }

        var user = await _context.Users.FindAsync(new UserId(userId));
        return user?.AttorneyProfileId;
    }
}

public class TimeTrackingStats
{
    public decimal HoursToday { get; set; }
    public decimal HoursThisWeek { get; set; }
    public decimal UnbilledAmount { get; set; }
}
    
// Request/Response Models
public class StartTimeTrackingRequest
{
    public Guid? ClientId { get; set; }
    public Guid? CaseId { get; set; }
    public string? Description { get; set; }
    public string? Notes { get; set; }
}

public class StopTimeTrackingRequest
{
    public string? Description { get; set; }
    public string? Notes { get; set; }
}

public class UpdateTimeEntryRequest
{
    public string? Description { get; set; }
    public string? Notes { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public decimal? Duration { get; set; } // Duration in hours (e.g., 1.5 = 1.5 hours)
}
