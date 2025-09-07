namespace L4H.Infrastructure.Entities;

public class VisaClass
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? GeneralCategory { get; set; }
    public bool IsActive { get; set; } = true;
}