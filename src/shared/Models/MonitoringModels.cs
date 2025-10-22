using System.ComponentModel.DataAnnotations;

namespace L4H.Shared.Models;

public class TranslationErrorDto
{
    public string Id { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
    public string Namespace { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Context { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public bool Resolved { get; set; }
    public string? StackTrace { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}

public class TranslationPerformanceDto
{
    public string Id { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
    public double LoadTime { get; set; }
    public bool Success { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}

public class UserFeedbackDto
{
    public string Id { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
    public string? Namespace { get; set; }
    public string? Key { get; set; }
    public int? Rating { get; set; }
    public string? Comment { get; set; }
    public string UserAgent { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public Dictionary<string, object>? Metadata { get; set; }
}

public class MonitoringDashboardDto
{
    public ErrorStatisticsDto Errors { get; set; } = new();
    public PerformanceStatisticsDto Performance { get; set; } = new();
    public FeedbackStatisticsDto Feedback { get; set; } = new();
    public MonitoringHealthDto Health { get; set; } = new();
}

public class ErrorStatisticsDto
{
    public int Total { get; set; }
    public Dictionary<string, int> ByLanguage { get; set; } = new();
    public Dictionary<string, int> ByNamespace { get; set; } = new();
    public Dictionary<string, int> BySeverity { get; set; } = new();
    public List<TranslationErrorDto> Recent { get; set; } = new();
}

public class PerformanceStatisticsDto
{
    public double AverageLoadTime { get; set; }
    public double CacheHitRate { get; set; }
    public double LanguageSwitchTime { get; set; }
    public Dictionary<string, LanguagePerformanceDto> ByLanguage { get; set; } = new();
}

public class LanguagePerformanceDto
{
    public double LoadTime { get; set; }
    public int Success { get; set; }
    public int Total { get; set; }
}

public class FeedbackStatisticsDto
{
    public int Total { get; set; }
    public double AverageRating { get; set; }
    public Dictionary<string, LanguageFeedbackDto> ByLanguage { get; set; } = new();
    public List<UserFeedbackDto> Recent { get; set; } = new();
}

public class LanguageFeedbackDto
{
    public double Rating { get; set; }
    public int Count { get; set; }
}

public class MonitoringHealthDto
{
    public string Status { get; set; } = "unknown";
    public double Uptime { get; set; }
    public DateTime LastUpdate { get; set; }
    public List<string> Issues { get; set; } = new();
}

public class MonitoringAlertDto
{
    public string Id { get; set; } = string.Empty;
    public string RuleId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string Severity { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public Dictionary<string, object>? Data { get; set; }
    public bool Acknowledged { get; set; }
    public DateTime? ResolvedAt { get; set; }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}