using L4H.Shared.Models;
using Microsoft.Extensions.Options;

namespace L4H.Infrastructure.Services;

public interface IEnhancedPasswordPolicy
{
    Result<bool> ValidatePassword(string password, string? cultureCode = null);
}

public class EnhancedPasswordPolicy : IEnhancedPasswordPolicy
{
    private readonly PasswordPolicyConfig _config;

    public EnhancedPasswordPolicy(IOptions<AuthConfig> authConfig)
    {
        _config = authConfig.Value.PasswordPolicy;
    }

    public Result<bool> ValidatePassword(string password, string? cultureCode = null)
    {
        if (string.IsNullOrEmpty(password))
        {
            return Result<bool>.Failure("Password is required.");
        }

        // Check minimum length
        if (password.Length < _config.MinLength)
        {
            return Result<bool>.Failure($"Password must be at least {_config.MinLength} characters long.");
        }

        // Count character classes
        var classes = 0;
        var hasLower = password.Any(char.IsLower);
        var hasUpper = password.Any(char.IsUpper);
        var hasDigit = password.Any(char.IsDigit);
        var hasSpecial = password.Any(c => !char.IsLetterOrDigit(c));

        if (hasLower) classes++;
        if (hasUpper) classes++;
        if (hasDigit) classes++;
        if (hasSpecial) classes++;

        // If special characters are required but not present
        if (_config.RequireSpecial && !hasSpecial)
        {
            return Result<bool>.Failure("Password must contain at least one special character.");
        }

        // Check if we meet the required number of classes
        if (classes < _config.RequireClasses)
        {
            return Result<bool>.Failure($"Password must contain at least {_config.RequireClasses} types of characters (upper, lower, digit, special).");
        }

        return Result<bool>.Success(true);
    }
}