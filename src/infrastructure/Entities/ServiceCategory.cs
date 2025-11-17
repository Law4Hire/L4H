using System.ComponentModel.DataAnnotations;

using System.Text.Json.Serialization;

namespace L4H.Infrastructure.Entities;

public class ServiceCategory
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    public string Description { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string IconUrl { get; set; } = string.Empty;
    
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [JsonIgnore]

    public ICollection<LegalService> Services { get; set; } = new List<LegalService>();
}

public class LegalService
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    public string Description { get; set; } = string.Empty;
    
    public int ServiceCategoryId { get; set; }
    [JsonIgnore]

    public ServiceCategory ServiceCategory { get; set; } = null!;
    
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}