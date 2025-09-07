namespace L4H.Infrastructure.Entities;

public class Country
{
    public int Id { get; set; }
    public string Iso2 { get; set; } = string.Empty;
    public string Iso3 { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}