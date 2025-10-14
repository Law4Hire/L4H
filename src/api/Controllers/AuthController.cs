using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Services;
using L4H.Shared.Models;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;
using System.ComponentModel.DataAnnotations;

namespace L4H.Api.Controllers;

[ApiController]
[Route("v1/auth")]
[Tags("Authentication")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IRememberMeTokenService _rememberMeTokenService;
    private readonly IEmailVerificationService _emailVerificationService;
    private readonly ISessionManagementService _sessionManagementService;
    private readonly ICsrfService _csrfService;
    private readonly IRateLimitingService _rateLimitingService;
    private readonly IAccountLockoutService _accountLockoutService;
    private readonly IStringLocalizer<Shared> _localizer;
    private readonly AuthConfig _authConfig;
    private readonly ILogger<AuthController> _logger;
    private readonly IMailService _mailService;

    public AuthController(
        IAuthService authService,
        IRememberMeTokenService rememberMeTokenService,
        IEmailVerificationService emailVerificationService,
        ISessionManagementService sessionManagementService,
        ICsrfService csrfService,
        IRateLimitingService rateLimitingService,
        IAccountLockoutService accountLockoutService,
        IStringLocalizer<Shared> localizer,
        IOptions<AuthConfig> authConfig,
        ILogger<AuthController> logger,
        IMailService mailService)
    {
        _authService = authService;
        _rememberMeTokenService = rememberMeTokenService;
        _emailVerificationService = emailVerificationService;
        _sessionManagementService = sessionManagementService;
        _csrfService = csrfService;
        _rateLimitingService = rateLimitingService;
        _accountLockoutService = accountLockoutService;
        _localizer = localizer;
        _authConfig = authConfig.Value;
        _logger = logger;
        _mailService = mailService;
    }

    /// <summary>
    /// Get CSRF token for cookie-based endpoints
    /// </summary>
    /// <returns>CSRF token</returns>
    [HttpGet("csrf")]
    [ProducesResponseType<string>(StatusCodes.Status200OK)]
    public IActionResult GetCsrfToken()
    {
        var token = _csrfService.GetToken();
        Response.Headers["X-CSRF-TOKEN"] = token;
        return Ok(new { token });
    }

    /// <summary>
    /// Check if a user exists by email
    /// </summary>
    /// <param name="email">Email to check</param>
    /// <returns>True if user exists, false otherwise</returns>
    [HttpGet("check-email")]
    [ProducesResponseType<bool>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CheckEmailExists([FromQuery, Required, EmailAddress] string email)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userExists = await _authService.UserExistsAsync(email).ConfigureAwait(false);
        return Ok(new { exists = userExists });
    }

    /// <summary>
    /// Register a new user account
    /// </summary>
    /// <param name="request">Signup details</param>
    /// <returns>JWT access token</returns>
    [HttpPost("signup")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Signup([FromBody] SignupRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService.SignupAsync(request).ConfigureAwait(false);
        
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        // Create email verification token if required
        if (_authConfig.EmailVerification.Required && result.Value!.UserId.HasValue)
        {
            var verificationToken = await _emailVerificationService.CreateVerificationTokenAsync(result.Value.UserId.Value).ConfigureAwait(false);
            // In a real implementation, this would be sent via email
            // For now, we'll log it for testing
            _logger.LogInformation("Email verification token for {Email}: {Token}", request.Email, verificationToken);
        }

        // Create a session for the user
        if (result.Value?.UserId.HasValue == true)
        {
            var session = await _sessionManagementService.CreateSessionAsync(result.Value.UserId.Value, HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown", Request.Headers.UserAgent.ToString() ?? string.Empty).ConfigureAwait(false);
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Authenticate user and obtain access token
    /// </summary>
    /// <param name="request">Login credentials</param>
    /// <returns>JWT access token and optional remember-me cookie</returns>
    [HttpPost("login")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Check IP rate limit
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var ipRateLimit = await _rateLimitingService.CheckIpRateLimitAsync(
            clientIp, 
            10, // Default rate limit for auth endpoints
            TimeSpan.FromMinutes(1)).ConfigureAwait(false);
        
        if (!ipRateLimit.IsSuccess)
        {
            Response.Headers["Retry-After"] = "60";
            return StatusCode(429, new ProblemDetails
            {
                Title = "Rate Limit Exceeded",
                Detail = ipRateLimit.Error
            });
        }

        var result = await _authService.LoginAsync(request).ConfigureAwait(false);
        
        if (!result.IsSuccess)
        {
            // Record failed login attempt if we have a user ID
            if (result.Value?.UserId.HasValue == true)
            {
                await _accountLockoutService.RecordFailedLoginAsync(result.Value.UserId.Value).ConfigureAwait(false);
            }

            // Check if this is a specific inactive account error
            if (result.Error!.Contains("deactivated"))
            {
                return Unauthorized(new ProblemDetails
                {
                    Title = "Account Deactivated",
                    Detail = result.Error
                });
            }

            return Unauthorized(new ProblemDetails
            {
                Title = "Authentication Failed",
                Detail = _localizer["Auth.LoginFailed"]
            });
        }

        // Check account lockout
        if (result.Value!.UserId.HasValue)
        {
            var lockoutCheck = await _accountLockoutService.CheckAccountLockoutAsync(result.Value.UserId.Value).ConfigureAwait(false);
            if (!lockoutCheck.IsSuccess)
            {
                return Unauthorized(new ProblemDetails
                {
                    Title = "Account Locked",
                    Detail = lockoutCheck.Error
                });
            }

            // Clear lockout on successful login
            await _accountLockoutService.ClearLockoutAsync(result.Value.UserId.Value).ConfigureAwait(false);
        }

        // Check email verification requirement
        if (_authConfig.EmailVerification.Required && result.Value!.UserId.HasValue)
        {
            var isVerified = await _emailVerificationService.IsUserVerifiedAsync(result.Value.UserId.Value).ConfigureAwait(false);
            if (!isVerified)
            {
                return Unauthorized(new ProblemDetails
                {
                    Title = "Email Verification Required",
                    Detail = _localizer["Auth.EmailVerificationRequired"]
                });
            }
        }

        // If remember me was requested, create and set remember token cookie
        if (request.RememberMe && result.Value!.UserId.HasValue)
        {
            var rememberToken = await _rememberMeTokenService.CreateRememberMeTokenAsync(result.Value!.UserId!.Value).ConfigureAwait(false);
            
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = HttpContext.Request.IsHttps,
                SameSite = SameSiteMode.Lax, // Changed from Strict to Lax for better UX
                Domain = Request.Host.Host == "localhost" ? "localhost" : Request.Host.Host,
                Expires = DateTimeOffset.UtcNow.AddDays(_authConfig.Remember.Days),
                Path = "/"
            };

            Response.Cookies.Append("l4h_remember", rememberToken, cookieOptions);
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Exchange remember-me token for new access token
    /// </summary>
    /// <returns>New JWT access token</returns>
    [HttpPost("remember")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Remember()
    {
        if (!Request.Cookies.TryGetValue("l4h_remember", out var rememberToken) || 
            string.IsNullOrEmpty(rememberToken))
        {
            return Unauthorized(new { error = "Remember token not found" });
        }

        var result = await _authService.RefreshFromRememberTokenAsync(rememberToken).ConfigureAwait(false);
        
        if (!result.IsSuccess)
        {
            // Clear the invalid cookie
            Response.Cookies.Delete("l4h_remember");
            return Unauthorized(new { error = result.Error });
        }

        // The remember token service already rotated the token, so we need to set the new one
        if (result.Value!.UserId.HasValue)
        {
            var newRememberToken = await _rememberMeTokenService.CreateRememberMeTokenAsync(result.Value!.UserId!.Value).ConfigureAwait(false);
            
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = HttpContext.Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Domain = Request.Host.Host == "localhost" ? "localhost" : Request.Host.Host,
                Expires = DateTimeOffset.UtcNow.AddDays(_authConfig.Remember.Days),
                Path = "/"
            };

            Response.Cookies.Append("l4h_remember", newRememberToken, cookieOptions);
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Verify email address with token
    /// </summary>
    /// <param name="token">Verification token</param>
    /// <returns>Success or error message</returns>
    [HttpGet("verify")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status410Gone)]
    public async Task<IActionResult> VerifyEmail([FromQuery] string token)
    {
        if (string.IsNullOrEmpty(token))
        {
            return BadRequest(new { error = _localizer["Auth.InvalidToken"] });
        }

        var result = await _emailVerificationService.VerifyTokenAsync(token).ConfigureAwait(false);
        
        if (!result.IsSuccess)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { message = _localizer["Auth.EmailVerified"] });
    }

    /// <summary>
    /// Request password reset email
    /// </summary>
    /// <param name="request">Email address</param>
    /// <returns>Success message</returns>
    [HttpPost("forgot")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService.ForgotPasswordAsync(request).ConfigureAwait(false);
        
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Reset password with token
    /// </summary>
    /// <param name="request">Reset password details</param>
    /// <returns>Success message</returns>
    [HttpPost("reset")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status410Gone)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService.ResetPasswordAsync(request).ConfigureAwait(false);
        
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }

    /// <summary>
    /// Logout from all devices (revoke all sessions)
    /// </summary>
    /// <returns>Success message</returns>
    [HttpPost("logout-all")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> LogoutAll()
    {
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userIdGuid))
        {
            return Unauthorized(new { error = "Invalid user" });
        }
        var userId = new UserId(userIdGuid);

        await _sessionManagementService.RevokeAllSessionsAsync(userId).ConfigureAwait(false);
        
        // Clear remember-me cookie
        Response.Cookies.Delete("l4h_remember");

        return Ok(new { message = _localizer["Auth.LoggedOutAllDevices"] });
    }

    /// <summary>
    /// Get active sessions for current user
    /// </summary>
    /// <returns>List of active sessions</returns>
    [HttpGet("sessions")]
    [ProducesResponseType<List<UserSession>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetSessions()
    {
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userIdGuid))
        {
            return Unauthorized(new { error = "Invalid user" });
        }
        var userId = new UserId(userIdGuid);

        var sessions = await _sessionManagementService.GetActiveSessionsAsync(userId).ConfigureAwait(false);
        return Ok(sessions);
    }

    /// <summary>
    /// Update user profile information
    /// </summary>
    /// <param name="request">Profile update details</param>
    /// <returns>Success message</returns>
    [HttpPut("profile")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        if (!ModelState.IsValid)
        {
            _logger.LogWarning("Profile update validation failed. Errors: {Errors}",
                string.Join("; ", ModelState.SelectMany(x => x.Value?.Errors ?? [], (kvp, error) =>
                    $"{kvp.Key}: {error.ErrorMessage}")));
            return BadRequest(ModelState);
        }

        var userIdClaim = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userIdGuid))
        {
            return Unauthorized(new { error = "Invalid user" });
        }
        var userId = new UserId(userIdGuid);

        var result = await _authService.UpdateProfileAsync(userId, request).ConfigureAwait(false);

        if (request.GuardianEmail != null)
        {
            await _mailService.SendEmailAsync(request.GuardianEmail, "Guardian Invitation", "You have been invited as a guardian.").ConfigureAwait(false);
        }
        
        if (!result.IsSuccess)
            return BadRequest(new { error = result.Error });

        return Ok(result.Value);
    }
}
