using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

/// <summary>
/// Database entity for USCIS forms (I-129, I-140, I-485, etc.)
/// </summary>
public class USCISFormEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// USCIS form number (e.g., "I-129", "I-140", "DS-160")
    /// </summary>
    public string FormNumber { get; set; } = string.Empty;

    /// <summary>
    /// Official form name (e.g., "Petition for a Nonimmigrant Worker")
    /// </summary>
    public string FormName { get; set; } = string.Empty;

    /// <summary>
    /// Detailed description of what this form is used for
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// URL to official USCIS form PDF
    /// </summary>
    public string? FormUrl { get; set; }

    /// <summary>
    /// Estimated time in minutes to complete this form
    /// </summary>
    public int? EstimatedTimeMinutes { get; set; }

    /// <summary>
    /// Whether this form is currently active and available
    /// </summary>
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public UserId? CreatedByUserId { get; set; }
    public UserId? UpdatedByUserId { get; set; }

    // Navigation properties
    public User? CreatedByUser { get; set; }
    public User? UpdatedByUser { get; set; }
    public ICollection<FormPricingEntity> Pricing { get; set; } = new List<FormPricingEntity>();
    public ICollection<FormVisaTypeMappingEntity> VisaTypeMappings { get; set; } = new List<FormVisaTypeMappingEntity>();

    // Dependencies where this form is the parent (requires other forms)
    public ICollection<FormDependencyEntity> RequiredForms { get; set; } = new List<FormDependencyEntity>();

    // Dependencies where this form is a dependent (required by other forms)
    public ICollection<FormDependencyEntity> RequiredByForms { get; set; } = new List<FormDependencyEntity>();
}
