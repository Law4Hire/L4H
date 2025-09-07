namespace L4H.Infrastructure.Services.Payments;

public enum WebhookEventStatus
{
    Pending,
    Processed,
    Failed
}

public enum PaymentStatus
{
    Pending,
    Succeeded,
    Failed,
    Canceled
}

public class CheckoutSessionRequest
{
    public required string InvoiceNumber { get; set; }
    public required string Currency { get; set; }
    public decimal Amount { get; set; }
    public required string SuccessUrl { get; set; }
    public required string CancelUrl { get; set; }
}

public class CheckoutSessionResponse
{
    public required string SessionId { get; set; }
    public required string PaymentUrl { get; set; }
}

public class RefundRequest
{
    public required string PaymentIntentId { get; set; }
    public decimal Amount { get; set; }
    public required string Reason { get; set; }
}

public class RefundResponse
{
    public required string RefundId { get; set; }
    public required string Status { get; set; }
    public decimal Amount { get; set; }
}

public interface IPaymentProvider
{
    Task<CheckoutSessionResponse> CreateCheckoutSessionAsync(CheckoutSessionRequest request, CancellationToken cancellationToken = default);
    Task<RefundResponse> RefundPaymentAsync(RefundRequest request, CancellationToken cancellationToken = default);
    Task<bool> VerifyWebhookSignatureAsync(string payload, string signature, CancellationToken cancellationToken = default);
}