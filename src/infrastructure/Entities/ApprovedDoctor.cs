namespace L4H.Infrastructure.Entities;

public class ApprovedDoctor
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? City { get; set; }
    public string? StateProvince { get; set; }
    public string? PostalCode { get; set; }
    public string CountryCode { get; set; } = string.Empty; // ISO-2 or "NULL" for any country
    public string? Website { get; set; }
    public string? Specialties { get; set; } // Comma-separated specialties
    public string? Languages { get; set; } // Comma-separated languages
    public string? AcceptedCountryCodes { get; set; } // Comma-separated country codes this doctor accepts
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}