using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Data;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;

namespace L4H.Infrastructure.Services;

public interface IAccountLockoutService
{
    Task<Result<bool>> CheckAccountLockoutAsync(UserId userId, CancellationToken cancellationToken = default);
    Task<Result<bool>> RecordFailedLoginAsync(UserId userId, CancellationToken cancellationToken = default);
    Task<Result<bool>> ClearLockoutAsync(UserId userId, CancellationToken cancellationToken = default);
    Task<Result<bool>> IsAccountLockedAsync(UserId userId, CancellationToken cancellationToken = default);
}

public class AccountLockoutService : IAccountLockoutService
{
    private readonly L4HDbContext _context;
    private readonly AuthConfig _authConfig;
    private readonly ILogger<AccountLockoutService> _logger;

    public AccountLockoutService(
        L4HDbContext context,
        IOptions<AuthConfig> authConfig,
        ILogger<AccountLockoutService> logger)
    {
        ArgumentNullException.ThrowIfNull(authConfig);
        
        _context = context;
        _authConfig = authConfig.Value;
        _logger = logger;
    }

    public async Task<Result<bool>> CheckAccountLockoutAsync(UserId userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
                .ConfigureAwait(false);

            if (user == null)
            {
                return Result<bool>.Failure("User not found.");
            }

            // Check if account is locked
            if (user.LockoutUntil.HasValue && user.LockoutUntil > DateTimeOffset.UtcNow)
            {
                var remainingTime = user.LockoutUntil.Value - DateTimeOffset.UtcNow;
                _logger.LogWarning("Account {UserId} is locked until {LockedUntil}. Remaining time: {RemainingTime}", 
                    userId.Value, user.LockoutUntil.Value, remainingTime);
                
                return Result<bool>.Failure($"Account locked. Try again in {remainingTime.Minutes} minutes.");
            }

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking account lockout for user {UserId}", userId.Value);
            return Result<bool>.Failure("Failed to check account lockout status.");
        }
    }

    public async Task<Result<bool>> RecordFailedLoginAsync(UserId userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
                .ConfigureAwait(false);

            if (user == null)
            {
                return Result<bool>.Failure("User not found.");
            }

            // Increment failed login count
            user.FailedLoginCount++;

            // Check if we should lock the account
            if (user.FailedLoginCount >= _authConfig.Lockout.MaxFailures)
            {
                user.LockoutUntil = DateTimeOffset.UtcNow.AddMinutes(_authConfig.Lockout.DurationMinutes);
                _logger.LogWarning("Account {UserId} locked due to {FailedAttempts} failed login attempts", 
                    userId.Value, user.FailedLoginCount);
            }

            await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording failed login for user {UserId}", userId.Value);
            return Result<bool>.Failure("Failed to record failed login.");
        }
    }

    public async Task<Result<bool>> ClearLockoutAsync(UserId userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
                .ConfigureAwait(false);

            if (user == null)
            {
                return Result<bool>.Failure("User not found.");
            }

            // Clear lockout
            user.FailedLoginCount = 0;
            user.LockoutUntil = null;

            await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            
            _logger.LogInformation("Lockout cleared for user {UserId}", userId.Value);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing lockout for user {UserId}", userId.Value);
            return Result<bool>.Failure("Failed to clear account lockout.");
        }
    }

    public async Task<Result<bool>> IsAccountLockedAsync(UserId userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
                .ConfigureAwait(false);

            if (user == null)
            {
                return Result<bool>.Failure("User not found.");
            }

            var isLocked = user.LockoutUntil.HasValue && user.LockoutUntil > DateTimeOffset.UtcNow;
            return Result<bool>.Success(isLocked);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if account is locked for user {UserId}", userId.Value);
            return Result<bool>.Failure("Failed to check lockout status.");
        }
    }
}