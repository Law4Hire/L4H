namespace L4H.Shared.Models;

public class AuthConfig
{
    public EmailVerificationConfig EmailVerification { get; set; } = new();
    public PasswordPolicyConfig PasswordPolicy { get; set; } = new();
    public LockoutConfig Lockout { get; set; } = new();
    public RememberConfig Remember { get; set; } = new();
}

public class EmailVerificationConfig
{
    public bool Required { get; set; } = true;
}

public class PasswordPolicyConfig
{
    public int MinLength { get; set; } = 8;
    public int RequireClasses { get; set; } = 3; // 3 of 4 character classes
    public bool RequireSpecial { get; set; } = true;
}

public class LockoutConfig
{
    public int MaxFailures { get; set; } = 5;
    public int DurationMinutes { get; set; } = 15;
}

public class RememberConfig
{
    public int Days { get; set; } = 90;
}

public class SecurityConfig
{
    public CorsConfig Cors { get; set; } = new();
    public RateLimitsConfig RateLimits { get; set; } = new();
    public bool MaintenanceMode { get; set; } = false;
}

public class CorsConfig
{
    public string[] AllowedOrigins { get; set; } = Array.Empty<string>();
}

public class RateLimitsConfig
{
    public RateLimitPolicy AuthTight { get; set; } = new() { PerMinute = 10 };
    public RateLimitPolicy UploadsPresign { get; set; } = new() { PerMinute = 30 };
    public RateLimitPolicy Default { get; set; } = new() { PerMinute = 120 };
}

public class RateLimitPolicy
{
    public int PerMinute { get; set; }
}
