using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class VisaRecommendation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public CaseId CaseId { get; set; }
    public int VisaTypeId { get; set; }
    public string? Rationale { get; set; }

    /// <summary>
    /// Eligibility status: "Eligible" (green), "Potential" (yellow), or null for legacy recommendations
    /// </summary>
    public string? EligibilityStatus { get; set; }

    /// <summary>
    /// Match score (0-100) for this visa type
    /// </summary>
    public int? MatchScore { get; set; }

    public DateTime? LockedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public virtual Case Case { get; set; } = null!;
    public virtual VisaType VisaType { get; set; } = null!;
}