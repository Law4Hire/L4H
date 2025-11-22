using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace L4H.Infrastructure.Entities;

public class Attorney
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(255)]
    public string Title { get; set; } = string.Empty;
    
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
    public decimal DefaultHourlyRate { get; set; } = 0;
    
    public bool IsActive { get; set; } = true;
    public bool IsManagingAttorney { get; set; } = false;
    public int DisplayOrder { get; set; }
    
    // Navigation properties for client billing system
    public ICollection<Client> AssignedClients { get; } = new List<Client>();
    public ICollection<TimeEntry> TimeEntries { get; } = new List<TimeEntry>();
    public ICollection<BillingRate> BillingRates { get; } = new List<BillingRate>();
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}