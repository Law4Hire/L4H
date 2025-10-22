using System.ComponentModel.DataAnnotations;

namespace L4H.Infrastructure.Entities;

public class TranslationPerformanceMetric
{
    [Key]
    public string Id { get; set; } = string.Empty;
    
    public DateTime Timestamp { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(10)]
    public string Language { get; set; } = string.Empty;
    
    public double LoadTime { get; set; }
    
    public bool Success { get; set; }
    
    public string? Metadata { get; set; } // JSON
}