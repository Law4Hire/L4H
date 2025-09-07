namespace L4H.Infrastructure.Services.Teams;

public class CreateMeetingRequest
{
    public required Guid AppointmentId { get; set; }
    public required string Subject { get; set; }
    public required DateTimeOffset StartTime { get; set; }
    public required DateTimeOffset EndTime { get; set; }
    public bool WaitingRoom { get; set; } = true;
    public bool Recording { get; set; } = true;
}

public class CreateMeetingResponse
{
    public required string MeetingId { get; set; }
    public required string JoinUrl { get; set; }
    public bool WaitingRoom { get; set; }
    public bool Recording { get; set; }
}

public interface IMeetingsProvider
{
    Task<CreateMeetingResponse> CreateMeetingAsync(CreateMeetingRequest request, CancellationToken cancellationToken = default);
}