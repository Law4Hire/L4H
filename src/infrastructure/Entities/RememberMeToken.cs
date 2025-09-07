using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class RememberMeToken
{
    public int Id { get; set; }
    public UserId UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime IssuedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
}