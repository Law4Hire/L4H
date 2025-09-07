using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class EmailVerificationToken
{
    public Guid Id { get; set; }
    public UserId UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? UsedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
}
