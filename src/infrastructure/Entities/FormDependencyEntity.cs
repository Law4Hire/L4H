namespace L4H.Infrastructure.Entities;

/// <summary>
/// Defines hierarchical relationships between forms (which forms require other forms)
/// Example: For EB-2, I-140 requires I-485 to be filed together
/// Dependencies are visa-specific - same forms may have different dependencies for different visas
/// </summary>
public class FormDependencyEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// The main/parent form
    /// </summary>
    public Guid ParentFormId { get; set; }

    /// <summary>
    /// The dependent/required form
    /// </summary>
    public Guid DependentFormId { get; set; }

    /// <summary>
    /// This dependency applies to this specific visa type
    /// Example: I-140 requires I-485 for EB-2, but not for all visa types
    /// </summary>
    public int VisaTypeId { get; set; }

    /// <summary>
    /// Whether the dependent form is required (true) or just recommended (false)
    /// </summary>
    public bool IsRequired { get; set; } = true;

    /// <summary>
    /// Explanation of why this dependency exists
    /// Example: "I-485 allows you to adjust status while I-140 is pending"
    /// </summary>
    public string? DependencyReason { get; set; }

    /// <summary>
    /// Display order when showing dependencies
    /// Lower numbers appear first
    /// </summary>
    public int DisplayOrder { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public USCISFormEntity ParentForm { get; set; } = null!;
    public USCISFormEntity DependentForm { get; set; } = null!;
    public VisaType VisaType { get; set; } = null!;
}
