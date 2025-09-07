using System.Security.Cryptography;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace L4H.Infrastructure.Services;

public interface IRememberMeTokenService
{
    Task<string> CreateRememberMeTokenAsync(UserId userId);
    Task<User?> ValidateAndRotateTokenAsync(string token);
    Task RevokeAllTokensForUserAsync(UserId userId);
}

public class RememberMeTokenService : IRememberMeTokenService
{
    private readonly L4HDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public RememberMeTokenService(L4HDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<string> CreateRememberMeTokenAsync(UserId userId)
    {
        // Generate a 256-bit (32 bytes) random token
        var tokenBytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(tokenBytes);
        
        var token = Convert.ToBase64String(tokenBytes);
        var tokenHash = _passwordHasher.HashPassword(token);

        var rememberMeToken = new RememberMeToken
        {
            UserId = userId,
            TokenHash = tokenHash,
            IssuedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(90) // 90 day expiry
        };

        _context.RememberMeTokens.Add(rememberMeToken);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        return token;
    }

    public async Task<User?> ValidateAndRotateTokenAsync(string token)
    {
        if (string.IsNullOrEmpty(token))
            return null;

        var now = DateTime.UtcNow;

        // Get all non-expired, non-revoked tokens
        var activeTokens = await _context.RememberMeTokens
            .Where(t => t.ExpiresAt > now && t.RevokedAt == null)
            .Include(t => t.User)
            .ToListAsync().ConfigureAwait(false);

        // Find matching token by verifying hash
        RememberMeToken? matchingToken = null;
        foreach (var dbToken in activeTokens)
        {
            if (_passwordHasher.VerifyPassword(token, dbToken.TokenHash))
            {
                matchingToken = dbToken;
                break;
            }
        }

        if (matchingToken == null)
            return null;

        // Revoke the used token
        matchingToken.RevokedAt = now;

        // Create a new token for rotation
        var newToken = await CreateRememberMeTokenAsync(matchingToken.UserId).ConfigureAwait(false);

        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Return user so caller can generate new JWT and set new cookie
        return matchingToken.User;
    }

    public async Task RevokeAllTokensForUserAsync(UserId userId)
    {
        var now = DateTime.UtcNow;
        
        var activeTokens = await _context.RememberMeTokens
            .Where(t => t.UserId == userId && t.RevokedAt == null)
            .ToListAsync().ConfigureAwait(false);

        foreach (var token in activeTokens)
        {
            token.RevokedAt = now;
        }

        await _context.SaveChangesAsync().ConfigureAwait(false);
    }
}