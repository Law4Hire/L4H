using System.Net;
using System.Net.Http;
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

public sealed class ProviderSelectionTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public ProviderSelectionTests(WebApplicationFactory<Program> factory)
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
    public async Task ProviderProbe_WithDefaultConfig_ShouldReturnFakeProviders()
    {
        // Arrange
        var token = await GetAdminTokenAsync();

        // Act
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var response = await _client.GetAsync("/v1/admin/providers");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        var providers = JsonSerializer.Deserialize<ProviderStatusResponse>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        providers.Should().NotBeNull();
        providers!.Payments.Should().Be("Fake");
        providers.Graph.Should().Be("Fake");
        providers.Meetings.Should().Be("Fake");
    }

    [Fact]
    public async Task ProviderProbe_WithLiveStripeConfig_ShouldReturnLiveStripe()
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
                });
            });
        });

        var client = factory.CreateClient();
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
        providers!.Payments.Should().Be("Live");
        providers.Graph.Should().Be("Fake");
        providers.Meetings.Should().Be("Fake");
    }

    [Fact]
    public async Task ProviderProbe_WithLiveGraphConfig_ShouldReturnLiveGraph()
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
            });
        });

        var client = factory.CreateClient();
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
        providers!.Payments.Should().Be("Fake");
        providers.Graph.Should().Be("Live");
        providers.Meetings.Should().Be("Fake");
    }

    [Fact]
    public async Task ProviderProbe_WithTeamsMeetingsConfig_ShouldReturnTeamsMeetings()
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
            });
        });

        var client = factory.CreateClient();
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
        providers!.Payments.Should().Be("Fake");
        providers.Graph.Should().Be("Fake");
        providers.Meetings.Should().Be("Teams");
    }

    [Fact]
    public async Task ProviderProbe_WithoutAdminToken_ShouldReturnUnauthorized()
    {
        // Act
        var response = await _client.GetAsync("/v1/admin/providers");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    private static async Task<string> GetAdminTokenAsync()
    {
        // For testing, return a mock JWT token with admin role
        return await Task.FromResult("mock-admin-jwt-token-for-testing");
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

public class ProviderStatusResponse
{
    public string Payments { get; set; } = string.Empty;
    public string Graph { get; set; } = string.Empty;
    public string Meetings { get; set; } = string.Empty;
}
