using L4H.Api.Controllers;
using L4H.Shared.Models;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using System.Net.Http.Json;
using System.Net;
using System.Text.Json;
using System.Text;
using Xunit;
using L4H.Api.Tests.TestHelpers;

namespace L4H.Api.Tests.Controllers;

public sealed class LocalizationIntegrationTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly string _testDatabaseName;

    public LocalizationIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _testDatabaseName = $"L4H_LocalizationTest_{Guid.NewGuid():N}";

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
    public async Task AuthLogin_WithSpanishCulture_ReturnsLocalizedError()
    {
        // Arrange
        // First set Spanish culture
        var setCultureRequest = new SetCultureRequest { Culture = "es-ES" };
        var cultureResponse = await _client.PostAsJsonAsync("/v1/i18n/culture", setCultureRequest);
        cultureResponse.EnsureSuccessStatusCode();

        // Extract cookie from response
        var setCookieHeader = cultureResponse.Headers.GetValues("Set-Cookie").FirstOrDefault();
        Assert.NotNull(setCookieHeader);

        // Parse the actual cookie value from Set-Cookie header
        var cookieValue = setCookieHeader.Split(';')[0]; // Get "l4h_culture=c=es-ES|uic=es-ES" part

        // Create new client with culture cookie
        var clientWithCookie = _factory.CreateClient();
        clientWithCookie.DefaultRequestHeaders.Add("Cookie", cookieValue);

        // Attempt login with invalid credentials
        var loginRequest = new LoginRequest 
        { 
            Email = "invalid@example.com", 
            Password = "wrongpassword" 
        };

        // Act
        var response = await clientWithCookie.PostAsJsonAsync("/v1/auth/login", loginRequest);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var problemDetails = JsonSerializer.Deserialize<JsonElement>(content);
        
        // Verify the localized message is present
        var detail = problemDetails.GetProperty("detail").GetString();
        Assert.Equal("Correo o contraseña inválidos.", detail);
    }

    [Fact]
    public async Task AuthLogin_WithEnglishCulture_ReturnsEnglishError()
    {
        // Arrange
        var loginRequest = new LoginRequest 
        { 
            Email = "invalid@example.com", 
            Password = "wrongpassword" 
        };

        // Act (default culture is en-US)
        var response = await _client.PostAsJsonAsync("/v1/auth/login", loginRequest);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var problemDetails = JsonSerializer.Deserialize<JsonElement>(content);
        
        // Verify the English message is present
        var detail = problemDetails.GetProperty("detail").GetString();
        Assert.Equal("Invalid email or password.", detail);
    }

    [Fact]
    public async Task AuthForgot_WithCulture_ReturnsLocalizedMessage()
    {
        // Arrange
        var request = new ForgotPasswordRequest { Email = "test@example.com" };

        // Act
        var response = await _client.PostAsJsonAsync("/v1/auth/forgot", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var messageResponse = JsonSerializer.Deserialize<MessageResponse>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        // Verify the localized message is present (English default)
        Assert.Equal("If an account with that email exists, a password reset link has been sent.", messageResponse!.Message);
    }
}