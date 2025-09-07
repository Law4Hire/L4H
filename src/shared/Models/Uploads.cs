namespace L4H.Shared.Models;

// Upload DTOs
public class UploadPresignRequest
{
    public CaseId CaseId { get; set; }
    public string Filename { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
}

public class UploadPresignResponse
{
    public string Key { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public Dictionary<string, string> Headers { get; set; } = new Dictionary<string, string>();
    public Guid UploadId { get; set; }
}

public class UploadConfirmRequest
{
    public CaseId CaseId { get; set; }
    public string Key { get; set; } = string.Empty;
}

public class UploadConfirmResponse
{
    public string Status { get; set; } = string.Empty;
    public Guid UploadId { get; set; }
}

public class UploadListResponse
{
    public List<UploadSummary> Uploads { get; set; } = new List<UploadSummary>();
}

public class UploadSummary
{
    public Guid Id { get; set; }
    public string OriginalName { get; set; } = string.Empty;
    public string Mime { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? DownloadUrl { get; set; } // Only for clean files
    public DateTime CreatedAt { get; set; }
    public DateTime? VerdictAt { get; set; }
}

// Configuration DTOs
public class UploadLimitsResponse
{
    public long MaxSizeMB { get; set; }
    public List<string> AllowedExtensions { get; set; } = new List<string>();
}