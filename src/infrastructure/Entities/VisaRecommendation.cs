using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class VisaRecommendation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public CaseId CaseId { get; set; }
    public int VisaTypeId { get; set; }
    public string? Rationale { get; set; }
    public DateTime? LockedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public virtual Case Case { get; set; } = null!;
    public virtual VisaType VisaType { get; set; } = null!;
}