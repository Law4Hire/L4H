using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using L4H.Infrastructure.Services;
using L4H.Shared.Models;
using System.ComponentModel.DataAnnotations;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/monitoring")]
public class TranslationMonitoringController : ControllerBase
{
    private readonly ITranslationMonitoringService _monitoringService;
    private readonly ILogger<TranslationMonitoringController> _logger;

    public TranslationMonitoringController(
        ITranslationMonitoringService monitoringService,
        ILogger<TranslationMonitoringController> logger)
    {
        _monitoringService = monitoringService;
        _logger = logger;
    }

    /// <summary>
    /// Track translation errors
    /// </summary>
    [HttpPost("errors")]
    public async Task<IActionResult> TrackErrors([FromBody] List<TranslationErrorDto> errors)
    {
        try
        {
            if (errors == null || !errors.Any())
            {
                return BadRequest("No errors provided");
            }

            await _monitoringService.TrackErrorsAsync(errors);
            
            _logger.LogInformation("Tracked {Count} translation errors", errors.Count);
            
            return Ok(new { message = "Errors tracked successfully", count = errors.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to track translation errors");
            return StatusCode(500, "Failed to track errors");
        }
    }

    /// <summary>
    /// Track performance metrics
    /// </summary>
    [HttpPost("performance")]
    public async Task<IActionResult> TrackPerformance([FromBody] List<TranslationPerformanceDto> metrics)
    {
        try
        {
            if (metrics == null || !metrics.Any())
            {
                return BadRequest("No metrics provided");
            }

            await _monitoringService.TrackPerformanceAsync(metrics);
            
            _logger.LogInformation("Tracked {Count} performance metrics", metrics.Count);
            
            return Ok(new { message = "Performance metrics tracked successfully", count = metrics.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to track performance metrics");
            return StatusCode(500, "Failed to track performance metrics");
        }
    }

    /// <summary>
    /// Track user feedback
    /// </summary>
    [HttpPost("feedback")]
    public async Task<IActionResult> TrackFeedback([FromBody] List<UserFeedbackDto> feedback)
    {
        try
        {
            if (feedback == null || !feedback.Any())
            {
                return BadRequest("No feedback provided");
            }

            await _monitoringService.TrackFeedbackAsync(feedback);
            
            _logger.LogInformation("Tracked {Count} user feedback items", feedback.Count);
            
            return Ok(new { message = "Feedback tracked successfully", count = feedback.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to track user feedback");
            return StatusCode(500, "Failed to track feedback");
        }
    }

    /// <summary>
    /// Get monitoring dashboard data
    /// </summary>
    [HttpGet("dashboard")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetDashboardData(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] string? language = null)
    {
        try
        {
            var start = startDate ?? DateTime.UtcNow.AddDays(-7);
            var end = endDate ?? DateTime.UtcNow;

            var dashboardData = await _monitoringService.GetDashboardDataAsync(start, end, language);
            
            return Ok(dashboardData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get dashboard data");
            return StatusCode(500, "Failed to get dashboard data");
        }
    }

    /// <summary>
    /// Get translation errors
    /// </summary>
    [HttpGet("errors")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetErrors(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? language = null,
        [FromQuery] string? namespace_ = null,
        [FromQuery] string? severity = null,
        [FromQuery] bool? resolved = null)
    {
        try
        {
            var errors = await _monitoringService.GetErrorsAsync(
                page, pageSize, language, namespace_, severity, resolved);
            
            return Ok(errors);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get translation errors");
            return StatusCode(500, "Failed to get errors");
        }
    }

    /// <summary>
    /// Mark error as resolved
    /// </summary>
    [HttpPatch("errors/{errorId}/resolve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ResolveError(string errorId)
    {
        try
        {
            var success = await _monitoringService.ResolveErrorAsync(errorId);
            
            if (!success)
            {
                return NotFound("Error not found");
            }
            
            return Ok(new { message = "Error marked as resolved" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to resolve error {ErrorId}", errorId);
            return StatusCode(500, "Failed to resolve error");
        }
    }

    /// <summary>
    /// Get performance metrics
    /// </summary>
    [HttpGet("performance")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetPerformanceMetrics(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] string? language = null,
        [FromQuery] string? type = null)
    {
        try
        {
            var start = startDate ?? DateTime.UtcNow.AddDays(-7);
            var end = endDate ?? DateTime.UtcNow;

            var metrics = await _monitoringService.GetPerformanceMetricsAsync(start, end, language, type);
            
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get performance metrics");
            return StatusCode(500, "Failed to get performance metrics");
        }
    }

    /// <summary>
    /// Get user feedback
    /// </summary>
    [HttpGet("feedback")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetFeedback(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? language = null,
        [FromQuery] string? type = null,
        [FromQuery] int? minRating = null)
    {
        try
        {
            var feedback = await _monitoringService.GetFeedbackAsync(
                page, pageSize, language, type, minRating);
            
            return Ok(feedback);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get user feedback");
            return StatusCode(500, "Failed to get feedback");
        }
    }

    /// <summary>
    /// Get monitoring health status
    /// </summary>
    [HttpGet("health")]
    public async Task<IActionResult> GetHealthStatus()
    {
        try
        {
            var health = await _monitoringService.GetHealthStatusAsync();
            
            return Ok(health);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get health status");
            return StatusCode(500, "Failed to get health status");
        }
    }

    /// <summary>
    /// Get alerts
    /// </summary>
    [HttpGet("alerts")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAlerts(
        [FromQuery] bool? acknowledged = null,
        [FromQuery] string? severity = null)
    {
        try
        {
            var alerts = await _monitoringService.GetAlertsAsync(acknowledged, severity);
            
            return Ok(alerts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get alerts");
            return StatusCode(500, "Failed to get alerts");
        }
    }

    /// <summary>
    /// Acknowledge alert
    /// </summary>
    [HttpPatch("alerts/{alertId}/acknowledge")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AcknowledgeAlert(string alertId)
    {
        try
        {
            var success = await _monitoringService.AcknowledgeAlertAsync(alertId);
            
            if (!success)
            {
                return NotFound("Alert not found");
            }
            
            return Ok(new { message = "Alert acknowledged" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to acknowledge alert {AlertId}", alertId);
            return StatusCode(500, "Failed to acknowledge alert");
        }
    }
}