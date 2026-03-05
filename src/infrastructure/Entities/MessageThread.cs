using L4H.Shared.Models;
using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations;

namespace L4H.Infrastructure.Entities;

public class MessageThread
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public CaseId? CaseId { get; set; }
    
    [MaxLength(200)]
    public string? Subject { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Recipient user ID. Null = "General" message visible to all admins.
    /// Non-null = Message directed to specific staff member (attorney).
    /// </summary>
    public UserId? RecipientUserId { get; set; }

    // Navigation properties
    [JsonIgnore]
    public Case? Case { get; set; }
    
    [JsonIgnore]
    public User? RecipientUser { get; set; }
    
    [JsonIgnore]
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
