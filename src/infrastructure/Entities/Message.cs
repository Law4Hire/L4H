using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class Message
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ThreadId { get; set; }
    public UserId SenderUserId { get; set; }
    public string Body { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public string Channel { get; set; } = "inapp"; // inapp|email
    public string? ReadByJson { get; set; } // JSON object tracking read receipts by user

    // Navigation properties
    public MessageThread Thread { get; set; } = null!;
    public User Sender { get; set; } = null!;
}