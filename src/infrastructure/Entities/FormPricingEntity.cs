using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

/// <summary>
/// Pricing information for USCIS form preparation services
/// Supports 3-tier pricing: Self-File, Paralegal, Lawyer
/// Plus LLC fee for revenue split between Law4Hire LLC and CannLaw
/// </summary>
public class FormPricingEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// The form this pricing applies to
    /// </summary>
    public Guid FormId { get; set; }

    /// <summary>
    /// Price for self-file (DIY) option. NULL = this tier is disabled for this form
    /// </summary>
    public decimal? SelfFilePriceUSD { get; set; }

    /// <summary>
    /// Price for filing with paralegal assistance. NULL = this tier is disabled for this form
    /// </summary>
    public decimal? ParalegalPriceUSD { get; set; }

    /// <summary>
    /// Price for filing with lawyer assistance. NULL = this tier is disabled for this form
    /// </summary>
    public decimal? LawyerPriceUSD { get; set; }

    /// <summary>
    /// Law4Hire LLC's fee for processing this form (fixed amount)
    /// This is the portion that goes to the LLC vs the law firm (CannLaw)
    /// </summary>
    public decimal LLCFeeUSD { get; set; }

    /// <summary>
    /// Alternative to LLCFeeUSD: percentage of total price for LLC
    /// If both are set, LLCFeeUSD takes precedence
    /// </summary>
    public decimal? LLCFeePercentage { get; set; }

    /// <summary>
    /// Notes about this pricing (e.g., "Includes document review", "Premium processing extra")
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Whether this pricing is currently active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// When this pricing became effective
    /// </summary>
    public DateTime EffectiveDate { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// When this pricing expires (optional - NULL means no expiration)
    /// </summary>
    public DateTime? ExpirationDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public UserId? CreatedByUserId { get; set; }
    public UserId? UpdatedByUserId { get; set; }

    // Navigation properties
    public USCISFormEntity Form { get; set; } = null!;
    public User? CreatedByUser { get; set; }
    public User? UpdatedByUser { get; set; }
}
