using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class AuditLog
{
    public long Id { get; set; }
    public string Category { get; set; } = string.Empty;
    public UserId? ActorUserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string TargetType { get; set; } = string.Empty;
    public string TargetId { get; set; } = string.Empty;
    public string DetailsJson { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property  
    public User? ActorUser { get; set; }
}