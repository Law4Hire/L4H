using L4H.Shared.Models;

namespace L4H.Infrastructure.Services.Graph;

public class FakeGraphCalendarProvider : ICalendarProvider
{
    public bool SimulateFailure { get; set; } = false;

    public Task<CalendarAvailabilityResponse> GetAvailabilityAsync(CalendarAvailabilityRequest request, CancellationToken cancellationToken = default)
    {
        if (SimulateFailure)
        {
            throw new InvalidOperationException("Fake Graph calendar provider simulated failure");
        }

        // Generate predictable fake busy slots for testing
        var busySlots = new List<BusySlot>();
        
        // Add a predictable busy slot that falls within the query range
        // Use the middle of the query range to ensure it's always included
        var queryDuration = request.To - request.From;
        var busyStart = request.From.Add(queryDuration / 2); // Middle of the query range
        var busyEnd = busyStart.AddHours(1);
        
        if (busyStart >= request.From && busyEnd <= request.To)
        {
            busySlots.Add(new BusySlot
            {
                StartTime = busyStart,
                EndTime = busyEnd,
                Source = "Graph",
                Reason = "Existing calendar event"
            });
        }

        return Task.FromResult(new CalendarAvailabilityResponse
        {
            BusySlots = busySlots
        });
    }
}