namespace L4H.Infrastructure.Entities;

public class WorkflowStep
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkflowVersionId { get; set; }
    public int Ordinal { get; set; }
    public required string Key { get; set; } // stable id like medical_exam, fee_payment
    public required string Title { get; set; }
    public required string Description { get; set; }
    public string? DataJson { get; set; } // structured extras like links, deadlines
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public WorkflowVersion WorkflowVersion { get; set; } = null!;
}