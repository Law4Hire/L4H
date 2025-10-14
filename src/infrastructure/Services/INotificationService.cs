using L4H.Infrastructure.Entities;

namespace L4H.Infrastructure.Services;

public interface INotificationService
{
    // Core notification methods
    Task<Notification> CreateNotificationAsync(int userId, NotificationType type, string title, string message, 
        NotificationPriority priority = NotificationPriority.Normal, string? actionUrl = null, 
        string? relatedEntityType = null, int? relatedEntityId = null, DateTime? expiresAt = null);
    
    Task<List<Notification>> GetUserNotificationsAsync(int userId, bool unreadOnly = false, int skip = 0, int take = 50);
    
    Task<int> GetUnreadCountAsync(int userId);
    
    Task MarkAsReadAsync(int notificationId, int userId);
    
    Task MarkAllAsReadAsync(int userId);
    
    Task DeleteNotificationAsync(int notificationId, int userId);
    
    // Template-based notifications
    Task SendClientAssignmentNotificationAsync(int attorneyId, int clientId, string clientName);
    
    Task SendCaseStatusChangeNotificationAsync(int userId, int caseId, string caseName, string oldStatus, string newStatus);
    
    Task SendBillingThresholdWarningAsync(int attorneyId, decimal currentAmount, decimal threshold, string period);
    
    Task SendDeadlineReminderAsync(int userId, string taskName, DateTime deadline, string? actionUrl = null);
    
    Task SendDocumentUploadNotificationAsync(int attorneyId, int clientId, string clientName, string documentName);
    
    Task SendTimeEntryReminderAsync(int attorneyId, string message);
    
    // User preferences
    Task<List<UserNotificationPreference>> GetUserPreferencesAsync(int userId);
    
    Task UpdateUserPreferenceAsync(int userId, NotificationType type, bool inAppEnabled, bool emailEnabled, 
        NotificationPriority minimumPriority);
    
    // Template management
    Task<List<NotificationTemplate>> GetTemplatesAsync();
    
    Task<NotificationTemplate?> GetTemplateAsync(NotificationType type);
    
    Task UpdateTemplateAsync(int templateId, string subjectTemplate, string bodyTemplate, string? emailBodyTemplate);
    
    // Cleanup and maintenance
    Task CleanupExpiredNotificationsAsync();
    
    Task ProcessPendingEmailNotificationsAsync();
}