namespace L4H.Api.Services.Providers;

public interface IMeetingsProvider
{
    Task<MeetingResult> CreateMeetingAsync(MeetingOptions options);
}

public class MeetingOptions
{
    public string Subject { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public List<string> Attendees { get; set; } = new();
    public bool WaitingRoomEnabled { get; set; } = true;
    public bool RecordingEnabled { get; set; } = true;
}

public class MeetingResult
{
    public bool Success { get; set; }
    public string? MeetingId { get; set; }
    public string? JoinUrl { get; set; }
    public string? Message { get; set; }
    public string? ErrorMessage { get; set; }
}
