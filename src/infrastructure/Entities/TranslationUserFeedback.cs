using System.ComponentModel.DataAnnotations;

namespace L4H.Infrastructure.Entities;

public class TranslationUserFeedback
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
    
    [MaxLength(100)]
    public string? Namespace { get; set; }
    
    [MaxLength(500)]
    public string? Key { get; set; }
    
    public int? Rating { get; set; }
    
    [MaxLength(2000)]
    public string? Comment { get; set; }
    
    [MaxLength(500)]
    public string UserAgent { get; set; } = string.Empty;
    
    [MaxLength(2000)]
    public string Url { get; set; } = string.Empty;
    
    public string? Metadata { get; set; } // JSON
}