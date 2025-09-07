namespace L4H.Infrastructure.Entities;

public class WorkflowDoctor
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkflowVersionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string City { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public string SourceUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public WorkflowVersion WorkflowVersion { get; set; } = null!;
}