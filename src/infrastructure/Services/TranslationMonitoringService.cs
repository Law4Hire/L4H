using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using System.Text.Json;

namespace L4H.Infrastructure.Services;

public class TranslationMonitoringService : ITranslationMonitoringService
{
    private readonly L4HDbContext _context;
    private readonly ILogger<TranslationMonitoringService> _logger;

    public TranslationMonitoringService(
        L4HDbContext context,
        ILogger<TranslationMonitoringService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task TrackErrorsAsync(List<TranslationErrorDto> errors)
    {
        var entities = errors.Select(e => new TranslationError
        {
            Id = e.Id,
            Timestamp = e.Timestamp,
            Type = e.Type,
            Severity = e.Severity,
            Language = e.Language,
            Namespace = e.Namespace,
            Key = e.Key,
            Message = e.Message,
            Context = e.Context,
            UserAgent = e.UserAgent,
            Url = e.Url,
            Resolved = e.Resolved,
            StackTrace = e.StackTrace,
            Metadata = e.Metadata != null ? JsonSerializer.Serialize(e.Metadata) : null
        }).ToList();

        _context.TranslationErrors.AddRange(entities);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Tracked {Count} translation errors", errors.Count);
    }

    public async Task TrackPerformanceAsync(List<TranslationPerformanceDto> metrics)
    {
        var entities = metrics.Select(m => new TranslationPerformanceMetric
        {
            Id = m.Id,
            Timestamp = m.Timestamp,
            Type = m.Type,
            Language = m.Language,
            LoadTime = m.LoadTime,
            Success = m.Success,
            Metadata = m.Metadata != null ? JsonSerializer.Serialize(m.Metadata) : null
        }).ToList();

        _context.TranslationPerformanceMetrics.AddRange(entities);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Tracked {Count} performance metrics", metrics.Count);
    }

    public async Task TrackFeedbackAsync(List<UserFeedbackDto> feedback)
    {
        var entities = feedback.Select(f => new TranslationUserFeedback
        {
            Id = f.Id,
            Timestamp = f.Timestamp,
            Type = f.Type,
            Language = f.Language,
            Namespace = f.Namespace,
            Key = f.Key,
            Rating = f.Rating,
            Comment = f.Comment,
            UserAgent = f.UserAgent,
            Url = f.Url,
            Metadata = f.Metadata != null ? JsonSerializer.Serialize(f.Metadata) : null
        }).ToList();

        _context.TranslationUserFeedback.AddRange(entities);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Tracked {Count} user feedback items", feedback.Count);
    }

    public async Task<MonitoringDashboardDto> GetDashboardDataAsync(DateTime startDate, DateTime endDate, string? language = null)
    {
        var errorsQuery = _context.TranslationErrors
            .Where(e => e.Timestamp >= startDate && e.Timestamp <= endDate);
        
        var performanceQuery = _context.TranslationPerformanceMetrics
            .Where(p => p.Timestamp >= startDate && p.Timestamp <= endDate);
        
        var feedbackQuery = _context.TranslationUserFeedback
            .Where(f => f.Timestamp >= startDate && f.Timestamp <= endDate);

        if (!string.IsNullOrEmpty(language))
        {
            errorsQuery = errorsQuery.Where(e => e.Language == language);
            performanceQuery = performanceQuery.Where(p => p.Language == language);
            feedbackQuery = feedbackQuery.Where(f => f.Language == language);
        }

        // Error statistics
        var totalErrors = await errorsQuery.CountAsync();
        var errorsByLanguage = await errorsQuery
            .GroupBy(e => e.Language)
            .Select(g => new { Language = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Language, x => x.Count);
        
        var errorsByNamespace = await errorsQuery
            .GroupBy(e => e.Namespace)
            .Select(g => new { Namespace = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Namespace, x => x.Count);
        
        var errorsBySeverity = await errorsQuery
            .GroupBy(e => e.Severity)
            .Select(g => new { Severity = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Severity, x => x.Count);

        var recentErrorsRaw = await errorsQuery
            .OrderByDescending(e => e.Timestamp)
            .Take(10)
            .ToListAsync();

        var recentErrors = recentErrorsRaw.Select(e => new TranslationErrorDto
            {
                Id = e.Id,
                Timestamp = e.Timestamp,
                Type = e.Type,
                Severity = e.Severity,
                Language = e.Language,
                Namespace = e.Namespace,
                Key = e.Key,
                Message = e.Message,
                Context = e.Context,
                UserAgent = e.UserAgent,
                Url = e.Url,
                Resolved = e.Resolved,
                StackTrace = e.StackTrace,
                Metadata = e.Metadata != null ? JsonSerializer.Deserialize<Dictionary<string, object>>(e.Metadata) : null
            })
            .ToList();

        // Performance statistics
        var avgLoadTime = await performanceQuery.AverageAsync(p => (double?)p.LoadTime) ?? 0;
        var successfulLoads = await performanceQuery.CountAsync(p => p.Success);
        var totalLoads = await performanceQuery.CountAsync();
        var cacheHitRate = totalLoads > 0 ? (double)successfulLoads / totalLoads : 0;

        var languageSwitchMetrics = await performanceQuery
            .Where(p => p.Type == "language_switch")
            .AverageAsync(p => (double?)p.LoadTime) ?? 0;

        var performanceByLanguage = await performanceQuery
            .GroupBy(p => p.Language)
            .Select(g => new
            {
                Language = g.Key,
                LoadTime = g.Average(p => p.LoadTime),
                Success = g.Count(p => p.Success),
                Total = g.Count()
            })
            .ToDictionaryAsync(
                x => x.Language,
                x => new { LoadTime = x.LoadTime, Success = x.Success, Total = x.Total }
            );

        // Feedback statistics
        var totalFeedback = await feedbackQuery.CountAsync();
        var avgRating = await feedbackQuery.AverageAsync(f => (double?)f.Rating) ?? 0;

        var feedbackByLanguage = await feedbackQuery
            .Where(f => f.Rating.HasValue)
            .GroupBy(f => f.Language)
            .Select(g => new
            {
                Language = g.Key,
                Rating = g.Average(f => f.Rating!.Value),
                Count = g.Count()
            })
            .ToDictionaryAsync(
                x => x.Language,
                x => new { Rating = x.Rating, Count = x.Count }
            );

        var recentFeedbackRaw = await feedbackQuery
            .OrderByDescending(f => f.Timestamp)
            .Take(10)
            .ToListAsync();

        var recentFeedback = recentFeedbackRaw.Select(f => new UserFeedbackDto
            {
                Id = f.Id,
                Timestamp = f.Timestamp,
                Type = f.Type,
                Language = f.Language,
                Namespace = f.Namespace,
                Key = f.Key,
                Rating = f.Rating,
                Comment = f.Comment,
                UserAgent = f.UserAgent,
                Url = f.Url,
                Metadata = f.Metadata != null ? JsonSerializer.Deserialize<Dictionary<string, object>>(f.Metadata) : null
            })
            .ToList();

        // Health status
        var criticalErrors = await errorsQuery.CountAsync(e => e.Severity == "critical");
        var unresolvedErrors = await errorsQuery.CountAsync(e => !e.Resolved);
        
        var status = criticalErrors > 0 ? "critical" : 
                    unresolvedErrors > 10 ? "warning" : "healthy";

        var issues = new List<string>();
        if (criticalErrors > 0)
            issues.Add($"{criticalErrors} critical errors");
        if (unresolvedErrors > 10)
            issues.Add($"{unresolvedErrors} unresolved errors");

        return new MonitoringDashboardDto
        {
            Errors = new ErrorStatisticsDto
            {
                Total = totalErrors,
                ByLanguage = errorsByLanguage,
                ByNamespace = errorsByNamespace,
                BySeverity = errorsBySeverity,
                Recent = recentErrors
            },
            Performance = new PerformanceStatisticsDto
            {
                AverageLoadTime = avgLoadTime,
                CacheHitRate = cacheHitRate,
                LanguageSwitchTime = languageSwitchMetrics,
                ByLanguage = performanceByLanguage.ToDictionary(
                    kvp => kvp.Key,
                    kvp => new LanguagePerformanceDto
                    {
                        LoadTime = kvp.Value.LoadTime,
                        Success = kvp.Value.Success,
                        Total = kvp.Value.Total
                    }
                )
            },
            Feedback = new FeedbackStatisticsDto
            {
                Total = totalFeedback,
                AverageRating = avgRating,
                ByLanguage = feedbackByLanguage.ToDictionary(
                    kvp => kvp.Key,
                    kvp => new LanguageFeedbackDto
                    {
                        Rating = kvp.Value.Rating,
                        Count = kvp.Value.Count
                    }
                ),
                Recent = recentFeedback
            },
            Health = new MonitoringHealthDto
            {
                Status = status,
                Uptime = (DateTime.UtcNow - startDate).TotalHours,
                LastUpdate = DateTime.UtcNow,
                Issues = issues
            }
        };
    }

    public async Task<PagedResult<TranslationErrorDto>> GetErrorsAsync(
        int page, int pageSize, string? language = null, string? namespace_ = null, 
        string? severity = null, bool? resolved = null)
    {
        var query = _context.TranslationErrors.AsQueryable();

        if (!string.IsNullOrEmpty(language))
            query = query.Where(e => e.Language == language);
        
        if (!string.IsNullOrEmpty(namespace_))
            query = query.Where(e => e.Namespace == namespace_);
        
        if (!string.IsNullOrEmpty(severity))
            query = query.Where(e => e.Severity == severity);
        
        if (resolved.HasValue)
            query = query.Where(e => e.Resolved == resolved.Value);

        var total = await query.CountAsync();

        var errorsRaw = await query
            .OrderByDescending(e => e.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var errors = errorsRaw.Select(e => new TranslationErrorDto
            {
                Id = e.Id,
                Timestamp = e.Timestamp,
                Type = e.Type,
                Severity = e.Severity,
                Language = e.Language,
                Namespace = e.Namespace,
                Key = e.Key,
                Message = e.Message,
                Context = e.Context,
                UserAgent = e.UserAgent,
                Url = e.Url,
                Resolved = e.Resolved,
                StackTrace = e.StackTrace,
                Metadata = e.Metadata != null ? JsonSerializer.Deserialize<Dictionary<string, object>>(e.Metadata) : null
            })
            .ToList();

        return new PagedResult<TranslationErrorDto>
        {
            Items = errors,
            TotalCount = total,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling((double)total / pageSize)
        };
    }

    public async Task<bool> ResolveErrorAsync(string errorId)
    {
        var error = await _context.TranslationErrors.FindAsync(errorId);
        if (error == null) return false;

        error.Resolved = true;
        await _context.SaveChangesAsync();
        
        return true;
    }

    public async Task<List<TranslationPerformanceDto>> GetPerformanceMetricsAsync(
        DateTime startDate, DateTime endDate, string? language = null, string? type = null)
    {
        var query = _context.TranslationPerformanceMetrics
            .Where(p => p.Timestamp >= startDate && p.Timestamp <= endDate);

        if (!string.IsNullOrEmpty(language))
            query = query.Where(p => p.Language == language);
        
        if (!string.IsNullOrEmpty(type))
            query = query.Where(p => p.Type == type);

        var metricsRaw = await query
            .OrderByDescending(p => p.Timestamp)
            .ToListAsync();

        return metricsRaw.Select(p => new TranslationPerformanceDto
            {
                Id = p.Id,
                Timestamp = p.Timestamp,
                Type = p.Type,
                Language = p.Language,
                LoadTime = p.LoadTime,
                Success = p.Success,
                Metadata = p.Metadata != null ? JsonSerializer.Deserialize<Dictionary<string, object>>(p.Metadata) : null
            })
            .ToList();
    }

    public async Task<PagedResult<UserFeedbackDto>> GetFeedbackAsync(
        int page, int pageSize, string? language = null, string? type = null, int? minRating = null)
    {
        var query = _context.TranslationUserFeedback.AsQueryable();

        if (!string.IsNullOrEmpty(language))
            query = query.Where(f => f.Language == language);
        
        if (!string.IsNullOrEmpty(type))
            query = query.Where(f => f.Type == type);
        
        if (minRating.HasValue)
            query = query.Where(f => f.Rating >= minRating.Value);

        var total = await query.CountAsync();

        var feedbackRaw = await query
            .OrderByDescending(f => f.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var feedback = feedbackRaw.Select(f => new UserFeedbackDto
            {
                Id = f.Id,
                Timestamp = f.Timestamp,
                Type = f.Type,
                Language = f.Language,
                Namespace = f.Namespace,
                Key = f.Key,
                Rating = f.Rating,
                Comment = f.Comment,
                UserAgent = f.UserAgent,
                Url = f.Url,
                Metadata = f.Metadata != null ? JsonSerializer.Deserialize<Dictionary<string, object>>(f.Metadata) : null
            })
            .ToList();

        return new PagedResult<UserFeedbackDto>
        {
            Items = feedback,
            TotalCount = total,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling((double)total / pageSize)
        };
    }

    public async Task<MonitoringHealthDto> GetHealthStatusAsync()
    {
        var now = DateTime.UtcNow;
        var last24Hours = now.AddDays(-1);

        var criticalErrors = await _context.TranslationErrors
            .CountAsync(e => e.Timestamp >= last24Hours && e.Severity == "critical");
        
        var unresolvedErrors = await _context.TranslationErrors
            .CountAsync(e => e.Timestamp >= last24Hours && !e.Resolved);

        var avgLoadTime = await _context.TranslationPerformanceMetrics
            .Where(p => p.Timestamp >= last24Hours)
            .AverageAsync(p => (double?)p.LoadTime) ?? 0;

        var status = criticalErrors > 0 ? "critical" : 
                    unresolvedErrors > 10 || avgLoadTime > 5000 ? "warning" : "healthy";

        var issues = new List<string>();
        if (criticalErrors > 0)
            issues.Add($"{criticalErrors} critical errors in last 24h");
        if (unresolvedErrors > 10)
            issues.Add($"{unresolvedErrors} unresolved errors in last 24h");
        if (avgLoadTime > 5000)
            issues.Add($"High average load time: {avgLoadTime:F0}ms");

        return new MonitoringHealthDto
        {
            Status = status,
            Uptime = (now - DateTime.UtcNow.Date).TotalHours,
            LastUpdate = now,
            Issues = issues
        };
    }

    public async Task<List<MonitoringAlertDto>> GetAlertsAsync(bool? acknowledged = null, string? severity = null)
    {
        var query = _context.MonitoringAlerts.AsQueryable();

        if (acknowledged.HasValue)
            query = query.Where(a => a.Acknowledged == acknowledged.Value);
        
        if (!string.IsNullOrEmpty(severity))
            query = query.Where(a => a.Severity == severity);

        var alertsRaw = await query
            .OrderByDescending(a => a.Timestamp)
            .ToListAsync();

        return alertsRaw.Select(a => new MonitoringAlertDto
            {
                Id = a.Id,
                RuleId = a.RuleId,
                Timestamp = a.Timestamp,
                Severity = a.Severity,
                Message = a.Message,
                Data = a.Data != null ? JsonSerializer.Deserialize<Dictionary<string, object>>(a.Data) : null,
                Acknowledged = a.Acknowledged,
                ResolvedAt = a.ResolvedAt
            })
            .ToList();
    }

    public async Task<bool> AcknowledgeAlertAsync(string alertId)
    {
        var alert = await _context.MonitoringAlerts.FindAsync(alertId);
        if (alert == null) return false;

        alert.Acknowledged = true;
        await _context.SaveChangesAsync();
        
        return true;
    }

    public async Task ProcessAlertsAsync()
    {
        // This would contain alert processing logic
        // For now, just log that it's running
        _logger.LogInformation("Processing translation monitoring alerts");
        
        // TODO: Implement alert rules processing
        // - Check error rates
        // - Check performance thresholds
        // - Check feedback ratings
        // - Send notifications if thresholds are exceeded
    }
}