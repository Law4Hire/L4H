using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Text;

namespace L4H.Infrastructure.Services;

public interface ISessionManagementService
{
    Task<string> CreateSessionAsync(UserId userId, string userAgent, string ipAddress);
    Task<Result<UserId>> ValidateSessionAsync(string refreshToken);
    Task RevokeAllSessionsAsync(UserId userId);
    Task RevokeSessionAsync(string refreshToken);
    Task<List<UserSession>> GetActiveSessionsAsync(UserId userId);
}

public class SessionManagementService : ISessionManagementService
{
    private readonly L4HDbContext _context;
    private readonly ILogger<SessionManagementService> _logger;

    public SessionManagementService(L4HDbContext context, ILogger<SessionManagementService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<string> CreateSessionAsync(UserId userId, string userAgent, string ipAddress)
    {
        // Generate a secure refresh token
        var refreshBytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(refreshBytes);
        var refreshToken = Convert.ToBase64String(refreshBytes);

        // Hash the token for storage
        var refreshIdHash = HashToken(refreshToken);
        var ipHash = HashToken(ipAddress);

        // Create session record
        var session = new UserSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            RefreshIdHash = refreshIdHash,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(90), // 90 day sliding window
            UserAgent = userAgent,
            IpHash = ipHash
        };

        _context.UserSessions.Add(session);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        _logger.LogInformation("Created session for user {UserId}", userId);
        return refreshToken;
    }

    public async Task<Result<UserId>> ValidateSessionAsync(string refreshToken)
    {
        var refreshIdHash = HashToken(refreshToken);

        var session = await _context.UserSessions
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.RefreshIdHash == refreshIdHash && s.RevokedAt == null).ConfigureAwait(false);

        if (session == null)
        {
            _logger.LogWarning("Invalid refresh token attempted");
            return Result<UserId>.Failure("Invalid or expired refresh token");
        }

        if (session.ExpiresAt < DateTime.UtcNow)
        {
            _logger.LogWarning("Expired refresh token attempted for user {UserId}", session.UserId);
            return Result<UserId>.Failure("Refresh token has expired");
        }

        // Extend session expiry (sliding window)
        session.ExpiresAt = DateTime.UtcNow.AddDays(90);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        _logger.LogInformation("Validated session for user {UserId}", session.UserId);
        return Result<UserId>.Success(session.UserId);
    }

    public async Task RevokeAllSessionsAsync(UserId userId)
    {
        var sessions = await _context.UserSessions
            .Where(s => s.UserId == userId && s.RevokedAt == null)
            .ToListAsync().ConfigureAwait(false);

        foreach (var session in sessions)
        {
            session.RevokedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync().ConfigureAwait(false);

        _logger.LogInformation("Revoked all sessions for user {UserId}", userId);
    }

    public async Task RevokeSessionAsync(string refreshToken)
    {
        var refreshIdHash = HashToken(refreshToken);

        var session = await _context.UserSessions
            .FirstOrDefaultAsync(s => s.RefreshIdHash == refreshIdHash && s.RevokedAt == null).ConfigureAwait(false);

        if (session != null)
        {
            session.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync().ConfigureAwait(false);

            _logger.LogInformation("Revoked session for user {UserId}", session.UserId);
        }
    }

    public async Task<List<UserSession>> GetActiveSessionsAsync(UserId userId)
    {
        return await _context.UserSessions
            .Where(s => s.UserId == userId && s.RevokedAt == null && s.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync().ConfigureAwait(false);
    }

    private static string HashToken(string token)
    {
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(hashBytes);
    }
}
