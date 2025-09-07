namespace L4H.Infrastructure.Entities;

public class CountryServiceMapping
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Service { get; set; } // PanelPhysician etc.
    public required string FromCountry { get; set; } // e.g., AD
    public required string ToCountry { get; set; } // e.g., ES
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}