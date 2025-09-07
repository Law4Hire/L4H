using L4H.Api.Services.Providers;
using L4H.Infrastructure.Services.Teams;
using Microsoft.Extensions.Localization;

namespace L4H.Api.Tests.Fakes;

public class FakeApiMeetingsProvider : L4H.Api.Services.Providers.IMeetingsProvider
{
    private readonly IStringLocalizer<Shared> _localizer;

    public FakeApiMeetingsProvider(IStringLocalizer<Shared> localizer)
    {
        _localizer = localizer;
    }

    public bool SimulateFailure { get; set; } = false;
    public MeetingOptions? LastMeetingOptions { get; private set; }

    public Task<MeetingResult> CreateMeetingAsync(MeetingOptions options)
    {
        LastMeetingOptions = options;
        
        if (SimulateFailure)
        {
            return Task.FromResult(new MeetingResult
            {
                Success = false,
                ErrorMessage = "Simulated failure"
            });
        }

        return Task.FromResult(new MeetingResult
        {
            Success = true,
            MeetingId = "meeting_123456789",
            JoinUrl = "https://teams.microsoft.com/l/meetup-join/test",
            Message = _localizer["Appointments.CreatedSuccessfully"]
        });
    }
}
