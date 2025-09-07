namespace L4H.Shared.Models;

// Request models
public class ApproveWorkflowRequest
{
    public string? Notes { get; set; }
}

public class RejectWorkflowRequest
{
    public required string Reason { get; set; }
    public string? Notes { get; set; }
}

// Response models
public class WorkflowPendingListResponse
{
    public List<WorkflowPendingSummary> Workflows { get; set; } = new();
    public int TotalCount { get; set; }
}

public class WorkflowPendingSummary
{
    public Guid Id { get; set; }
    public int VisaTypeId { get; set; }
    public required string CountryCode { get; set; }
    public int Version { get; set; }
    public required string Status { get; set; }
    public required string StatusDisplayName { get; set; }
    public required string Source { get; set; }
    public DateTime ScrapedAt { get; set; }
    public int StepCount { get; set; }
    public int DoctorCount { get; set; }
}

public class WorkflowDiffResponse
{
    public Guid WorkflowId { get; set; }
    public Guid? ComparedToId { get; set; }
    public List<WorkflowStepDiff> ModifiedSteps { get; set; } = new();
    public List<WorkflowStepDiff> AddedSteps { get; set; } = new();
    public List<WorkflowStepDiff> RemovedSteps { get; set; } = new();
    public int TotalChanges { get; set; }
}

public class WorkflowStepDiff
{
    public required string Key { get; set; }
    public required string ChangeType { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
}

public class ApproveWorkflowResponse
{
    public bool Success { get; set; }
    public required string Message { get; set; }
    public int NewVersion { get; set; }
    public List<string> Warnings { get; set; } = new();
}

public class WorkflowLookupResponse
{
    public Guid Id { get; set; }
    public int VisaTypeId { get; set; }
    public required string CountryCode { get; set; }
    public int Version { get; set; }
    public required string Status { get; set; }
    public required string Source { get; set; }
    public DateTime ApprovedAt { get; set; }
    public List<WorkflowStepDetails> Steps { get; set; } = new();
    public List<WorkflowDoctorDetails> Doctors { get; set; } = new();
}

public class WorkflowStepDetails
{
    public Guid Id { get; set; }
    public int Ordinal { get; set; }
    public required string Key { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public string? DataJson { get; set; }
}

public class WorkflowDoctorDetails
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Address { get; set; }
    public string? Phone { get; set; }
    public required string City { get; set; }
    public required string CountryCode { get; set; }
    public string? SourceUrl { get; set; }
}

public class ErrorResponse
{
    public required string Message { get; set; }
    public string? Details { get; set; }
    public List<string> Errors { get; set; } = new();
}