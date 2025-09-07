using L4H.Api.Services.Providers;

namespace L4H.Api.Tests.Fakes;

public class FakeApiPaymentProvider : IPaymentProvider
{
    public bool SimulateFailure { get; set; } = false;

    public Task<CheckoutResult> CreateCheckoutSessionAsync(CheckoutRequest request)
    {
        if (SimulateFailure)
        {
            return Task.FromResult(new CheckoutResult
            {
                Success = false,
                ErrorMessage = "Simulated failure"
            });
        }

        return Task.FromResult(new CheckoutResult
        {
            Success = true,
            CheckoutUrl = "https://checkout.stripe.com/test",
            SessionId = "cs_test_123456789"
        });
    }

    public Task<RefundResult> ProcessRefundAsync(RefundRequest request)
    {
        if (SimulateFailure)
        {
            return Task.FromResult(new RefundResult
            {
                Success = false,
                ErrorMessage = "Simulated failure"
            });
        }

        return Task.FromResult(new RefundResult
        {
            Success = true,
            RefundId = "re_test_123456789"
        });
    }

    public Task<WebhookResult> ProcessWebhookAsync(WebhookRequest request)
    {
        if (SimulateFailure)
        {
            return Task.FromResult(new WebhookResult
            {
                Success = false,
                ErrorMessage = "Simulated failure"
            });
        }

        return Task.FromResult(new WebhookResult
        {
            Success = true,
            EventType = "payment_intent.succeeded",
            EventId = "evt_test_123456789"
        });
    }

    public Task<bool> VerifyWebhookSignatureAsync(string payload, string signature, CancellationToken cancellationToken = default)
    {
        // For testing, always return true unless signature is explicitly invalid
        if (signature == "t=1234567890,v1=invalid" || signature == "t=1234567890,v1=invalid_signature")
        {
            return Task.FromResult(false);
        }
        
        return Task.FromResult(true);
    }
}
