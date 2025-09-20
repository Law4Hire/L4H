using System.ComponentModel.DataAnnotations;

namespace L4H.Shared.Models;

public record CreateWorkflowRequest
{
    [Required]
    public string VisaType { get; init; } = string.Empty;

    [Required]
    public string CountryCode { get; init; } = string.Empty;

    public string? Source { get; init; }

    public string? Notes { get; init; }

    public List<CreateWorkflowStepRequest>? Steps { get; init; }

    public List<CreateWorkflowDoctorRequest>? Doctors { get; init; }
}

public record CreateWorkflowStepRequest
{
    [Required]
    [Range(1, int.MaxValue)]
    public int StepNumber { get; init; }

    [Required]
    public string CountryCode { get; init; } = string.Empty;

    [Required]
    public string VisaType { get; init; } = string.Empty;

    public string? Key { get; init; }

    public string? Title { get; init; }

    public string? Description { get; init; }

    /// <summary>
    /// Type of document: file, form, payment, etc.
    /// </summary>
    public string? DocumentType { get; init; }

    /// <summary>
    /// Whether this is provided by user (true) or government (false)
    /// </summary>
    public bool IsUserProvided { get; init; }

    /// <summary>
    /// Name of the required document
    /// </summary>
    public string? DocumentName { get; init; }

    /// <summary>
    /// Link to official government source (for government provided documents)
    /// </summary>
    public string? GovernmentLink { get; init; }

    /// <summary>
    /// Additional structured data as JSON string
    /// </summary>
    public string? AdditionalData { get; init; }
}

public record CreateWorkflowDoctorRequest
{
    [Required]
    public string Name { get; init; } = string.Empty;

    [Required]
    public string Address { get; init; } = string.Empty;

    public string? Phone { get; init; }

    [Required]
    public string City { get; init; } = string.Empty;

    [Required]
    public string CountryCode { get; init; } = string.Empty;

    public string? SourceUrl { get; init; }
}

public record WorkflowCreateResponse
{
    public Guid Id { get; init; }
    public int VisaTypeId { get; init; }
    public string CountryCode { get; init; } = string.Empty;
    public int Version { get; init; }
    public string Status { get; init; } = string.Empty;
    public int StepsCount { get; init; }
    public int DoctorsCount { get; init; }
    public DateTime CreatedAt { get; init; }
}