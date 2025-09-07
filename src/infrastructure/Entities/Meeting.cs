namespace L4H.Infrastructure.Entities;

public enum MeetingProvider
{
    Fake,
    Teams
}

public class Meeting
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AppointmentId { get; set; }
    public MeetingProvider Provider { get; set; }
    public required string MeetingId { get; set; }
    public required string JoinUrl { get; set; }
    public bool WaitingRoom { get; set; }
    public bool Recording { get; set; }
    public DateTime? ConsentAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Appointment Appointment { get; set; } = null!;
}