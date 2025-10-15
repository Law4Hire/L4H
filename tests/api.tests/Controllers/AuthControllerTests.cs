using System.Net;
using System.Net.Http.Json;
using System.Text;
using L4H.Api.Tests.TestHelpers;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Services;
using L4H.Shared.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using L4H.Shared.Json;
using Xunit;

namespace L4H.Api.Tests.Controllers;

public sealed class AuthControllerTests : BaseIntegrationTest
{
    public AuthControllerTests(WebApplicationFactory<Program> factory) : base(factory)
    {
    }

    [Fact]
    public async Task Signup_ValidRequest_ReturnsSuccess()
    {
        // Arrange
        var request = new SignupRequest
        {
            Email = $"test_{Guid.NewGuid()}@example.com",
            Password = "SecureTest123!"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/v1/auth/signup", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var options = new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        };
        options.Converters.Add(new CaseIdConverter());
        options.Converters.Add(new UserIdConverter());
        var authResponse = JsonSerializer.Deserialize<AuthResponse>(content, options);
        
        Assert.NotNull(authResponse);
        Assert.NotEmpty(authResponse.Token);
    }

    [Fact]
    public async Task Signup_InvalidPassword_ReturnsBadRequest()
    {
        // Arrange
        var request = new SignupRequest
        {
            Email = "test@example.com",
            Password = "weak"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/v1/auth/signup", request);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Signup_DuplicateEmail_ReturnsBadRequest()
    {
        // Arrange
        var uniqueEmail = $"duplicate_{Guid.NewGuid()}@example.com";
        var request = new SignupRequest
        {
            Email = uniqueEmail,
            Password = "SecureTest123!"
        };

        // First signup
        await Client.PostAsJsonAsync("/v1/auth/signup", request);

        // Act - Second signup with same email
        var response = await Client.PostAsJsonAsync("/v1/auth/signup", request);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsSuccess()
    {
        // Arrange - First create a user
        var uniqueEmail = $"login_{Guid.NewGuid()}@example.com";
        var signupRequest = new SignupRequest
        {
            Email = uniqueEmail,
            Password = "SecureTest123!"
        };
        await Client.PostAsJsonAsync("/v1/auth/signup", signupRequest);

        var loginRequest = new LoginRequest
        {
            Email = uniqueEmail,
            Password = "SecureTest123!",
            RememberMe = false
        };

        // Act
        var response = await Client.PostAsJsonAsync("/v1/auth/login", loginRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var options = new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        };
        options.Converters.Add(new CaseIdConverter());
        options.Converters.Add(new UserIdConverter());
        var authResponse = JsonSerializer.Deserialize<AuthResponse>(content, options);
        
        Assert.NotNull(authResponse);
        Assert.NotEmpty(authResponse.Token);
    }

    [Fact]
    public async Task Login_InvalidCredentials_ReturnsUnauthorized()
    {
        // Arrange
        var loginRequest = new LoginRequest
        {
            Email = "nonexistent@example.com",
            Password = "SecureTest123!",
            RememberMe = false
        };

        // Act
        var response = await Client.PostAsJsonAsync("/v1/auth/login", loginRequest);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithRememberMe_SetsCookie()
    {
        // Arrange - First create a user
        var uniqueEmail = $"remember_{Guid.NewGuid()}@example.com";
        var signupRequest = new SignupRequest
        {
            Email = uniqueEmail,
            Password = "SecureTest123!"
        };
        await Client.PostAsJsonAsync("/v1/auth/signup", signupRequest);

        var loginRequest = new LoginRequest
        {
            Email = uniqueEmail,
            Password = "SecureTest123!",
            RememberMe = true
        };

        // Act
        var response = await Client.PostAsJsonAsync("/v1/auth/login", loginRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        // Check for remember me cookie
        Assert.Contains(response.Headers, h => h.Key == "Set-Cookie");
        var setCookieHeader = response.Headers.GetValues("Set-Cookie").FirstOrDefault();
        Assert.Contains("l4h_remember", setCookieHeader);
    }

    [Fact]
    public async Task ForgotPassword_ValidEmail_ReturnsSuccess()
    {
        // Arrange - First create a user
        var uniqueEmail = $"forgot_{Guid.NewGuid()}@example.com";
        var signupRequest = new SignupRequest
        {
            Email = uniqueEmail,
            Password = "SecureTest123!"
        };
        await Client.PostAsJsonAsync("/v1/auth/signup", signupRequest);

        var forgotRequest = new ForgotPasswordRequest
        {
            Email = uniqueEmail
        };

        // Act
        var response = await Client.PostAsJsonAsync("/v1/auth/forgot", forgotRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var content = await response.Content.ReadAsStringAsync();
        var messageResponse = JsonSerializer.Deserialize<MessageResponse>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        Assert.NotNull(messageResponse);
        Assert.NotEmpty(messageResponse.Message);
    }

    [Fact]
    public async Task ForgotPassword_NonexistentEmail_ReturnsSuccess()
    {
        // Arrange
        var forgotRequest = new ForgotPasswordRequest
        {
            Email = "nonexistent@example.com"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/v1/auth/forgot", forgotRequest);

        // Assert - Should still return success to prevent email enumeration
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Remember_WithoutCookie_ReturnsUnauthorized()
    {
        // Act
        var response = await Client.PostAsync("/v1/auth/remember", null);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [InlineData("")]
    [InlineData("invalid@")]
    [InlineData("not-an-email")]
    public async Task Signup_InvalidEmail_ReturnsBadRequest(string invalidEmail)
    {
        // Arrange
        var request = new SignupRequest
        {
            Email = invalidEmail,
            Password = "SecureTest123!"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/v1/auth/signup", request);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ResetPassword_InvalidToken_ReturnsBadRequest()
    {
        // Arrange
        var resetRequest = new ResetPasswordRequest
        {
            Token = "invalid_token",
            NewPassword = "SecureTest123!"
        };

        // Act
        var response = await Client.PostAsJsonAsync("/v1/auth/reset", resetRequest);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private async Task<string> GetValidResetTokenAsync(string email)
    {
        using var scope = Factory.Services.CreateScope();
        var resetService = scope.ServiceProvider.GetRequiredService<IPasswordResetTokenService>();
        return await resetService.CreatePasswordResetTokenAsync(email);
    }
}