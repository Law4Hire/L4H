using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class CasePriceSnapshot
{
    public int Id { get; set; }
    public CaseId CaseId { get; set; }
    public string VisaTypeCode { get; set; } = string.Empty;
    public string PackageCode { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public string BreakdownJson { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string Currency { get; set; } = "USD";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Case Case { get; set; } = null!;
}