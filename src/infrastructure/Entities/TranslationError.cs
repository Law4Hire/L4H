using System.ComponentModel.DataAnnotations;

namespace L4H.Infrastructure.Entities;

public class TranslationError
{
    [Key]
    public string Id { get; set; } = string.Empty;
    
    public DateTime Timestamp { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(20)]
    public string Severity { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(10)]
    public string Language { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string Namespace { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string Key { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(1000)]
    public string Message { get; set; } = string.Empty;
    
    [MaxLength(200)]
    public string Context { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string UserAgent { get; set; } = string.Empty;
    
    [MaxLength(2000)]
    public string Url { get; set; } = string.Empty;
    
    public bool Resolved { get; set; }
    
    public string? StackTrace { get; set; }
    
    public string? Metadata { get; set; } // JSON
}