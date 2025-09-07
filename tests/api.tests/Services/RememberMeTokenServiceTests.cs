using L4H.Api.Tests.TestHelpers;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Services;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace L4H.Api.Tests.Services;

public class RememberMeTokenServiceTests : SqlServerDbTestBase
{
    private readonly IPasswordHasher _passwordHasher;
    private readonly RememberMeTokenService _tokenService;

    public RememberMeTokenServiceTests()
    {
        _passwordHasher = new PasswordHasher();
        _tokenService = new RememberMeTokenService(DbContext, _passwordHasher);
    }

    [Fact]
    public async Task CreateRememberMeTokenAsync_ValidUserId_ReturnsToken()
    {
        // Arrange
        var user = new User
        {
            Email = "test@example.com",
            PasswordHash = "dummy_hash",
            EmailVerified = true,
            CreatedAt = DateTime.UtcNow,
            PasswordUpdatedAt = DateTime.UtcNow,
            FailedLoginCount = 0,
            IsAdmin = false
        };
        
        DbContext.Users.Add(user);
        await DbContext.SaveChangesAsync();

        // Act
        var token = await _tokenService.CreateRememberMeTokenAsync(user.Id);

        // Assert
        Assert.NotNull(token);
        Assert.NotEmpty(token);

        // Verify token is stored in database
        var storedToken = await DbContext.RememberMeTokens
            .FirstOrDefaultAsync(t => t.UserId == user.Id);
        Assert.NotNull(storedToken);
        Assert.True(storedToken.ExpiresAt > DateTime.UtcNow.AddDays(89)); // Should be ~90 days
    }

    [Fact]
    public async Task ValidateAndRotateTokenAsync_ValidToken_ReturnsUserAndRotatesToken()
    {
        // Arrange
        var user = new User
        {
            Email = "test@example.com",
            PasswordHash = "dummy_hash",
            EmailVerified = true,
            CreatedAt = DateTime.UtcNow,
            PasswordUpdatedAt = DateTime.UtcNow,
            FailedLoginCount = 0,
            IsAdmin = false
        };
        
        DbContext.Users.Add(user);
        await DbContext.SaveChangesAsync();

        var originalToken = await _tokenService.CreateRememberMeTokenAsync(user.Id);

        // Act
        var returnedUser = await _tokenService.ValidateAndRotateTokenAsync(originalToken);

        // Assert
        Assert.NotNull(returnedUser);
        Assert.Equal(user.Id, returnedUser.Id);

        // Verify original token is revoked
        var originalDbToken = await DbContext.RememberMeTokens
            .Where(t => t.UserId == user.Id && t.RevokedAt != null)
            .FirstOrDefaultAsync();
        Assert.NotNull(originalDbToken);

        // Verify new token exists
        var newDbToken = await DbContext.RememberMeTokens
            .Where(t => t.UserId == user.Id && t.RevokedAt == null)
            .FirstOrDefaultAsync();
        Assert.NotNull(newDbToken);
    }

    [Fact]
    public async Task ValidateAndRotateTokenAsync_InvalidToken_ReturnsNull()
    {
        // Act
        var result = await _tokenService.ValidateAndRotateTokenAsync("invalid_token");

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task ValidateAndRotateTokenAsync_ExpiredToken_ReturnsNull()
    {
        // Arrange
        var user = new User
        {
            Email = "test@example.com",
            PasswordHash = "dummy_hash",
            EmailVerified = true,
            CreatedAt = DateTime.UtcNow,
            PasswordUpdatedAt = DateTime.UtcNow,
            FailedLoginCount = 0,
            IsAdmin = false
        };
        
        DbContext.Users.Add(user);

        var expiredToken = new RememberMeToken
        {
            UserId = user.Id,
            TokenHash = _passwordHasher.HashPassword("expired_token"),
            IssuedAt = DateTime.UtcNow.AddDays(-100),
            ExpiresAt = DateTime.UtcNow.AddDays(-10), // Expired
            User = user
        };

        DbContext.RememberMeTokens.Add(expiredToken);
        await DbContext.SaveChangesAsync();

        // Act
        var result = await _tokenService.ValidateAndRotateTokenAsync("expired_token");

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task RevokeAllTokensForUserAsync_ValidUserId_RevokesAllTokens()
    {
        // Arrange
        var user = new User
        {
            Email = "test@example.com",
            PasswordHash = "dummy_hash",
            EmailVerified = true,
            CreatedAt = DateTime.UtcNow,
            PasswordUpdatedAt = DateTime.UtcNow,
            FailedLoginCount = 0,
            IsAdmin = false
        };
        
        DbContext.Users.Add(user);
        await DbContext.SaveChangesAsync();

        // Create multiple tokens
        await _tokenService.CreateRememberMeTokenAsync(user.Id);
        await _tokenService.CreateRememberMeTokenAsync(user.Id);
        await _tokenService.CreateRememberMeTokenAsync(user.Id);

        // Act
        await _tokenService.RevokeAllTokensForUserAsync(user.Id);

        // Assert
        var activeTokens = await DbContext.RememberMeTokens
            .Where(t => t.UserId == user.Id && t.RevokedAt == null)
            .CountAsync();
        Assert.Equal(0, activeTokens);

        var revokedTokens = await DbContext.RememberMeTokens
            .Where(t => t.UserId == user.Id && t.RevokedAt != null)
            .CountAsync();
        Assert.Equal(3, revokedTokens);
    }
}