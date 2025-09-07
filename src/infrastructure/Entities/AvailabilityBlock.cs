using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class AvailabilityBlock
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public UserId StaffId { get; set; }
    public UserId StaffUserId 
    { 
        get => StaffId; 
        set => StaffId = value; 
    }
    public DateTime StartTime { get; set; } // UTC
    public DateTime EndTime { get; set; } // UTC
    public string TimeZone { get; set; } = "UTC"; // IANA timezone
    public string Type { get; set; } = "available"; // available, unavailable, break
    public string? Reason { get; set; }
    public bool IsRecurring { get; set; } = false;
    public string? RecurrencePattern { get; set; } // JSON for recurring rules
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }

    // Navigation properties
    public User Staff { get; set; } = null!;
}