using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

/// <summary>
/// Junction table for many-to-many relationship between Cases and VisaTypes
/// Allows a case to have up to 5 different visa types
/// </summary>
[Table("CaseVisaTypes")]
public class CaseVisaType
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public CaseId CaseId { get; set; }

    public int VisaTypeId { get; set; }

    /// <summary>
    /// Display order (1-5) for this visa type in the case
    /// </summary>
    [Range(1, 5)]
    public int DisplayOrder { get; set; } = 1;

    /// <summary>
    /// Whether this visa type is the primary one for the case
    /// </summary>
    public bool IsPrimary { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Case Case { get; set; } = null!;
    public VisaType VisaType { get; set; } = null!;
}
