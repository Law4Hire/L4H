using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Text;

namespace L4H.Infrastructure.Services;

public interface IEmailVerificationService
{
    Task<string> CreateVerificationTokenAsync(UserId userId);
    Task<Result<UserId>> VerifyTokenAsync(string token);
    Task<bool> IsUserVerifiedAsync(UserId userId);
}

public class EmailVerificationService : IEmailVerificationService
{
    private readonly L4HDbContext _context;
    private readonly ILogger<EmailVerificationService> _logger;

    public EmailVerificationService(L4HDbContext context, ILogger<EmailVerificationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<string> CreateVerificationTokenAsync(UserId userId)
    {
        // Generate a secure random token
        var tokenBytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(tokenBytes);
        var token = Convert.ToBase64String(tokenBytes);

        // Hash the token for storage
        var tokenHash = HashToken(token);

        // Create verification token record
        var verificationToken = new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddHours(24), // 24 hour expiry
            CreatedAt = DateTime.UtcNow
        };

        _context.EmailVerificationTokens.Add(verificationToken);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        _logger.LogInformation("Created email verification token for user {UserId}", userId);
        return token;
    }

    public async Task<Result<UserId>> VerifyTokenAsync(string token)
    {
        var tokenHash = HashToken(token);

        var verificationToken = await _context.EmailVerificationTokens
            .Include(vt => vt.User)
            .FirstOrDefaultAsync(vt => vt.TokenHash == tokenHash && vt.UsedAt == null).ConfigureAwait(false);

        if (verificationToken == null)
        {
            _logger.LogWarning("Invalid email verification token attempted");
            return Result<UserId>.Failure("Invalid or expired verification token");
        }

        if (verificationToken.ExpiresAt < DateTime.UtcNow)
        {
            _logger.LogWarning("Expired email verification token attempted for user {UserId}", verificationToken.UserId);
            return Result<UserId>.Failure("Verification token has expired");
        }

        // Mark token as used
        verificationToken.UsedAt = DateTime.UtcNow;

        // Mark user as verified
        verificationToken.User.EmailVerified = true;

        await _context.SaveChangesAsync().ConfigureAwait(false);

        _logger.LogInformation("Email verified for user {UserId}", verificationToken.UserId);
        return Result<UserId>.Success(verificationToken.UserId);
    }

    public async Task<bool> IsUserVerifiedAsync(UserId userId)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId).ConfigureAwait(false);

        return user?.EmailVerified ?? false;
    }

    private static string HashToken(string token)
    {
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(hashBytes);
    }
}
