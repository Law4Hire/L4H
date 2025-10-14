using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;
using L4H.Infrastructure.Services.Teams;
using L4H.Infrastructure.Entities;
using L4H.Api.Services.Providers;
using L4H.Api.Configuration;

namespace L4H.Api.Controllers;

[ApiController]
[Route("v1/meetings")]
[Authorize]
[Tags("Meetings")]
public class AppointmentsController : ControllerBase
{
    private readonly L4H.Api.Services.Providers.IMeetingsProvider _meetingsProvider;
    private readonly IStringLocalizer<Shared> _localizer;
    private readonly ILogger<AppointmentsController> _logger;
    private readonly MeetingsOptions _meetingsOptions;

    public AppointmentsController(
        L4H.Api.Services.Providers.IMeetingsProvider meetingsProvider,
        IStringLocalizer<Shared> localizer,
        ILogger<AppointmentsController> logger,
        IOptions<MeetingsOptions> meetingsOptions)
    {
        _meetingsProvider = meetingsProvider;
        _localizer = localizer;
        _logger = logger;
        _meetingsOptions = meetingsOptions.Value;
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
                    message = result.Message ?? _localizer["Appointments.CreatedSuccessfully"]
                });
            }
            else
            {
                return StatusCode(500, new { message = result.ErrorMessage ?? _localizer["Appointments.CreationFailed"] });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating appointment");
            return StatusCode(500, new { message = _localizer["Appointments.CreationError"] });
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
