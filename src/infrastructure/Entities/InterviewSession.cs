using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class InterviewSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public UserId UserId { get; set; }
    public CaseId CaseId { get; set; }
    public string Status { get; set; } = "active"; // active, completed, cancelled
    public DateTime StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public DateTime? LockedAt { get; set; }

    // Navigation properties
    public virtual Case Case { get; set; } = null!;
    public virtual User User { get; set; } = null!;
    public virtual ICollection<InterviewQA> QAs { get; set; } = new List<InterviewQA>();
}