using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using System.Text.Json;
using System.Globalization;

namespace L4H.Api.Services;

public class CaseAutoAgingService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<CaseAutoAgingService> _logger;

    public CaseAutoAgingService(
        IServiceProvider serviceProvider,
        ILogger<CaseAutoAgingService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessAutoAgingAsync().ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in case auto-aging service");
            }

            // Wait for 1 hour before next run
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken).ConfigureAwait(false);
        }
    }

    private async Task ProcessAutoAgingAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var localizer = scope.ServiceProvider.GetRequiredService<IStringLocalizer<Shared>>();

        // TODO: Make configurable via AdminSettings (default 30 days)
        var cutoffDate = DateTimeOffset.UtcNow.AddDays(-30);
        
        var eligibleCases = await context.Cases
            .Where(c => (c.Status == "pending" || c.Status == "paid" || c.Status == "active") 
                       && c.LastActivityAt <= cutoffDate)
            .ToListAsync().ConfigureAwait(false);

        _logger.LogInformation("Found {Count} cases eligible for auto-aging", eligibleCases.Count);

        foreach (var caseEntity in eligibleCases)
        {
            var oldStatus = caseEntity.Status;
            caseEntity.Status = "inactive";
            caseEntity.LastActivityAt = DateTimeOffset.UtcNow;

            // Create audit log
            var auditLog = new AuditLog
            {
                Category = "case",
                ActorUserId = null, // System action
                Action = "auto_age_inactive",
                TargetType = "Case",
                TargetId = caseEntity.Id.Value.ToString(),
                DetailsJson = JsonSerializer.Serialize(new 
                { 
                    oldStatus, 
                    newStatus = "inactive",
                    reason = "Auto-aged due to 30+ days of inactivity",
                    cutoffDate = cutoffDate
                }),
                CreatedAt = DateTime.UtcNow
            };

            context.AuditLogs.Add(auditLog);

            _logger.LogInformation("Auto-aged case {CaseId} from {OldStatus} to inactive", 
                caseEntity.Id.Value, oldStatus);
        }

        if (eligibleCases.Any())
        {
            await context.SaveChangesAsync().ConfigureAwait(false);
            _logger.LogInformation("Auto-aged {Count} cases to inactive status", eligibleCases.Count);
        }
    }
}