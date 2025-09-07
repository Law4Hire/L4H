using System.Security.Cryptography;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace L4H.Infrastructure.Services;

public interface IPasswordResetTokenService
{
    Task<string> CreatePasswordResetTokenAsync(string email);
    Task<Result<UserId>> ValidatePasswordResetTokenAsync(string token);
    Task MarkTokenAsUsedAsync(string token);
}

public class PasswordResetTokenService : IPasswordResetTokenService
{
    private readonly L4HDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public PasswordResetTokenService(L4HDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<string> CreatePasswordResetTokenAsync(string email)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email).ConfigureAwait(false);

        if (user == null)
        {
            // For security, we generate a token anyway to prevent timing attacks
            // but it won't be stored in the database
            var dummyBytes = new byte[32];
            using var dummyRng = RandomNumberGenerator.Create();
            dummyRng.GetBytes(dummyBytes);
            return Convert.ToBase64String(dummyBytes);
        }

        // Generate a 256-bit (32 bytes) random token
        var tokenBytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(tokenBytes);
        
        var token = Convert.ToBase64String(tokenBytes);
        var tokenHash = _passwordHasher.HashPassword(token);

        var resetToken = new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddMinutes(60) // 60 minute expiry
        };

        _context.PasswordResetTokens.Add(resetToken);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        return token;
    }

    public async Task<Result<UserId>> ValidatePasswordResetTokenAsync(string token)
    {
        if (string.IsNullOrEmpty(token))
            return Result<UserId>.Failure("Invalid token");

        var now = DateTime.UtcNow;

        // Get all non-expired, non-used tokens
        var activeTokens = await _context.PasswordResetTokens
            .Where(t => t.ExpiresAt > now && t.UsedAt == null)
            .ToListAsync().ConfigureAwait(false);

        // Find matching token by verifying hash
        PasswordResetToken? matchingToken = null;
        foreach (var dbToken in activeTokens)
        {
            if (_passwordHasher.VerifyPassword(token, dbToken.TokenHash))
            {
                matchingToken = dbToken;
                break;
            }
        }

        if (matchingToken == null)
            return Result<UserId>.Failure("Invalid or expired token");

        return Result<UserId>.Success(matchingToken.UserId);
    }

    public async Task MarkTokenAsUsedAsync(string token)
    {
        if (string.IsNullOrEmpty(token))
            return;

        var now = DateTime.UtcNow;

        // Get all non-expired, non-used tokens
        var activeTokens = await _context.PasswordResetTokens
            .Where(t => t.ExpiresAt > now && t.UsedAt == null)
            .ToListAsync().ConfigureAwait(false);

        // Find matching token by verifying hash
        PasswordResetToken? matchingToken = null;
        foreach (var dbToken in activeTokens)
        {
            if (_passwordHasher.VerifyPassword(token, dbToken.TokenHash))
            {
                matchingToken = dbToken;
                break;
            }
        }

        if (matchingToken != null)
        {
            matchingToken.UsedAt = now;
            await _context.SaveChangesAsync().ConfigureAwait(false);
        }
    }
}