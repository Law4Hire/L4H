using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using L4H.Infrastructure.Services;
using L4H.Infrastructure.Entities;
using L4H.Api.Authorization;
using L4H.Shared.Models;
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
        var userId = GetCurrentUserId();
        var notifications = await _notificationService.GetUserNotificationsAsync(userId, unreadOnly, skip, take);
        return Ok(notifications);
    }

    /// <summary>
    /// Get unread notification count for the current user
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<ActionResult<int>> GetUnreadCount()
    {
        var userId = GetCurrentUserId();
        var count = await _notificationService.GetUnreadCountAsync(userId);
        return Ok(count);
    }

    /// <summary>
    /// Mark a notification as read
    /// </summary>
    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var userId = GetCurrentUserId();
        await _notificationService.MarkAsReadAsync(id, userId);
        return Ok();
    }

    /// <summary>
    /// Mark all notifications as read for the current user
    /// </summary>
    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = GetCurrentUserId();
        await _notificationService.MarkAllAsReadAsync(userId);
        return Ok();
    }

    /// <summary>
    /// Delete a notification
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteNotification(int id)
    {
        var userId = GetCurrentUserId();
        await _notificationService.DeleteNotificationAsync(id, userId);
        return Ok();
    }

    /// <summary>
    /// Get user notification preferences
    /// </summary>
    [HttpGet("preferences")]
    public async Task<ActionResult<List<UserNotificationPreference>>> GetPreferences()
    {
        var userId = GetCurrentUserId();
        var preferences = await _notificationService.GetUserPreferencesAsync(userId);
        return Ok(preferences);
    }

    /// <summary>
    /// Update user notification preference
    /// </summary>
    [HttpPut("preferences")]
    public async Task<IActionResult> UpdatePreference([FromBody] UpdateNotificationPreferenceRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        var userId = GetCurrentUserId();
        await _notificationService.UpdateUserPreferenceAsync(
            userId, 
            request.Type, 
            request.InAppEnabled, 
            request.EmailEnabled, 
            request.MinimumPriority);
        return Ok();
    }

    /// <summary>
    /// Get notification templates (admin only)
    /// </summary>
    [HttpGet("templates")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<List<NotificationTemplate>>> GetTemplates()
    {
        var templates = await _notificationService.GetTemplatesAsync();
        return Ok(templates);
    }

    /// <summary>
    /// Update notification template (admin only)
    /// </summary>
    [HttpPut("templates/{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UpdateTemplate(int id, [FromBody] UpdateNotificationTemplateRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        await _notificationService.UpdateTemplateAsync(
            id, 
            request.SubjectTemplate, 
            request.BodyTemplate, 
            request.EmailBodyTemplate);
        return Ok();
    }

    /// <summary>
    /// Send a test notification (admin only)
    /// </summary>
    [HttpPost("test")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> SendTestNotification([FromBody] SendTestNotificationRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        await _notificationService.CreateNotificationAsync(
            new UserId(request.UserId),
            NotificationType.SystemAlert,
            request.Title,
            request.Message,
            request.Priority);
        return Ok();
    }

    private UserId GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
        {
            throw new UnauthorizedAccessException("User ID not found in token or invalid");
        }
        return new UserId(userId);
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
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;
}