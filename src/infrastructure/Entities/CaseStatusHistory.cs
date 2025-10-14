using System.ComponentModel.DataAnnotations;

namespace L4H.Infrastructure.Entities;

public class CaseStatusHistory
{
    public int Id { get; set; }
    
    public int CaseId { get; set; }
    public CannlawCase Case { get; set; } = null!;
    
    public CaseStatus FromStatus { get; set; }
    public CaseStatus ToStatus { get; set; }
    
    [MaxLength(1000)]
    public string Notes { get; set; } = string.Empty;
    
    [MaxLength(255)]
    public string ChangedBy { get; set; } = string.Empty;
    
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}