namespace L4H.Infrastructure.Entities;

/// <summary>
/// Junction table mapping which visa types are available for each country
/// </summary>
public class CountryVisaType
{
    public int Id { get; set; }

    public int CountryId { get; set; }
    public Country Country { get; set; } = null!;

    public int VisaTypeId { get; set; }
    public VisaType VisaType { get; set; } = null!;

    /// <summary>
    /// Whether this visa type is currently available for this country
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Optional notes about specific requirements or restrictions for this country
    /// </summary>
    public string? Notes { get; set; }
}
