namespace L4H.Shared.Models;

// Request models
public class CreateAppointmentRequest
{
    public required CaseId CaseId { get; set; }
    public required UserId StaffUserId { get; set; }
    public required DateTimeOffset ScheduledStart { get; set; }
    public required DateTimeOffset ScheduledEnd { get; set; }
    public required string Type { get; set; }
    public required string Status { get; set; }
    public string? Notes { get; set; }
}

public class UpdateAppointmentRequest
{
    public string? Status { get; set; }
    public string? Notes { get; set; }
}

public class RecordingConsentRequest
{
    public bool ConsentGiven { get; set; }
}

// Response models
public class CreateAppointmentResponse
{
    public required Guid Id { get; set; }
    public List<string> Warnings { get; set; } = new();
}

public class UpdateAppointmentResponse
{
    public required Guid Id { get; set; }
    public required string Status { get; set; }
    public string? Notes { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public required DateTime UpdatedAt { get; set; }
}

public class AppointmentDetailsResponse
{
    public required Guid Id { get; set; }
    public required CaseId CaseId { get; set; }
    public required UserId StaffUserId { get; set; }
    public required DateTimeOffset ScheduledStart { get; set; }
    public required DateTimeOffset ScheduledEnd { get; set; }
    public required string Type { get; set; }
    public required string Status { get; set; }
    public string? Notes { get; set; }
    public required DateTime CreatedAt { get; set; }
    public MeetingDetails? Meeting { get; set; }
}

public class MeetingDetails
{
    public Guid Id { get; set; }
    public required string MeetingId { get; set; }
    public required string JoinUrl { get; set; }
    public bool WaitingRoom { get; set; }
    public bool Recording { get; set; }
    public required string Provider { get; set; }
    public DateTime? ConsentAt { get; set; }
}