namespace L4H.Infrastructure.Entities;

public class PricingRule
{
    public int Id { get; set; }
    public int VisaTypeId { get; set; }
    public int PackageId { get; set; }
    public string CountryCode { get; set; } = string.Empty; // ISO-2
    public decimal BasePrice { get; set; }
    public string Currency { get; set; } = "USD";
    public string? FxSurchargeMode { get; set; }
    public decimal TaxRate { get; set; } = 0.0m;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public VisaType VisaType { get; set; } = null!;
    public Package Package { get; set; } = null!;
}