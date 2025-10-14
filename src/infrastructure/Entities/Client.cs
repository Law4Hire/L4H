using System.ComponentModel.DataAnnotations;

namespace L4H.Infrastructure.Entities;

public class Client
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;
    
    [MaxLength(50)]
    public string Phone { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string Address { get; set; } = string.Empty;
    
    public DateTime? DateOfBirth { get; set; }
    
    [MaxLength(100)]
    public string CountryOfOrigin { get; set; } = string.Empty;
    
    // Case Management
    public int? AssignedAttorneyId { get; set; }
    public Attorney? AssignedAttorney { get; set; }
    
    // Navigation properties
    public List<CannlawCase> Cases { get; set; } = new();
    public List<Document> Documents { get; set; } = new();
    public List<TimeEntry> TimeEntries { get; set; } = new();
    
    // Audit Fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    [MaxLength(255)]
    public string CreatedBy { get; set; } = string.Empty;
    
    [MaxLength(255)]
    public string UpdatedBy { get; set; } = string.Empty;
}