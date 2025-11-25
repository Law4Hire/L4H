using System.Text.Json.Serialization;
namespace L4H.Infrastructure.Entities;

public class Package
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    /// <summary>
    /// Indicates whether this package requires appointments with lawyers only.
    /// When true, scheduling should only show lawyer availability.
    /// When false, scheduling can show both lawyer and paralegal availability.
    /// </summary>
    public bool RequiresLawyer { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [JsonIgnore]

    public ICollection<PricingRule> PricingRules { get; set; } = new List<PricingRule>();
    [JsonIgnore]

    public ICollection<Case> Cases { get; set; } = new List<Case>();
}