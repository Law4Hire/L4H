using L4H.Shared.Models;

namespace L4H.Infrastructure.Services;

public interface ITranslationMonitoringService
{
    Task TrackErrorsAsync(List<TranslationErrorDto> errors);
    Task TrackPerformanceAsync(List<TranslationPerformanceDto> metrics);
    Task TrackFeedbackAsync(List<UserFeedbackDto> feedback);
    
    Task<MonitoringDashboardDto> GetDashboardDataAsync(DateTime startDate, DateTime endDate, string? language = null);
    Task<PagedResult<TranslationErrorDto>> GetErrorsAsync(int page, int pageSize, string? language = null, string? namespace_ = null, string? severity = null, bool? resolved = null);
    Task<bool> ResolveErrorAsync(string errorId);
    
    Task<List<TranslationPerformanceDto>> GetPerformanceMetricsAsync(DateTime startDate, DateTime endDate, string? language = null, string? type = null);
    Task<PagedResult<UserFeedbackDto>> GetFeedbackAsync(int page, int pageSize, string? language = null, string? type = null, int? minRating = null);
    
    Task<MonitoringHealthDto> GetHealthStatusAsync();
    Task<List<MonitoringAlertDto>> GetAlertsAsync(bool? acknowledged = null, string? severity = null);
    Task<bool> AcknowledgeAlertAsync(string alertId);
    
    Task ProcessAlertsAsync();
}