namespace L4H.Infrastructure.Services.Teams;

public class FakeMeetingsProvider : IMeetingsProvider
{
    public bool SimulateFailure { get; set; } = false;

    public Task<CreateMeetingResponse> CreateMeetingAsync(CreateMeetingRequest request, CancellationToken cancellationToken = default)
    {
        if (SimulateFailure)
        {
            throw new InvalidOperationException("Fake Teams provider simulated failure");
        }

        var response = new CreateMeetingResponse
        {
            MeetingId = $"FAKE-{Guid.NewGuid()}",
            JoinUrl = $"https://teams.example.local/{request.AppointmentId}",
            WaitingRoom = request.WaitingRoom,
            Recording = request.Recording
        };

        return Task.FromResult(response);
    }
}