using System.ComponentModel.DataAnnotations;
using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class CaseStatusHistory
{
    public int Id { get; set; }
    
    public CaseId CaseId { get; set; }
    public Case Case { get; set; } = null!;
    
    public string FromStatus { get; set; } = string.Empty; // Was CaseStatus enum
    public string ToStatus { get; set; } = string.Empty; // Was CaseStatus enum
    
    [MaxLength(1000)]
    public string Notes { get; set; } = string.Empty;
    
    [MaxLength(255)]
    public string ChangedBy { get; set; } = string.Empty;
    
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}