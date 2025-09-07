namespace L4H.Api.Configuration;

public class GraphOptions
{
    public const string SectionName = "Graph";

    public string Mode { get; set; } = "Fake";
    public string TenantId { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string MailboxFrom { get; set; } = "DoNotReply <donotreply@cannlaw.com>";
    public string AvailabilityEmailDomain { get; set; } = "cannlaw.com";
}
