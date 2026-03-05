using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace L4H.Infrastructure.Entities;

public class AttorneyImage
{
    public Guid Id { get; set; }
    
    public int AttorneyId { get; set; }
    
    [ForeignKey(nameof(AttorneyId))]
    [System.Text.Json.Serialization.JsonIgnore]
    public Attorney? Attorney { get; set; }
    
    [Required]
    [MaxLength(500)]
    public string FileUrl { get; set; } = string.Empty;
    
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;
    
    [MaxLength(255)]
    public string AltText { get; set; } = string.Empty;
    
    public bool IsPrimary { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
