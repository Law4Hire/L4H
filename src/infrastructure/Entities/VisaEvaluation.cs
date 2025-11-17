using L4H.Shared.Models;
using System.Text.Json.Serialization;

namespace L4H.Infrastructure.Entities;

/// <summary>
/// Unified visa evaluation entity that replaces both VisaRecommendation and VisaEligibilityResult.
/// Stores all visa evaluations from an interview session with eligibility status, scoring, and locking.
/// </summary>
public class VisaEvaluation
{
    public Guid Id { get; set; }

    // Session relationship
    public Guid SessionId { get; set; }
    [JsonIgnore]

    public InterviewSession Session { get; set; } = null!;

    // Visa relationship
    public int VisaTypeId { get; set; }
    [JsonIgnore]

    public VisaType VisaType { get; set; } = null!;

    // Eligibility evaluation
    public EligibilityStatus Status { get; set; }
    public decimal MatchScore { get; set; } // 0-100
    public int Rank { get; set; } // 1 = best match
    public string Explanation { get; set; } = string.Empty;
    public string? MissingInformation { get; set; }

    // Required documents (JSON serialized)
    public List<string> RequiredDocuments { get; set; } = new();

    // User selection
    public bool IsUserSelected { get; set; }
    public DateTime? UserSelectedAt { get; set; }

    // Attorney/Professional locking
    public bool IsAttorneyLocked { get; set; }
    public UserId? LockedByUserId { get; set; }
    [JsonIgnore]

    public User? LockedByUser { get; set; }
    public DateTime? LockedAt { get; set; }
    public DateTime? UnlockedAt { get; set; }
    public string? LockReason { get; set; }
    public string? UnlockReason { get; set; }

    // Metadata
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Eligibility status for visa evaluation
/// </summary>
public enum EligibilityStatus
{
    /// <summary>User is eligible for this visa type</summary>
    Eligible = 1,

    /// <summary>User might be eligible, needs more information or review</summary>
    Potential = 2,

    /// <summary>User is not eligible for this visa type</summary>
    NotEligible = 3
}
