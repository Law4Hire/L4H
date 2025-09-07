namespace L4H.Infrastructure.Entities;

public enum RetentionAction
{
    Mask,
    Delete
}

public class RetentionQueue
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Category { get; set; } = string.Empty; // e.g., "Message", "Recording", "MedicalDoc"
    public string TargetId { get; set; } = string.Empty;
    public RetentionAction Action { get; set; } = RetentionAction.Delete;
    public DateTime EnqueuedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }
}