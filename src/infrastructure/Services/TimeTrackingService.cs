using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;

namespace L4H.Infrastructure.Services;

public class TimeTrackingService : ITimeTrackingService
{
    private readonly L4HDbContext _context;
    private readonly ILogger<TimeTrackingService> _logger;
    private const decimal SixMinuteIncrement = 0.1m; // 6 minutes = 0.1 hour

    public TimeTrackingService(L4HDbContext context, ILogger<TimeTrackingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    #region Time Tracking Operations

    public async Task<TimeEntry> StartTimeTrackingAsync(int clientId, int attorneyId, string description)
    {
        // Check for existing active time entry
        var activeEntry = await GetActiveTimeEntryAsync(attorneyId);
        if (activeEntry != null)
        {
            throw new InvalidOperationException($"Attorney {attorneyId} already has an active time tracking session");
        }

        // Validate client and attorney exist
        var client = await _context.Clients.FindAsync(clientId);
        var attorney = await _context.Attorneys.FindAsync(attorneyId);

        if (client == null)
        {
            throw new ArgumentException($"Client with ID {clientId} not found");
        }

        if (attorney == null)
        {
            throw new ArgumentException($"Attorney with ID {attorneyId} not found");
        }

        if (!attorney.IsActive)
        {
            throw new InvalidOperationException("Cannot start time tracking for inactive attorney");
        }

        // Get attorney's hourly rate
        var hourlyRate = await GetAttorneyHourlyRateAsync(attorneyId);

        var timeEntry = new TimeEntry
        {
            ClientId = clientId,
            AttorneyId = attorneyId,
            StartTime = DateTime.UtcNow,
            EndTime = DateTime.UtcNow, // Will be updated when stopped
            Duration = 0,
            Description = description,
            HourlyRate = hourlyRate,
            BillableAmount = 0,
            CreatedAt = DateTime.UtcNow
        };

        _context.TimeEntries.Add(timeEntry);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Time tracking started for Attorney {AttorneyId} on Client {ClientId}, TimeEntry {TimeEntryId}", 
            attorneyId, clientId, timeEntry.Id);

        return timeEntry;
    }

    public async Task<TimeEntry?> StopTimeTrackingAsync(int timeEntryId, string? notes = null)
    {
        var timeEntry = await _context.TimeEntries
            .Include(te => te.Client)
            .Include(te => te.Attorney)
            .FirstOrDefaultAsync(te => te.Id == timeEntryId);

        if (timeEntry == null)
        {
            return null;
        }

        // Check if already stopped (has a meaningful duration)
        if (timeEntry.Duration > 0)
        {
            throw new InvalidOperationException("Time entry has already been stopped");
        }

        var endTime = DateTime.UtcNow;
        timeEntry.EndTime = endTime;

        // Calculate and round duration to 6-minute increments
        var actualDuration = endTime - timeEntry.StartTime;
        timeEntry.Duration = RoundToSixMinuteIncrements(actualDuration);

        // Calculate billable amount
        timeEntry.BillableAmount = timeEntry.Duration * timeEntry.HourlyRate;

        // Add notes if provided
        if (!string.IsNullOrWhiteSpace(notes))
        {
            timeEntry.Notes = notes;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Time tracking stopped for TimeEntry {TimeEntryId}, Duration: {Duration} hours, Amount: ${BillableAmount}", 
            timeEntryId, timeEntry.Duration, timeEntry.BillableAmount);

        return timeEntry;
    }

    public async Task<TimeEntry?> GetActiveTimeEntryAsync(int attorneyId)
    {
        return await _context.TimeEntries
            .Include(te => te.Client)
            .Where(te => te.AttorneyId == attorneyId && te.Duration == 0)
            .OrderByDescending(te => te.StartTime)
            .FirstOrDefaultAsync();
    }

    public async Task<bool> HasActiveTimeEntryAsync(int attorneyId)
    {
        return await _context.TimeEntries
            .AnyAsync(te => te.AttorneyId == attorneyId && te.Duration == 0);
    }

    #endregion

    #region Time Entry Management

    public async Task<TimeEntry?> GetTimeEntryByIdAsync(int timeEntryId)
    {
        return await _context.TimeEntries
            .Include(te => te.Client)
            .Include(te => te.Attorney)
            .FirstOrDefaultAsync(te => te.Id == timeEntryId);
    }

    public async Task<IEnumerable<TimeEntry>> GetTimeEntriesByClientAsync(int clientId)
    {
        return await _context.TimeEntries
            .Include(te => te.Attorney)
            .Where(te => te.ClientId == clientId)
            .OrderByDescending(te => te.StartTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<TimeEntry>> GetTimeEntriesByAttorneyAsync(int attorneyId)
    {
        return await _context.TimeEntries
            .Include(te => te.Client)
            .Where(te => te.AttorneyId == attorneyId)
            .OrderByDescending(te => te.StartTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<TimeEntry>> GetTimeEntriesAsync(int? clientId = null, int? attorneyId = null, DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.TimeEntries
            .Include(te => te.Client)
            .Include(te => te.Attorney)
            .AsQueryable();

        if (clientId.HasValue)
        {
            query = query.Where(te => te.ClientId == clientId.Value);
        }

        if (attorneyId.HasValue)
        {
            query = query.Where(te => te.AttorneyId == attorneyId.Value);
        }

        if (startDate.HasValue)
        {
            query = query.Where(te => te.StartTime >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(te => te.StartTime <= endDate.Value);
        }

        return await query
            .OrderByDescending(te => te.StartTime)
            .ToListAsync();
    }

    public async Task<TimeEntry> CreateTimeEntryAsync(TimeEntry timeEntry)
    {
        // Validate time entry
        if (!IsValidTimeEntry(timeEntry.StartTime, timeEntry.EndTime))
        {
            throw new ArgumentException("Invalid time entry: end time must be after start time");
        }

        // Check for concurrent sessions
        if (!await ValidateNoConcurrentSessionsAsync(timeEntry.AttorneyId, timeEntry.StartTime, timeEntry.EndTime))
        {
            throw new InvalidOperationException("Time entry conflicts with existing time tracking session");
        }

        // Calculate duration and billing
        var duration = timeEntry.EndTime - timeEntry.StartTime;
        timeEntry.Duration = RoundToSixMinuteIncrements(duration);

        if (timeEntry.HourlyRate == 0)
        {
            timeEntry.HourlyRate = await GetAttorneyHourlyRateAsync(timeEntry.AttorneyId);
        }

        timeEntry.BillableAmount = timeEntry.Duration * timeEntry.HourlyRate;
        timeEntry.CreatedAt = DateTime.UtcNow;

        _context.TimeEntries.Add(timeEntry);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Time entry {TimeEntryId} created for Attorney {AttorneyId} and Client {ClientId}", 
            timeEntry.Id, timeEntry.AttorneyId, timeEntry.ClientId);

        return timeEntry;
    }

    public async Task<TimeEntry> UpdateTimeEntryAsync(TimeEntry timeEntry)
    {
        var existingEntry = await _context.TimeEntries.FindAsync(timeEntry.Id);
        if (existingEntry == null)
        {
            throw new ArgumentException($"Time entry with ID {timeEntry.Id} not found");
        }

        // Validate time entry
        if (!IsValidTimeEntry(timeEntry.StartTime, timeEntry.EndTime))
        {
            throw new ArgumentException("Invalid time entry: end time must be after start time");
        }

        // Check for concurrent sessions (excluding current entry)
        if (!await ValidateNoConcurrentSessionsAsync(timeEntry.AttorneyId, timeEntry.StartTime, timeEntry.EndTime, timeEntry.Id))
        {
            throw new InvalidOperationException("Time entry conflicts with existing time tracking session");
        }

        // Update fields
        existingEntry.StartTime = timeEntry.StartTime;
        existingEntry.EndTime = timeEntry.EndTime;
        existingEntry.Description = timeEntry.Description;
        existingEntry.Notes = timeEntry.Notes;

        // Recalculate duration and billing
        var duration = existingEntry.EndTime - existingEntry.StartTime;
        existingEntry.Duration = RoundToSixMinuteIncrements(duration);
        existingEntry.BillableAmount = existingEntry.Duration * existingEntry.HourlyRate;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Time entry {TimeEntryId} updated", timeEntry.Id);
        return existingEntry;
    }

    public async Task<bool> DeleteTimeEntryAsync(int timeEntryId)
    {
        var timeEntry = await _context.TimeEntries.FindAsync(timeEntryId);
        if (timeEntry == null)
        {
            return false;
        }

        if (timeEntry.IsBilled)
        {
            throw new InvalidOperationException("Cannot delete billed time entry");
        }

        _context.TimeEntries.Remove(timeEntry);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Time entry {TimeEntryId} deleted", timeEntryId);
        return true;
    }

    #endregion

    #region Billing Calculations

    public async Task<decimal> CalculateBillableAmountAsync(int timeEntryId)
    {
        var timeEntry = await _context.TimeEntries.FindAsync(timeEntryId);
        if (timeEntry == null)
        {
            return 0;
        }

        return timeEntry.Duration * timeEntry.HourlyRate;
    }

    public async Task<decimal> GetAttorneyHourlyRateAsync(int attorneyId, string? serviceType = null)
    {
        // First try to get specific billing rate for service type
        if (!string.IsNullOrWhiteSpace(serviceType))
        {
            var specificRate = await _context.BillingRates
                .Where(br => br.AttorneyId == attorneyId && 
                           br.ServiceType == serviceType && 
                           br.IsActive &&
                           br.EffectiveDate <= DateTime.UtcNow &&
                           (br.ExpiryDate == null || br.ExpiryDate > DateTime.UtcNow))
                .OrderByDescending(br => br.EffectiveDate)
                .FirstOrDefaultAsync();

            if (specificRate != null)
            {
                return specificRate.HourlyRate;
            }
        }

        // Fall back to attorney's default hourly rate
        var attorney = await _context.Attorneys.FindAsync(attorneyId);
        if (attorney != null && attorney.DefaultHourlyRate > 0)
        {
            return attorney.DefaultHourlyRate;
        }

        // Fall back to general billing rate
        var generalRate = await _context.BillingRates
            .Where(br => br.AttorneyId == attorneyId && 
                       br.IsActive &&
                       br.EffectiveDate <= DateTime.UtcNow &&
                       (br.ExpiryDate == null || br.ExpiryDate > DateTime.UtcNow))
            .OrderByDescending(br => br.EffectiveDate)
            .FirstOrDefaultAsync();

        return generalRate?.HourlyRate ?? 0;
    }

    public async Task<decimal> CalculateTotalBillableHoursAsync(int attorneyId, DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.TimeEntries
            .Where(te => te.AttorneyId == attorneyId);

        if (startDate.HasValue)
        {
            query = query.Where(te => te.StartTime >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(te => te.StartTime <= endDate.Value);
        }

        return await query.SumAsync(te => te.Duration);
    }

    public async Task<decimal> CalculateTotalBillableAmountAsync(int attorneyId, DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.TimeEntries
            .Where(te => te.AttorneyId == attorneyId);

        if (startDate.HasValue)
        {
            query = query.Where(te => te.StartTime >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(te => te.StartTime <= endDate.Value);
        }

        return await query.SumAsync(te => te.BillableAmount);
    }

    #endregion

    #region Time Validation and Rounding

    public decimal RoundToSixMinuteIncrements(TimeSpan duration)
    {
        var totalMinutes = duration.TotalMinutes;
        var sixMinuteIncrements = Math.Ceiling(totalMinutes / 6.0);
        return (decimal)sixMinuteIncrements * SixMinuteIncrement;
    }

    public decimal RoundToSixMinuteIncrements(decimal hours)
    {
        var totalMinutes = (double)(hours * 60);
        var sixMinuteIncrements = Math.Ceiling(totalMinutes / 6.0);
        return (decimal)sixMinuteIncrements * SixMinuteIncrement;
    }

    public bool IsValidTimeEntry(DateTime startTime, DateTime endTime)
    {
        return endTime > startTime && startTime <= DateTime.UtcNow;
    }

    #endregion

    #region Reporting and Aggregation

    public async Task<IEnumerable<TimeEntry>> GetUnbilledTimeEntriesAsync(int? attorneyId = null)
    {
        var query = _context.TimeEntries
            .Include(te => te.Client)
            .Include(te => te.Attorney)
            .Where(te => !te.IsBilled);

        if (attorneyId.HasValue)
        {
            query = query.Where(te => te.AttorneyId == attorneyId.Value);
        }

        return await query
            .OrderBy(te => te.AttorneyId)
            .ThenBy(te => te.StartTime)
            .ToListAsync();
    }

    public async Task<bool> MarkTimeEntriesAsBilledAsync(IEnumerable<int> timeEntryIds, DateTime billedDate)
    {
        var timeEntries = await _context.TimeEntries
            .Where(te => timeEntryIds.Contains(te.Id))
            .ToListAsync();

        if (!timeEntries.Any())
        {
            return false;
        }

        foreach (var timeEntry in timeEntries)
        {
            timeEntry.IsBilled = true;
            timeEntry.BilledDate = billedDate;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Marked {Count} time entries as billed", timeEntries.Count);
        return true;
    }

    public async Task<Dictionary<int, decimal>> GetBillingSummaryByAttorneyAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.TimeEntries.AsQueryable();

        if (startDate.HasValue)
        {
            query = query.Where(te => te.StartTime >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(te => te.StartTime <= endDate.Value);
        }

        return await query
            .GroupBy(te => te.AttorneyId)
            .Select(g => new { AttorneyId = g.Key, TotalAmount = g.Sum(te => te.BillableAmount) })
            .ToDictionaryAsync(x => x.AttorneyId, x => x.TotalAmount);
    }

    public async Task<Dictionary<int, decimal>> GetBillingSummaryByClientAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.TimeEntries.AsQueryable();

        if (startDate.HasValue)
        {
            query = query.Where(te => te.StartTime >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(te => te.StartTime <= endDate.Value);
        }

        return await query
            .GroupBy(te => te.ClientId)
            .Select(g => new { ClientId = g.Key, TotalAmount = g.Sum(te => te.BillableAmount) })
            .ToDictionaryAsync(x => x.ClientId, x => x.TotalAmount);
    }

    #endregion

    #region Concurrent Session Validation

    public async Task<bool> ValidateNoConcurrentSessionsAsync(int attorneyId, DateTime startTime, DateTime endTime, int? excludeTimeEntryId = null)
    {
        var query = _context.TimeEntries
            .Where(te => te.AttorneyId == attorneyId &&
                        ((te.StartTime <= startTime && te.EndTime > startTime) ||
                         (te.StartTime < endTime && te.EndTime >= endTime) ||
                         (te.StartTime >= startTime && te.EndTime <= endTime)));

        if (excludeTimeEntryId.HasValue)
        {
            query = query.Where(te => te.Id != excludeTimeEntryId.Value);
        }

        var conflictingEntries = await query.CountAsync();
        return conflictingEntries == 0;
    }

    #endregion
}