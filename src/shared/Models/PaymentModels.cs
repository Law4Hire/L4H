namespace L4H.Shared.Models;

// Request models
public class CreateCheckoutSessionRequest
{
    public CaseId CaseId { get; set; }
    public string SuccessUrl { get; set; } = string.Empty;
    public string CancelUrl { get; set; } = string.Empty;
}

public class ProcessRefundRequest
{
    public Guid InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public string Reason { get; set; } = string.Empty;
}

// Response models
public class CreateCheckoutSessionResponse
{
    public string SessionId { get; set; } = string.Empty;
    public string PaymentUrl { get; set; } = string.Empty;
    public List<string> Warnings { get; set; } = new();
}

public class ProcessRefundResponse
{
    public string RefundId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public List<string> Warnings { get; set; } = new();
}

public class PaymentWebhookResponse
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public List<string> Warnings { get; set; } = new();
}