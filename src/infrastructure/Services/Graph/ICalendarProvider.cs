using L4H.Shared.Models;

namespace L4H.Infrastructure.Services.Graph;

public class BusySlot
{
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset EndTime { get; set; }
    public string Source { get; set; } = "Graph";
    public string? Reason { get; set; }
}

public class CalendarAvailabilityRequest
{
    public required UserId StaffId { get; set; }
    public required string EmailAddress { get; set; }
    public required DateTimeOffset From { get; set; }
    public required DateTimeOffset To { get; set; }
}

public class CalendarAvailabilityResponse
{
    public List<BusySlot> BusySlots { get; set; } = new();
}

public interface ICalendarProvider
{
    Task<CalendarAvailabilityResponse> GetAvailabilityAsync(CalendarAvailabilityRequest request, CancellationToken cancellationToken = default);
}