using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using System.Text;

namespace L4H.Api.Controllers;

[ApiController]
[Route("v1/billing")]
[Tags("Billing")]
[Authorize(Policy = "IsAdmin")]
public class BillingController : ControllerBase
{
    private readonly L4HDbContext _context;

    public BillingController(L4HDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get billing dashboard summary for all attorneys
    /// </summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(BillingDashboardResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<BillingDashboardResponse>> GetBillingDashboard(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        // Default to current month if no dates provided
        startDate ??= new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        endDate ??= startDate.Value.AddMonths(1).AddDays(-1);

        var attorneySummaries = await _context.Attorneys
            .Where(a => a.IsActive)
            .Select(a => new AttorneyBillingSummary
            {
                AttorneyId = a.Id,
                AttorneyName = a.Name,
                DefaultHourlyRate = a.DefaultHourlyRate,
                TotalHours = a.TimeEntries
                    .Where(te => te.StartTime >= startDate && te.StartTime <= endDate && te.EndTime != default)
                    .Sum(te => te.Duration),
                BillableAmount = a.TimeEntries
                    .Where(te => te.StartTime >= startDate && te.StartTime <= endDate && te.EndTime != default)
                    .Sum(te => te.BillableAmount),
                BilledAmount = a.TimeEntries
                    .Where(te => te.StartTime >= startDate && te.StartTime <= endDate && te.IsBilled)
                    .Sum(te => te.BillableAmount),
                UnbilledAmount = a.TimeEntries
                    .Where(te => te.StartTime >= startDate && te.StartTime <= endDate && te.EndTime != default && !te.IsBilled)
                    .Sum(te => te.BillableAmount),
                ClientCount = a.AssignedClients.Count,
                TimeEntryCount = a.TimeEntries
                    .Count(te => te.StartTime >= startDate && te.StartTime <= endDate && te.EndTime != default)
            })
            .ToArrayAsync();

        var totalSummary = new BillingTotalSummary
        {
            TotalHours = attorneySummaries.Sum(a => a.TotalHours),
            TotalBillableAmount = attorneySummaries.Sum(a => a.BillableAmount),
            TotalBilledAmount = attorneySummaries.Sum(a => a.BilledAmount),
            TotalUnbilledAmount = attorneySummaries.Sum(a => a.UnbilledAmount),
            TotalAttorneys = attorneySummaries.Length,
            TotalClients = await _context.Clients.CountAsync(),
            TotalTimeEntries = attorneySummaries.Sum(a => a.TimeEntryCount)
        };

        return Ok(new BillingDashboardResponse
        {
            StartDate = startDate.Value,
            EndDate = endDate.Value,
            AttorneySummaries = attorneySummaries,
            TotalSummary = totalSummary
        });
    } 
   /// <summary>
    /// Get detailed billing information for a specific attorney
    /// </summary>
    [HttpGet("attorney/{attorneyId}")]
    [ProducesResponseType(typeof(AttorneyBillingDetail), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AttorneyBillingDetail>> GetAttorneyBillingDetail(
        int attorneyId,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var attorney = await _context.Attorneys
            .FirstOrDefaultAsync(a => a.Id == attorneyId && a.IsActive);

        if (attorney == null)
        {
            return NotFound("Attorney not found");
        }

        // Default to current month if no dates provided
        startDate ??= new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        endDate ??= startDate.Value.AddMonths(1).AddDays(-1);

        var timeEntries = await _context.TimeEntries
            .Include(te => te.Client)
            .Where(te => te.AttorneyId == attorneyId && 
                        te.StartTime >= startDate && 
                        te.StartTime <= endDate && 
                        te.EndTime != default)
            .OrderByDescending(te => te.StartTime)
            .ToArrayAsync();

        var clientBreakdown = timeEntries
            .GroupBy(te => new { te.ClientId, te.Client.FirstName, te.Client.LastName })
            .Select(g => new ClientBillingBreakdown
            {
                ClientId = g.Key.ClientId,
                ClientName = $"{g.Key.FirstName} {g.Key.LastName}",
                TotalHours = g.Sum(te => te.Duration),
                TotalAmount = g.Sum(te => te.BillableAmount),
                BilledAmount = g.Where(te => te.IsBilled).Sum(te => te.BillableAmount),
                UnbilledAmount = g.Where(te => !te.IsBilled).Sum(te => te.BillableAmount),
                TimeEntryCount = g.Count()
            })
            .OrderByDescending(c => c.TotalAmount)
            .ToArray();

        return Ok(new AttorneyBillingDetail
        {
            AttorneyId = attorneyId,
            AttorneyName = attorney.Name,
            StartDate = startDate.Value,
            EndDate = endDate.Value,
            TotalHours = timeEntries.Sum(te => te.Duration),
            TotalBillableAmount = timeEntries.Sum(te => te.BillableAmount),
            TotalBilledAmount = timeEntries.Where(te => te.IsBilled).Sum(te => te.BillableAmount),
            TotalUnbilledAmount = timeEntries.Where(te => !te.IsBilled).Sum(te => te.BillableAmount),
            TimeEntries = timeEntries,
            ClientBreakdown = clientBreakdown
        });
    }

    /// <summary>
    /// Get billing rates for an attorney
    /// </summary>
    [HttpGet("attorney/{attorneyId}/rates")]
    [ProducesResponseType(typeof(BillingRate[]), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BillingRate[]>> GetAttorneyBillingRates(int attorneyId)
    {
        var attorney = await _context.Attorneys
            .FirstOrDefaultAsync(a => a.Id == attorneyId && a.IsActive);

        if (attorney == null)
        {
            return NotFound("Attorney not found");
        }

        var rates = await _context.BillingRates
            .Where(br => br.AttorneyId == attorneyId)
            .OrderByDescending(br => br.EffectiveDate)
            .ToArrayAsync();

        return Ok(rates);
    }

    /// <summary>
    /// Create or update billing rate for an attorney
    /// </summary>
    [HttpPost("attorney/{attorneyId}/rates")]
    [ProducesResponseType(typeof(BillingRate), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BillingRate>> CreateBillingRate(int attorneyId, [FromBody] CreateBillingRateRequest request)
    {
        var attorney = await _context.Attorneys
            .FirstOrDefaultAsync(a => a.Id == attorneyId && a.IsActive);

        if (attorney == null)
        {
            return NotFound("Attorney not found");
        }

        // Deactivate existing rates for the same service type
        var existingRates = await _context.BillingRates
            .Where(br => br.AttorneyId == attorneyId && 
                        br.ServiceType == request.ServiceType && 
                        br.IsActive)
            .ToArrayAsync();

        foreach (var rate in existingRates)
        {
            rate.IsActive = false;
            rate.ExpiryDate = DateTime.UtcNow;
            rate.UpdatedAt = DateTime.UtcNow;
        }

        var newRate = new BillingRate
        {
            AttorneyId = attorneyId,
            ServiceType = request.ServiceType,
            HourlyRate = request.HourlyRate,
            EffectiveDate = request.EffectiveDate ?? DateTime.UtcNow,
            IsActive = true,
            Notes = request.Notes ?? string.Empty,
            CreatedBy = User.FindFirst("email")?.Value ?? "system",
            UpdatedBy = User.FindFirst("email")?.Value ?? "system"
        };

        _context.BillingRates.Add(newRate);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAttorneyBillingRates), new { attorneyId }, newRate);
    }

    /// <summary>
    /// Mark time entries as billed
    /// </summary>
    [HttpPost("mark-billed")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> MarkTimeEntriesAsBilled([FromBody] MarkBilledRequest request)
    {
        if (!request.TimeEntryIds.Any())
        {
            return BadRequest("No time entry IDs provided");
        }

        var timeEntries = await _context.TimeEntries
            .Where(te => request.TimeEntryIds.Contains(te.Id))
            .ToArrayAsync();

        if (timeEntries.Length != request.TimeEntryIds.Count)
        {
            return BadRequest("Some time entries were not found");
        }

        // Check if any are already billed
        var alreadyBilled = timeEntries.Where(te => te.IsBilled).ToArray();
        if (alreadyBilled.Any())
        {
            return BadRequest($"Time entries {string.Join(", ", alreadyBilled.Select(te => te.Id))} are already billed");
        }

        // Mark as billed
        foreach (var timeEntry in timeEntries)
        {
            timeEntry.IsBilled = true;
            timeEntry.BilledDate = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = $"Marked {timeEntries.Length} time entries as billed" });
    }

    /// <summary>
    /// Export billing report as CSV
    /// </summary>
    [HttpGet("export")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    public async Task<ActionResult> ExportBillingReport(
        [FromQuery] int? attorneyId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] bool? includeUnbilled = true)
    {
        // Default to current month if no dates provided
        startDate ??= new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        endDate ??= startDate.Value.AddMonths(1).AddDays(-1);

        var query = _context.TimeEntries
            .Include(te => te.Client)
            .Include(te => te.Attorney)
            .Where(te => te.StartTime >= startDate && 
                        te.StartTime <= endDate && 
                        te.EndTime != default);

        if (attorneyId.HasValue)
        {
            query = query.Where(te => te.AttorneyId == attorneyId.Value);
        }

        if (includeUnbilled == false)
        {
            query = query.Where(te => te.IsBilled);
        }

        var timeEntries = await query
            .OrderBy(te => te.Attorney.Name)
            .ThenBy(te => te.StartTime)
            .ToArrayAsync();

        // Generate CSV
        var csv = new StringBuilder();
        csv.AppendLine("Attorney,Client,Start Time,End Time,Duration (Hours),Description,Hourly Rate,Billable Amount,Is Billed,Billed Date");

        foreach (var entry in timeEntries)
        {
            csv.AppendLine($"\"{entry.Attorney.Name}\",\"{entry.Client.FirstName} {entry.Client.LastName}\"," +
                          $"\"{entry.StartTime:yyyy-MM-dd HH:mm}\",\"{entry.EndTime:yyyy-MM-dd HH:mm}\"," +
                          $"{entry.Duration},{entry.Description},{entry.HourlyRate:C}," +
                          $"{entry.BillableAmount:C},{entry.IsBilled}," +
                          $"\"{entry.BilledDate?.ToString("yyyy-MM-dd") ?? ""}\"");
        }

        var fileName = $"billing_report_{startDate:yyyyMMdd}_{endDate:yyyyMMdd}.csv";
        var bytes = Encoding.UTF8.GetBytes(csv.ToString());

        return File(bytes, "text/csv", fileName);
    }

    /// <summary>
    /// Get billing analytics and trends
    /// </summary>
    [HttpGet("analytics")]
    [ProducesResponseType(typeof(BillingAnalytics), StatusCodes.Status200OK)]
    public async Task<ActionResult<BillingAnalytics>> GetBillingAnalytics(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        // Default to last 12 months if no dates provided
        endDate ??= DateTime.UtcNow.Date;
        startDate ??= endDate.Value.AddMonths(-12);

        var timeEntries = await _context.TimeEntries
            .Include(te => te.Attorney)
            .Include(te => te.Client)
            .Where(te => te.StartTime >= startDate && 
                        te.StartTime <= endDate && 
                        te.EndTime != default)
            .ToArrayAsync();

        // Monthly trends
        var monthlyTrends = timeEntries
            .GroupBy(te => new { te.StartTime.Year, te.StartTime.Month })
            .Select(g => new MonthlyBillingTrend
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                TotalHours = g.Sum(te => te.Duration),
                TotalRevenue = g.Sum(te => te.BillableAmount),
                BilledRevenue = g.Where(te => te.IsBilled).Sum(te => te.BillableAmount),
                TimeEntryCount = g.Count()
            })
            .OrderBy(t => t.Year)
            .ThenBy(t => t.Month)
            .ToArray();

        // Attorney performance
        var attorneyPerformance = timeEntries
            .GroupBy(te => new { te.AttorneyId, te.Attorney.Name })
            .Select(g => new AttorneyPerformance
            {
                AttorneyId = g.Key.AttorneyId,
                AttorneyName = g.Key.Name,
                TotalHours = g.Sum(te => te.Duration),
                TotalRevenue = g.Sum(te => te.BillableAmount),
                AverageHourlyRate = g.Average(te => te.HourlyRate),
                ClientCount = g.Select(te => te.ClientId).Distinct().Count(),
                TimeEntryCount = g.Count()
            })
            .OrderByDescending(a => a.TotalRevenue)
            .ToArray();

        return Ok(new BillingAnalytics
        {
            StartDate = startDate.Value,
            EndDate = endDate.Value,
            MonthlyTrends = monthlyTrends,
            AttorneyPerformance = attorneyPerformance,
            TotalRevenue = timeEntries.Sum(te => te.BillableAmount),
            TotalBilledRevenue = timeEntries.Where(te => te.IsBilled).Sum(te => te.BillableAmount),
            TotalHours = timeEntries.Sum(te => te.Duration),
            AverageHourlyRate = timeEntries.Any() ? timeEntries.Average(te => te.HourlyRate) : 0
        });
    }
}

// Request/Response Models
public class BillingDashboardResponse
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public AttorneyBillingSummary[] AttorneySummaries { get; set; } = Array.Empty<AttorneyBillingSummary>();
    public BillingTotalSummary TotalSummary { get; set; } = new();
}

public class AttorneyBillingSummary
{
    public int AttorneyId { get; set; }
    public string AttorneyName { get; set; } = string.Empty;
    public decimal DefaultHourlyRate { get; set; }
    public decimal TotalHours { get; set; }
    public decimal BillableAmount { get; set; }
    public decimal BilledAmount { get; set; }
    public decimal UnbilledAmount { get; set; }
    public int ClientCount { get; set; }
    public int TimeEntryCount { get; set; }
}

public class BillingTotalSummary
{
    public decimal TotalHours { get; set; }
    public decimal TotalBillableAmount { get; set; }
    public decimal TotalBilledAmount { get; set; }
    public decimal TotalUnbilledAmount { get; set; }
    public int TotalAttorneys { get; set; }
    public int TotalClients { get; set; }
    public int TotalTimeEntries { get; set; }
}

public class AttorneyBillingDetail
{
    public int AttorneyId { get; set; }
    public string AttorneyName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal TotalHours { get; set; }
    public decimal TotalBillableAmount { get; set; }
    public decimal TotalBilledAmount { get; set; }
    public decimal TotalUnbilledAmount { get; set; }
    public TimeEntry[] TimeEntries { get; set; } = Array.Empty<TimeEntry>();
    public ClientBillingBreakdown[] ClientBreakdown { get; set; } = Array.Empty<ClientBillingBreakdown>();
}

public class ClientBillingBreakdown
{
    public int ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public decimal TotalHours { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal BilledAmount { get; set; }
    public decimal UnbilledAmount { get; set; }
    public int TimeEntryCount { get; set; }
}

public class CreateBillingRateRequest
{
    public string ServiceType { get; set; } = string.Empty;
    public decimal HourlyRate { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public string? Notes { get; set; }
}

public class MarkBilledRequest
{
    public List<int> TimeEntryIds { get; set; } = new();
}

public class BillingAnalytics
{
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public MonthlyBillingTrend[] MonthlyTrends { get; set; } = Array.Empty<MonthlyBillingTrend>();
    public AttorneyPerformance[] AttorneyPerformance { get; set; } = Array.Empty<AttorneyPerformance>();
    public decimal TotalRevenue { get; set; }
    public decimal TotalBilledRevenue { get; set; }
    public decimal TotalHours { get; set; }
    public decimal AverageHourlyRate { get; set; }
}

public class MonthlyBillingTrend
{
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal TotalHours { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal BilledRevenue { get; set; }
    public int TimeEntryCount { get; set; }
}

public class AttorneyPerformance
{
    public int AttorneyId { get; set; }
    public string AttorneyName { get; set; } = string.Empty;
    public decimal TotalHours { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal AverageHourlyRate { get; set; }
    public int ClientCount { get; set; }
    public int TimeEntryCount { get; set; }
}