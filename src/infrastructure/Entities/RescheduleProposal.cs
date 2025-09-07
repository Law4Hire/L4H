using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class RescheduleProposal
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AppointmentId { get; set; }
    public string InitiatedBy { get; set; } = string.Empty; // client, staff
    public string Status { get; set; } = "pending"; // pending, accepted, rejected, expired
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(2);
    public DateTime? RespondedAt { get; set; }
    public string? RejectionReason { get; set; }

    // 3 proposed options
    public DateTime Option1StartTime { get; set; } // UTC
    public DateTime Option2StartTime { get; set; } // UTC  
    public DateTime Option3StartTime { get; set; } // UTC
    public int DurationMinutes { get; set; } = 60;
    public string TimeZone { get; set; } = "UTC"; // IANA timezone
    public int TimezoneOffsetMinutes { get; set; } // offset from UTC at time of proposal

    public int? ChosenOption { get; set; } // 1, 2, or 3

    // Navigation properties
    public Appointment Appointment { get; set; } = null!;
}