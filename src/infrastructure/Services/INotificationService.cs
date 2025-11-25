using L4H.Infrastructure.Entities;
using L4H.Shared.Models;

namespace L4H.Infrastructure.Services;

public interface INotificationService
{
    // Core notification methods
    Task<Notification> CreateNotificationAsync(UserId userId, NotificationType type, string title, string message, 
        NotificationPriority priority = NotificationPriority.Normal, string? actionUrl = null, 
        string? relatedEntityType = null, int? relatedEntityId = null);

    Task<List<Notification>> GetUserNotificationsAsync(UserId userId, bool unreadOnly = false, int skip = 0, int take = 50);
    
    Task<int> GetUnreadCountAsync(UserId userId);
    
    Task MarkAsReadAsync(int notificationId, UserId userId);
    
    Task MarkAllAsReadAsync(UserId userId);
    
    Task DeleteNotificationAsync(int notificationId, UserId userId);
    
    // Template-based notifications
    Task SendClientAssignmentNotificationAsync(UserId attorneyId, int clientId, string clientName);
    
    Task SendCaseStatusChangeNotificationAsync(UserId userId, int caseId, string caseName, string oldStatus, string newStatus);
    
    Task SendBillingThresholdNotificationAsync(UserId attorneyId, int clientId, string clientName, double currentHours, double thresholdHours);
    
    Task SendDeadlineReminderNotificationAsync(UserId userId, string title, string message, DateTime deadline, bool isCritical);
    
    Task SendDocumentUploadNotificationAsync(UserId attorneyId, int clientId, string clientName, string documentName);
    
    Task SendTimeEntryReminderNotificationAsync(UserId attorneyId, string title, string body);

    // Preferences
    Task<List<UserNotificationPreference>> GetUserPreferencesAsync(UserId userId);
    
    Task UpdateUserPreferenceAsync(UserId userId, NotificationType type, bool inAppEnabled, bool emailEnabled, 
        NotificationPriority minimumPriority);
    
    // Templates
    Task<List<NotificationTemplate>> GetTemplatesAsync();
    
    Task<NotificationTemplate?> GetTemplateAsync(NotificationType type);
    
    Task UpdateTemplateAsync(int templateId, string subjectTemplate, string bodyTemplate, string? emailBodyTemplate);
    
    // System
    Task CleanupExpiredNotificationsAsync();
    
    Task ProcessPendingEmailNotificationsAsync();
}