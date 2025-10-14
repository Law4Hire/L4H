using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using System.Security.Claims;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/time-tracking")]
[Tags("Time Tracking")]
[Authorize]
public class TimeTrackingController : ControllerBase
{
    private readonly L4HDbContext _context;

    public TimeTrackingController(L4HDbContext context)
    {
        _context = context;
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
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (!int.TryParse(userIdClaim, out var attorneyId))
        {
            return BadRequest("Invalid user ID");
        }

        // Verify attorney exists and is active
        var attorney = await _context.Attorneys.FirstOrDefaultAsync(a => a.Id == attorneyId && a.IsActive);
        if (attorney == null)
        {
            return BadRequest("Attorney not found or inactive");
        }

        // Verify client exists and is assigned to this attorney (unless admin)
        var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == request.ClientId);
        if (client == null)
        {
            return BadRequest("Client not found");
        }

        var isAdmin = User.HasClaim("is_admin", "true");
        if (!isAdmin && client.AssignedAttorneyId != attorneyId)
        {
            return Forbid("You can only track time for your assigned clients");
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
            ClientId = request.ClientId,
            AttorneyId = attorneyId,
            StartTime = DateTime.UtcNow,
            Description = request.Description ?? string.Empty,
            Notes = request.Notes ?? string.Empty,
            HourlyRate = attorney.DefaultHourlyRate,
            CreatedAt = DateTime.UtcNow
        };

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
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (!int.TryParse(userIdClaim, out var attorneyId))
        {
            return BadRequest("Invalid user ID");
        }

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

        // Calculate duration and billing amount with 6-minute increment rounding
        timeEntry.RoundDurationToSixMinuteIncrements();

        await _context.SaveChangesAsync();

        return Ok(timeEntry);
    }

    /// <summary>
    /// Get active time tracking session for current user
    /// </summary>
    [HttpGet("active")]
    [ProducesResponseType(typeof(TimeEntry), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TimeEntry>> GetActiveTimeTracking()
    {
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (!int.TryParse(userIdClaim, out var attorneyId))
        {
            return BadRequest("Invalid user ID");
        }

        var activeSession = await _context.TimeEntries
            .Include(te => te.Client)
            .Include(te => te.Attorney)
            .FirstOrDefaultAsync(te => te.AttorneyId == attorneyId && te.EndTime == default);

        if (activeSession == null)
        {
            return NotFound("No active time tracking session");
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
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (!int.TryParse(userIdClaim, out var attorneyId))
        {
            return BadRequest("Invalid user ID");
        }

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
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (!int.TryParse(userIdClaim, out var currentAttorneyId))
        {
            return BadRequest("Invalid user ID");
        }

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
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> UpdateTimeEntry(int id, [FromBody] UpdateTimeEntryRequest request)
    {
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (!int.TryParse(userIdClaim, out var attorneyId))
        {
            return BadRequest("Invalid user ID");
        }

        var timeEntry = await _context.TimeEntries.FirstOrDefaultAsync(te => te.Id == id);
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
            
            // Recalculate duration and billing
            timeEntry.RoundDurationToSixMinuteIncrements();
        }

        await _context.SaveChangesAsync();
        return Ok();
    }

    /// <summary>
    /// Delete a time entry
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> DeleteTimeEntry(int id)
    {
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (!int.TryParse(userIdClaim, out var attorneyId))
        {
            return BadRequest("Invalid user ID");
        }

        var timeEntry = await _context.TimeEntries.FirstOrDefaultAsync(te => te.Id == id);
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

        // Cannot delete billed time entries
        if (timeEntry.IsBilled)
        {
            return BadRequest("Cannot delete billed time entries");
        }

        _context.TimeEntries.Remove(timeEntry);
        await _context.SaveChangesAsync();

        return Ok();
    }
}

// Request/Response Models
public class StartTimeTrackingRequest
{
    public int ClientId { get; set; }
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
}