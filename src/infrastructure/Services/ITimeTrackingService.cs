using L4H.Infrastructure.Entities;
using L4H.Shared.Models;

namespace L4H.Infrastructure.Services;

public interface ITimeTrackingService
{
    Task<TimeEntry> CreateTimeEntryAsync(TimeEntry timeEntry, string createdBy);
    Task<IEnumerable<TimeEntry>> GetTimeEntriesByCaseAsync(CaseId caseId);
    Task<IEnumerable<TimeEntry>> GetTimeEntriesByUserAsync(UserId userId);
    Task<IEnumerable<TimeEntry>> GetTimeEntriesByAttorneyAsync(int attorneyId, DateTime? startDate = null, DateTime? endDate = null);
    Task<BillingRate?> GetBillingRateAsync(int attorneyId, string serviceType);
    Task UpdateTimeEntryAsync(int id, TimeEntry update, string updatedBy);
    Task DeleteTimeEntryAsync(int id);
}