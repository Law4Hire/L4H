using FluentAssertions;
using L4H.UploadGateway.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using System.Text;
using Xunit;

namespace L4H.UploadGateway.Tests.Integration;

public sealed class UploadGatewayIntegrationTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly string _tempUploadPath;

    public UploadGatewayIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _tempUploadPath = Path.Combine(Path.GetTempPath(), "test-uploads", Guid.NewGuid().ToString());
        Directory.CreateDirectory(_tempUploadPath);

        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Override upload options for testing
                services.Configure<UploadOptions>(options =>
                {
                    options.BasePath = _tempUploadPath;
                    options.QuarantineSubdir = "quarantine";
                    options.MaxSizeMB = 25;
                    options.Token = new TokenOptions
                    {
                        SigningKey = "test-signing-key-for-integration-tests",
                        TtlMinutes = 30
                    };
                });
            });
        });
        
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task Health_ShouldReturnOk()
    {
        // Act
        var response = await _client.GetAsync("/health");

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("healthy");
    }

    [Fact]
    public async Task UploadFile_WithValidToken_ShouldSucceed()
    {
        // Arrange
        var token = GenerateValidToken();
        var fileContent = "This is a test file content for upload testing";
        var content = new StringContent(fileContent, Encoding.UTF8, "text/plain");

        // Act
        var response = await _client.PutAsync($"/gateway/uploads/{token}", content);

        // Assert
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new Exception($"Request failed with status {response.StatusCode}: {errorContent}");
        }
        response.IsSuccessStatusCode.Should().BeTrue();
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Created);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        responseContent.Should().Contain("stored");
        responseContent.Should().Contain(token);

        // Verify file was created (using safe token for directory name)
        var safeToken = L4H.UploadGateway.Services.UploadTokenService.GetSafeFilename(token);
        var expectedPath = Path.Combine(_tempUploadPath, "quarantine", safeToken, "test.txt");
        File.Exists(expectedPath).Should().BeTrue();
        var savedContent = await File.ReadAllTextAsync(expectedPath);
        savedContent.Should().Be(fileContent);
    }

    [Fact]
    public async Task UploadFile_WithInvalidToken_ShouldReturnBadRequest()
    {
        // Arrange
        var invalidToken = "invalid-token";
        var content = new StringContent("test", Encoding.UTF8, "text/plain");

        // Act
        var response = await _client.PutAsync($"/gateway/uploads/{invalidToken}", content);

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
        var responseContent = await response.Content.ReadAsStringAsync();
        responseContent.Should().Contain("Invalid or expired token");
    }

    [Fact]
    public async Task UploadFile_WithExpiredToken_ShouldReturnBadRequest()
    {
        // Arrange
        var expiredToken = GenerateExpiredToken();
        var content = new StringContent("test", Encoding.UTF8, "text/plain");

        // Act
        var response = await _client.PutAsync($"/gateway/uploads/{expiredToken}", content);

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
        var responseContent = await response.Content.ReadAsStringAsync();
        responseContent.Should().Contain("Invalid or expired token");
    }

    [Fact]
    public async Task UploadFile_WithWrongContentType_ShouldReturnBadRequest()
    {
        // Arrange
        var token = GenerateValidToken();
        var content = new StringContent("test", Encoding.UTF8, "application/pdf"); // Wrong content type

        // Act
        var response = await _client.PutAsync($"/gateway/uploads/{token}", content);

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
        var responseContent = await response.Content.ReadAsStringAsync();
        responseContent.Should().Contain("Content type mismatch");
    }

    [Fact]
    public async Task UploadFile_WithExcessiveSize_ShouldReturnBadRequest()
    {
        // Arrange
        var token = GenerateValidTokenWithSize(1024); // Token says 1KB
        var largeContent = new string('x', 2048); // But we send 2KB
        var content = new StringContent(largeContent, Encoding.UTF8, "text/plain");

        // Act
        var response = await _client.PutAsync($"/gateway/uploads/{token}", content);

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
        var responseContent = await response.Content.ReadAsStringAsync();
        responseContent.Should().Contain("exceeds token limit");
    }

    private static string GenerateValidToken()
    {
        return GenerateValidTokenWithSize(1024);
    }

    private static string GenerateValidTokenWithSize(long sizeBytes)
    {
        var caseId = Guid.NewGuid();
        var filename = "test.txt";
        var contentType = "text/plain; charset=utf-8"; // Match what StringContent sends
        var exp = DateTimeOffset.UtcNow.AddMinutes(15).ToUnixTimeSeconds();
        var signingKey = "test-signing-key-for-integration-tests";

        var canonicalJson = System.Text.Json.JsonSerializer.Serialize(new
        {
            caseId,
            filename,
            contentType,
            sizeBytes,
            exp
        });

        var signature = GenerateSignature(canonicalJson, signingKey);

        var tokenData = System.Text.Json.JsonSerializer.Serialize(new
        {
            caseId,
            filename,
            contentType,
            sizeBytes,
            exp,
            signature
        });

        return Convert.ToBase64String(Encoding.UTF8.GetBytes(tokenData))
            .Replace('+', '-').Replace('/', '_').TrimEnd('=');
    }

    private static string GenerateExpiredToken()
    {
        var caseId = Guid.NewGuid();
        var filename = "test.txt";
        var contentType = "text/plain; charset=utf-8";
        var sizeBytes = 1024L;
        var exp = DateTimeOffset.UtcNow.AddMinutes(-5).ToUnixTimeSeconds(); // Expired
        var signingKey = "test-signing-key-for-integration-tests";

        var canonicalJson = System.Text.Json.JsonSerializer.Serialize(new
        {
            caseId,
            filename,
            contentType,
            sizeBytes,
            exp
        });

        var signature = GenerateSignature(canonicalJson, signingKey);

        var tokenData = System.Text.Json.JsonSerializer.Serialize(new
        {
            caseId,
            filename,
            contentType,
            sizeBytes,
            exp,
            signature
        });

        return Convert.ToBase64String(Encoding.UTF8.GetBytes(tokenData))
            .Replace('+', '-').Replace('/', '_').TrimEnd('=');
    }

    private static string GenerateSignature(string data, string key)
    {
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var dataBytes = Encoding.UTF8.GetBytes(data);

        using var hmac = new System.Security.Cryptography.HMACSHA256(keyBytes);
        var hashBytes = hmac.ComputeHash(dataBytes);
        return Convert.ToBase64String(hashBytes);
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
            _client.Dispose();
            _factory.Dispose();
            
            // Cleanup test directory
            if (Directory.Exists(_tempUploadPath))
            {
                Directory.Delete(_tempUploadPath, true);
            }
        }
    }
}