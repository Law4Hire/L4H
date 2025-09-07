using L4H.Api.Models;

namespace L4H.Api.Services.Providers;

public interface IPaymentProvider
{
    Task<CheckoutResult> CreateCheckoutSessionAsync(CheckoutRequest request);
    Task<RefundResult> ProcessRefundAsync(RefundRequest request);
    Task<WebhookResult> ProcessWebhookAsync(WebhookRequest request);
    Task<bool> VerifyWebhookSignatureAsync(string payload, string signature, CancellationToken cancellationToken = default);
}

public class CheckoutRequest
{
    public string CaseId { get; set; } = string.Empty;
    public long Amount { get; set; }
    public string Currency { get; set; } = "usd";
    public string SuccessUrl { get; set; } = string.Empty;
    public string CancelUrl { get; set; } = string.Empty;
}

public class CheckoutResult
{
    public bool Success { get; set; }
    public string? CheckoutUrl { get; set; }
    public string? SessionId { get; set; }
    public string? ErrorMessage { get; set; }
}

public class RefundRequest
{
    public string PaymentIntentId { get; set; } = string.Empty;
    public long Amount { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class RefundResult
{
    public bool Success { get; set; }
    public string? RefundId { get; set; }
    public string? ErrorMessage { get; set; }
}

public class WebhookRequest
{
    public string Payload { get; set; } = string.Empty;
    public string Signature { get; set; } = string.Empty;
    public string WebhookSecret { get; set; } = string.Empty;
}

public class WebhookResult
{
    public bool Success { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string EventId { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
}
