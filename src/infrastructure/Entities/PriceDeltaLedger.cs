using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class PriceDeltaLedger
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public CaseId CaseId { get; set; }
    public Guid? VisaChangeRequestId { get; set; }
    public string Type { get; set; } = string.Empty; // charge, refund
    public PriceDeltaDirection Direction { get; set; } = PriceDeltaDirection.Increase;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string Description { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public PriceDeltaStatus Status { get; set; } = PriceDeltaStatus.Pending;
    public UserId? ApprovedByUserId { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? StripePaymentIntentId { get; set; }
    public string? StripeRefundId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }
    public string? ProcessorResponse { get; set; }

    // Navigation properties
    public Case Case { get; set; } = null!;
    public VisaChangeRequest? VisaChangeRequest { get; set; }
    public User? ApprovedByUser { get; set; }
}