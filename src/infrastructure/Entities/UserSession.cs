using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class UserSession
{
    public Guid Id { get; set; }
    public UserId UserId { get; set; }
    public string RefreshIdHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public string UserAgent { get; set; } = string.Empty;
    public string IpHash { get; set; } = string.Empty;
    public DateTime? RevokedAt { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
}
