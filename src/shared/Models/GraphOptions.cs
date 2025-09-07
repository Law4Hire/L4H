namespace L4H.Shared.Models;

public enum GraphMode
{
    Fake,
    Live
}

public class GraphOptions
{
    public GraphMode Mode { get; set; } = GraphMode.Fake;
    public string? TenantId { get; set; }
    public string? ClientId { get; set; }
    public string? ClientSecret { get; set; }
    public string? MailboxFrom { get; set; }
    public string? AvailabilityEmailDomain { get; set; }
}