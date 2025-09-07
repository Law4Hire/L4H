using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Localization;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;
using Xunit;
using FluentAssertions;
using L4H.Api.Configuration;
using L4H.Api.Services.Providers;
using L4H.Api.Tests;
using L4H.Api.Tests.Fakes;

namespace L4H.Api.Tests.Providers;

public sealed class I18nProviderTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public I18nProviderTests(WebApplicationFactory<Program> factory)
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
    public async Task PaymentsWebhook_WithSpanishLocale_ShouldReturnLocalizedMessage()
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
        client.DefaultRequestHeaders.Add("Accept-Language", "es-ES");
        
        var payload = JsonSerializer.Serialize(new
        {
            id = "evt_test_webhook_i18n_" + Guid.NewGuid().ToString("N")[..8],
            type = "checkout.session.completed",
            data = new { @object = new { id = "cs_test_123" } }
        });

        // Act
        var response = await client.PostAsync("/webhooks/stripe", 
            new StringContent(payload, Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("completado"); // Spanish for "completed"
    }

    [Fact]
    public async Task GraphMail_WithSpanishLocale_ShouldReturnLocalizedMessage()
    {
        // Arrange
        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.Configure<GraphOptions>(options =>
                {
                    options.Mode = "Live";
                    options.TenantId = "test-tenant";
                    options.ClientId = "test-client";
                    options.ClientSecret = "test-secret";
                });
                
                services.AddScoped<IGraphMailProvider, TestGraphMailProvider>();
            });
        });

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Accept-Language", "es-ES");
        var token = await GetAdminTokenAsync();

        // Act
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var response = await client.PostAsync("/v1/admin/graph/test-mail", 
            new StringContent("{}", Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("enviado"); // Spanish for "sent"
    }

    [Fact]
    public async Task TeamsMeetings_WithSpanishLocale_ShouldReturnLocalizedMessage()
    {
        // Arrange
        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.Configure<MeetingsOptions>(options =>
                {
                    options.Mode = "Teams";
                });
                
                services.AddScoped<L4H.Api.Services.Providers.IMeetingsProvider, FakeApiMeetingsProvider>();
            });
        });

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Accept-Language", "es-ES");
        var token = await GetStaffTokenAsync();

        var startTime = DateTime.UtcNow.AddDays(1);
        var appointmentRequest = new
        {
            subject = "Test Meeting",
            startTime = startTime,
            endTime = startTime.AddHours(1),
            attendees = new[] { "test@example.com" }
        };

        // Act
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var response = await client.PostAsync("/v1/meetings", 
            new StringContent(JsonSerializer.Serialize(appointmentRequest), System.Text.Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("creada"); // Spanish for "created" (feminine form)
    }

    [Fact]
    public async Task ProviderProbe_WithSpanishLocale_ShouldReturnLocalizedProviderNames()
    {
        // Arrange
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("Accept-Language", "es-ES");
        var token = await GetAdminTokenAsync();

        // Act
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var response = await client.GetAsync("/v1/admin/providers");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        var providers = JsonSerializer.Deserialize<ProviderStatusResponse>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        providers.Should().NotBeNull();
        providers!.Payments.Should().Be("Falso"); // Spanish for "Fake"
        providers.Graph.Should().Be("Falso");
        providers.Meetings.Should().Be("Falso");
    }

    [Fact]
    public async Task StripeCheckout_WithSpanishLocale_ShouldReturnLocalizedUrls()
    {
        // Arrange
        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.Configure<PaymentsOptions>(options =>
                {
                    options.Stripe.Mode = "Live";
                    options.Stripe.SecretKey = "sk_live_test";
                    options.SuccessUrl = "https://l4h.localhost/payment/success";
                    options.CancelUrl = "https://l4h.localhost/payment/cancel";
                });
            });
        });

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Accept-Language", "es-ES");
        var token = await GetUserTokenAsync();

        var checkoutRequest = new
        {
            caseId = Guid.NewGuid().ToString(),
            amount = 5000,
            currency = "usd"
        };

        // Act
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var response = await client.PostAsync("/v1/payments/checkout", 
            new StringContent(JsonSerializer.Serialize(checkoutRequest), System.Text.Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<CheckoutResponse>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        result.Should().NotBeNull();
        result!.SuccessUrl.Should().Contain("success");
        result.CancelUrl.Should().Contain("cancel");
    }

    private static async Task<string> GetAdminTokenAsync()
    {
        return await Task.FromResult("mock-admin-jwt-token-for-testing");
    }

    private static async Task<string> GetStaffTokenAsync()
    {
        return await Task.FromResult("mock-staff-jwt-token-for-testing");
    }

    private static async Task<string> GetUserTokenAsync()
    {
        return await Task.FromResult("mock-user-jwt-token-for-testing");
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

public class CheckoutResponse
{
    public string CheckoutUrl { get; set; } = string.Empty;
    public string SuccessUrl { get; set; } = string.Empty;
    public string CancelUrl { get; set; } = string.Empty;
}
