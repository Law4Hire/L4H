using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Api.Tests.TestHelpers;
using Xunit;

namespace L4H.Api.Tests;

public sealed class HealthTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly string _testDatabaseName;

    public HealthTests(WebApplicationFactory<Program> factory)
    {
        _testDatabaseName = $"L4H_HealthTest_{Guid.NewGuid():N}";

        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureServices(services =>
            {
                // Register test services (but keep SQL Server database)
                TestServiceRegistration.RegisterTestServices(services);
            });
        });
        
        _client = _factory.CreateClient();
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
            _factory?.Dispose();
        }
    }

    [Fact]
    public async Task HealthEndpoint_ReturnsOkWithExpectedStatus()
    {
        // Act
        var response = await _client.GetAsync("/healthz");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var json = JsonDocument.Parse(content);
        var status = json.RootElement.GetProperty("status").GetString();
        Assert.Equal("ok", status);
    }

    [Fact]
    public async Task PingEndpoint_ReturnsOkWithPong()
    {
        // Act
        var response = await _client.GetAsync("/v1/ping");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var json = JsonDocument.Parse(content);
        var message = json.RootElement.GetProperty("message").GetString();
        Assert.Equal("pong", message);
        Assert.True(json.RootElement.TryGetProperty("timestamp", out _));
    }
}