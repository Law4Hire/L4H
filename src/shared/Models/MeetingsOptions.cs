namespace L4H.Shared.Models;

public enum MeetingsMode
{
    Fake,
    Teams
}

public class MeetingsOptions
{
    public MeetingsMode Mode { get; set; } = MeetingsMode.Fake;
    public string? TenantId { get; set; }
    public string? ClientId { get; set; }
    public string? ClientSecret { get; set; }
}