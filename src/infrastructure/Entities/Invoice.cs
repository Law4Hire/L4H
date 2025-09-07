using L4H.Shared.Models;
using System.ComponentModel.DataAnnotations;

namespace L4H.Infrastructure.Entities;

public class Invoice
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public CaseId CaseId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public int SequentialNumber { get; set; }
    public int Year { get; set; }
    public string Currency { get; set; } = "USD";
    public decimal Total { get; set; }
    public string Status { get; set; } = "draft";
    public string? StripeCheckoutSessionId { get; set; }
    public DateTimeOffset? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Case Case { get; set; } = null!;
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<Refund> Refunds { get; set; } = new List<Refund>();
}