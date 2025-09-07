using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Localization;
using L4H.Api.Configuration;
using L4H.Api.Services.Providers;

namespace L4H.Api.Services.Providers;

public class StripeProvider : IPaymentProvider
{
    private readonly PaymentsOptions _options;
    private readonly IStringLocalizer<Shared> _localizer;
    private readonly ILogger<StripeProvider> _logger;

    public StripeProvider(
        IOptions<PaymentsOptions> options,
        IStringLocalizer<Shared> localizer,
        ILogger<StripeProvider> logger)
    {
        _options = options.Value;
        _localizer = localizer;
        _logger = logger;
    }

    public Task<CheckoutResult> CreateCheckoutSessionAsync(CheckoutRequest request)
    {
        try
        {
            _logger.LogInformation("Creating Stripe checkout session for case {CaseId}", request.CaseId);

            // In a real implementation, this would use the Stripe.NET SDK
            // For now, we'll simulate the API call
            var sessionId = $"cs_test_{Guid.NewGuid():N}";
            var checkoutUrl = $"https://checkout.stripe.com/pay/{sessionId}";

            _logger.LogInformation("Stripe checkout session created: {SessionId}", sessionId);

            return Task.FromResult(new CheckoutResult
            {
                Success = true,
                CheckoutUrl = checkoutUrl,
                SessionId = sessionId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create Stripe checkout session for case {CaseId}", request.CaseId);
            return Task.FromResult(new CheckoutResult
            {
                Success = false,
                ErrorMessage = _localizer["Payments.CheckoutFailed"]
            });
        }
    }

    public Task<RefundResult> ProcessRefundAsync(RefundRequest request)
    {
        try
        {
            _logger.LogInformation("Processing Stripe refund for payment {PaymentIntentId}", request.PaymentIntentId);

            // In a real implementation, this would use the Stripe.NET SDK
            var refundId = $"re_test_{Guid.NewGuid():N}";

            _logger.LogInformation("Stripe refund processed: {RefundId}", refundId);

            return Task.FromResult(new RefundResult
            {
                Success = true,
                RefundId = refundId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process Stripe refund for payment {PaymentIntentId}", request.PaymentIntentId);
            return Task.FromResult(new RefundResult
            {
                Success = false,
                ErrorMessage = _localizer["Payments.RefundFailed"]
            });
        }
    }

    public async Task<WebhookResult> ProcessWebhookAsync(WebhookRequest request)
    {
        try
        {
            _logger.LogInformation("Processing Stripe webhook");

            // Validate signature if not skipping validation
            if (!_options.Stripe.SkipSignatureValidation)
            {
                if (!ValidateWebhookSignature(request.Payload, request.Signature, request.WebhookSecret))
                {
                    _logger.LogWarning("Invalid Stripe webhook signature");
                    return new WebhookResult
                    {
                        Success = false,
                        ErrorMessage = _localizer["Payments.WebhookRejected"]
                    };
                }
            }

            // Parse the webhook payload
            var webhookData = JsonSerializer.Deserialize<StripeWebhookData>(request.Payload);
            if (webhookData == null)
            {
                _logger.LogWarning("Failed to parse Stripe webhook payload");
                return new WebhookResult
                {
                    Success = false,
                    ErrorMessage = _localizer["Payments.WebhookRejected"]
                };
            }

            _logger.LogInformation("Processing Stripe webhook event {EventType} with ID {EventId}", 
                webhookData.Type, webhookData.Id);

            // Process the webhook event
            var result = await ProcessWebhookEvent(webhookData).ConfigureAwait(false);

            _logger.LogInformation("Stripe webhook processed successfully: {EventId}", webhookData.Id);

            return new WebhookResult
            {
                Success = true,
                EventType = webhookData.Type,
                EventId = webhookData.Id
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process Stripe webhook");
            return new WebhookResult
            {
                Success = false,
                ErrorMessage = _localizer["Payments.WebhookRejected"]
            };
        }
    }

    private static bool ValidateWebhookSignature(string payload, string signature, string secret)
    {
        try
        {
            var elements = signature.Split(',');
            var timestamp = elements.FirstOrDefault(e => e.StartsWith("t="))?.Substring(2);
            var signatureHash = elements.FirstOrDefault(e => e.StartsWith("v1="))?.Substring(3);

            if (string.IsNullOrEmpty(timestamp) || string.IsNullOrEmpty(signatureHash))
            {
                return false;
            }

            var signedPayload = $"{timestamp}.{payload}";
            var expectedSignature = ComputeHmacSha256(signedPayload, secret);

            return signatureHash.Equals(expectedSignature, StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }

    private static string ComputeHmacSha256(string payload, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private async Task<bool> ProcessWebhookEvent(StripeWebhookData webhookData)
    {
        return webhookData.Type switch
        {
            "checkout.session.completed" => await ProcessCheckoutCompleted(webhookData).ConfigureAwait(false),
            "charge.refunded" => await ProcessChargeRefunded(webhookData).ConfigureAwait(false),
            "refund.updated" => await ProcessRefundUpdated(webhookData).ConfigureAwait(false),
            _ => true // Ignore unknown event types
        };
    }

    private async Task<bool> ProcessCheckoutCompleted(StripeWebhookData webhookData)
    {
        _logger.LogInformation("Processing checkout.session.completed event");
        // In a real implementation, this would update the case payment status
        return await Task.FromResult(true).ConfigureAwait(false);
    }

    private async Task<bool> ProcessChargeRefunded(StripeWebhookData webhookData)
    {
        _logger.LogInformation("Processing charge.refunded event");
        // In a real implementation, this would update the case refund status
        return await Task.FromResult(true).ConfigureAwait(false);
    }

    private async Task<bool> ProcessRefundUpdated(StripeWebhookData webhookData)
    {
        _logger.LogInformation("Processing refund.updated event");
        // In a real implementation, this would update the refund status
        return await Task.FromResult(true).ConfigureAwait(false);
    }

    public Task<bool> VerifyWebhookSignatureAsync(string payload, string signature, CancellationToken cancellationToken = default)
    {
        try
        {
            var secret = _options.Stripe.WebhookSecret;
            if (string.IsNullOrEmpty(secret))
            {
                _logger.LogWarning("Stripe webhook secret not configured");
                return Task.FromResult(false);
            }

            var isValid = ValidateWebhookSignature(payload, signature, secret);
            return Task.FromResult(isValid);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying Stripe webhook signature");
            return Task.FromResult(false);
        }
    }
}

public class StripeWebhookData
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public JsonElement Data { get; set; }
}
