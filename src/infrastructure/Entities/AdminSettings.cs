using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class AdminSettings
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public UserId? UpdatedByUserId { get; set; }

    // Navigation properties
    public User? UpdatedByUser { get; set; }
}