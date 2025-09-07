using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class MessageThread
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public CaseId CaseId { get; set; }
    public string? Subject { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Case Case { get; set; } = null!;
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}