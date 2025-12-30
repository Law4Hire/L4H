using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace L4H.Infrastructure.Entities;

public enum ProfessionalType
{
    Lawyer = 1,
    Paralegal = 2,
    LegalAssistant = 3
}

public class Attorney
{
    public int Id { get; set; }

    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(255)]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Professional type for scheduling purposes.
    /// Determines if this professional can handle lawyer-only packages.
    /// </summary>
    public ProfessionalType ProfessionalType { get; set; } = ProfessionalType.Lawyer;
    
    public string Bio { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public Uri? PhotoUrl { get; set; }
    
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;
    
    [MaxLength(50)]
    public string Phone { get; set; } = string.Empty;
    
    public string Credentials { get; set; } = string.Empty; // JSON array
    public string PracticeAreas { get; set; } = string.Empty; // JSON array
    public string Languages { get; set; } = string.Empty; // JSON array
    
    // Enhanced fields for client billing system
    [MaxLength(50)]
    public string DirectPhone { get; set; } = string.Empty;
    
    [MaxLength(255)]
    public string DirectEmail { get; set; } = string.Empty;
    
    [MaxLength(255)]
    public string OfficeLocation { get; set; } = string.Empty;
    
    [Column(TypeName = "decimal(10,2)")]
    public decimal DefaultHourlyRate { get; set; }

    public bool IsActive { get; set; } = true;
    public bool IsManagingAttorney { get; set; }
    public int DisplayOrder { get; set; }
    
    // Navigation properties for client billing system
    [System.Text.Json.Serialization.JsonIgnore]
    public ICollection<Client> AssignedClients { get; } = new List<Client>();
    
    [System.Text.Json.Serialization.JsonIgnore]
    public ICollection<TimeEntry> TimeEntries { get; } = new List<TimeEntry>();
    
    [System.Text.Json.Serialization.JsonIgnore]
    public ICollection<BillingRate> BillingRates { get; } = new List<BillingRate>();
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}