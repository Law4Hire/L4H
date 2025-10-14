using L4H.UploadGateway.Models;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace L4H.UploadGateway.Services;

public class UploadTokenService
{
    private readonly UploadOptions _options;

    public UploadTokenService(IOptions<UploadOptions> options)
    {
        _options = options.Value;
    }

    public bool ValidateToken(string token, out TokenPayload? payload)
    {
        payload = null;
        
        try
        {
            // Decode base64url
            var jsonBytes = Base64UrlDecode(token);
            var json = Encoding.UTF8.GetString(jsonBytes);
            
            // Parse payload
            var tokenData = JsonSerializer.Deserialize<TokenData>(json);
            if (tokenData == null) return false;

            // Check expiration
            if (tokenData.Exp < DateTimeOffset.UtcNow.ToUnixTimeSeconds())
                return false;

            // Verify signature
            var canonicalJson = JsonSerializer.Serialize(new
            {
                caseId = tokenData.CaseId,
                filename = tokenData.Filename,
                contentType = tokenData.ContentType,
                sizeBytes = tokenData.SizeBytes,
                exp = tokenData.Exp
            });

            var expectedSignature = GenerateHmac(canonicalJson, _options.Token.SigningKey);
            if (tokenData.Signature != expectedSignature)
                return false;

            payload = new TokenPayload
            {
                CaseId = tokenData.CaseId,
                Filename = tokenData.Filename,
                ContentType = tokenData.ContentType,
                SizeBytes = tokenData.SizeBytes,
                ExpiresAt = DateTimeOffset.FromUnixTimeSeconds(tokenData.Exp)
            };

            return true;
        }
        catch
        {
            return false;
        }
    }

    private static string GenerateHmac(string data, string key)
    {
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var dataBytes = Encoding.UTF8.GetBytes(data);

        using var hmac = new HMACSHA256(keyBytes);
        var hashBytes = hmac.ComputeHash(dataBytes);
        return Convert.ToBase64String(hashBytes);
    }

    private static byte[] Base64UrlDecode(string input)
    {
        // Convert base64url to base64
        var base64 = input.Replace('-', '+').Replace('_', '/');
        
        // Pad with '=' characters if needed
        switch (base64.Length % 4)
        {
            case 2: base64 += "=="; break;
            case 3: base64 += "="; break;
        }

        return Convert.FromBase64String(base64);
    }

    public static string GetSafeFilename(string originalFilename)
    {
        if (string.IsNullOrWhiteSpace(originalFilename))
            return "upload";

        var filename = originalFilename;

        // For path traversal attempts like "../../../etc/passwd", just take the base filename
        if (filename.Contains("../") || filename.Contains("..\\"))
        {
            filename = Path.GetFileName(filename);
        }

        // Replace OS-specific invalid characters from Path.GetInvalidFileNameChars()
        var invalidChars = Path.GetInvalidFileNameChars();
        foreach (var c in invalidChars)
        {
            filename = filename.Replace(c, '_');
        }

        // Also replace explicit path separators that might not be in invalid chars
        filename = filename.Replace('\\', '_').Replace('/', '_');

        // Also explicitly replace additional unsafe characters that might be valid on some OS
        // but are problematic for cross-platform file operations: < > : " | ? *
        var additionalUnsafeChars = new[] { '<', '>', ':', '"', '|', '?', '*' };
        foreach (var c in additionalUnsafeChars)
        {
            filename = filename.Replace(c, '_');
        }

        // Additional security: remove leading dots and limit length
        filename = filename.TrimStart('.').Trim();
        if (filename.Length > 255)
        {
            var extension = Path.GetExtension(filename);
            var nameWithoutExt = Path.GetFileNameWithoutExtension(filename);
            filename = nameWithoutExt.Substring(0, 255 - extension.Length) + extension;
        }

        return string.IsNullOrWhiteSpace(filename) ? "upload" : filename;
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

public class TokenPayload
{
    public Guid CaseId { get; set; }
    public string Filename { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
}