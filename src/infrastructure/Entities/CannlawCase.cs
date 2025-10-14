using System.ComponentModel.DataAnnotations;

namespace L4H.Infrastructure.Entities;

public class CannlawCase
{
    public int Id { get; set; }
    
    public int ClientId { get; set; }
    public Client Client { get; set; } = null!;
    
    [Required]
    [MaxLength(100)]
    public string CaseType { get; set; } = string.Empty; // Immigration type
    
    public CaseStatus Status { get; set; } = CaseStatus.NotStarted;
    
    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;
    
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime? CompletionDate { get; set; }
    
    // Status tracking
    public List<CaseStatusHistory> StatusHistory { get; set; } = new();
    
    [MaxLength(2000)]
    public string Notes { get; set; } = string.Empty;
    
    // Government interaction
    [MaxLength(100)]
    public string GovernmentCaseNumber { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string RejectionReason { get; set; } = string.Empty; // For closed cases
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}