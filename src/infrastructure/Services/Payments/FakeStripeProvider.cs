namespace L4H.Infrastructure.Services.Payments;

public class FakeStripeProvider : IPaymentProvider
{
    public bool SimulateFailure { get; set; } = false;

    public Task<CheckoutSessionResponse> CreateCheckoutSessionAsync(CheckoutSessionRequest request, CancellationToken cancellationToken = default)
    {
        if (SimulateFailure)
        {
            throw new InvalidOperationException("Fake Stripe provider simulated failure");
        }

        var response = new CheckoutSessionResponse
        {
            SessionId = $"cs_fake_{Guid.NewGuid()}",
            PaymentUrl = "https://checkout.stripe.fake/session"
        };

        return Task.FromResult(response);
    }

    public Task<RefundResponse> RefundPaymentAsync(RefundRequest request, CancellationToken cancellationToken = default)
    {
        if (SimulateFailure)
        {
            throw new InvalidOperationException("Fake Stripe provider simulated failure");
        }

        var response = new RefundResponse
        {
            RefundId = $"re_fake_{Guid.NewGuid()}",
            Status = "succeeded",
            Amount = request.Amount
        };

        return Task.FromResult(response);
    }

    public Task<bool> VerifyWebhookSignatureAsync(string payload, string signature, CancellationToken cancellationToken = default)
    {
        // For fake provider, always return true unless simulating failure
        return Task.FromResult(!SimulateFailure);
    }
}