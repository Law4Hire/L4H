using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Services.Graph;
using L4H.Shared.Models;
using System.Security.Claims;

namespace L4H.Api.Controllers;

[ApiController]
[Route("v1/staff")]
[Authorize]
[Tags("Staff Availability")]
public class StaffAvailabilityController : ControllerBase
{
    private readonly L4HDbContext _context;
    private readonly IStringLocalizer<Shared> _localizer;
    private readonly ILogger<StaffAvailabilityController> _logger;
    private readonly ICalendarProvider _calendarProvider;

    public StaffAvailabilityController(
        L4HDbContext context,
        IStringLocalizer<Shared> localizer,
        ILogger<StaffAvailabilityController> logger,
        ICalendarProvider calendarProvider)
    {
        _context = context;
        _localizer = localizer;
        _logger = logger;
        _calendarProvider = calendarProvider;
    }

    /// <summary>
    /// Get staff availability for a given time range
    /// </summary>
    /// <param name="staffId">Staff member ID</param>
    /// <param name="from">Start time</param>
    /// <param name="to">End time</param>
    /// <param name="bufferMinutes">Buffer time in minutes</param>
    /// <returns>Staff availability response</returns>
    [HttpGet("{staffId}/availability")]
    [ProducesResponseType<L4H.Shared.Models.StaffAvailabilityResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStaffAvailability(
        [FromRoute] Guid staffId,
        [FromQuery] DateTimeOffset from,
        [FromQuery] DateTimeOffset to,
        [FromQuery] int bufferMinutes = 30)
    {
        // Verify staff permissions
        if (!IsStaff())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["StaffAvailability.StaffOnly"]
            });
        }

        if (from >= to)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Bad Request",
                Detail = _localizer["StaffAvailability.InvalidTimeRange"]
            });
        }

        try
        {
            // Check if staff member exists
            var staffMember = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == new UserId(staffId) && (u.IsAdmin || u.IsStaff)).ConfigureAwait(false);
            
            if (staffMember == null)
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Not Found",
                    Detail = _localizer["StaffAvailability.StaffNotFound"]
                });
            }

            // Get appointments for this staff member in the time range
            var appointments = await _context.Appointments
                .Where(a => a.StaffUserId == new UserId(staffId) &&
                           a.Status != "cancelled" &&
                           a.ScheduledStart < to &&
                           a.ScheduledEnd > from)
                .ToListAsync().ConfigureAwait(false);

            // Convert appointments to busy slots with buffer time
            var appointmentBusySlots = appointments.Select(a => new L4H.Shared.Models.BusySlot
            {
                StartTime = a.ScheduledStart.AddMinutes(-bufferMinutes),
                EndTime = a.ScheduledEnd.AddMinutes(bufferMinutes),
                Source = "Appointment",
                Reason = "Existing appointment + buffer"
            }).ToList();

            // Get busy slots from calendar provider
            var calendarBusySlots = new List<L4H.Shared.Models.BusySlot>();
            var warnings = new List<string>();

            try
            {
                var calendarRequest = new CalendarAvailabilityRequest
                {
                    StaffId = new UserId(staffId),
                    EmailAddress = staffMember.Email, // Use staff member's email
                    From = from,
                    To = to
                };

                var calendarResponse = await _calendarProvider.GetAvailabilityAsync(calendarRequest).ConfigureAwait(false);
                // Convert from infrastructure BusySlot to shared BusySlot
                calendarBusySlots = calendarResponse.BusySlots.Select(bs => new L4H.Shared.Models.BusySlot
                {
                    StartTime = bs.StartTime,
                    EndTime = bs.EndTime,
                    Source = bs.Source,
                    Reason = bs.Reason
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to retrieve calendar availability for staff {StaffId}", staffId);
                warnings.Add("Calendar availability could not be retrieved");
            }

            // Combine all busy slots
            var allBusySlots = appointmentBusySlots.Concat(calendarBusySlots).ToList();

            return Ok(new L4H.Shared.Models.StaffAvailabilityResponse
            {
                StaffId = new UserId(staffId),
                From = from,
                To = to,
                BusySlots = allBusySlots,
                Warnings = warnings
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving staff availability");
            return StatusCode(500, new ProblemDetails
            {
                Title = "Internal Server Error",
                Detail = _localizer["StaffAvailability.RetrievalFailed"]
            });
        }
    }


    private bool IsStaff()
    {
        return User.IsInRole("Admin") || User.IsInRole("Staff") || 
               User.HasClaim("IsAdmin", "true") || User.HasClaim("IsStaff", "true");
    }
}


