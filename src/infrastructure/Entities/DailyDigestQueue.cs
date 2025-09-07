using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class DailyDigestQueue
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public UserId UserId { get; set; }
    public string ItemsJson { get; set; } = string.Empty; // JSON array of digest items
    public DateTime? LastSentAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
}