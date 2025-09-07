namespace L4H.Infrastructure.Entities;

public class USSubdivision
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsState { get; set; } = false;
    public bool IsTerritory { get; set; } = false;
}