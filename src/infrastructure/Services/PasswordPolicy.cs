using L4H.Shared.Models;

namespace L4H.Infrastructure.Services;

public interface IPasswordPolicy
{
    Result<bool> ValidatePassword(string password);
}

public class PasswordPolicy : IPasswordPolicy
{
    private readonly bool _fallbackRequireSpecialOnly;

    public PasswordPolicy(bool fallbackRequireSpecialOnly = false)
    {
        _fallbackRequireSpecialOnly = fallbackRequireSpecialOnly;
    }

    public Result<bool> ValidatePassword(string password)
    {
        if (string.IsNullOrEmpty(password))
        {
            return Result<bool>.Failure("Password cannot be empty");
        }

        if (password.Length < 8)
        {
            return Result<bool>.Failure("Password must be at least 8 characters long");
        }

        if (_fallbackRequireSpecialOnly)
        {
            // Fallback rule: ≥8 + ≥1 special
            if (!ContainsSpecialCharacter(password))
            {
                return Result<bool>.Failure("Password must contain at least one special character");
            }
        }
        else
        {
            // Full 8/3/4 rule: 8 chars, 3 character types (lower, upper, digit), 4th type is special
            var characterTypes = 0;
            var errors = new List<string>();

            if (!ContainsLowercase(password))
            {
                errors.Add("lowercase letter");
            }
            else
            {
                characterTypes++;
            }

            if (!ContainsUppercase(password))
            {
                errors.Add("uppercase letter");
            }
            else
            {
                characterTypes++;
            }

            if (!ContainsDigit(password))
            {
                errors.Add("digit");
            }
            else
            {
                characterTypes++;
            }

            if (ContainsSpecialCharacter(password))
            {
                characterTypes++;
            }
            else
            {
                errors.Add("special character");
            }

            if (characterTypes < 3)
            {
                return Result<bool>.Failure($"Password must contain at least 3 of the following: {string.Join(", ", errors)}");
            }
        }

        return Result<bool>.Success(true);
    }

    private static bool ContainsLowercase(string password) => password.Any(char.IsLower);
    private static bool ContainsUppercase(string password) => password.Any(char.IsUpper);
    private static bool ContainsDigit(string password) => password.Any(char.IsDigit);
    private static bool ContainsSpecialCharacter(string password) => password.Any(c => !char.IsLetterOrDigit(c));
}