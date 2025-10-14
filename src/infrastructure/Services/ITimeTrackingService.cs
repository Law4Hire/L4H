using L4H.Infrastructure.Entities;

namespace L4H.Infrastructure.Services;

public interface ITimeTrackingService
{
    // Time tracking operations
    Task<TimeEntry> StartTimeTrackingAsync(int clientId, int attorneyId, string description);
    Task<TimeEntry?> StopTimeTrackingAsync(int timeEntryId, string? notes = null);
    Task<TimeEntry?> GetActiveTimeEntryAsync(int attorneyId);
    Task<bool> HasActiveTimeEntryAsync(int attorneyId);

    // Time entry management
    Task<TimeEntry?> GetTimeEntryByIdAsync(int timeEntryId);
    Task<IEnumerable<TimeEntry>> GetTimeEntriesByClientAsync(int clientId);
    Task<IEnumerable<TimeEntry>> GetTimeEntriesByAttorneyAsync(int attorneyId);
    Task<IEnumerable<TimeEntry>> GetTimeEntriesAsync(int? clientId = null, int? attorneyId = null, DateTime? startDate = null, DateTime? endDate = null);
    Task<TimeEntry> CreateTimeEntryAsync(TimeEntry timeEntry);
    Task<TimeEntry> UpdateTimeEntryAsync(TimeEntry timeEntry);
    Task<bool> DeleteTimeEntryAsync(int timeEntryId);

    // Billing calculations
    Task<decimal> CalculateBillableAmountAsync(int timeEntryId);
    Task<decimal> GetAttorneyHourlyRateAsync(int attorneyId, string? serviceType = null);
    Task<decimal> CalculateTotalBillableHoursAsync(int attorneyId, DateTime? startDate = null, DateTime? endDate = null);
    Task<decimal> CalculateTotalBillableAmountAsync(int attorneyId, DateTime? startDate = null, DateTime? endDate = null);

    // Time validation and rounding
    decimal RoundToSixMinuteIncrements(TimeSpan duration);
    decimal RoundToSixMinuteIncrements(decimal hours);
    bool IsValidTimeEntry(DateTime startTime, DateTime endTime);

    // Reporting and aggregation
    Task<IEnumerable<TimeEntry>> GetUnbilledTimeEntriesAsync(int? attorneyId = null);
    Task<bool> MarkTimeEntriesAsBilledAsync(IEnumerable<int> timeEntryIds, DateTime billedDate);
    Task<Dictionary<int, decimal>> GetBillingSummaryByAttorneyAsync(DateTime? startDate = null, DateTime? endDate = null);
    Task<Dictionary<int, decimal>> GetBillingSummaryByClientAsync(DateTime? startDate = null, DateTime? endDate = null);

    // Concurrent session validation
    Task<bool> ValidateNoConcurrentSessionsAsync(int attorneyId, DateTime startTime, DateTime endTime, int? excludeTimeEntryId = null);
}