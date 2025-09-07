using L4H.Shared.Models;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Localization;

namespace L4H.Infrastructure.Services;

public interface IEnhancedPasswordPolicy
{
    Result<bool> ValidatePassword(string password, string? cultureCode = null);
}

public class EnhancedPasswordPolicy : IEnhancedPasswordPolicy
{
    private readonly PasswordPolicyConfig _config;
    private readonly IStringLocalizer<L4H.Infrastructure.Resources.Shared> _localizer;

    public EnhancedPasswordPolicy(IOptions<AuthConfig> authConfig, IStringLocalizer<L4H.Infrastructure.Resources.Shared> localizer)
    {
        _config = authConfig.Value.PasswordPolicy;
        _localizer = localizer;
    }

    public Result<bool> ValidatePassword(string password, string? cultureCode = null)
    {
        if (string.IsNullOrEmpty(password))
        {
            return Result<bool>.Failure(_localizer["Auth.PasswordRequired"]);
        }

        // Check minimum length
        if (password.Length < _config.MinLength)
        {
            return Result<bool>.Failure(_localizer["Auth.PasswordTooShort", _config.MinLength]);
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
            return Result<bool>.Failure(_localizer["Auth.PasswordNeedsSpecialChar"]);
        }

        // Check if we meet the required number of classes
        if (classes < _config.RequireClasses)
        {
            return Result<bool>.Failure(_localizer["Auth.PasswordNeedsMoreClasses", _config.RequireClasses]);
        }

        return Result<bool>.Success(true);
    }
}
