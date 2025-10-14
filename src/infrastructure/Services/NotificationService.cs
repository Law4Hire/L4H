using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using System.Text.RegularExpressions;

namespace L4H.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly L4HDbContext _context;
    private readonly IMailService _mailService;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(L4HDbContext context, IMailService mailService, ILogger<NotificationService> logger)
    {
        _context = context;
        _mailService = mailService;
        _logger = logger;
    }

    public async Task<Notification> CreateNotificationAsync(int userId, NotificationType type, string title, string message,
        NotificationPriority priority = NotificationPriority.Normal, string? actionUrl = null,
        string? relatedEntityType = null, int? relatedEntityId = null, DateTime? expiresAt = null)
    {
        try
        {
            // Check user preferences
            var preferences = await GetUserPreferencesAsync(userId);
            var typePreference = preferences.FirstOrDefault(p => p.NotificationType == type);
            
            // If user has disabled this notification type or priority is below minimum, skip
            if (typePreference != null && (!typePreference.InAppEnabled || priority < typePreference.MinimumPriority))
            {
                _logger.LogDebug("Notification skipped for user {UserId} due to preferences", userId);
                return null!;
            }

            var notification = new Notification
            {
                UserId = userId,
                Type = type,
                Title = title,
                Message = message,
                Priority = priority,
                ActionUrl = actionUrl,
                RelatedEntityType = relatedEntityType,
                RelatedEntityId = relatedEntityId,
                ExpiresAt = expiresAt,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            // Queue email notification if enabled
            if (typePreference?.EmailEnabled != false)
            {
                await QueueEmailNotificationAsync(notification);
            }

            _logger.LogInformation("Notification created for user {UserId}: {Title}", userId, title);
            return notification;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating notification for user {UserId}", userId);
            throw;
        }
    }

    public async Task<List<Notification>> GetUserNotificationsAsync(int userId, bool unreadOnly = false, int skip = 0, int take = 50)
    {
        try
        {
            var query = _context.Notifications
                .Where(n => n.UserId == userId && (n.ExpiresAt == null || n.ExpiresAt > DateTime.UtcNow));

            if (unreadOnly)
            {
                query = query.Where(n => !n.IsRead);
            }

            return await query
                .OrderByDescending(n => n.CreatedAt)
                .Skip(skip)
                .Take(take)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notifications for user {UserId}", userId);
            throw;
        }
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        try
        {
            return await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead && 
                           (n.ExpiresAt == null || n.ExpiresAt > DateTime.UtcNow));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unread count for user {UserId}", userId);
            throw;
        }
    }

    public async Task MarkAsReadAsync(int notificationId, int userId)
    {
        try
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification != null && !notification.IsRead)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                
                _logger.LogDebug("Notification {NotificationId} marked as read for user {UserId}", notificationId, userId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notification {NotificationId} as read for user {UserId}", notificationId, userId);
            throw;
        }
    }

    public async Task MarkAllAsReadAsync(int userId)
    {
        try
        {
            var unreadNotifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("All notifications marked as read for user {UserId}", userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking all notifications as read for user {UserId}", userId);
            throw;
        }
    }

    public async Task DeleteNotificationAsync(int notificationId, int userId)
    {
        try
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification != null)
            {
                _context.Notifications.Remove(notification);
                await _context.SaveChangesAsync();
                
                _logger.LogDebug("Notification {NotificationId} deleted for user {UserId}", notificationId, userId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting notification {NotificationId} for user {UserId}", notificationId, userId);
            throw;
        }
    }

    // Template-based notification methods
    public async Task SendClientAssignmentNotificationAsync(int attorneyId, int clientId, string clientName)
    {
        try
        {
            var template = await GetTemplateAsync(NotificationType.ClientAssignment);
            if (template == null)
            {
                await CreateNotificationAsync(attorneyId, NotificationType.ClientAssignment,
                    "New Client Assignment",
                    $"You have been assigned a new client: {clientName}",
                    NotificationPriority.High,
                    $"/clients/{clientId}",
                    "Client",
                    clientId);
                return;
            }

            var title = ReplaceTokens(template.SubjectTemplate, new Dictionary<string, string>
            {
                { "ClientName", clientName }
            });

            var message = ReplaceTokens(template.BodyTemplate, new Dictionary<string, string>
            {
                { "ClientName", clientName }
            });

            await CreateNotificationAsync(attorneyId, NotificationType.ClientAssignment,
                title, message, NotificationPriority.High,
                $"/clients/{clientId}", "Client", clientId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending client assignment notification to attorney {AttorneyId}", attorneyId);
            throw;
        }
    }

    public async Task SendCaseStatusChangeNotificationAsync(int userId, int caseId, string caseName, string oldStatus, string newStatus)
    {
        try
        {
            var template = await GetTemplateAsync(NotificationType.CaseStatusChange);
            var tokens = new Dictionary<string, string>
            {
                { "CaseName", caseName },
                { "OldStatus", oldStatus },
                { "NewStatus", newStatus }
            };

            var title = template != null ? ReplaceTokens(template.SubjectTemplate, tokens) : 
                $"Case Status Updated: {caseName}";

            var message = template != null ? ReplaceTokens(template.BodyTemplate, tokens) :
                $"Case '{caseName}' status changed from {oldStatus} to {newStatus}";

            await CreateNotificationAsync(userId, NotificationType.CaseStatusChange,
                title, message, NotificationPriority.Normal,
                $"/cases/{caseId}", "Case", caseId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending case status change notification for case {CaseId}", caseId);
            throw;
        }
    }

    public async Task SendBillingThresholdWarningAsync(int attorneyId, decimal currentAmount, decimal threshold, string period)
    {
        try
        {
            var template = await GetTemplateAsync(NotificationType.BillingThreshold);
            var tokens = new Dictionary<string, string>
            {
                { "CurrentAmount", currentAmount.ToString("C") },
                { "Threshold", threshold.ToString("C") },
                { "Period", period }
            };

            var title = template != null ? ReplaceTokens(template.SubjectTemplate, tokens) :
                "Billing Threshold Warning";

            var message = template != null ? ReplaceTokens(template.BodyTemplate, tokens) :
                $"Your billing for {period} has reached {currentAmount:C}, approaching the threshold of {threshold:C}";

            await CreateNotificationAsync(attorneyId, NotificationType.BillingThreshold,
                title, message, NotificationPriority.High,
                "/billing", "Billing", null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending billing threshold warning to attorney {AttorneyId}", attorneyId);
            throw;
        }
    }

    public async Task SendDeadlineReminderAsync(int userId, string taskName, DateTime deadline, string? actionUrl = null)
    {
        try
        {
            var template = await GetTemplateAsync(NotificationType.DeadlineReminder);
            var tokens = new Dictionary<string, string>
            {
                { "TaskName", taskName },
                { "Deadline", deadline.ToString("MMM dd, yyyy") },
                { "DaysUntil", (deadline.Date - DateTime.UtcNow.Date).Days.ToString() }
            };

            var title = template != null ? ReplaceTokens(template.SubjectTemplate, tokens) :
                $"Deadline Reminder: {taskName}";

            var message = template != null ? ReplaceTokens(template.BodyTemplate, tokens) :
                $"Reminder: '{taskName}' is due on {deadline:MMM dd, yyyy}";

            var priority = deadline.Date <= DateTime.UtcNow.Date.AddDays(1) ? 
                NotificationPriority.Critical : NotificationPriority.High;

            await CreateNotificationAsync(userId, NotificationType.DeadlineReminder,
                title, message, priority, actionUrl, "Task", null, deadline.AddDays(1));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending deadline reminder to user {UserId}", userId);
            throw;
        }
    }

    public async Task SendDocumentUploadNotificationAsync(int attorneyId, int clientId, string clientName, string documentName)
    {
        try
        {
            var template = await GetTemplateAsync(NotificationType.DocumentUpload);
            var tokens = new Dictionary<string, string>
            {
                { "ClientName", clientName },
                { "DocumentName", documentName }
            };

            var title = template != null ? ReplaceTokens(template.SubjectTemplate, tokens) :
                "New Document Uploaded";

            var message = template != null ? ReplaceTokens(template.BodyTemplate, tokens) :
                $"New document '{documentName}' uploaded by {clientName}";

            await CreateNotificationAsync(attorneyId, NotificationType.DocumentUpload,
                title, message, NotificationPriority.Normal,
                $"/clients/{clientId}/documents", "Document", null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending document upload notification to attorney {AttorneyId}", attorneyId);
            throw;
        }
    }

    public async Task SendTimeEntryReminderAsync(int attorneyId, string message)
    {
        try
        {
            var template = await GetTemplateAsync(NotificationType.TimeEntryReminder);
            var title = template != null ? template.SubjectTemplate : "Time Entry Reminder";
            var body = template != null ? ReplaceTokens(template.BodyTemplate, new Dictionary<string, string>
            {
                { "Message", message }
            }) : message;

            await CreateNotificationAsync(attorneyId, NotificationType.TimeEntryReminder,
                title, body, NotificationPriority.Normal, "/time-tracking", "TimeEntry", null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending time entry reminder to attorney {AttorneyId}", attorneyId);
            throw;
        }
    }

    // User preferences methods
    public async Task<List<UserNotificationPreference>> GetUserPreferencesAsync(int userId)
    {
        try
        {
            var preferences = await _context.UserNotificationPreferences
                .Where(p => p.UserId == userId)
                .ToListAsync();

            // Create default preferences for missing notification types
            var existingTypes = preferences.Select(p => p.NotificationType).ToHashSet();
            var allTypes = Enum.GetValues<NotificationType>();
            
            foreach (var type in allTypes)
            {
                if (!existingTypes.Contains(type))
                {
                    var defaultPreference = new UserNotificationPreference
                    {
                        UserId = userId,
                        NotificationType = type,
                        InAppEnabled = true,
                        EmailEnabled = true,
                        MinimumPriority = NotificationPriority.Normal
                    };
                    
                    _context.UserNotificationPreferences.Add(defaultPreference);
                    preferences.Add(defaultPreference);
                }
            }

            if (preferences.Count > existingTypes.Count)
            {
                await _context.SaveChangesAsync();
            }

            return preferences;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user preferences for user {UserId}", userId);
            throw;
        }
    }

    public async Task UpdateUserPreferenceAsync(int userId, NotificationType type, bool inAppEnabled, bool emailEnabled,
        NotificationPriority minimumPriority)
    {
        try
        {
            var preference = await _context.UserNotificationPreferences
                .FirstOrDefaultAsync(p => p.UserId == userId && p.NotificationType == type);

            if (preference == null)
            {
                preference = new UserNotificationPreference
                {
                    UserId = userId,
                    NotificationType = type
                };
                _context.UserNotificationPreferences.Add(preference);
            }

            preference.InAppEnabled = inAppEnabled;
            preference.EmailEnabled = emailEnabled;
            preference.MinimumPriority = minimumPriority;
            preference.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            _logger.LogDebug("Updated notification preference for user {UserId}, type {Type}", userId, type);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user preference for user {UserId}", userId);
            throw;
        }
    }

    // Template management methods
    public async Task<List<NotificationTemplate>> GetTemplatesAsync()
    {
        try
        {
            return await _context.NotificationTemplates
                .Where(t => t.IsActive)
                .OrderBy(t => t.Type)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notification templates");
            throw;
        }
    }

    public async Task<NotificationTemplate?> GetTemplateAsync(NotificationType type)
    {
        try
        {
            return await _context.NotificationTemplates
                .FirstOrDefaultAsync(t => t.Type == type && t.IsActive);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notification template for type {Type}", type);
            throw;
        }
    }

    public async Task UpdateTemplateAsync(int templateId, string subjectTemplate, string bodyTemplate, string? emailBodyTemplate)
    {
        try
        {
            var template = await _context.NotificationTemplates.FindAsync(templateId);
            if (template == null)
            {
                throw new ArgumentException($"Template with ID {templateId} not found");
            }

            template.SubjectTemplate = subjectTemplate;
            template.BodyTemplate = bodyTemplate;
            template.EmailBodyTemplate = emailBodyTemplate;
            template.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            _logger.LogInformation("Updated notification template {TemplateId}", templateId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating notification template {TemplateId}", templateId);
            throw;
        }
    }

    // Cleanup and maintenance methods
    public async Task CleanupExpiredNotificationsAsync()
    {
        try
        {
            var expiredNotifications = await _context.Notifications
                .Where(n => n.ExpiresAt != null && n.ExpiresAt < DateTime.UtcNow)
                .ToListAsync();

            if (expiredNotifications.Any())
            {
                _context.Notifications.RemoveRange(expiredNotifications);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Cleaned up {Count} expired notifications", expiredNotifications.Count);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cleaning up expired notifications");
            throw;
        }
    }

    public async Task ProcessPendingEmailNotificationsAsync()
    {
        try
        {
            var pendingNotifications = await _context.Notifications
                .Include(n => n.User)
                .Where(n => !n.IsEmailSent && n.CreatedAt > DateTime.UtcNow.AddHours(-24))
                .OrderBy(n => n.CreatedAt)
                .Take(50) // Process in batches
                .ToListAsync();

            foreach (var notification in pendingNotifications)
            {
                try
                {
                    // Check if user has email notifications enabled for this type
                    var preference = await _context.UserNotificationPreferences
                        .FirstOrDefaultAsync(p => p.UserId == notification.UserId && 
                                           p.NotificationType == notification.Type);

                    if (preference?.EmailEnabled == false)
                    {
                        notification.IsEmailSent = true; // Mark as sent to avoid reprocessing
                        continue;
                    }

                    // Get email template
                    var template = await GetTemplateAsync(notification.Type);
                    var emailBody = template?.EmailBodyTemplate ?? notification.Message;

                    await _mailService.SendEmailAsync(
                        notification.User.Email,
                        notification.Title,
                        emailBody
                    );

                    notification.IsEmailSent = true;
                    notification.EmailSentAt = DateTime.UtcNow;
                }
                catch (Exception emailEx)
                {
                    _logger.LogError(emailEx, "Failed to send email notification {NotificationId}", notification.Id);
                    // Don't mark as sent so it can be retried
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogDebug("Processed {Count} pending email notifications", pendingNotifications.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing pending email notifications");
            throw;
        }
    }

    // Helper methods
    private async Task QueueEmailNotificationAsync(Notification notification)
    {
        // Email will be processed by ProcessPendingEmailNotificationsAsync
        // This method is for future enhancement if we want immediate email sending
        await Task.CompletedTask;
    }

    private static string ReplaceTokens(string template, Dictionary<string, string> tokens)
    {
        var result = template;
        foreach (var token in tokens)
        {
            result = Regex.Replace(result, $@"\{{{token.Key}\}}", token.Value, RegexOptions.IgnoreCase);
        }
        return result;
    }
}