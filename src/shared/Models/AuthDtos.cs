using System.ComponentModel.DataAnnotations;

namespace L4H.Shared.Models;

public record SignupRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    public string Password { get; init; } = string.Empty;

    [Required]
    public string FirstName { get; init; } = string.Empty;

    [Required]
    public string LastName { get; init; } = string.Empty;
}

public record LoginRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    public string Password { get; init; } = string.Empty;

    public bool RememberMe { get; init; }
}

public record ForgotPasswordRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;
}

public record ResetPasswordRequest
{
    [Required]
    public string Token { get; init; } = string.Empty;

    [Required]
    public string NewPassword { get; init; } = string.Empty;
}

public record AuthResponse
{
    public string Token { get; init; } = string.Empty;
    public UserId? UserId { get; init; }
    public bool IsProfileComplete { get; init; }
    public bool IsInterviewComplete { get; init; }
    public bool IsStaff { get; init; }
    public bool IsAdmin { get; init; }
}

public record MessageResponse
{
    public string Message { get; init; } = string.Empty;
}

public record UpdateProfileRequest
{
    [Phone]
    public string? PhoneNumber { get; init; }

    public string? StreetAddress { get; init; }

    public string? City { get; init; }

    public string? StateProvince { get; init; }

    public string? PostalCode { get; init; }

    public string? Country { get; init; }

    public string? Nationality { get; init; }

    public DateTime? DateOfBirth { get; init; }

    public string? MaritalStatus { get; init; }

    public string? Gender { get; init; }

    public string? GuardianEmail { get; init; }
}