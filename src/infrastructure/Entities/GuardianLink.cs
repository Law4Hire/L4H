using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class GuardianLink
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public UserId ChildUserId { get; set; }
    public UserId GuardianUserId { get; set; }
    public Guid AttestationId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public User ChildUser { get; set; } = null!;
    public User GuardianUser { get; set; } = null!;
}