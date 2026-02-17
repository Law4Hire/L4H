using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;

namespace L4H.Infrastructure.Services;

public class TimeTrackingService : ITimeTrackingService
{
    private readonly L4HDbContext _context;

    public TimeTrackingService(L4HDbContext context)
    {
        _context = context;
    }

    public async Task<TimeEntry> CreateTimeEntryAsync(TimeEntry timeEntry, string createdBy)
    {
        // Calculate duration if not provided but start/end are
        if (timeEntry.Duration == 0 && timeEntry.EndTime.HasValue)
        {
            timeEntry.Duration = (decimal)(timeEntry.EndTime.Value - timeEntry.StartTime).TotalHours;
        }

        // Apply billing rate if not provided
        if (timeEntry.HourlyRate == 0)
        {
            var rate = await GetBillingRateAsync(timeEntry.AttorneyId, timeEntry.ServiceType);
            timeEntry.HourlyRate = rate?.HourlyRate ?? 0;
        }

        // Calculate billable amount
        if (timeEntry.IsBillable && timeEntry.BillableAmount == 0)
        {
            timeEntry.BillableAmount = timeEntry.Duration * timeEntry.HourlyRate;
        }

        timeEntry.CreatedAt = DateTime.UtcNow;
        timeEntry.CreatedBy = createdBy;
        timeEntry.UpdatedAt = DateTime.UtcNow;
        timeEntry.UpdatedBy = createdBy;

        _context.TimeEntries.Add(timeEntry);
        await _context.SaveChangesAsync();

        return timeEntry;
    }

    public async Task<IEnumerable<TimeEntry>> GetTimeEntriesByCaseAsync(CaseId caseId)
    {
        return await _context.TimeEntries
            .Include(t => t.Attorney)
            .Where(t => t.CaseId == caseId)
            .OrderByDescending(t => t.StartTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<TimeEntry>> GetTimeEntriesByUserAsync(UserId userId)
    {
        return await _context.TimeEntries
            .Include(t => t.Attorney)
            .Include(t => t.Case)
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.StartTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<TimeEntry>> GetTimeEntriesByAttorneyAsync(int attorneyId, DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.TimeEntries
            .Include(t => t.User)
            .Include(t => t.Case)
            .Where(t => t.AttorneyId == attorneyId);

        if (startDate.HasValue)
        {
            query = query.Where(t => t.StartTime >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(t => t.StartTime <= endDate.Value);
        }

        return await query
            .OrderByDescending(t => t.StartTime)
            .ToListAsync();
    }

    public async Task<BillingRate?> GetBillingRateAsync(int attorneyId, string serviceType)
    {
        return await _context.BillingRates
            .Where(r => r.AttorneyId == attorneyId && 
                       r.ServiceType == serviceType && 
                       r.IsActive && 
                       r.EffectiveDate <= DateTime.UtcNow)
            .OrderByDescending(r => r.EffectiveDate)
            .FirstOrDefaultAsync();
    }

    public async Task UpdateTimeEntryAsync(int id, TimeEntry update, string updatedBy)
    {
        var entry = await _context.TimeEntries.FindAsync(id);
        if (entry == null) throw new KeyNotFoundException($"TimeEntry {id} not found");

        entry.Description = update.Description;
        entry.Duration = update.Duration;
        entry.StartTime = update.StartTime;
        entry.EndTime = update.EndTime;
        entry.IsBillable = update.IsBillable;
        entry.ServiceType = update.ServiceType;
        entry.Notes = update.Notes;
        
        // Recalculate billing
        if (update.HourlyRate > 0)
        {
            entry.HourlyRate = update.HourlyRate;
        }
        
        if (entry.IsBillable)
        {
            entry.BillableAmount = entry.Duration * entry.HourlyRate;
        }
        else
        {
            entry.BillableAmount = 0;
        }

        entry.UpdatedAt = DateTime.UtcNow;
        entry.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync();
    }

    public async Task DeleteTimeEntryAsync(int id)
    {
        var entry = await _context.TimeEntries.FindAsync(id);
        if (entry == null) return;

        if (entry.IsBilled)
        {
            throw new InvalidOperationException("Cannot delete billed time entries");
        }

        _context.TimeEntries.Remove(entry);
        await _context.SaveChangesAsync();
    }
}