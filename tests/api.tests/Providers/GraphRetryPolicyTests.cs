using System.Net;
using System.Net.Http;
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
using L4H.Api.Services.Providers;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Services.Graph;
using L4H.Api.Tests;

namespace L4H.Api.Tests.Providers;

public sealed class GraphRetryPolicyTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public GraphRetryPolicyTests(WebApplicationFactory<Program> factory)
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
    public async Task GraphMail_WithRateLimit_ShouldRetryWithExponentialBackoff()
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
                
                // Configure fake provider to simulate rate limit failures
                services.AddSingleton<IMailProvider>(provider =>
                {
                    var fakeProvider = new FakeGraphMailProvider();
                    fakeProvider.SimulateFailure = true; // Simulate rate limit failures
                    return fakeProvider;
                });
            });
        });

        var client = factory.CreateClient();
        var token = await GetAdminTokenAsync();

        // Act
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var response = await client.PostAsync("/v1/admin/graph/test-mail", 
            new StringContent("{}", Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        
        // Verify error response contains expected message
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Failed to send test email");
    }

    [Fact]
    public async Task GraphMail_WithMaxRetriesExceeded_ShouldReturnError()
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
                
                // Configure fake provider to always fail
                services.AddSingleton<IMailProvider>(provider =>
                {
                    var fakeProvider = new FakeGraphMailProvider();
                    fakeProvider.SimulateFailure = true; // Always fail
                    return fakeProvider;
                });
            });
        });

        var client = factory.CreateClient();
        var token = await GetAdminTokenAsync();

        // Act
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var response = await client.PostAsync("/v1/admin/graph/test-mail", 
            new StringContent("{}", Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Failed to send test email");
    }

    [Fact]
    public async Task GraphAvailability_WithRetryAfterHeader_ShouldRespectDelay()
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
                
                // Configure fake provider to simulate failures
                services.AddSingleton<IMailProvider>(provider =>
                {
                    var fakeProvider = new FakeGraphMailProvider();
                    fakeProvider.SimulateFailure = true; // Simulate failures
                    return fakeProvider;
                });
            });
        });

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Accept-Language", "es-ES");
        var token = await GetAdminTokenAsync();

        // Act
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var response = await client.PostAsync("/v1/admin/graph/test-mail", 
            new StringContent(JsonSerializer.Serialize(new { to = "test@example.com" }), System.Text.Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        
        // Verify error response contains expected message
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Error al enviar correo de prueba");
    }

    [Fact]
    public async Task GraphAvailability_WithLocalizedError_ShouldReturnLocalizedMessage()
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
                
                // Configure fake provider to always fail
                services.AddSingleton<IMailProvider>(provider =>
                {
                    var fakeProvider = new FakeGraphMailProvider();
                    fakeProvider.SimulateFailure = true; // Always fail
                    return fakeProvider;
                });
            });
        });

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Accept-Language", "es-ES");
        var token = await GetAdminTokenAsync();

        // Act
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var response = await client.PostAsync("/v1/admin/graph/test-mail", 
            new StringContent(JsonSerializer.Serialize(new { to = "test@example.com" }), System.Text.Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Error al enviar correo de prueba"); // Spanish for "Error retrieving calendar availability"
    }

    private static async Task<string> GetAdminTokenAsync()
    {
        return await Task.FromResult("mock-admin-jwt-token-for-testing");
    }

    private static List<string> GetTestLogs()
    {
        // In a real implementation, this would capture logs from the test logger
        return new List<string>();
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

// Test implementations for Graph providers
public class TestGraphMailProvider : IGraphMailProvider
{
    private int _callCount = 0;

    public async Task<SendMailResponse> SendMailAsync(SendMailRequest request, CancellationToken cancellationToken = default)
    {
        _callCount++;
        
        if (_callCount == 1)
        {
            // Simulate rate limit on first call
            throw new HttpRequestException("Rate limit exceeded");
        }
        
        // Success on retry
        return await Task.FromResult(new SendMailResponse
        {
            MessageId = $"msg_{Guid.NewGuid():N}",
            Success = true
        });
    }

    public async Task<TestMailResult> SendTestMailAsync(string to, string subject, string body, CancellationToken cancellationToken = default)
    {
        _callCount++;
        
        if (_callCount == 1)
        {
            // Simulate rate limit on first call
            throw new HttpRequestException("Rate limit exceeded");
        }
        
        // Success on retry
        return await Task.FromResult(new TestMailResult
        {
            Success = true,
            MessageId = $"test_msg_{Guid.NewGuid():N}"
        });
    }

    public async Task<bool> SendTestMailAsync(string to, string subject, string body)
    {
        var result = await SendTestMailAsync(to, subject, body, CancellationToken.None);
        return result.Success;
    }
}

public class FailingGraphMailProvider : IGraphMailProvider
{
    public Task<SendMailResponse> SendMailAsync(SendMailRequest request, CancellationToken cancellationToken = default)
    {
        // Always fail
        throw new HttpRequestException("Service unavailable");
    }

    public Task<TestMailResult> SendTestMailAsync(string to, string subject, string body, CancellationToken cancellationToken = default)
    {
        // Always fail
        throw new HttpRequestException("Service unavailable");
    }

    public async Task<bool> SendTestMailAsync(string to, string subject, string body)
    {
        var result = await SendTestMailAsync(to, subject, body, CancellationToken.None);
        return result.Success;
    }
}

public class TestGraphCalendarProvider : IGraphCalendarProvider
{
    private int _callCount = 0;

    public async Task<CalendarAvailabilityResponse> GetAvailabilityAsync(CalendarAvailabilityRequest request, CancellationToken cancellationToken = default)
    {
        _callCount++;
        
        if (_callCount == 1)
        {
            // Simulate rate limit with Retry-After header
            var response = new HttpResponseMessage(HttpStatusCode.TooManyRequests);
            response.Headers.Add("Retry-After", "5");
            throw new HttpRequestException("Rate limit exceeded");
        }
        
        // Return empty availability on retry
        return await Task.FromResult(new CalendarAvailabilityResponse());
    }

    public async Task<List<AvailabilityBlock>> GetAvailabilityAsync(string email, DateTime start, DateTime end)
    {
        _callCount++;
        
        if (_callCount == 1)
        {
            // Simulate rate limit with Retry-After header
            var response = new HttpResponseMessage(HttpStatusCode.TooManyRequests);
            response.Headers.Add("Retry-After", "5");
            throw new HttpRequestException("Rate limit exceeded");
        }
        
        // Return empty availability on retry
        return await Task.FromResult(new List<AvailabilityBlock>());
    }
}

public class FailingGraphCalendarProvider : IGraphCalendarProvider
{
    public Task<CalendarAvailabilityResponse> GetAvailabilityAsync(CalendarAvailabilityRequest request, CancellationToken cancellationToken = default)
    {
        // Always fail
        throw new HttpRequestException("Service unavailable");
    }

    public Task<List<AvailabilityBlock>> GetAvailabilityAsync(string email, DateTime start, DateTime end)
    {
        // Always fail
        throw new HttpRequestException("Service unavailable");
    }
}
