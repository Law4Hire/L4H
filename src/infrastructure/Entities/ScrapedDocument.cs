namespace L4H.Infrastructure.Entities;

public class ScrapedDocument
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string CountryCode { get; set; }
    public required string VisaTypeCode { get; set; }
    public required string Source { get; set; } // Embassy|USCIS
    public required string Url { get; set; }
    public DateTime FetchedAt { get; set; }
    public required string Sha256 { get; set; }
    public required string Content { get; set; } // text/html; stored compressed or plain
    public string? HeadersJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}