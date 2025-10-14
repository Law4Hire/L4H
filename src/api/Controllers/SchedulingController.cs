using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Services.Teams;
using L4H.Shared.Models;
using System.Security.Claims;
using System.Text.Json;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/appointments")]
[Authorize]
[Tags("Appointments")]
public class SchedulingController : ControllerBase
{
    private readonly L4HDbContext _context;
    private readonly IStringLocalizer<Shared> _localizer;
    private readonly ILogger<SchedulingController> _logger;
    private readonly IMeetingsProvider _meetingsProvider;

    public SchedulingController(
        L4HDbContext context,
        IStringLocalizer<Shared> localizer,
        ILogger<SchedulingController> logger,
        IMeetingsProvider meetingsProvider)
    {
        _context = context;
        _localizer = localizer;
        _logger = logger;
        _meetingsProvider = meetingsProvider;
    }

    /// <summary>
    /// Create an appointment directly (for testing/integration)
    /// </summary>
    /// <param name="request">Direct appointment creation request</param>
    /// <returns>Created appointment details</returns>
    [HttpPost]
    [ProducesResponseType<CreateAppointmentResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateAppointmentDirect([FromBody] CreateAppointmentRequest request)
    {
        var userId = GetCurrentUserId();

        // Get the case and verify ownership
        var caseEntity = await _context.Cases
            .FirstOrDefaultAsync(c => c.Id == request.CaseId).ConfigureAwait(false);

        if (caseEntity == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Case Not Found",
                Detail = _localizer["Cases.NotFound"]
            });
        }

        if (caseEntity.UserId != userId && !IsStaff())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Appointments.AccessDenied"]
            });
        }

        // TODO: Add staff validation back later
        // For now, just check that the staff user exists
        var staffUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.StaffUserId).ConfigureAwait(false);

        if (staffUser == null)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Staff User Not Found",
                Detail = "The specified staff user does not exist"
            });
        }

        // Create the appointment directly
        var appointment = new Appointment
        {
            CaseId = request.CaseId,
            StaffUserId = request.StaffUserId,
            ScheduledStart = request.ScheduledStart,
            ScheduledEnd = request.ScheduledEnd,
            Type = request.Type,
            Status = request.Status,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        // If appointment is confirmed, create a meeting
        var warnings = new List<string>();
        if (appointment.Status == "confirmed")
        {
            try
            {
                var meetingRequest = new CreateMeetingRequest
                {
                    AppointmentId = appointment.Id,
                    Subject = $"Consultation - Case {request.CaseId.Value}",
                    StartTime = appointment.ScheduledStart,
                    EndTime = appointment.ScheduledEnd,
                    WaitingRoom = true,
                    Recording = true
                };

                var meetingResponse = await _meetingsProvider.CreateMeetingAsync(meetingRequest).ConfigureAwait(false);

                var meeting = new Meeting
                {
                    AppointmentId = appointment.Id,
                    Provider = MeetingProvider.Fake, // This should be configurable based on provider
                    MeetingId = meetingResponse.MeetingId,
                    JoinUrl = meetingResponse.JoinUrl,
                    WaitingRoom = meetingResponse.WaitingRoom,
                    Recording = meetingResponse.Recording,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Meetings.Add(meeting);
                await _context.SaveChangesAsync().ConfigureAwait(false);

                // Log meeting creation
                LogAudit("meeting", "created", "Meeting", meeting.Id.ToString(),
                    new { appointmentId = appointment.Id, meetingId = meetingResponse.MeetingId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create meeting for appointment {AppointmentId}", appointment.Id);
                warnings.Add("Meeting creation failed");
                // Don't fail the appointment creation if meeting creation fails
            }
        }

        // Log audit event
        LogAudit("appointment", "created", "Appointment", appointment.Id.ToString(),
            new { caseId = request.CaseId.Value, startTime = request.ScheduledStart, staffId = request.StaffUserId.Value });

        var response = new CreateAppointmentResponse
        {
            Id = appointment.Id,
            Warnings = warnings
        };

        return Created($"/v1/appointments/{appointment.Id}", response);
    }

    /// <summary>
    /// Get appointment details by ID
    /// </summary>
    /// <param name="id">Appointment ID</param>
    /// <returns>Appointment details with meeting info if available</returns>
    [HttpGet("{id}")]
    [ProducesResponseType<AppointmentDetailsResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAppointmentDetails(Guid id)
    {
        var userId = GetCurrentUserId();
        var isStaff = IsStaff();

        var appointment = await _context.Appointments
            .Include(a => a.Case)
            .Include(a => a.Meeting)
            .FirstOrDefaultAsync(a => a.Id == id).ConfigureAwait(false);

        if (appointment == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Appointment Not Found",
                Detail = _localizer["Appointments.NotFound"]
            });
        }

        // Verify access: case owner or staff assigned to appointment
        var isCaseOwner = appointment.Case.UserId == userId;
        var isAssignedStaff = appointment.StaffId == userId;
        
        if (!isCaseOwner && !isAssignedStaff)
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Appointments.AccessDenied"]
            });
        }

        var response = new AppointmentDetailsResponse
        {
            Id = appointment.Id,
            CaseId = appointment.CaseId,
            StaffUserId = appointment.StaffUserId,
            ScheduledStart = appointment.ScheduledStart,
            ScheduledEnd = appointment.ScheduledEnd,
            Type = appointment.Type,
            Status = appointment.Status,
            Notes = appointment.Notes,
            CreatedAt = appointment.CreatedAt,
            Meeting = appointment.Meeting != null ? new MeetingDetails
            {
                Id = appointment.Meeting.Id,
                MeetingId = appointment.Meeting.MeetingId,
                JoinUrl = appointment.Meeting.JoinUrl,
                WaitingRoom = appointment.Meeting.WaitingRoom,
                Recording = appointment.Meeting.Recording,
                Provider = appointment.Meeting.Provider.ToString(),
                ConsentAt = appointment.Meeting.ConsentAt
            } : null
        };

        return Ok(response);
    }

    /// <summary>
    /// Give recording consent for an appointment
    /// </summary>
    /// <param name="id">Appointment ID</param>
    /// <param name="request">Recording consent request</param>
    /// <returns>Success response</returns>
    [HttpPost("{id}/recording-consent")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GiveRecordingConsent(Guid id, [FromBody] RecordingConsentRequest request)
    {
        var userId = GetCurrentUserId();
        var isStaff = IsStaff();

        var appointment = await _context.Appointments
            .Include(a => a.Case)
            .Include(a => a.Meeting)
            .FirstOrDefaultAsync(a => a.Id == id).ConfigureAwait(false);

        if (appointment == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Appointment Not Found",
                Detail = _localizer["Appointments.NotFound"]
            });
        }

        // Verify access: case owner or staff assigned to appointment
        var isCaseOwner = appointment.Case.UserId == userId;
        var isAssignedStaff = appointment.StaffId == userId;
        
        if (!isCaseOwner && !isAssignedStaff)
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Appointments.AccessDenied"]
            });
        }

        if (appointment.Meeting != null && request.ConsentGiven)
        {
            appointment.Meeting.ConsentAt = DateTime.UtcNow;
            await _context.SaveChangesAsync().ConfigureAwait(false);
        }

        return Ok();
    }

    /// <summary>
    /// Update an existing appointment
    /// </summary>
    /// <param name="id">Appointment ID</param>
    /// <param name="request">Update request</param>
    /// <returns>Updated appointment details</returns>
    [HttpPut("{id}")]
    [ProducesResponseType<UpdateAppointmentResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateAppointment(Guid id, [FromBody] UpdateAppointmentRequest request)
    {
        var userId = GetCurrentUserId();
        var isStaff = IsStaff();

        // Get the appointment with case information
        var appointment = await _context.Appointments
            .Include(a => a.Case)
            .Include(a => a.Staff)
            .FirstOrDefaultAsync(a => a.Id == id).ConfigureAwait(false);

        if (appointment == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Appointment Not Found",
                Detail = _localizer["Appointments.NotFound"]
            });
        }

        // Verify access: case owner or staff assigned to appointment
        var isCaseOwner = appointment.Case.UserId == userId;
        var isAssignedStaff = appointment.StaffId == userId;
        
        if (!isCaseOwner && !isAssignedStaff)
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Appointments.AccessDenied"]
            });
        }

        // Store the original status to check if it changed to confirmed
        var originalStatus = appointment.Status;

        // Update appointment properties
        if (!string.IsNullOrEmpty(request.Status))
        {
            appointment.Status = request.Status;
        }

        if (!string.IsNullOrEmpty(request.Notes))
        {
            appointment.Notes = request.Notes;
        }

        // If status changed to confirmed, update confirmed timestamp
        if (appointment.Status == "confirmed" && originalStatus != "confirmed")
        {
            appointment.ConfirmedAt = DateTime.UtcNow;
        }

        // If appointment status changed to confirmed, create a meeting
        if (appointment.Status == "confirmed" && originalStatus != "confirmed")
        {
            try
            {
                var meetingRequest = new CreateMeetingRequest
                {
                    AppointmentId = appointment.Id,
                    Subject = $"Consultation - Case {appointment.CaseId.Value}",
                    StartTime = appointment.ScheduledStart.DateTime,
                    EndTime = appointment.ScheduledEnd.DateTime,
                    WaitingRoom = true,
                    Recording = true
                };

                var meetingResponse = await _meetingsProvider.CreateMeetingAsync(meetingRequest).ConfigureAwait(false);

                var meeting = new Meeting
                {
                    AppointmentId = appointment.Id,
                    Provider = MeetingProvider.Fake, // This should be configurable based on provider
                    MeetingId = meetingResponse.MeetingId,
                    JoinUrl = meetingResponse.JoinUrl,
                    WaitingRoom = meetingResponse.WaitingRoom,
                    Recording = meetingResponse.Recording,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Meetings.Add(meeting);
                await _context.SaveChangesAsync().ConfigureAwait(false);

                // Log meeting creation
                LogAudit("meeting", "created", "Meeting", meeting.Id.ToString(),
                    new { appointmentId = appointment.Id, meetingId = meetingResponse.MeetingId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create meeting for appointment {AppointmentId}", appointment.Id);
                // Don't fail the appointment update if meeting creation fails
            }
        }

        // Update case activity
        appointment.Case.LastActivityAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Log audit event
        LogAudit("appointment", "updated", "Appointment", appointment.Id.ToString(),
            new { appointmentId = appointment.Id, status = appointment.Status, notes = appointment.Notes });

        var response = new UpdateAppointmentResponse
        {
            Id = appointment.Id,
            Status = appointment.Status,
            Notes = appointment.Notes,
            ConfirmedAt = appointment.ConfirmedAt,
            UpdatedAt = DateTime.UtcNow
        };

        return Ok(response);
    }

    /// <summary>
    /// Create an appointment for a case
    /// </summary>
    /// <param name="request">Appointment creation request</param>
    /// <returns>Created appointment details</returns>
    [HttpPost("create")]
    [ProducesResponseType<AppointmentCreateResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateAppointment([FromBody] AppointmentCreateRequest request)
    {
        var userId = GetCurrentUserId();

        // Get the case and verify ownership
        var caseEntity = await _context.Cases
            .FirstOrDefaultAsync(c => c.Id == request.CaseId).ConfigureAwait(false);

        if (caseEntity == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Case Not Found",
                Detail = _localizer["Cases.NotFound"]
            });
        }

        if (caseEntity.UserId != userId && !IsStaff())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Appointments.AccessDenied"]
            });
        }

        // Check for existing active appointments for this case
        var existingAppointment = await _context.Appointments
            .FirstOrDefaultAsync(a => a.CaseId == request.CaseId && 
                                     (a.Status == "scheduled" || a.Status == "confirmed")).ConfigureAwait(false);

        if (existingAppointment != null)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Appointment Exists",
                Detail = _localizer["Appointments.ExistingActive"]
            });
        }

        // Find available staff member
        var availableStaff = await FindAvailableStaff(request.PreferredStartTime, request.DurationMinutes).ConfigureAwait(false);
        
        if (availableStaff == null)
        {
            return Conflict(new ProblemDetails
            {
                Title = "No Staff Available",
                Detail = _localizer["Appointments.NoStaffAvailable"]
            });
        }

        // Calculate buffer times
        var bufferMinutes = await GetAppointmentBufferMinutes().ConfigureAwait(false);
        var actualStartTime = request.PreferredStartTime;
        var actualEndTime = actualStartTime.AddMinutes(request.DurationMinutes);

        // Check for conflicts with buffer
        var hasConflict = await HasSchedulingConflict(availableStaff.Id, 
            actualStartTime.AddMinutes(-bufferMinutes), 
            actualEndTime.AddMinutes(bufferMinutes)).ConfigureAwait(false);

        if (hasConflict)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Scheduling Conflict",
                Detail = _localizer["Appointments.SchedulingConflict"]
            });
        }

        // Get timezone offset for the requested timezone
        var timezoneOffset = GetTimezoneOffsetMinutes(request.TimeZone, request.PreferredStartTime);

        // Create the appointment
        var appointment = new Appointment
        {
            CaseId = request.CaseId,
            StaffId = availableStaff.Id,
            StartTime = actualStartTime.ToUniversalTime(),
            DurationMinutes = request.DurationMinutes,
            TimeZone = request.TimeZone,
            TimezoneOffsetMinutes = timezoneOffset,
            Status = "scheduled",
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow
        };

        _context.Appointments.Add(appointment);

        // Lock interview for this case (per specification)
        caseEntity.IsInterviewLocked = true;
        caseEntity.LastActivityAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Log audit event
        LogAudit("appointment", "created", "Appointment", appointment.Id.ToString(),
            new { caseId = request.CaseId.Value, startTime = actualStartTime, staffId = availableStaff.Id.Value });

        var response = new AppointmentCreateResponse
        {
            AppointmentId = appointment.Id,
            StartTime = actualStartTime,
            DurationMinutes = appointment.DurationMinutes,
            TimeZone = appointment.TimeZone,
            Status = appointment.Status,
            StaffName = availableStaff.Email, // Could be enhanced with staff name field
            CreatedAt = appointment.CreatedAt,
            Notes = appointment.Notes
        };

        return Ok(response);
    }

    /// <summary>
    /// Request to reschedule an appointment
    /// </summary>
    /// <param name="request">Reschedule request with 3 options</param>
    /// <returns>Reschedule proposal details</returns>
    [HttpPost("reschedule")]
    [ProducesResponseType<AppointmentRescheduleResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RescheduleAppointment([FromBody] AppointmentRescheduleRequest request)
    {
        var userId = GetCurrentUserId();
        var isStaff = IsStaff();

        // Get the appointment with case information
        var appointment = await _context.Appointments
            .Include(a => a.Case)
            .Include(a => a.Staff)
            .FirstOrDefaultAsync(a => a.Id == request.AppointmentId).ConfigureAwait(false);

        if (appointment == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Appointment Not Found",
                Detail = _localizer["Appointments.NotFound"]
            });
        }

        // Verify access: case owner or staff assigned to appointment
        if (!isStaff && appointment.Case.UserId != userId)
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Appointments.AccessDenied"]
            });
        }

        if (isStaff && appointment.StaffId != userId)
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Appointments.StaffMismatch"]
            });
        }

        // Check appointment status
        if (appointment.Status != "scheduled" && appointment.Status != "confirmed")
        {
            return Conflict(new ProblemDetails
            {
                Title = "Invalid Status",
                Detail = _localizer["Appointments.CannotReschedule"]
            });
        }

        // Check reschedule limits (2 per side)
        var existingReschedules = await _context.RescheduleProposals
            .Where(r => r.AppointmentId == request.AppointmentId && r.InitiatedBy == request.InitiatedBy)
            .CountAsync().ConfigureAwait(false);

        if (existingReschedules >= 2)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Reschedule Limit Reached",
                Detail = _localizer["Appointments.RescheduleLimit"]
            });
        }

        // Check for existing pending reschedule proposal
        var existingProposal = await _context.RescheduleProposals
            .FirstOrDefaultAsync(r => r.AppointmentId == request.AppointmentId && r.Status == "pending").ConfigureAwait(false);

        if (existingProposal != null)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Pending Reschedule Exists",
                Detail = _localizer["Appointments.PendingReschedule"]
            });
        }

        // Validate the three options don't conflict with staff schedule
        var bufferMinutes = await GetAppointmentBufferMinutes().ConfigureAwait(false);
        var conflicts = new List<int>();

        foreach (var (option, index) in new[] {
            (request.Option1StartTime, 1),
            (request.Option2StartTime, 2),
            (request.Option3StartTime, 3)
        })
        {
            var optionEndTime = option.AddMinutes(request.DurationMinutes);
            var hasConflict = await HasSchedulingConflict(appointment.StaffId,
                option.AddMinutes(-bufferMinutes),
                optionEndTime.AddMinutes(bufferMinutes),
                request.AppointmentId).ConfigureAwait(false); // Exclude current appointment

            if (hasConflict)
            {
                conflicts.Add(index);
            }
        }

        if (conflicts.Count == 3)
        {
            return Conflict(new ProblemDetails
            {
                Title = "All Options Conflict",
                Detail = _localizer["Appointments.AllOptionsConflict"]
            });
        }

        // Get timezone offset
        var timezoneOffset = GetTimezoneOffsetMinutes(request.TimeZone, request.Option1StartTime);

        // Create reschedule proposal
        var proposal = new RescheduleProposal
        {
            AppointmentId = request.AppointmentId,
            InitiatedBy = request.InitiatedBy,
            Status = "pending",
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(2),
            Option1StartTime = request.Option1StartTime.ToUniversalTime(),
            Option2StartTime = request.Option2StartTime.ToUniversalTime(),
            Option3StartTime = request.Option3StartTime.ToUniversalTime(),
            DurationMinutes = request.DurationMinutes,
            TimeZone = request.TimeZone,
            TimezoneOffsetMinutes = timezoneOffset
        };

        _context.RescheduleProposals.Add(proposal);

        // Update appointment status
        appointment.Status = "rescheduling";

        // Update case activity
        appointment.Case.LastActivityAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Log audit event
        LogAudit("appointment", "reschedule_requested", "RescheduleProposal", proposal.Id.ToString(),
            new { appointmentId = request.AppointmentId, initiatedBy = request.InitiatedBy });

        var response = new AppointmentRescheduleResponse
        {
            ProposalId = proposal.Id,
            AppointmentId = request.AppointmentId,
            InitiatedBy = request.InitiatedBy,
            Option1StartTime = request.Option1StartTime,
            Option2StartTime = request.Option2StartTime,
            Option3StartTime = request.Option3StartTime,
            DurationMinutes = request.DurationMinutes,
            TimeZone = request.TimeZone,
            ExpiresAt = proposal.ExpiresAt,
            Status = proposal.Status
        };

        return Ok(response);
    }

    /// <summary>
    /// Choose one of the three reschedule options
    /// </summary>
    /// <param name="request">Reschedule choice request</param>
    /// <returns>Updated appointment details</returns>
    [HttpPost("reschedule/choose")]
    [ProducesResponseType<RescheduleChoiceResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ChooseRescheduleOption([FromBody] RescheduleChoiceRequest request)
    {
        var userId = GetCurrentUserId();
        var isStaff = IsStaff();

        // Validate chosen option
        if (request.ChosenOption < 1 || request.ChosenOption > 3)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid Option",
                Detail = _localizer["Appointments.InvalidOption"]
            });
        }

        // Get the reschedule proposal with appointment and case
        var proposal = await _context.RescheduleProposals
            .Include(p => p.Appointment)
            .ThenInclude(a => a.Case)
            .FirstOrDefaultAsync(p => p.Id == request.ProposalId).ConfigureAwait(false);

        if (proposal == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Proposal Not Found",
                Detail = _localizer["Appointments.ProposalNotFound"]
            });
        }

        // Verify access (opposite side of who initiated should respond)
        var shouldBeStaff = proposal.InitiatedBy == "client";
        if (shouldBeStaff && !isStaff)
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Staff Response Required",
                Detail = _localizer["Appointments.StaffResponseRequired"]
            });
        }

        if (!shouldBeStaff && (isStaff || proposal.Appointment.Case.UserId != userId))
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Client Response Required",
                Detail = _localizer["Appointments.ClientResponseRequired"]
            });
        }

        // Check if proposal is still pending
        if (proposal.Status != "pending")
        {
            return Conflict(new ProblemDetails
            {
                Title = "Proposal Not Pending",
                Detail = _localizer["Appointments.ProposalNotPending"]
            });
        }

        // Check if proposal has expired
        if (proposal.ExpiresAt < DateTime.UtcNow)
        {
            proposal.Status = "expired";
            await _context.SaveChangesAsync().ConfigureAwait(false);

            return Conflict(new ProblemDetails
            {
                Title = "Proposal Expired",
                Detail = _localizer["Appointments.ProposalExpired"]
            });
        }

        // Get the chosen start time
        var chosenStartTime = request.ChosenOption switch
        {
            1 => proposal.Option1StartTime,
            2 => proposal.Option2StartTime,
            3 => proposal.Option3StartTime,
            _ => throw new InvalidOperationException("Invalid option")
        };

        // Final conflict check for the chosen option
        var bufferMinutes = await GetAppointmentBufferMinutes().ConfigureAwait(false);
        var chosenEndTime = chosenStartTime.AddMinutes(proposal.DurationMinutes);
        var hasConflict = await HasSchedulingConflict(proposal.Appointment.StaffId,
            chosenStartTime.AddMinutes(-bufferMinutes),
            chosenEndTime.AddMinutes(bufferMinutes),
            proposal.AppointmentId).ConfigureAwait(false);

        if (hasConflict)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Chosen Option Conflicts",
                Detail = _localizer["Appointments.ChosenOptionConflicts"]
            });
        }

        // Apply the reschedule
        proposal.Status = "accepted";
        proposal.ChosenOption = request.ChosenOption;
        proposal.RespondedAt = DateTime.UtcNow;

        proposal.Appointment.StartTime = chosenStartTime;
        proposal.Appointment.DurationMinutes = proposal.DurationMinutes;
        proposal.Appointment.TimeZone = proposal.TimeZone;
        proposal.Appointment.TimezoneOffsetMinutes = proposal.TimezoneOffsetMinutes;
        proposal.Appointment.Status = "scheduled";

        // Update case activity
        proposal.Appointment.Case.LastActivityAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Log audit event
        LogAudit("appointment", "rescheduled", "Appointment", proposal.AppointmentId.ToString(),
            new { proposalId = proposal.Id, chosenOption = request.ChosenOption, newStartTime = chosenStartTime });

        var response = new RescheduleChoiceResponse
        {
            AppointmentId = proposal.AppointmentId,
            NewStartTime = chosenStartTime.ToLocalTime(),
            DurationMinutes = proposal.DurationMinutes,
            TimeZone = proposal.TimeZone,
            Status = proposal.Appointment.Status,
            UpdatedAt = DateTime.UtcNow
        };

        return Ok(response);
    }

    /// <summary>
    /// Reject a reschedule proposal
    /// </summary>
    /// <param name="request">Reschedule rejection request</param>
    /// <returns>Success response</returns>
    [HttpPost("reschedule/reject")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RejectRescheduleProposal([FromBody] RescheduleRejectionRequest request)
    {
        var userId = GetCurrentUserId();
        var isStaff = IsStaff();

        // Get the reschedule proposal
        var proposal = await _context.RescheduleProposals
            .Include(p => p.Appointment)
            .ThenInclude(a => a.Case)
            .FirstOrDefaultAsync(p => p.Id == request.ProposalId).ConfigureAwait(false);

        if (proposal == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Proposal Not Found",
                Detail = _localizer["Appointments.ProposalNotFound"]
            });
        }

        // Verify access (opposite side of who initiated should respond)
        var shouldBeStaff = proposal.InitiatedBy == "client";
        if (shouldBeStaff && !isStaff)
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Staff Response Required",
                Detail = _localizer["Appointments.StaffResponseRequired"]
            });
        }

        if (!shouldBeStaff && (isStaff || proposal.Appointment.Case.UserId != userId))
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Client Response Required",
                Detail = _localizer["Appointments.ClientResponseRequired"]
            });
        }

        // Check if proposal is still pending
        if (proposal.Status != "pending")
        {
            return Conflict(new ProblemDetails
            {
                Title = "Proposal Not Pending",
                Detail = _localizer["Appointments.ProposalNotPending"]
            });
        }

        // Reject the proposal
        proposal.Status = "rejected";
        proposal.RespondedAt = DateTime.UtcNow;
        proposal.RejectionReason = request.Reason;

        // Restore appointment to original status
        proposal.Appointment.Status = "scheduled";

        // Update case activity
        proposal.Appointment.Case.LastActivityAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Log audit event
        LogAudit("appointment", "reschedule_rejected", "RescheduleProposal", proposal.Id.ToString(),
            new { appointmentId = proposal.AppointmentId, reason = request.Reason });

        return NoContent();
    }

    /// <summary>
    /// Cancel an appointment
    /// </summary>
    /// <param name="request">Appointment cancellation request</param>
    /// <returns>Success response</returns>
    [HttpPost("cancel")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CancelAppointment([FromBody] AppointmentCancelRequest request)
    {
        var userId = GetCurrentUserId();
        var isStaff = IsStaff();

        // Get the appointment with case
        var appointment = await _context.Appointments
            .Include(a => a.Case)
            .FirstOrDefaultAsync(a => a.Id == request.AppointmentId).ConfigureAwait(false);

        if (appointment == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Appointment Not Found",
                Detail = _localizer["Appointments.NotFound"]
            });
        }

        // Verify access
        if (!isStaff && appointment.Case.UserId != userId)
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Appointments.AccessDenied"]
            });
        }

        if (isStaff && appointment.StaffId != userId)
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Appointments.StaffMismatch"]
            });
        }

        // Check if appointment can be cancelled
        if (appointment.Status == "cancelled" || appointment.Status == "completed")
        {
            return Conflict(new ProblemDetails
            {
                Title = "Cannot Cancel",
                Detail = _localizer["Appointments.CannotCancel"]
            });
        }

        // Cancel the appointment
        appointment.Status = "cancelled";
        appointment.CancelledAt = DateTime.UtcNow;
        appointment.CancellationReason = request.Reason;

        // Unlock interview for the case
        appointment.Case.IsInterviewLocked = false;
        appointment.Case.LastActivityAt = DateTimeOffset.UtcNow;

        // Cancel any pending reschedule proposals
        var pendingProposals = await _context.RescheduleProposals
            .Where(p => p.AppointmentId == request.AppointmentId && p.Status == "pending")
            .ToListAsync().ConfigureAwait(false);

        foreach (var proposal in pendingProposals)
        {
            proposal.Status = "cancelled";
        }

        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Log audit event
        LogAudit("appointment", "cancelled", "Appointment", appointment.Id.ToString(),
            new { caseId = appointment.CaseId.Value, reason = request.Reason });

        return NoContent();
    }

    /// <summary>
    /// Get appointment history for current user's cases
    /// </summary>
    /// <param name="caseId">Optional case ID to filter by specific case</param>
    /// <returns>Appointment history</returns>
    [HttpGet("history")]
    [ProducesResponseType<AppointmentHistoryResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAppointmentHistory([FromQuery] Guid? caseId = null)
    {
        var userId = GetCurrentUserId();

        var appointmentQuery = _context.Appointments
            .Include(a => a.Case)
            .Include(a => a.Staff)
            .Where(a => a.Case.UserId == userId);

        if (caseId.HasValue)
        {
            var filterCaseId = new CaseId(caseId.Value);
            appointmentQuery = appointmentQuery.Where(a => a.CaseId == filterCaseId);
        }

        var appointments = await appointmentQuery
            .OrderByDescending(a => a.StartTime)
            .ToListAsync().ConfigureAwait(false);

        var appointmentSummaries = appointments.Select(a => new AppointmentSummary
        {
            Id = a.Id,
            StartTime = a.StartTime.DateTime,
            DurationMinutes = a.DurationMinutes,
            TimeZone = a.TimeZone,
            Status = a.Status,
            StaffName = a.Staff.Email,
            CreatedAt = a.CreatedAt,
            ConfirmedAt = a.ConfirmedAt,
            CompletedAt = a.CompletedAt,
            CancelledAt = a.CancelledAt,
            CancellationReason = a.CancellationReason,
            Notes = a.Notes
        }).ToList();

        var rescheduleQuery = _context.RescheduleProposals
            .Include(r => r.Appointment)
            .ThenInclude(a => a.Case)
            .Where(r => r.Appointment.Case.UserId == userId);

        if (caseId.HasValue)
        {
            var filterCaseId = new CaseId(caseId.Value);
            rescheduleQuery = rescheduleQuery.Where(r => r.Appointment.CaseId == filterCaseId);
        }

        var reschedules = await rescheduleQuery
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync().ConfigureAwait(false);

        var rescheduleSummaries = reschedules.Select(r => new RescheduleSummary
        {
            Id = r.Id,
            AppointmentId = r.AppointmentId,
            InitiatedBy = r.InitiatedBy,
            Status = r.Status,
            CreatedAt = r.CreatedAt,
            ExpiresAt = r.ExpiresAt,
            RespondedAt = r.RespondedAt,
            ChosenOption = r.ChosenOption,
            RejectionReason = r.RejectionReason
        }).ToList();

        var response = new AppointmentHistoryResponse
        {
            Appointments = appointmentSummaries,
            RescheduleRequests = rescheduleSummaries
        };

        return Ok(response);
    }

    // Helper methods

    private async Task<User?> FindAvailableStaff(DateTime startTime, int durationMinutes)
    {
        // For now, return any admin user as staff
        // This could be enhanced with proper staff role management
        var staff = await _context.Users
            .Where(u => u.IsAdmin)
            .FirstOrDefaultAsync().ConfigureAwait(false);

        return staff;
    }

    private async Task<bool> HasSchedulingConflict(UserId staffId, DateTime startTime, DateTime endTime, Guid? excludeAppointmentId = null)
    {
        var conflictQuery = _context.Appointments
            .Where(a => a.StaffId == staffId &&
                       a.Status != "cancelled" &&
                       a.StartTime < endTime &&
                       a.StartTime.AddMinutes(a.DurationMinutes) > startTime);

        if (excludeAppointmentId.HasValue)
        {
            conflictQuery = conflictQuery.Where(a => a.Id != excludeAppointmentId.Value);
        }

        return await conflictQuery.AnyAsync().ConfigureAwait(false);
    }

    private async Task<int> GetAppointmentBufferMinutes()
    {
        var setting = await _context.AdminSettings
            .FirstOrDefaultAsync(s => s.Key == "APPOINTMENT_BUFFER_MINUTES").ConfigureAwait(false);

        return setting != null && int.TryParse(setting.Value, out var minutes) ? minutes : 30;
    }

    private static int GetTimezoneOffsetMinutes(string timeZone, DateTime dateTime)
    {
        // Simple implementation - could be enhanced with proper timezone handling
        try
        {
            var timeZoneInfo = TimeZoneInfo.FindSystemTimeZoneById(timeZone);
            var offset = timeZoneInfo.GetUtcOffset(dateTime);
            return (int)offset.TotalMinutes;
        }
        catch
        {
            return 0; // Default to UTC
        }
    }

    private UserId GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user ID in token");
        }
        return new UserId(userId);
    }

    private bool IsStaff()
    {
        return User.HasClaim("IsAdmin", "true") || User.IsInRole("Admin") || User.IsInRole("Staff");
    }

    private void LogAudit(string category, string action, string targetType, string targetId, object details)
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
        // Note: SaveChangesAsync will be called by the calling method
    }
}