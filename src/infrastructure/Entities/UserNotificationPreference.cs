using System.ComponentModel.DataAnnotations;
using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class UserNotificationPreference
{
    public int Id { get; set; }
    
    [Required]
    public UserId UserId { get; set; }
    public User User { get; set; } = null!;
    
    [Required]
    public NotificationType NotificationType { get; set; }
    
    public bool InAppEnabled { get; set; } = true;
    
    public bool EmailEnabled { get; set; } = true;
    
    public NotificationPriority MinimumPriority { get; set; } = NotificationPriority.Normal;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}