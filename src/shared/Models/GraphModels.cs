using L4H.Shared.Models;

namespace L4H.Shared.Models;

// Request models
public class SendTestMailRequest
{
    public required string To { get; set; }
    public string? Subject { get; set; }
    public string? Body { get; set; }
}

// Response models
public class SendTestMailResponse
{
    public bool Success { get; set; }
    public required string Message { get; set; }
    public required string Provider { get; set; }
    public List<string> Warnings { get; set; } = new();
}

public class StaffAvailabilityResponse
{
    public required UserId StaffId { get; set; }
    public required DateTimeOffset From { get; set; }
    public required DateTimeOffset To { get; set; }
    public List<BusySlot> BusySlots { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}

public class BusySlot
{
    public required DateTimeOffset StartTime { get; set; }
    public required DateTimeOffset EndTime { get; set; }
    public required string Source { get; set; }
    public string? Reason { get; set; }
}