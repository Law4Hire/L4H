using L4H.Infrastructure.Services.Graph;
using L4H.Infrastructure.Entities;

namespace L4H.Api.Services.Providers;

public interface IGraphCalendarProvider : ICalendarProvider
{
    Task<List<AvailabilityBlock>> GetAvailabilityAsync(string email, DateTime start, DateTime end);
}
