using System.ComponentModel.DataAnnotations;

namespace L4H.Infrastructure.Entities;

public class MonitoringAlert
{
    [Key]
    public string Id { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string RuleId { get; set; } = string.Empty;
    
    public DateTime Timestamp { get; set; }
    
    [Required]
    [MaxLength(20)]
    public string Severity { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(1000)]
    public string Message { get; set; } = string.Empty;
    
    public string? Data { get; set; } // JSON
    
    public bool Acknowledged { get; set; }
    
    public DateTime? ResolvedAt { get; set; }
}