using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using System.Security.Claims;

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
        
        // Fallback: If AttorneyId is null on the user, try to find by email
        if (attorneyId == null)
        {
            var userIdClaim = User.FindFirst("sub")?.Value;
            _logger.LogWarning("AttorneyId is null for user claim sub: {Sub}. Attempting fallback...", userIdClaim);
            
            if (Guid.TryParse(userIdClaim, out var userId))
            {
                var user = await _context.Users.FindAsync(new UserId(userId));
                if (user != null)
                {
                    _logger.LogWarning("User found: {Email}. AttorneyId: {AttorneyId}", user.Email, user.AttorneyId);
                    if (!string.IsNullOrEmpty(user.Email))
                    {
                        var fallbackAttorney = await _context.Attorneys.FirstOrDefaultAsync(a => a.Email == user.Email);
                        if (fallbackAttorney != null)
                        {
                            _logger.LogInformation("Fallback found attorney by email: {Id}", fallbackAttorney.Id);
                            attorneyId = fallbackAttorney.Id;
                            // Optional: Self-heal the link
                            user.AttorneyId = attorneyId;
                            await _context.SaveChangesAsync();
                        }
                        else
                        {
                            _logger.LogWarning("Fallback failed: No attorney found with email {Email}", user.Email);
                        }
                    }
                }
                else
                {
                    _logger.LogError("User not found in DB with ID: {UserId}", userId);
                }
            }
        }

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

        // Resolve Case and Client
        Case? caseEntity = null;
        Client? client = null;

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

            // Find client by matching user email (Cannlaw specific mapping)
            client = await _context.Clients.FirstOrDefaultAsync(c => c.Email == caseEntity.User.Email);

            // Auto-create Client if missing but User exists
            if (client == null && caseEntity.User != null)
            {
                client = new Client
                {
                    FirstName = caseEntity.User.FirstName ?? "Unknown",
                    LastName = caseEntity.User.LastName ?? "Unknown",
                    Email = caseEntity.User.Email,
                    Phone = caseEntity.User.PhoneNumber ?? "",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    CreatedBy = "System (TimeTracking)"
                };
                _context.Clients.Add(client);
                await _context.SaveChangesAsync();
            }
        }
        else if (request.ClientId.HasValue)
        {
            // Direct client billing
            client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == request.ClientId.Value);
            
            if (client != null)
            {
                // We MUST have a valid CaseId for the TimeEntry database constraint.
                // Try to find an active case for this client via email -> User -> Case
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == client.Email);
                if (user != null)
                {
                    caseEntity = await _context.Cases
                        .Include(c => c.User)
                        .Where(c => c.UserId == user.Id)
                        .OrderByDescending(c => c.LastActivityAt)
                        .FirstOrDefaultAsync();
                }
                
                if (caseEntity == null)
                {
                    // If no case exists, we cannot create a time entry due to FK constraints.
                    // Option: Create a default "General Matter" case for this user?
                    // For now, return specific error.
                    return BadRequest($"Client {client.FirstName} {client.LastName} has no active cases. Please create a case first.");
                }
            }
        }

        if (client == null)
        {
            return BadRequest("Client not found");
        }

        var isAdmin = User.HasClaim(c => c.Type == "is_admin" && c.Value.Equals("true", StringComparison.OrdinalIgnoreCase));
        _logger.LogInformation("Auth Check: User {User}, isAdmin: {IsAdmin}, ClientAssignedAtty: {ClientAtty}, CurrentAtty: {AttyId}", 
            User.FindFirst("sub")?.Value, isAdmin, client.AssignedAttorneyId, attorneyId);

        if (!isAdmin && client.AssignedAttorneyId != attorneyId)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ProblemDetails 
            { 
                Title = "Forbidden", 
                Detail = $"You can only track time for your assigned clients. Client Assigned ID: {client.AssignedAttorneyId}, Your Attorney ID: {attorneyId}" 
            });
        }

        // Check for existing active time tracking session
        var activeSession = await _context.TimeEntries
            .FirstOrDefaultAsync(te => te.AttorneyId == attorneyId && te.EndTime == default);

        if (activeSession != null)
        {
            return BadRequest("You already have an active time tracking session. Please stop it first.");
        }

        // Create new time entry
        var timeEntry = new TimeEntry
        {
            CaseId = caseEntity?.Id ?? default, 
            ClientId = client.Id,
            AttorneyId = attorneyId.Value,
            StartTime = DateTime.UtcNow,
            Description = request.Description ?? string.Empty,
            Notes = request.Notes ?? string.Empty,
            HourlyRate = attorney.DefaultHourlyRate,
            CreatedAt = DateTime.UtcNow
        };
        
        if (caseEntity != null)
        {
            timeEntry.CaseId = caseEntity.Id;
        }
        else
        {
            return BadRequest("Case ID is required for time tracking.");
        }

        _context.TimeEntries.Add(timeEntry);
        await _context.SaveChangesAsync();

        // Load related entities for response
        await _context.Entry(timeEntry)
            .Reference(te => te.Client)
            .LoadAsync();
        await _context.Entry(timeEntry)
            .Reference(te => te.Attorney)
            .LoadAsync();

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
            .Include(te => te.Client)
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

        if (timeEntry.EndTime != default)
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
            .Include(te => te.Client)
            .Include(te => te.Attorney)
            .FirstOrDefaultAsync(te => te.AttorneyId == attorneyId && te.EndTime == default);

        if (activeSession == null)
        {
            // Return 204 No Content instead of 404 to avoid console errors in frontend
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
            .Include(te => te.Client)
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
        [FromQuery] int? clientId = null,
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
            .Include(te => te.Client)
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
            query = query.Where(te => te.ClientId == clientId.Value);
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
        query = query.Where(te => te.EndTime != default);

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
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> UpdateTimeEntry(int id, [FromBody] UpdateTimeEntryRequest request)
    {
        var attorneyId = await GetCurrentAttorneyId();
        if (attorneyId == null) return BadRequest("Invalid user");

        var timeEntry = await _context.TimeEntries.FirstOrDefaultAsync(te => te.Id == id);
        if (timeEntry == null)
        {
            return NotFound();
        }

        // Verify ownership (unless admin)
        var isAdmin = User.HasClaim(c => c.Type == "is_admin" && (c.Value.Equals("true", StringComparison.OrdinalIgnoreCase)));
        if (!isAdmin && timeEntry.AttorneyId != attorneyId)
        {
            return Forbid();
        }

        // Cannot edit billed time entries
        if (timeEntry.IsBilled)
        {
            return BadRequest("Cannot edit billed time entries");
        }

        // Cannot edit active time entries
        if (timeEntry.EndTime == default)
        {
            return BadRequest("Cannot edit active time tracking session. Stop it first.");
        }

        // Update fields
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

            // Get site configuration for billing rules
            var config = await _context.SiteConfigurations.OrderBy(c => c.Id).FirstOrDefaultAsync();
            var roundUp = config?.RoundBillingUp ?? false;

            // Recalculate duration and billing
            timeEntry.RoundDurationToSixMinuteIncrements(roundUp);
        }
        else if (request.Duration.HasValue)
        {
            // Direct duration update (in hours)
            // Round to 6-minute (0.1 hour) increments
            var roundedDuration = Math.Ceiling(request.Duration.Value / 0.1m) * 0.1m;
            timeEntry.Duration = roundedDuration;

            // Recalculate billable amount based on attorney rate
            var attorney = await _context.Attorneys.FindAsync(timeEntry.AttorneyId);
            if (attorney != null)
            {
                timeEntry.BillableAmount = roundedDuration * attorney.DefaultHourlyRate;
            }

            // Adjust end time to match the new duration
            if (timeEntry.StartTime != default)
            {
                timeEntry.EndTime = timeEntry.StartTime.AddHours((double)roundedDuration);
            }
        }

        await _context.SaveChangesAsync();
        return Ok(timeEntry);
    }

    /// <summary>
    /// Delete a time entry
    /// </summary>
    [HttpDelete("{id}")]
    [HttpDelete("entries/{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> DeleteTimeEntry(int id)
    {
        var attorneyId = await GetCurrentAttorneyId();
        if (attorneyId == null) return BadRequest("Invalid user");

        var timeEntry = await _context.TimeEntries.FirstOrDefaultAsync(te => te.Id == id);
        if (timeEntry == null)
        {
            return NotFound();
        }

        // Verify ownership (unless admin)
        var isAdmin = User.HasClaim(c => c.Type == "is_admin" && (c.Value.Equals("true", StringComparison.OrdinalIgnoreCase)));
        if (!isAdmin && timeEntry.AttorneyId != attorneyId)
        {
            return Forbid();
        }

        // Cannot delete billed time entries
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
        return user?.AttorneyId;
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
            public int? ClientId { get; set; }
            public Guid? CaseId { get; set; }
            public string? Description { get; set; }
            public string? Notes { get; set; }
        }public class StopTimeTrackingRequest
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
