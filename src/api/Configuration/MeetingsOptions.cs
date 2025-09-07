namespace L4H.Api.Configuration;

public class MeetingsOptions
{
    public const string SectionName = "Meetings";

    public string Mode { get; set; } = "Fake";
    public bool WaitingRoomEnabled { get; set; } = true;
    public bool RecordingEnabled { get; set; } = true;
}
