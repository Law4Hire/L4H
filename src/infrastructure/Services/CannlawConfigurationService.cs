using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace L4H.Infrastructure.Services;

public class CannlawConfigurationService
{
    private readonly L4HDbContext _context;
    private readonly ILogger<CannlawConfigurationService> _logger;

    public CannlawConfigurationService(L4HDbContext context, ILogger<CannlawConfigurationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Initialize default system configuration settings for Cannlaw
    /// </summary>
    public async Task InitializeDefaultSettingsAsync()
    {
        _logger.LogInformation("Initializing Cannlaw system configuration settings...");

        await InitializeBillingSettingsAsync();
        await InitializeFileUploadSettingsAsync();
        await InitializeNotificationSettingsAsync();
        await InitializeSystemSettingsAsync();

        await _context.SaveChangesAsync();
        _logger.LogInformation("Cannlaw system configuration settings initialized successfully.");
    }

    private async Task InitializeBillingSettingsAsync()
    {
        var billingSettings = new Dictionary<string, string>
        {
            ["Billing.DefaultHourlyRate"] = "250.00",
            ["Billing.MinimumBillingIncrement"] = "0.1", // 6 minutes in hours
            ["Billing.BillingIncrementMinutes"] = "6",
            ["Billing.ConsultationDiscountPercent"] = "20",
            ["Billing.CourtRepresentationPremiumPercent"] = "20",
            ["Billing.AutoCalculateBillableAmount"] = "true",
            ["Billing.RequireTimeEntryDescription"] = "true",
            ["Billing.AllowConcurrentTimers"] = "false",
            ["Billing.MaxDailyHours"] = "16",
            ["Billing.TimerAutoStopMinutes"] = "480", // 8 hours
            ["Billing.BillingCurrency"] = "USD",
            ["Billing.TaxRate"] = "0.00" // No tax by default
        };

        await UpsertAdminSettingsAsync(billingSettings, "Billing configuration settings");
    }

    private async Task InitializeFileUploadSettingsAsync()
    {
        var fileUploadSettings = new Dictionary<string, string>
        {
            // Attorney photo settings
            ["FileUpload.AttorneyPhoto.MaxSizeBytes"] = "5242880", // 5MB
            ["FileUpload.AttorneyPhoto.AllowedExtensions"] = "jpg,jpeg,png,webp",
            ["FileUpload.AttorneyPhoto.MaxWidth"] = "800",
            ["FileUpload.AttorneyPhoto.MaxHeight"] = "800",
            ["FileUpload.AttorneyPhoto.Quality"] = "85",
            
            // Client document settings
            ["FileUpload.ClientDocument.MaxSizeBytes"] = "52428800", // 50MB
            ["FileUpload.ClientDocument.AllowedExtensions"] = "pdf,doc,docx,jpg,jpeg,png,tiff,txt",
            ["FileUpload.ClientDocument.RequireVirusScan"] = "true",
            ["FileUpload.ClientDocument.MaxFilesPerUpload"] = "10",
            
            // General upload settings
            ["FileUpload.StoragePath"] = "/uploads",
            ["FileUpload.TempPath"] = "/temp",
            ["FileUpload.RetentionDays"] = "2555", // 7 years
            ["FileUpload.EnableVersioning"] = "true",
            ["FileUpload.CompressImages"] = "true",
            ["FileUpload.GenerateThumbnails"] = "true",
            ["FileUpload.ThumbnailSize"] = "200x200",
            
            // Security settings
            ["FileUpload.ScanForMalware"] = "true",
            ["FileUpload.QuarantineSuspiciousFiles"] = "true",
            ["FileUpload.LogAllUploads"] = "true",
            ["FileUpload.RequireAuthentication"] = "true"
        };

        await UpsertAdminSettingsAsync(fileUploadSettings, "File upload configuration settings");
    }

    private async Task InitializeNotificationSettingsAsync()
    {
        var notificationSettings = new Dictionary<string, string>
        {
            // Email notification settings
            ["Notification.Email.Enabled"] = "true",
            ["Notification.Email.FromAddress"] = "noreply@cannlaw.com",
            ["Notification.Email.FromName"] = "Cannlaw Immigration Services",
            ["Notification.Email.SmtpHost"] = "",
            ["Notification.Email.SmtpPort"] = "587",
            ["Notification.Email.UseTLS"] = "true",
            ["Notification.Email.Username"] = "",
            ["Notification.Email.Password"] = "",
            
            // In-app notification settings
            ["Notification.InApp.Enabled"] = "true",
            ["Notification.InApp.RetentionDays"] = "30",
            ["Notification.InApp.MaxNotificationsPerUser"] = "100",
            
            // Notification triggers
            ["Notification.ClientAssignment.Enabled"] = "true",
            ["Notification.CaseStatusChange.Enabled"] = "true",
            ["Notification.BillingThreshold.Enabled"] = "true",
            ["Notification.BillingThreshold.Hours"] = "40", // Warn after 40 hours
            ["Notification.DocumentUpload.Enabled"] = "true",
            ["Notification.TimeEntryReminder.Enabled"] = "true",
            ["Notification.TimeEntryReminder.Hours"] = "24", // Remind after 24 hours
            
            // Notification templates
            ["Notification.Template.ClientAssignment.Subject"] = "New Client Assignment - {ClientName}",
            ["Notification.Template.ClientAssignment.Body"] = "You have been assigned a new client: {ClientName}. Case Type: {CaseType}. Please review the client details and begin case preparation.",
            
            ["Notification.Template.CaseStatusChange.Subject"] = "Case Status Update - {ClientName}",
            ["Notification.Template.CaseStatusChange.Body"] = "The case status for {ClientName} has been updated from {OldStatus} to {NewStatus}. Please review the case details for any required actions.",
            
            ["Notification.Template.BillingThreshold.Subject"] = "Billing Threshold Alert - {ClientName}",
            ["Notification.Template.BillingThreshold.Body"] = "The billable hours for client {ClientName} have exceeded {ThresholdHours} hours. Current total: {CurrentHours} hours. Please review billing status.",
            
            ["Notification.Template.DocumentUpload.Subject"] = "New Document Uploaded - {ClientName}",
            ["Notification.Template.DocumentUpload.Body"] = "A new document has been uploaded for client {ClientName}: {DocumentName}. Please review the document when convenient."
        };

        await UpsertAdminSettingsAsync(notificationSettings, "Notification system configuration");
    }

    private async Task InitializeSystemSettingsAsync()
    {
        var systemSettings = new Dictionary<string, string>
        {
            // General system settings
            ["System.CompanyName"] = "Cannlaw Immigration Services",
            ["System.DefaultTimeZone"] = "America/New_York",
            ["System.DateFormat"] = "MM/dd/yyyy",
            ["System.TimeFormat"] = "hh:mm tt",
            ["System.Currency"] = "USD",
            ["System.Language"] = "en-US",
            
            // Security settings
            ["Security.SessionTimeoutMinutes"] = "480", // 8 hours
            ["Security.RequireStrongPasswords"] = "true",
            ["Security.MaxLoginAttempts"] = "5",
            ["Security.LockoutDurationMinutes"] = "30",
            ["Security.RequireTwoFactorAuth"] = "false",
            ["Security.AuditLogRetentionDays"] = "2555", // 7 years
            
            // Case management settings
            ["CaseManagement.DefaultCaseStatus"] = "NotStarted",
            ["CaseManagement.AutoAssignCases"] = "false",
            ["CaseManagement.RequireCaseNotes"] = "true",
            ["CaseManagement.AllowStatusRollback"] = "true",
            ["CaseManagement.RequireCompletionNotes"] = "true",
            
            // Client management settings
            ["ClientManagement.RequireAllFields"] = "false",
            ["ClientManagement.AllowDuplicateEmails"] = "false",
            ["ClientManagement.AutoCreateCases"] = "true",
            ["ClientManagement.DefaultCaseType"] = "General Immigration",
            
            // Time tracking settings
            ["TimeTracking.RequireDescription"] = "true",
            ["TimeTracking.AllowEditPastEntries"] = "true",
            ["TimeTracking.EditTimeWindowHours"] = "72", // 3 days
            ["TimeTracking.RequireApprovalForEdits"] = "false",
            ["TimeTracking.AutoStopTimerHours"] = "8",
            
            // Reporting settings
            ["Reporting.DefaultDateRange"] = "30", // days
            ["Reporting.MaxExportRecords"] = "10000",
            ["Reporting.AllowedExportFormats"] = "pdf,excel,csv",
            ["Reporting.IncludeConfidentialData"] = "false",
            
            // Integration settings
            ["Integration.CalendarSync.Enabled"] = "false",
            ["Integration.EmailSync.Enabled"] = "false",
            ["Integration.DocumentManagement.Provider"] = "Local",
            ["Integration.BackupFrequencyHours"] = "24"
        };

        await UpsertAdminSettingsAsync(systemSettings, "General system configuration");
    }

    private async Task UpsertAdminSettingsAsync(Dictionary<string, string> settings, string description)
    {
        foreach (var setting in settings)
        {
            var existingSetting = await _context.AdminSettings
                .FirstOrDefaultAsync(s => s.Key == setting.Key);

            if (existingSetting == null)
            {
                var adminSetting = new AdminSettings
                {
                    Key = setting.Key,
                    Value = setting.Value,
                    Description = description,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.AdminSettings.Add(adminSetting);
                _logger.LogDebug("Added admin setting: {Key} = {Value}", setting.Key, setting.Value);
            }
            else
            {
                _logger.LogDebug("Admin setting already exists: {Key}", setting.Key);
            }
        }
    }

    /// <summary>
    /// Get a configuration value by key
    /// </summary>
    public async Task<string?> GetSettingAsync(string key)
    {
        var setting = await _context.AdminSettings
            .FirstOrDefaultAsync(s => s.Key == key);
        
        return setting?.Value;
    }

    /// <summary>
    /// Update a configuration value
    /// </summary>
    public async Task UpdateSettingAsync(string key, string value, string? updatedBy = null)
    {
        var setting = await _context.AdminSettings
            .FirstOrDefaultAsync(s => s.Key == key);

        if (setting != null)
        {
            setting.Value = value;
            setting.UpdatedAt = DateTime.UtcNow;
            
            if (!string.IsNullOrEmpty(updatedBy))
            {
                // Try to find the user by email or name
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == updatedBy || 
                                            $"{u.FirstName} {u.LastName}" == updatedBy);
                if (user != null)
                {
                    setting.UpdatedByUserId = user.Id;
                }
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Updated admin setting: {Key} = {Value}", key, value);
        }
        else
        {
            _logger.LogWarning("Attempted to update non-existent admin setting: {Key}", key);
        }
    }
}