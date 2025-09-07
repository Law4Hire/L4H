using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class Upload
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public CaseId CaseId { get; set; }
    public string OriginalName { get; set; } = string.Empty;
    public string Mime { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string Key { get; set; } = string.Empty; // S3 key
    public string Status { get; set; } = "pending"; // pending|clean|infected|rejected
    public string? StorageUrl { get; set; } // URL in clean bucket after scan passes
    public DateTime? VerdictAt { get; set; } // When scan completed
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Case Case { get; set; } = null!;
}