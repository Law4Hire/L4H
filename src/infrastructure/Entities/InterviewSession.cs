using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class InterviewSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public UserId? UserId { get; set; } // Nullable for unauthenticated sessions
    public CaseId? CaseId { get; set; } // Nullable for unauthenticated sessions
    public string Status { get; set; } = "active"; // active, completed, cancelled
    public DateTime StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public DateTime? LockedAt { get; set; }

    // Navigation properties
    public virtual Case? Case { get; set; } // Nullable for unauthenticated sessions
    public virtual User? User { get; set; } // Nullable for unauthenticated sessions
    public virtual ICollection<InterviewQA> QAs { get; set; } = new List<InterviewQA>();
    public virtual ICollection<VisaEligibilityResult> VisaEligibilityResults { get; set; } = new List<VisaEligibilityResult>();
}