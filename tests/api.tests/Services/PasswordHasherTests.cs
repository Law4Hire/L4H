using L4H.Infrastructure.Services;
using Xunit;

namespace L4H.Api.Tests.Services;

public class PasswordHasherTests
{
    [Fact]
    public void HashPassword_ValidPassword_ReturnsHashedPassword()
    {
        // Arrange
        var hasher = new PasswordHasher();
        var password = "SecureTest123!";

        // Act
        var hashedPassword = hasher.HashPassword(password);

        // Assert
        Assert.NotNull(hashedPassword);
        Assert.NotEmpty(hashedPassword);
        Assert.NotEqual(password, hashedPassword);
        Assert.Contains("PBKDF2-SHA256", hashedPassword);
    }

    [Fact]
    public void HashPassword_SamePassword_GeneratesDifferentHashes()
    {
        // Arrange
        var hasher = new PasswordHasher();
        var password = "SecureTest123!";

        // Act
        var hash1 = hasher.HashPassword(password);
        var hash2 = hasher.HashPassword(password);

        // Assert
        Assert.NotEqual(hash1, hash2); // Different salts should produce different hashes
    }

    [Fact]
    public void VerifyPassword_CorrectPassword_ReturnsTrue()
    {
        // Arrange
        var hasher = new PasswordHasher();
        var password = "SecureTest123!";
        var hashedPassword = hasher.HashPassword(password);

        // Act
        var isValid = hasher.VerifyPassword(password, hashedPassword);

        // Assert
        Assert.True(isValid);
    }

    [Fact]
    public void VerifyPassword_IncorrectPassword_ReturnsFalse()
    {
        // Arrange
        var hasher = new PasswordHasher();
        var password = "SecureTest123!";
        var wrongPassword = "SecureTest123Different!";
        var hashedPassword = hasher.HashPassword(password);

        // Act
        var isValid = hasher.VerifyPassword(wrongPassword, hashedPassword);

        // Assert
        Assert.False(isValid);
    }

    [Theory]
    [InlineData(null, "hashedPassword")]
    [InlineData("", "hashedPassword")]
    [InlineData("password", null)]
    [InlineData("password", "")]
    public void VerifyPassword_NullOrEmptyInputs_ReturnsFalse(string? password, string? hashedPassword)
    {
        // Arrange
        var hasher = new PasswordHasher();

        // Act
        var isValid = hasher.VerifyPassword(password!, hashedPassword!);

        // Assert
        Assert.False(isValid);
    }

    [Fact]
    public void HashPassword_NullPassword_ThrowsArgumentNullException()
    {
        // Arrange
        var hasher = new PasswordHasher();

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => hasher.HashPassword(null!));
    }

    [Fact]
    public void VerifyPassword_InvalidHashFormat_ReturnsFalse()
    {
        // Arrange
        var hasher = new PasswordHasher();
        var password = "SecureTest123!";
        var invalidHash = "invalid_hash_format";

        // Act
        var isValid = hasher.VerifyPassword(password, invalidHash);

        // Assert
        Assert.False(isValid);
    }
}