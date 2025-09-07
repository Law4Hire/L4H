using L4H.Infrastructure.Services;
using Xunit;

namespace L4H.Api.Tests.Services;

public class PasswordPolicyTests
{
    [Theory]
    [InlineData("", false, "Password cannot be empty")]
    [InlineData("short", false, "Password must be at least 8 characters long")]
    [InlineData("NoSpecial123", true, null)] // Has upper, lower, digit - 3 types
    [InlineData("Password123!", true, null)]
    [InlineData("PASSWORD123!", true, null)] // Has upper, digit, special - 3 types
    [InlineData("password123!", true, null)] // Has lower, digit, special - 3 types  
    [InlineData("Password!", true, null)] // Has upper, lower, special - 3 types
    [InlineData("PASSWORD", false, "Password must contain at least 3 of the following")] // Only uppercase - 1 type
    [InlineData("password", false, "Password must contain at least 3 of the following")] // Only lowercase - 1 type
    [InlineData("12345678", false, "Password must contain at least 3 of the following")] // Only digits - 1 type
    [InlineData("!@#$%^&*", false, "Password must contain at least 3 of the following")] // Only special - 1 type
    [InlineData("Password", false, "Password must contain at least 3 of the following")] // Upper + lower - 2 types
    [InlineData("PASS123!", true, null)] // Upper + digit + special - 3 types
    [InlineData("password1", false, "Password must contain at least 3 of the following")] // Lower + digit - 2 types
    public void ValidatePassword_WithStandardPolicy_ReturnsExpectedResult(
        string password, bool expectedSuccess, string? expectedError)
    {
        // Arrange
        var policy = new PasswordPolicy(fallbackRequireSpecialOnly: false);

        // Act
        var result = policy.ValidatePassword(password);

        // Assert
        Assert.Equal(expectedSuccess, result.IsSuccess);
        if (expectedError != null)
        {
            Assert.Contains(expectedError, result.Error);
        }
    }

    [Theory]
    [InlineData("", false, "Password cannot be empty")]
    [InlineData("short", false, "Password must be at least 8 characters long")]
    [InlineData("Password123", false, "Password must contain at least one special character")]
    [InlineData("Password123!", true, null)]
    [InlineData("12345678!", true, null)]
    [InlineData("abcdefgh!", true, null)]
    public void ValidatePassword_WithFallbackPolicy_ReturnsExpectedResult(
        string password, bool expectedSuccess, string? expectedError)
    {
        // Arrange
        var policy = new PasswordPolicy(fallbackRequireSpecialOnly: true);

        // Act
        var result = policy.ValidatePassword(password);

        // Assert
        Assert.Equal(expectedSuccess, result.IsSuccess);
        if (expectedError != null)
        {
            Assert.Contains(expectedError, result.Error);
        }
    }
}