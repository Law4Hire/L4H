using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

/// <summary>
/// Maps which USCIS forms are required for which visa types
/// Example: H-1B requires I-129, I-907 is optional
/// </summary>
public class FormVisaTypeMappingEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// The form
    /// </summary>
    public Guid FormId { get; set; }

    /// <summary>
    /// The visa type
    /// </summary>
    public int VisaTypeId { get; set; }

    /// <summary>
    /// Whether this form is required (true) or optional (false) for this visa type
    /// </summary>
    public bool IsRequired { get; set; } = true;

    /// <summary>
    /// Display order when showing forms for this visa type
    /// Lower numbers appear first
    /// </summary>
    public int DisplayOrder { get; set; }

    /// <summary>
    /// Special notes for this form-visa combination
    /// Example: "Required only for dependent spouses", "Needed if requesting premium processing"
    /// </summary>
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public UserId? CreatedByUserId { get; set; }
    public UserId? UpdatedByUserId { get; set; }

    // Navigation properties
    public USCISFormEntity Form { get; set; } = null!;
    public VisaType VisaType { get; set; } = null!;
    public User? CreatedByUser { get; set; }
    public User? UpdatedByUser { get; set; }
}
