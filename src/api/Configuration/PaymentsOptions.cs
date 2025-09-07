namespace L4H.Api.Configuration;

public class PaymentsOptions
{
    public const string SectionName = "Payments";

    public StripeOptions Stripe { get; set; } = new();
    public string SuccessUrl { get; set; } = string.Empty;
    public string CancelUrl { get; set; } = string.Empty;
}

public class StripeOptions
{
    public const string SectionName = "Stripe";

    public string Mode { get; set; } = "Fake";
    public string SecretKey { get; set; } = string.Empty;
    public string WebhookSecret { get; set; } = string.Empty;
    public bool SkipSignatureValidation { get; set; } = true;
}
