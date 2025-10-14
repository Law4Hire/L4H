using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Configuration;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace L4H.Infrastructure.Services;

public interface IAuthService
{
    Task<Result<AuthResponse>> SignupAsync(SignupRequest request);
    Task<Result<AuthResponse>> LoginAsync(LoginRequest request);
    Task<Result<AuthResponse>> RefreshFromRememberTokenAsync(string token);
    Task<Result<MessageResponse>> ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<Result<MessageResponse>> ResetPasswordAsync(ResetPasswordRequest request);
    Task<bool> UserExistsAsync(string email);
    Task<Result<MessageResponse>> UpdateProfileAsync(UserId userId, UpdateProfileRequest request);
}

public class AuthService : IAuthService
{
    private readonly L4HDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IPasswordPolicy _passwordPolicy;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IRememberMeTokenService _rememberMeTokenService;
    private readonly IPasswordResetTokenService _passwordResetService;
    private readonly ILogger<AuthService> _logger;
    private readonly SupportOptions _supportOptions;

    public AuthService(
        L4HDbContext context,
        IPasswordHasher passwordHasher,
        IPasswordPolicy passwordPolicy,
        IJwtTokenService jwtTokenService,
        IRememberMeTokenService rememberMeTokenService,
        IPasswordResetTokenService passwordResetService,
        ILogger<AuthService> logger,
        IOptions<SupportOptions> supportOptions)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _passwordPolicy = passwordPolicy;
        _jwtTokenService = jwtTokenService;
        _rememberMeTokenService = rememberMeTokenService;
        _passwordResetService = passwordResetService;
        _logger = logger;
        _supportOptions = supportOptions.Value;
    }

    public async Task<Result<AuthResponse>> SignupAsync(SignupRequest request)
    {
        // Validate password policy
        var policyResult = _passwordPolicy.ValidatePassword(request.Password);
        if (!policyResult.IsSuccess)
        {
            return Result<AuthResponse>.Failure(policyResult.Error!);
        }

        // Check if user already exists
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email).ConfigureAwait(false);

        if (existingUser != null)
        {
            return Result<AuthResponse>.Failure("User with this email already exists");
        }

        // Create new user
        var user = new User
        {
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            EmailVerified = false,
            CreatedAt = DateTime.UtcNow,
            PasswordUpdatedAt = DateTime.UtcNow,
            FailedLoginCount = 0,
            IsAdmin = false,
            IsActive = true // New users should be active by default
        };

        _context.Users.Add(user);
        
        // Create a case for the new user if none exists
        var existingCase = await _context.Cases
            .FirstOrDefaultAsync(c => c.UserId == user.Id).ConfigureAwait(false);

        if (existingCase == null)
        {
            var newCase = new Case
            {
                UserId = user.Id,
                Status = "pending",
                CreatedAt = DateTime.UtcNow,
                LastActivityAt = DateTime.UtcNow
            };
            _context.Cases.Add(newCase);
        }

        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Generate JWT token
        var token = _jwtTokenService.GenerateAccessToken(user);

        return Result<AuthResponse>.Success(new AuthResponse
        {
            Token = token,
            UserId = user.Id,
            IsProfileComplete = IsProfileComplete(user),
            IsInterviewComplete = await IsInterviewCompleteAsync(user).ConfigureAwait(false),
            IsStaff = user.IsStaff,
            IsAdmin = user.IsAdmin
        });
    }

    public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email).ConfigureAwait(false);

        if (user == null)
        {
            return Result<AuthResponse>.Failure("Invalid email or password");
        }

        // Check if user is locked out
        if (user.LockoutUntil.HasValue && user.LockoutUntil > DateTimeOffset.UtcNow)
        {
            return Result<AuthResponse>.Failure("Account is temporarily locked. Please try again later.");
        }

        // Check if user account is active
        if (!user.IsActive)
        {
            return Result<AuthResponse>.Failure($"Your account has been deactivated. Please contact our office at {_supportOptions.PhoneNumber} for assistance.");
        }

        // Verify password
        if (!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            // Increment failed login count
            user.FailedLoginCount++;
            
            // Lock account after 5 failed attempts for 15 minutes
            if (user.FailedLoginCount >= 5)
            {
                user.LockoutUntil = DateTimeOffset.UtcNow.AddMinutes(15);
                _logger.LogWarning("Account locked for user {Email} after {FailedCount} failed login attempts", 
                    user.Email, user.FailedLoginCount);
            }
            
            await _context.SaveChangesAsync().ConfigureAwait(false);
            return Result<AuthResponse>.Failure("Invalid email or password");
        }

        // Reset failed login count on successful login
        user.FailedLoginCount = 0;
        user.LockoutUntil = null;
        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Generate JWT token
        var token = _jwtTokenService.GenerateAccessToken(user);

        var response = new AuthResponse
        {
            Token = token,
            UserId = user.Id,
            IsProfileComplete = IsProfileComplete(user),
            IsInterviewComplete = await IsInterviewCompleteAsync(user).ConfigureAwait(false),
            IsStaff = user.IsStaff,
            IsAdmin = user.IsAdmin
        };

        return Result<AuthResponse>.Success(response);
    }

    public async Task<Result<AuthResponse>> RefreshFromRememberTokenAsync(string token)
    {
        var user = await _rememberMeTokenService.ValidateAndRotateTokenAsync(token).ConfigureAwait(false);
        
        if (user == null)
        {
            return Result<AuthResponse>.Failure("Invalid or expired remember token");
        }

        // Generate new JWT token
        var jwtToken = _jwtTokenService.GenerateAccessToken(user);

        return Result<AuthResponse>.Success(new AuthResponse
        {
            Token = jwtToken,
            UserId = user.Id,
            IsProfileComplete = IsProfileComplete(user),
            IsInterviewComplete = await IsInterviewCompleteAsync(user).ConfigureAwait(false),
            IsStaff = user.IsStaff,
            IsAdmin = user.IsAdmin
        });
    }

    public async Task<Result<MessageResponse>> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var resetToken = await _passwordResetService.CreatePasswordResetTokenAsync(request.Email).ConfigureAwait(false);

        // For now, log the reset URL to console/Serilog (email wiring later)
        var resetUrl = $"https://localhost:8765/reset-password?token={Uri.EscapeDataString(resetToken)}";
        _logger.LogInformation("Password reset requested for {Email}. Reset URL: {ResetUrl}", 
            request.Email, resetUrl);

        // Always return success to prevent email enumeration
        return Result<MessageResponse>.Success(
            new MessageResponse { Message = "If an account with that email exists, a password reset link has been sent." });
    }

    public async Task<Result<MessageResponse>> ResetPasswordAsync(ResetPasswordRequest request)
    {
        // Validate new password policy
        var policyResult = _passwordPolicy.ValidatePassword(request.NewPassword);
        if (!policyResult.IsSuccess)
        {
            return Result<MessageResponse>.Failure(policyResult.Error!);
        }

        // Validate reset token
        var tokenValidation = await _passwordResetService.ValidatePasswordResetTokenAsync(request.Token).ConfigureAwait(false);
        if (!tokenValidation.IsSuccess)
        {
            return Result<MessageResponse>.Failure(tokenValidation.Error!);
        }

        var userId = tokenValidation.Value!;

        // Get user
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId).ConfigureAwait(false);
        if (user == null)
        {
            return Result<MessageResponse>.Failure("User not found");
        }

        // Update password
        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        user.PasswordUpdatedAt = DateTime.UtcNow;
        user.FailedLoginCount = 0;
        user.LockoutUntil = null;

        // Mark reset token as used
        await _passwordResetService.MarkTokenAsUsedAsync(request.Token).ConfigureAwait(false);

        // Revoke all remember-me tokens for security
        await _rememberMeTokenService.RevokeAllTokensForUserAsync(userId).ConfigureAwait(false);

        await _context.SaveChangesAsync().ConfigureAwait(false);

        return Result<MessageResponse>.Success(
            new MessageResponse { Message = "Password has been reset successfully." });
    }

    public async Task<bool> UserExistsAsync(string email)
    {
        return await _context.Users
            .AnyAsync(u => u.Email == email).ConfigureAwait(false);
    }

    public async Task<Result<MessageResponse>> UpdateProfileAsync(UserId userId, UpdateProfileRequest request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId).ConfigureAwait(false);

        if (user == null)
        {
            return Result<MessageResponse>.Failure("User not found");
        }

        // Update only the provided fields
        if (!string.IsNullOrEmpty(request.PhoneNumber))
            user.PhoneNumber = request.PhoneNumber;
        
        if (!string.IsNullOrEmpty(request.StreetAddress))
            user.StreetAddress = request.StreetAddress;
            
        if (!string.IsNullOrEmpty(request.City))
            user.City = request.City;
            
        if (!string.IsNullOrEmpty(request.StateProvince))
            user.StateProvince = request.StateProvince;
            
        if (!string.IsNullOrEmpty(request.PostalCode))
            user.PostalCode = request.PostalCode;
            
        if (!string.IsNullOrEmpty(request.Country))
            user.Country = request.Country;
            
        if (!string.IsNullOrEmpty(request.Nationality))
            user.Nationality = request.Nationality;

        if (request.DateOfBirth.HasValue)
            user.DateOfBirth = request.DateOfBirth.Value;

        if (!string.IsNullOrEmpty(request.MaritalStatus))
            user.MaritalStatus = request.MaritalStatus;

        if (!string.IsNullOrEmpty(request.Gender))
            user.Gender = request.Gender;

        await _context.SaveChangesAsync().ConfigureAwait(false);

        return Result<MessageResponse>.Success(
            new MessageResponse { Message = "Profile updated successfully" });
    }

    private static bool IsProfileComplete(User user)
    {
        // Check if essential profile fields are filled
        return !string.IsNullOrEmpty(user.Country) &&
               !string.IsNullOrEmpty(user.Nationality) &&
               !string.IsNullOrEmpty(user.StreetAddress) &&
               !string.IsNullOrEmpty(user.City) &&
               !string.IsNullOrEmpty(user.PostalCode) &&
               !string.IsNullOrEmpty(user.MaritalStatus) &&
               !string.IsNullOrEmpty(user.Gender) &&
               user.DateOfBirth.HasValue;
    }

    private async Task<bool> IsInterviewCompleteAsync(User user)
    {
        // Check if user has any completed interview sessions with visa recommendations
        var completedInterview = await _context.InterviewSessions
            .Where(s => s.UserId == user.Id && s.Status == "completed")
            .Join(_context.VisaRecommendations,
                session => session.CaseId,
                recommendation => recommendation.CaseId,
                (session, recommendation) => new { session, recommendation })
            .AnyAsync().ConfigureAwait(false);

        return completedInterview;
    }
}