namespace L4H.Shared.Models;

public enum PaymentMode
{
    Fake,
    Live
}

public class PaymentOptions
{
    public PaymentMode Mode { get; set; } = PaymentMode.Fake;
    public string? StripePublishableKey { get; set; }
    public string? StripeSecretKey { get; set; }
    public string? WebhookSecret { get; set; }
}