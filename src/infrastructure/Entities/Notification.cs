using System.ComponentModel.DataAnnotations;

namespace L4H.Infrastructure.Entities;

public class Notification
{
    public int Id { get; set; }
    
    [Required]
    public int UserId { get; set; }
    public User User { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Title { get; set; }
    
    [Required]
    [MaxLength(1000)]
    public string Message { get; set; }
    
    [Required]
    public NotificationType Type { get; set; }
    
    [Required]
    public NotificationPriority Priority { get; set; }
    
    public bool IsRead { get; set; } = false;
    
    public bool IsEmailSent { get; set; } = false;
    
    public DateTime? EmailSentAt { get; set; }
    
    public string? RelatedEntityType { get; set; }
    
    public int? RelatedEntityId { get; set; }
    
    [MaxLength(500)]
    public string? ActionUrl { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? ReadAt { get; set; }
    
    public DateTime? ExpiresAt { get; set; }
}

public enum NotificationType
{
    ClientAssignment,
    CaseStatusChange,
    BillingThreshold,
    DeadlineReminder,
    SystemAlert,
    DocumentUpload,
    TimeEntryReminder
}

public enum NotificationPriority
{
    Low,
    Normal,
    High,
    Critical
}