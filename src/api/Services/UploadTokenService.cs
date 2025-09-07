using L4H.Api.Models;
using L4H.Shared.Models;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace L4H.Api.Services;

public class UploadTokenService
{
    private readonly UploadOptions _options;

    public UploadTokenService(IOptions<UploadOptions> options)
    {
        _options = options.Value;
    }

    public string GenerateToken(CaseId caseId, string filename, string contentType, long sizeBytes)
    {
        var exp = DateTimeOffset.UtcNow.AddMinutes(_options.Token.TtlMinutes).ToUnixTimeSeconds();
        
        var canonicalJson = JsonSerializer.Serialize(new
        {
            caseId = caseId.Value,
            filename,
            contentType,
            sizeBytes,
            exp
        });

        var signature = GenerateHmac(canonicalJson, _options.Token.SigningKey);

        var tokenData = new
        {
            caseId = caseId.Value,
            filename,
            contentType,
            sizeBytes,
            exp,
            signature
        };

        var tokenJson = JsonSerializer.Serialize(tokenData);
        return Base64UrlEncode(Encoding.UTF8.GetBytes(tokenJson));
    }

    private static string GenerateHmac(string data, string key)
    {
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var dataBytes = Encoding.UTF8.GetBytes(data);

        using var hmac = new HMACSHA256(keyBytes);
        var hashBytes = hmac.ComputeHash(dataBytes);
        return Convert.ToBase64String(hashBytes);
    }

    private static string Base64UrlEncode(byte[] input)
    {
        var base64 = Convert.ToBase64String(input);
        return base64.Replace('+', '-').Replace('/', '_').TrimEnd('=');
    }

    public static string GetSafeFilename(string originalFilename)
    {
        // Remove path traversal attempts and invalid characters
        var filename = Path.GetFileName(originalFilename);
        var invalidChars = Path.GetInvalidFileNameChars();
        
        foreach (var c in invalidChars)
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
}