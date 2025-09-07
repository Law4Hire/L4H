using FluentAssertions;
using L4H.Api.Models;
using L4H.Api.Services;
using L4H.Shared.Models;
using Microsoft.Extensions.Options;
using System.Text.Json.Serialization;
using Xunit;

namespace L4H.Api.Tests.Services;

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
                SigningKey = "test-signing-key-for-api-unit-tests",
                TtlMinutes = 30
            }
        };
        _service = new UploadTokenService(Options.Create(_options));
    }

    [Fact]
    public void GenerateToken_WithValidInputs_ShouldCreateValidToken()
    {
        // Arrange
        var caseId = new CaseId(Guid.NewGuid());
        var filename = "test-document.pdf";
        var contentType = "application/pdf";
        var sizeBytes = 1024L;

        // Act
        var token = _service.GenerateToken(caseId, filename, contentType, sizeBytes);

        // Assert
        token.Should().NotBeNullOrEmpty();
        token.Should().NotContain("+"); // Should be base64url encoded
        token.Should().NotContain("/"); // Should be base64url encoded
        token.Should().NotContain("="); // Should be base64url encoded (no padding)
        
        // Verify token can be decoded and contains expected data
        var decodedToken = DecodeToken(token);
        decodedToken.Should().NotBeNull();
        decodedToken!.CaseId.Should().Be(caseId.Value);
        decodedToken!.Filename.Should().Be(filename);
        decodedToken!.ContentType.Should().Be(contentType);
        decodedToken!.SizeBytes.Should().Be(sizeBytes);
        decodedToken!.Exp.Should().BeGreaterThan(DateTimeOffset.UtcNow.ToUnixTimeSeconds());
        decodedToken!.Signature.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void GenerateToken_WithDifferentInputs_ShouldGenerateDifferentTokens()
    {
        // Arrange
        var caseId1 = new CaseId(Guid.NewGuid());
        var caseId2 = new CaseId(Guid.NewGuid());
        var filename = "test.pdf";
        var contentType = "application/pdf";
        var sizeBytes = 1024L;

        // Act
        var token1 = _service.GenerateToken(caseId1, filename, contentType, sizeBytes);
        var token2 = _service.GenerateToken(caseId2, filename, contentType, sizeBytes);

        // Assert
        token1.Should().NotBe(token2);
    }

    [Theory]
    [InlineData("document with spaces.pdf", "document with spaces.pdf")]
    [InlineData("../../../etc/passwd", "passwd")]
    [InlineData("C:\\Windows\\System32\\notepad.exe", "notepad.exe")]
    [InlineData("file<>:\"|?*.txt", "file_______.txt")]
    [InlineData(".hidden-file", "hidden-file")]
    [InlineData("", "upload")]
    [InlineData("   ", "upload")]
    public void GetSafeFilename_WithVariousInputs_ShouldReturnSafeFilename(string input, string expected)
    {
        // Act
        var result = UploadTokenService.GetSafeFilename(input);

        // Assert
        result.Should().Be(expected);
    }

    [Fact]
    public void GetSafeFilename_WithExtremelyLongFilename_ShouldTruncateCorrectly()
    {
        // Arrange
        var longBaseName = new string('a', 300);
        var extension = ".pdf";
        var input = longBaseName + extension;

        // Act
        var result = UploadTokenService.GetSafeFilename(input);

        // Assert
        result.Should().EndWith(extension);
        result.Length.Should().BeLessOrEqualTo(255);
        result.Should().StartWith("aaa"); // Should preserve start of original name
    }

    [Fact]
    public void GetSafeFilename_WithPathTraversalAttempts_ShouldSanitize()
    {
        // Arrange
        var maliciousInputs = new[]
        {
            "../../../../etc/passwd",
            "..\\..\\..\\Windows\\System32\\cmd.exe",
            "/etc/shadow",
            "\\Windows\\System32\\format.com"
        };

        foreach (var input in maliciousInputs)
        {
            // Act
            var result = UploadTokenService.GetSafeFilename(input);

            // Assert
            result.Should().NotContain("..");
            result.Should().NotContain("/");
            result.Should().NotContain("\\");
            result.Should().NotStartWith(".");
            result.Should().NotBeNullOrWhiteSpace();
        }
    }

    private static TokenData? DecodeToken(string token)
    {
        try
        {
            // Convert base64url to base64
            var base64 = token.Replace('-', '+').Replace('_', '/');
            switch (base64.Length % 4)
            {
                case 2: base64 += "=="; break;
                case 3: base64 += "="; break;
            }

            var jsonBytes = Convert.FromBase64String(base64);
            var json = System.Text.Encoding.UTF8.GetString(jsonBytes);
            return System.Text.Json.JsonSerializer.Deserialize<TokenData>(json);
        }
        catch
        {
            return null;
        }
    }

    private class TokenData
    {
        [JsonPropertyName("caseId")]
        public Guid CaseId { get; set; }
        
        [JsonPropertyName("filename")]
        public string Filename { get; set; } = string.Empty;
        
        [JsonPropertyName("contentType")]
        public string ContentType { get; set; } = string.Empty;
        
        [JsonPropertyName("sizeBytes")]
        public long SizeBytes { get; set; }
        
        [JsonPropertyName("exp")]
        public long Exp { get; set; }
        
        [JsonPropertyName("signature")]
        public string Signature { get; set; } = string.Empty;
    }
}