using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using L4H.Infrastructure.Services;
using L4H.Infrastructure.Entities;
using L4H.Api.Authorization;
using System.Security.Claims;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(INotificationService notificationService, ILogger<NotificationsController> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    /// <summary>
    /// Get notifications for the current user
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<Notification>>> GetNotifications(
        [FromQuery] bool unreadOnly = false,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50)
    {
        try
        {
            var userId = GetCurrentUserId();
            var notifications = await _notificationService.GetUserNotificationsAsync(userId, unreadOnly, skip, take);
            return Ok(notifications);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notifications for user");
            return StatusCode(500, "An error occurred while retrieving notifications");
        }
    }

    /// <summary>
    /// Get unread notification count for the current user
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<ActionResult<int>> GetUnreadCount()
    {
        try
        {
            var userId = GetCurrentUserId();
            var count = await _notificationService.GetUnreadCountAsync(userId);
            return Ok(count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unread count for user");
            return StatusCode(500, "An error occurred while retrieving unread count");
        }
    }

    /// <summary>
    /// Mark a notification as read
    /// </summary>
    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _notificationService.MarkAsReadAsync(id, userId);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notification {NotificationId} as read", id);
            return StatusCode(500, "An error occurred while marking notification as read");
        }
    }

    /// <summary>
    /// Mark all notifications as read for the current user
    /// </summary>
    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        try
        {
            var userId = GetCurrentUserId();
            await _notificationService.MarkAllAsReadAsync(userId);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking all notifications as read for user");
            return StatusCode(500, "An error occurred while marking all notifications as read");
        }
    }

    /// <summary>
    /// Delete a notification
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNotification(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _notificationService.DeleteNotificationAsync(id, userId);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting notification {NotificationId}", id);
            return StatusCode(500, "An error occurred while deleting notification");
        }
    }

    /// <summary>
    /// Get user notification preferences
    /// </summary>
    [HttpGet("preferences")]
    public async Task<ActionResult<List<UserNotificationPreference>>> GetPreferences()
    {
        try
        {
            var userId = GetCurrentUserId();
            var preferences = await _notificationService.GetUserPreferencesAsync(userId);
            return Ok(preferences);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notification preferences for user");
            return StatusCode(500, "An error occurred while retrieving notification preferences");
        }
    }

    /// <summary>
    /// Update user notification preference
    /// </summary>
    [HttpPut("preferences")]
    public async Task<IActionResult> UpdatePreference([FromBody] UpdateNotificationPreferenceRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _notificationService.UpdateUserPreferenceAsync(
                userId, 
                request.Type, 
                request.InAppEnabled, 
                request.EmailEnabled, 
                request.MinimumPriority);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating notification preference for user");
            return StatusCode(500, "An error occurred while updating notification preference");
        }
    }

    /// <summary>
    /// Get notification templates (admin only)
    /// </summary>
    [HttpGet("templates")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<List<NotificationTemplate>>> GetTemplates()
    {
        try
        {
            var templates = await _notificationService.GetTemplatesAsync();
            return Ok(templates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notification templates");
            return StatusCode(500, "An error occurred while retrieving notification templates");
        }
    }

    /// <summary>
    /// Update notification template (admin only)
    /// </summary>
    [HttpPut("templates/{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UpdateTemplate(int id, [FromBody] UpdateNotificationTemplateRequest request)
    {
        try
        {
            await _notificationService.UpdateTemplateAsync(
                id, 
                request.SubjectTemplate, 
                request.BodyTemplate, 
                request.EmailBodyTemplate);
            return Ok();
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating notification template {TemplateId}", id);
            return StatusCode(500, "An error occurred while updating notification template");
        }
    }

    /// <summary>
    /// Send a test notification (admin only)
    /// </summary>
    [HttpPost("test")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> SendTestNotification([FromBody] SendTestNotificationRequest request)
    {
        try
        {
            await _notificationService.CreateNotificationAsync(
                request.UserId,
                NotificationType.SystemAlert,
                request.Title,
                request.Message,
                request.Priority);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending test notification");
            return StatusCode(500, "An error occurred while sending test notification");
        }
    }

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            throw new UnauthorizedAccessException("User ID not found in token");
        }
        return userId;
    }
}

// Request DTOs
public class UpdateNotificationPreferenceRequest
{
    public NotificationType Type { get; set; }
    public bool InAppEnabled { get; set; }
    public bool EmailEnabled { get; set; }
    public NotificationPriority MinimumPriority { get; set; }
}

public class UpdateNotificationTemplateRequest
{
    public string SubjectTemplate { get; set; } = string.Empty;
    public string BodyTemplate { get; set; } = string.Empty;
    public string? EmailBodyTemplate { get; set; }
}

public class SendTestNotificationRequest
{
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;
}