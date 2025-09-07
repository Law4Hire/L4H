using L4H.Shared.Models;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Security.Cryptography;
using System.Text;

namespace L4H.Infrastructure.Services;

public interface ISecretsValidationService
{
    void ValidateSecrets();
}

public class SecretsValidationService : ISecretsValidationService
{
    private readonly ILogger<SecretsValidationService> _logger;
    private readonly string _jwtSigningKey;
    private readonly string _uploadsTokenSigningKey;
    private readonly string _sqlConnectionString;

    public SecretsValidationService(
        ILogger<SecretsValidationService> logger,
        IOptions<JwtConfig> jwtConfig,
        IConfiguration configuration)
    {
        _logger = logger;
        _jwtSigningKey = jwtConfig.Value.SigningKey;
        _uploadsTokenSigningKey = configuration["UPLOADS_TOKEN_SIGNING_KEY"] ?? string.Empty;
        _sqlConnectionString = configuration.GetConnectionString("DefaultConnection") ?? string.Empty;
    }

    public void ValidateSecrets()
    {
        var errors = new List<string>();

        // Validate JWT signing key
        if (string.IsNullOrEmpty(_jwtSigningKey))
        {
            errors.Add("JWT_SIGNING_KEY is required");
        }
        else if (_jwtSigningKey.Length < 32) // 256 bits minimum
        {
            errors.Add("JWT_SIGNING_KEY must be at least 32 characters (256 bits)");
        }

        // Validate uploads token signing key
        if (string.IsNullOrEmpty(_uploadsTokenSigningKey))
        {
            errors.Add("UPLOADS_TOKEN_SIGNING_KEY is required");
        }
        else if (_uploadsTokenSigningKey.Length < 32)
        {
            errors.Add("UPLOADS_TOKEN_SIGNING_KEY must be at least 32 characters (256 bits)");
        }

        // Validate SQL connection string
        if (string.IsNullOrEmpty(_sqlConnectionString))
        {
            errors.Add("SQL connection string is required");
        }

        if (errors.Any())
        {
            var errorMessage = string.Join("; ", errors);
            _logger.LogCritical("Secrets validation failed: {Errors}", errorMessage);
            throw new InvalidOperationException($"Secrets validation failed: {errorMessage}");
        }

        _logger.LogInformation("Secrets validation passed");
    }
}
