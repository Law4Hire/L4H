namespace L4H.Infrastructure.Entities;

/// <summary>
/// Stores multiple visa eligibility results for an interview session.
/// Each session can have multiple eligible (green) and potential (yellow) visas.
/// </summary>
public class VisaEligibilityResult
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// The interview session this result belongs to
    /// </summary>
    public Guid InterviewSessionId { get; set; }

    /// <summary>
    /// The visa type that was evaluated
    /// </summary>
    public int VisaTypeId { get; set; }

    /// <summary>
    /// Eligibility status: "Eligible" (green) or "Potential" (yellow)
    /// </summary>
    public string EligibilityStatus { get; set; } = string.Empty; // "Eligible" or "Potential"

    /// <summary>
    /// Match score (0-100) indicating how well the applicant matches the visa requirements
    /// </summary>
    public int MatchScore { get; set; }

    /// <summary>
    /// Explanation of why this visa is eligible/potential
    /// </summary>
    public string? Rationale { get; set; }

    /// <summary>
    /// Specific requirements that are met (JSON array of requirement keys)
    /// </summary>
    public string? MetRequirements { get; set; }

    /// <summary>
    /// Specific requirements that need review or are missing (JSON array of requirement keys)
    /// </summary>
    public string? UnmetRequirements { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual InterviewSession InterviewSession { get; set; } = null!;
    public virtual VisaType VisaType { get; set; } = null!;
}
