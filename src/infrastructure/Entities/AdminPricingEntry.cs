using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace L4H.Infrastructure.Entities;

/// <summary>
/// Simple pricing entries managed through the admin pricing page.
/// These are displayed on the public fees/pricing page.
/// </summary>
[Table("AdminPricingEntries")]
public class AdminPricingEntry
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string VisaType { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string PackageType { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Country { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "decimal(10,2)")]
    public decimal Price { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public Guid CreatedByUserId { get; set; }

    public Guid? UpdatedByUserId { get; set; }
}
