using System.Net;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;
using Xunit;
using FluentAssertions;
using L4H.Api.Configuration;
using L4H.Api.Services;
using L4H.Api.Tests;

namespace L4H.Api.Tests.Providers;

public sealed class StripeWebhookTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public StripeWebhookTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureServices(services =>
            {
                TestServiceRegistration.RegisterTestServices(services);
            });
        });
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task Webhook_WithValidSignatureInLiveMode_ShouldProcessEvent()
    {
        // Arrange
        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.Configure<PaymentsOptions>(options =>
                {
                    options.Stripe.Mode = "Live";
                    options.Stripe.WebhookSecret = "whsec_test_secret";
                    options.Stripe.SkipSignatureValidation = false;
                });
            });
        });

        var client = factory.CreateClient();
        var payload = CreateCheckoutSessionCompletedPayload();
        var signature = CreateValidSignature(payload, "whsec_test_secret");

        // Act
        var response = await client.PostAsync("/webhooks/stripe", 
            new StringContent(payload, Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Webhook_WithInvalidSignatureInLiveMode_ShouldReturnBadRequest()
    {
        // Arrange
        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.Configure<PaymentsOptions>(options =>
                {
                    options.Stripe.Mode = "Live";
                    options.Stripe.WebhookSecret = "whsec_test_secret";
                    options.Stripe.SkipSignatureValidation = false;
                });
            });
        });

        var client = factory.CreateClient();
        var payload = CreateCheckoutSessionCompletedPayload();
        var invalidSignature = "t=1234567890,v1=invalid_signature";

        // Act
        client.DefaultRequestHeaders.Add("Stripe-Signature", invalidSignature);
        var response = await client.PostAsync("/webhooks/stripe", 
            new StringContent(payload, Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Webhook_WithSkipSignatureValidation_ShouldProcessEvent()
    {
        // Arrange
        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.Configure<PaymentsOptions>(options =>
                {
                    options.Stripe.Mode = "Live";
                    options.Stripe.SkipSignatureValidation = true;
                });
            });
        });

        var client = factory.CreateClient();
        var payload = CreateCheckoutSessionCompletedPayload();

        // Act
        var response = await client.PostAsync("/webhooks/stripe", 
            new StringContent(payload, Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Webhook_WithDuplicateEvent_ShouldProcessThenIgnore()
    {
        // Arrange
        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.Configure<PaymentsOptions>(options =>
                {
                    options.Stripe.Mode = "Live";
                    options.Stripe.SkipSignatureValidation = true;
                });
            });
        });

        var client = factory.CreateClient();
        var uniqueId = "evt_test_duplicate_" + Guid.NewGuid().ToString("N")[..8];
        var payload = JsonSerializer.Serialize(new
        {
            id = uniqueId,
            type = "checkout.session.completed",
            data = new
            {
                @object = new
                {
                    id = "cs_test_123",
                    payment_status = "paid",
                    amount_total = 5000,
                    currency = "usd",
                    metadata = new
                    {
                        caseId = "test-case-id"
                    }
                }
            }
        });

        // Act - First call
        var response1 = await client.PostAsync("/webhooks/stripe", 
            new StringContent(payload, Encoding.UTF8, "application/json"));

        // Act - Second call with same event
        var response2 = await client.PostAsync("/webhooks/stripe", 
            new StringContent(payload, Encoding.UTF8, "application/json"));

        // Assert
        response1.StatusCode.Should().Be(HttpStatusCode.OK);
        response2.StatusCode.Should().Be(HttpStatusCode.OK);
        
        // Verify idempotency - second call should be ignored
        var content1 = await response1.Content.ReadAsStringAsync();
        var content2 = await response2.Content.ReadAsStringAsync();
        
        content1.Should().Contain("completed");
        content2.Should().Contain("ignored");
    }

    [Fact]
    public async Task Webhook_WithRefundEvent_ShouldProcessRefund()
    {
        // Arrange
        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.Configure<PaymentsOptions>(options =>
                {
                    options.Stripe.Mode = "Live";
                    options.Stripe.SkipSignatureValidation = true;
                });
            });
        });

        var client = factory.CreateClient();
        var payload = CreateRefundUpdatedPayload();

        // Act
        var response = await client.PostAsync("/webhooks/stripe", 
            new StringContent(payload, Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("processed");
    }

    [Fact]
    public async Task Webhook_WithLocalizedError_ShouldReturnLocalizedMessage()
    {
        // Arrange
        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.Configure<PaymentsOptions>(options =>
                {
                    options.Stripe.Mode = "Live";
                    options.Stripe.SkipSignatureValidation = false;
                });
            });
        });

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Accept-Language", "es-ES");
        
        var payload = "invalid json";

        // Act
        var response = await client.PostAsync("/webhooks/stripe", 
            new StringContent(payload, Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("rechazado"); // Spanish for "rejected"
    }

    private static string CreateCheckoutSessionCompletedPayload()
    {
        return JsonSerializer.Serialize(new
        {
            id = "evt_test_webhook_" + Guid.NewGuid().ToString("N")[..8],
            type = "checkout.session.completed",
            data = new
            {
                @object = new
                {
                    id = "cs_test_123",
                    payment_status = "paid",
                    amount_total = 5000,
                    currency = "usd",
                    metadata = new
                    {
                        caseId = "test-case-id"
                    }
                }
            }
        });
    }

    private static string CreateRefundUpdatedPayload()
    {
        return JsonSerializer.Serialize(new
        {
            id = "evt_test_refund_" + Guid.NewGuid().ToString("N")[..8],
            type = "charge.refunded",
            data = new
            {
                @object = new
                {
                    id = "ch_test_123",
                    refunded = true,
                    amount_refunded = 5000,
                    currency = "usd"
                }
            }
        });
    }

    private static string CreateValidSignature(string payload, string secret)
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var signedPayload = $"{timestamp}.{payload}";
        var signature = ComputeHmacSha256(signedPayload, secret);
        return $"t={timestamp},v1={signature}";
    }

    private static string ComputeHmacSha256(string payload, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    private void Dispose(bool disposing)
    {
        if (disposing)
        {
            _client?.Dispose();
        }
    }
}
