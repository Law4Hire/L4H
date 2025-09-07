using FluentAssertions;
using L4H.UploadGateway.Models;
using L4H.UploadGateway.Services;
using Microsoft.Extensions.Options;
using Xunit;

namespace L4H.UploadGateway.Tests.Services;

public class UploadTokenServiceTests
{
    private readonly UploadTokenService _service;
    private readonly UploadOptions _options;

    public UploadTokenServiceTests()
    {
        _options = new UploadOptions
        {
            Token = new TokenOptions
            {
                SigningKey = "test-signing-key-for-unit-tests",
                TtlMinutes = 30
            }
        };
        _service = new UploadTokenService(Options.Create(_options));
    }

    [Fact]
    public void ValidateToken_WithValidToken_ShouldReturnTrue()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var filename = "test.pdf";
        var contentType = "application/pdf";
        var sizeBytes = 1024L;

        // Create a valid token manually (simulating what API would generate)
        var exp = DateTimeOffset.UtcNow.AddMinutes(15).ToUnixTimeSeconds();
        var tokenData = System.Text.Json.JsonSerializer.Serialize(new
        {
            caseId,
            filename,
            contentType,
            sizeBytes,
            exp,
            signature = GenerateTestSignature(caseId, filename, contentType, sizeBytes, exp)
        });
        var token = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(tokenData))
            .Replace('+', '-').Replace('/', '_').TrimEnd('=');

        // Act
        var isValid = _service.ValidateToken(token, out var payload);

        // Assert
        isValid.Should().BeTrue();
        payload.Should().NotBeNull();
        payload!.CaseId.Should().Be(caseId);
        payload.Filename.Should().Be(filename);
        payload.ContentType.Should().Be(contentType);
        payload.SizeBytes.Should().Be(sizeBytes);
    }

    [Fact]
    public void ValidateToken_WithExpiredToken_ShouldReturnFalse()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var filename = "test.pdf";
        var contentType = "application/pdf";
        var sizeBytes = 1024L;
        var exp = DateTimeOffset.UtcNow.AddMinutes(-5).ToUnixTimeSeconds(); // Expired 5 minutes ago

        var tokenData = System.Text.Json.JsonSerializer.Serialize(new
        {
            caseId,
            filename,
            contentType,
            sizeBytes,
            exp,
            signature = GenerateTestSignature(caseId, filename, contentType, sizeBytes, exp)
        });
        var token = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(tokenData))
            .Replace('+', '-').Replace('/', '_').TrimEnd('=');

        // Act
        var isValid = _service.ValidateToken(token, out var payload);

        // Assert
        isValid.Should().BeFalse();
        payload.Should().BeNull();
    }

    [Fact]
    public void ValidateToken_WithInvalidSignature_ShouldReturnFalse()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var filename = "test.pdf";
        var contentType = "application/pdf";
        var sizeBytes = 1024L;
        var exp = DateTimeOffset.UtcNow.AddMinutes(15).ToUnixTimeSeconds();

        var tokenData = System.Text.Json.JsonSerializer.Serialize(new
        {
            caseId,
            filename,
            contentType,
            sizeBytes,
            exp,
            signature = "invalid-signature"
        });
        var token = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(tokenData))
            .Replace('+', '-').Replace('/', '_').TrimEnd('=');

        // Act
        var isValid = _service.ValidateToken(token, out var payload);

        // Assert
        isValid.Should().BeFalse();
        payload.Should().BeNull();
    }

    [Fact]
    public void ValidateToken_WithMalformedToken_ShouldReturnFalse()
    {
        // Arrange
        var token = "invalid-base64-token";

        // Act
        var isValid = _service.ValidateToken(token, out var payload);

        // Assert
        isValid.Should().BeFalse();
        payload.Should().BeNull();
    }

    [Theory]
    [InlineData("test file.pdf", "test file.pdf")]
    [InlineData("../../../etc/passwd", "passwd")]
    [InlineData("test\\file.pdf", "test_file.pdf")]
    [InlineData("file<with>invalid:chars.pdf", "file_with_invalid_chars.pdf")]
    [InlineData(".hidden", "hidden")]
    [InlineData("", "upload")]
    public void GetSafeFilename_WithVariousInputs_ShouldReturnSafeFilename(string input, string expected)
    {
        // Act
        var result = UploadTokenService.GetSafeFilename(input);

        // Assert
        result.Should().Be(expected);
    }

    [Fact]
    public void GetSafeFilename_WithVeryLongFilename_ShouldTruncate()
    {
        // Arrange
        var longName = new string('a', 300);
        var input = $"{longName}.pdf";

        // Act
        var result = UploadTokenService.GetSafeFilename(input);

        // Assert
        result.Should().EndWith(".pdf");
        result.Length.Should().BeLessOrEqualTo(255);
    }

    private string GenerateTestSignature(Guid caseId, string filename, string contentType, long sizeBytes, long exp)
    {
        var canonicalJson = System.Text.Json.JsonSerializer.Serialize(new
        {
            caseId,
            filename,
            contentType,
            sizeBytes,
            exp
        });

        var keyBytes = System.Text.Encoding.UTF8.GetBytes(_options.Token.SigningKey);
        var dataBytes = System.Text.Encoding.UTF8.GetBytes(canonicalJson);

        using var hmac = new System.Security.Cryptography.HMACSHA256(keyBytes);
        var hashBytes = hmac.ComputeHash(dataBytes);
        return Convert.ToBase64String(hashBytes);
    }
}