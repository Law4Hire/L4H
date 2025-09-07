using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class Appointment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public CaseId CaseId { get; set; }
    public UserId StaffUserId { get; set; }
    public DateTimeOffset ScheduledStart { get; set; }
    public DateTimeOffset ScheduledEnd { get; set; }
    public string Type { get; set; } = "consultation";
    public string Status { get; set; } = "scheduled"; // scheduled, confirmed, completed, cancelled, rescheduling
    
    // Additional properties for controller compatibility
    public UserId StaffId 
    { 
        get => StaffUserId; 
        set => StaffUserId = value; 
    }
    public DateTimeOffset StartTime 
    { 
        get => ScheduledStart; 
        set => ScheduledStart = value; 
    }
    public int DurationMinutes 
    { 
        get => (int)(ScheduledEnd - ScheduledStart).TotalMinutes;
        set => ScheduledEnd = ScheduledStart.AddMinutes(value);
    }
    public string TimeZone { get; set; } = "UTC";
    public int TimezoneOffsetMinutes { get; set; } = 0;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }

    // Navigation properties
    public Case Case { get; set; } = null!;
    public User Staff { get; set; } = null!;
    public ICollection<RescheduleProposal> RescheduleProposals { get; set; } = new List<RescheduleProposal>();
    public Meeting? Meeting { get; set; }
}