using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class Payment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid InvoiceId { get; set; }
    public string StripePaymentIntentId { get; set; } = string.Empty;
    public string? StripeCheckoutSessionId { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string Currency { get; set; } = "USD";
    public decimal Amount { get; set; }
    public DateTimeOffset? PaidAt { get; set; }
    public string? FailureReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Invoice Invoice { get; set; } = null!;
}