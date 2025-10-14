using System.ComponentModel.DataAnnotations;

namespace L4H.Infrastructure.Entities;

public class NotificationTemplate
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; }
    
    [Required]
    public NotificationType Type { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string SubjectTemplate { get; set; }
    
    [Required]
    [MaxLength(2000)]
    public string BodyTemplate { get; set; }
    
    [MaxLength(1000)]
    public string? EmailBodyTemplate { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}