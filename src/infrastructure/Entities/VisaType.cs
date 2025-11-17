using System.Text.Json.Serialization;
namespace L4H.Infrastructure.Entities;

public class VisaType
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [JsonIgnore]

    public ICollection<PricingRule> PricingRules { get; set; } = new List<PricingRule>();
    [JsonIgnore]

    public ICollection<Case> Cases { get; set; } = new List<Case>();
}