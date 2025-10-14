using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace L4H.Infrastructure.Entities;

public class BillingRate
{
    public int Id { get; set; }
    
    public int AttorneyId { get; set; }
    public Attorney Attorney { get; set; } = null!;
    
    [Required]
    [MaxLength(100)]
    public string ServiceType { get; set; } = string.Empty; // e.g., "Consultation", "Document Preparation", "Court Representation"
    
    [Column(TypeName = "decimal(10,2)")]
    public decimal HourlyRate { get; set; }
    
    public DateTime EffectiveDate { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiryDate { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    [MaxLength(500)]
    public string Notes { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    [MaxLength(255)]
    public string CreatedBy { get; set; } = string.Empty;
    
    [MaxLength(255)]
    public string UpdatedBy { get; set; } = string.Empty;
}