namespace L4H.Shared.Models;

public class AppointmentCreateRequest
{
    public CaseId CaseId { get; set; }
    public DateTime PreferredStartTime { get; set; }
    public int DurationMinutes { get; set; } = 60;
    public string TimeZone { get; set; } = "UTC";
    public string? Notes { get; set; }
}

public class AppointmentCreateResponse
{
    public Guid AppointmentId { get; set; }
    public DateTime StartTime { get; set; }
    public int DurationMinutes { get; set; }
    public string TimeZone { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string StaffName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? Notes { get; set; }
}

public class AppointmentRescheduleRequest
{
    public Guid AppointmentId { get; set; }
    public string InitiatedBy { get; set; } = string.Empty; // "client" or "staff"
    public DateTime Option1StartTime { get; set; }
    public DateTime Option2StartTime { get; set; }
    public DateTime Option3StartTime { get; set; }
    public int DurationMinutes { get; set; } = 60;
    public string TimeZone { get; set; } = "UTC";
}

public class AppointmentRescheduleResponse
{
    public Guid ProposalId { get; set; }
    public Guid AppointmentId { get; set; }
    public string InitiatedBy { get; set; } = string.Empty;
    public DateTime Option1StartTime { get; set; }
    public DateTime Option2StartTime { get; set; }
    public DateTime Option3StartTime { get; set; }
    public int DurationMinutes { get; set; }
    public string TimeZone { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class RescheduleChoiceRequest
{
    public Guid ProposalId { get; set; }
    public int ChosenOption { get; set; } // 1, 2, or 3
}

public class RescheduleChoiceResponse
{
    public Guid AppointmentId { get; set; }
    public DateTime NewStartTime { get; set; }
    public int DurationMinutes { get; set; }
    public string TimeZone { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
}

public class RescheduleRejectionRequest
{
    public Guid ProposalId { get; set; }
    public string? Reason { get; set; }
}

public class AppointmentCancelRequest
{
    public Guid AppointmentId { get; set; }
    public string? Reason { get; set; }
}

public class AppointmentHistoryResponse
{
    public List<AppointmentSummary> Appointments { get; set; } = new List<AppointmentSummary>();
    public List<RescheduleSummary> RescheduleRequests { get; set; } = new List<RescheduleSummary>();
}

public class AppointmentSummary
{
    public Guid Id { get; set; }
    public DateTime StartTime { get; set; }
    public int DurationMinutes { get; set; }
    public string TimeZone { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string StaffName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }
    public string? Notes { get; set; }
}

public class RescheduleSummary
{
    public Guid Id { get; set; }
    public Guid AppointmentId { get; set; }
    public string InitiatedBy { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? RespondedAt { get; set; }
    public int? ChosenOption { get; set; }
    public string? RejectionReason { get; set; }
}