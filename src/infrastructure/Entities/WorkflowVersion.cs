using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class WorkflowVersion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int VisaTypeId { get; set; }
    public required string CountryCode { get; set; } // ISO-2
    public int Version { get; set; }
    public required string Status { get; set; } // draft|pending_approval|approved|rejected
    public required string Source { get; set; } // Embassy|USCIS|Mixed
    public required string ScrapeHash { get; set; }
    public DateTime ScrapedAt { get; set; }
    public UserId? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? Notes { get; set; }
    public string? SummaryJson { get; set; } // counts, source URLs
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public VisaType? VisaType { get; set; }
    public User? ApprovedByUser { get; set; }
    public ICollection<WorkflowStep> Steps { get; set; } = new List<WorkflowStep>();
    public ICollection<WorkflowDoctor> Doctors { get; set; } = new List<WorkflowDoctor>();
}