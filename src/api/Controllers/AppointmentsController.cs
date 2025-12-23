using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using Microsoft.Extensions.Options;
using L4H.Infrastructure.Services.Teams;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Data;
using L4H.Shared.Models;
using L4H.Api.Services.Providers;
using L4H.Api.Configuration;
using System.Security.Claims;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/meetings")]
[Authorize]
[Tags("Appointments")]
public class AppointmentsController : ControllerBase
{
    private readonly L4H.Api.Services.Providers.IMeetingsProvider _meetingsProvider;
    private readonly ILogger<AppointmentsController> _logger;
    private readonly L4H.Api.Configuration.MeetingsOptions _meetingsOptions;
    private readonly L4HDbContext _context;

    public AppointmentsController(
        L4H.Api.Services.Providers.IMeetingsProvider meetingsProvider,
        ILogger<AppointmentsController> logger,
        IOptions<L4H.Api.Configuration.MeetingsOptions> meetingsOptions,
        L4HDbContext context)
    {
        _meetingsProvider = meetingsProvider;
        _logger = logger;
        _meetingsOptions = meetingsOptions.Value;
        _context = context;
    }

    /// <summary>
    /// List all appointments for the current user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<Appointment>>> GetAppointments()
    {
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "User not authenticated" });
        }

        var userIdTyped = new UserId(userId);

        // Get cases first to filter appointments
        var caseIds = await _context.Cases
            .Where(c => c.UserId == userIdTyped)
            .Select(c => c.Id)
            .ToListAsync()
            .ConfigureAwait(false);

        var appointments = await _context.Set<Appointment>()
            .Where(a => caseIds.Contains(a.CaseId))
            .OrderByDescending(a => a.ScheduledStart)
            .ToListAsync()
            .ConfigureAwait(false);

        return Ok(appointments);
    }

    /// <summary>
    /// Get available time slots for appointment scheduling based on the user's case package requirements
    /// </summary>
    [HttpGet("available-slots")]
    public async Task<ActionResult<List<TimeSlotResponse>>> GetAvailableSlots(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] int daysAhead = 14)
    {
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "User not authenticated" });
        }

        // Get user's active case to determine package requirements
        var userCase = await _context.Cases
            .Include(c => c.Package)
            .Where(c => c.UserId == new UserId(userId))
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync()
            .ConfigureAwait(false);

        if (userCase == null || userCase.Package == null)
        {
            return NotFound(new { message = "No active case found. Please select a package first." });
        }

        var requiresLawyer = userCase.Package.RequiresLawyer;
        _logger.LogInformation("Package {PackageCode} requires lawyer: {RequiresLawyer}",
            userCase.Package.Code, requiresLawyer);

        // Get available attorneys based on package requirements
        var query = _context.Set<Attorney>()
            .Where(a => a.IsActive);

        if (requiresLawyer)
        {
            query = query.Where(a => a.ProfessionalType == ProfessionalType.Lawyer);
        }

        var availableAttorneys = await query.ToListAsync().ConfigureAwait(false);

        if (availableAttorneys.Count == 0)
        {
            return NotFound(new { message = "No available professionals found for your package type." });
        }

        // Generate time slots for the next N days
        var start = startDate ?? DateTime.UtcNow.Date.AddDays(1);
        var slots = new List<TimeSlotResponse>();

        for (int day = 0; day < daysAhead; day++)
        {
            var currentDate = start.AddDays(day);

            // Skip weekends
            if (currentDate.DayOfWeek == DayOfWeek.Saturday || currentDate.DayOfWeek == DayOfWeek.Sunday)
                continue;

            // Generate slots from 9 AM to 5 PM (business hours)
            for (int hour = 9; hour < 17; hour++)
            {
                foreach (var attorney in availableAttorneys)
                {
                    var slotStart = new DateTimeOffset(currentDate.Year, currentDate.Month, currentDate.Day,
                        hour, 0, 0, TimeSpan.Zero);
                    var slotEnd = slotStart.AddHours(1);

                    // Check if slot is already booked
                    // Note: Attorney.Id is an int, but Appointment.StaffUserId is a UserId (Guid)
                    // For now, we skip the attorney check in the query since we don't have a mapping table
                    var isBooked = await _context.Set<Appointment>()
                        .AnyAsync(a => a.ScheduledStart < slotEnd
                            && a.ScheduledEnd > slotStart
                            && a.Status != "cancelled")
                        .ConfigureAwait(false);

                    if (!isBooked)
                    {
                        slots.Add(new TimeSlotResponse
                        {
                            AttorneyId = attorney.Id,
                            AttorneyName = attorney.Name,
                            AttorneyTitle = attorney.Title,
                            ProfessionalType = attorney.ProfessionalType.ToString(),
                            StartTime = slotStart,
                            EndTime = slotEnd,
                            IsAvailable = true
                        });
                    }
                }
            }
        }

        return Ok(slots);
    }

    /// <summary>
    /// Book an appointment with a selected attorney at a specific time slot
    /// </summary>
    [HttpPost("book")]
    public async Task<ActionResult<BookAppointmentResponse>> BookAppointment([FromBody] BookAppointmentRequest request)
    {
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "User not authenticated" });
        }

        // Get user's active case
        var userCase = await _context.Cases
            .Include(c => c.Package)
            .Where(c => c.UserId == new UserId(userId))
            .OrderByDescending(c => c.CreatedAt)
            .FirstOrDefaultAsync()
            .ConfigureAwait(false);

        if (userCase == null)
        {
            return NotFound(new { message = "No active case found. Please select a package first." });
        }

        // Verify attorney exists and is available
        var attorney = await _context.Set<Attorney>()
            .FirstOrDefaultAsync(a => a.Id == request.AttorneyId && a.IsActive)
            .ConfigureAwait(false);

        if (attorney == null)
        {
            return NotFound(new { message = "Attorney not found or unavailable" });
        }

        // Verify package requirements are met
        if (userCase.Package!.RequiresLawyer && attorney.ProfessionalType != ProfessionalType.Lawyer)
        {
            return BadRequest(new { message = "This package requires a lawyer consultation" });
        }

        // Check if time slot is still available
        var slotConflict = await _context.Set<Appointment>()
            .AnyAsync(a => a.ScheduledStart < request.EndTime
                && a.ScheduledEnd > request.StartTime
                && a.Status != "cancelled")
            .ConfigureAwait(false);

        if (slotConflict)
        {
            return Conflict(new { message = "This time slot is no longer available" });
        }

        // Create appointment
        // Note: Attorney.Id is an int, but Appointment.StaffUserId is a UserId (Guid)
        // TODO: Create a mapping table or add a UserId field to Attorney entity
        var appointment = new Appointment
        {
            Id = Guid.NewGuid(),
            CaseId = userCase.Id,
            StaffUserId = new UserId(Guid.NewGuid()), // Temporary: Map attorney to a staff user
            ScheduledStart = request.StartTime,
            ScheduledEnd = request.EndTime,
            Type = "consultation",
            Status = "scheduled",
            Notes = request.Notes,
            TimeZone = request.TimeZone ?? "UTC",
            CreatedAt = DateTime.UtcNow
        };

        _context.Set<Appointment>().Add(appointment);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        _logger.LogInformation("Appointment {AppointmentId} booked for case {CaseId} with attorney {AttorneyId}",
            appointment.Id, userCase.Id, attorney.Id);

        return Created($"/api/v1/appointments/{appointment.Id}", new BookAppointmentResponse
        {
            AppointmentId = appointment.Id,
            AttorneyName = attorney.Name,
            StartTime = appointment.ScheduledStart,
            EndTime = appointment.ScheduledEnd,
            Status = appointment.Status,
            Message = "Appointment booked successfully"
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateAppointment([FromBody] CreateAppointmentMeetingRequest request)
    {
        _logger.LogInformation("Creating appointment for {Subject}", request.Subject);

        try
        {
            var meetingOptions = new MeetingOptions
            {
                Subject = request.Subject,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                Attendees = request.Attendees ?? new List<string>(),
                WaitingRoomEnabled = _meetingsOptions.WaitingRoomEnabled
            };

            var result = await _meetingsProvider.CreateMeetingAsync(meetingOptions).ConfigureAwait(false);
            
            if (result.Success)
            {
                return CreatedAtAction(nameof(CreateAppointment), new { id = result.MeetingId }, new
                {
                    meetingId = result.MeetingId,
                    joinUrl = result.JoinUrl,
                    message = result.Message ?? "Appointment created successfully."
                });
            }
            else
            {
                return StatusCode(500, new { message = result.ErrorMessage ?? "Failed to create appointment." });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating appointment");
            return StatusCode(500, new { message = "Error creating appointment." });
        }
    }
}

public class CreateAppointmentMeetingRequest
{
    public string Subject { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public List<string>? Attendees { get; set; }
}

public class TimeSlotResponse
{
    public int AttorneyId { get; set; }
    public string AttorneyName { get; set; } = string.Empty;
    public string AttorneyTitle { get; set; } = string.Empty;
    public string ProfessionalType { get; set; } = string.Empty;
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset EndTime { get; set; }
    public bool IsAvailable { get; set; }
}

public class BookAppointmentRequest
{
    public int AttorneyId { get; set; }
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset EndTime { get; set; }
    public string? Notes { get; set; }
    public string? TimeZone { get; set; }
}

public class BookAppointmentResponse
{
    public Guid AppointmentId { get; set; }
    public string AttorneyName { get; set; } = string.Empty;
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}