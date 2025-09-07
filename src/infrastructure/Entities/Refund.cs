using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class Refund
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid InvoiceId { get; set; }
    public required string StripeRefundId { get; set; }
    public required string Status { get; set; }
    public required string Currency { get; set; }
    public decimal Amount { get; set; }
    public required string Reason { get; set; }
    public DateTimeOffset? ProcessedAt { get; set; }
    public string? FailureReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Invoice Invoice { get; set; } = null!;
}