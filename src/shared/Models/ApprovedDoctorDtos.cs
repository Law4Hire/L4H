using System.ComponentModel.DataAnnotations;

namespace L4H.Shared.Models;

public record CreateApprovedDoctorRequest
{
    [Required]
    public string Name { get; init; } = string.Empty;

    [Required]
    public string Address { get; init; } = string.Empty;

    public string? Phone { get; init; }

    [EmailAddress]
    public string? Email { get; init; }

    public string? City { get; init; }

    public string? StateProvince { get; init; }

    public string? PostalCode { get; init; }

    [Required]
    public string CountryCode { get; init; } = string.Empty;

    [Url]
    public string? Website { get; init; }

    /// <summary>
    /// Comma-separated list of medical specialties
    /// </summary>
    public string? Specialties { get; init; }

    /// <summary>
    /// Comma-separated list of languages spoken
    /// </summary>
    public string? Languages { get; init; }

    /// <summary>
    /// Comma-separated list of country codes this doctor accepts patients from
    /// </summary>
    public string? AcceptedCountryCodes { get; init; }

    public string? Notes { get; init; }
}

public record ApprovedDoctorResponse
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Address { get; init; } = string.Empty;
    public string? Phone { get; init; }
    public string? Email { get; init; }
    public string? City { get; init; }
    public string? StateProvince { get; init; }
    public string? PostalCode { get; init; }
    public string CountryCode { get; init; } = string.Empty;
    public string? Website { get; init; }
    public string? Specialties { get; init; }
    public string? Languages { get; init; }
    public string? AcceptedCountryCodes { get; init; }
    public string? Notes { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}