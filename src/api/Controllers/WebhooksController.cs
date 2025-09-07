using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;
using L4H.Api.Configuration;
using L4H.Api.Services.Providers;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using System.Text.Json;

namespace L4H.Api.Controllers;

[ApiController]
[Route("webhooks")]
[Tags("Webhooks")]
public class WebhooksController : ControllerBase
{
    private readonly L4H.Api.Services.Providers.IPaymentProvider _paymentProvider;
    private readonly IStringLocalizer<Shared> _localizer;
    private readonly ILogger<WebhooksController> _logger;
    private readonly L4HDbContext _context;
    private readonly PaymentsOptions _paymentsOptions;

    public WebhooksController(
        L4H.Api.Services.Providers.IPaymentProvider paymentProvider,
        IStringLocalizer<Shared> localizer,
        ILogger<WebhooksController> logger,
        L4HDbContext context,
        IOptions<PaymentsOptions> paymentsOptions)
    {
        _paymentProvider = paymentProvider;
        _localizer = localizer;
        _logger = logger;
        _context = context;
        _paymentsOptions = paymentsOptions.Value;
    }

    [HttpPost("stripe")]
    public async Task<IActionResult> StripeWebhook()
    {
        try
        {
            // Read the raw body
            using var reader = new StreamReader(Request.Body);
            var payload = await reader.ReadToEndAsync().ConfigureAwait(false);

            // Get the signature from headers
            var signature = Request.Headers["Stripe-Signature"].FirstOrDefault();

            // Verify signature if not in test mode
            if (!_paymentsOptions.Stripe.SkipSignatureValidation && !string.IsNullOrEmpty(signature))
            {
                var isValid = await _paymentProvider.VerifyWebhookSignatureAsync(payload, signature).ConfigureAwait(false);
                if (!isValid)
                {
                    _logger.LogWarning("Invalid Stripe webhook signature");
                    return BadRequest(new { message = _localizer["Payments.WebhookRejected"] });
                }
            }

            // Parse the webhook event
            var webhookEvent = JsonSerializer.Deserialize<JsonElement>(payload);
            var eventId = webhookEvent.GetProperty("id").GetString() ?? "";
            var eventType = webhookEvent.GetProperty("type").GetString() ?? "";

            // Check for duplicate events
            var existingEvent = await _context.WebhookEvents
                .FirstOrDefaultAsync(e => e.StripeEventId == eventId).ConfigureAwait(false);

            if (existingEvent != null)
            {
                _logger.LogInformation("Duplicate webhook event {EventId} ignored", eventId);
                return Ok(new { message = _localizer["Payments.WebhookIgnored"] });
            }

            // Store the webhook event
            var webhookEventEntity = new WebhookEvent
            {
                StripeEventId = eventId,
                EventType = eventType,
                Status = WebhookEventStatus.Pending,
                ReceivedAt = DateTime.UtcNow
            };

            _context.WebhookEvents.Add(webhookEventEntity);

            // Process the event based on type
            string message;
            switch (eventType)
            {
                case "checkout.session.completed":
                    message = _localizer["Payments.CheckoutCompleted"];
                    break;
                case "charge.refunded":
                    message = _localizer["Payments.RefundProcessed"];
                    break;
                default:
                    message = _localizer["Payments.WebhookProcessed"];
                    break;
            }

            // Mark as processed
            webhookEventEntity.Status = WebhookEventStatus.Processed;
            webhookEventEntity.ProcessedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync().ConfigureAwait(false);

            _logger.LogInformation("Stripe webhook {EventType} processed successfully", eventType);
            return Ok(new { message });
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Invalid JSON in Stripe webhook");
            return BadRequest(new { message = _localizer["Payments.WebhookRejected"] });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Stripe webhook");
            return StatusCode(500, new { message = _localizer["Payments.WebhookError"] });
        }
    }
}