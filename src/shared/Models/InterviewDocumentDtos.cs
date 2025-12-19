namespace L4H.Shared.Models;

/// <summary>
/// Configuration for document upload page type
/// </summary>
public record DocumentUploadConfig
{
    public string InstructionText { get; init; } = string.Empty;
    public string[] AllowedFileTypes { get; init; } = Array.Empty<string>();
    public int MaxFiles { get; init; } = 5;
    public int MinFiles { get; init; } = 1;
    public bool IsRequired { get; init; } = true;
}

/// <summary>
/// Configuration for attorney question page type
/// </summary>
public record AttorneyQuestionConfig
{
    public string SummaryText { get; init; } = string.Empty;
    public string CtaText { get; init; } = string.Empty;
}

/// <summary>
/// Request to generate a presigned upload URL for interview document
/// </summary>
public record InterviewDocumentPresignRequest
{
    public Guid SessionToken { get; init; }
    public Guid QuestionId { get; init; }
    public string Filename { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long SizeBytes { get; init; }
}

/// <summary>
/// Response containing presigned upload URL
/// </summary>
public record PresignedUploadResponse
{
    public string UploadUrl { get; init; } = string.Empty;
    public Guid UploadId { get; init; }
    public DateTime ExpiresAt { get; init; }
}

/// <summary>
/// Request to confirm successful upload
/// </summary>
public record ConfirmDocumentUploadRequest
{
    public Guid SessionToken { get; init; }
    public Guid UploadId { get; init; }
    public string StoragePath { get; init; } = string.Empty;
}

/// <summary>
/// Response for interview document
/// </summary>
public record InterviewDocumentResponse
{
    public Guid Id { get; init; }
    public string OriginalFileName { get; init; } = string.Empty;
    public long SizeBytes { get; init; }
    public DateTime UploadedAt { get; init; }
    public string Status { get; init; } = string.Empty;
}

/// <summary>
/// Request to delete a document
/// </summary>
public record DeleteDocumentRequest
{
    public Guid SessionToken { get; init; }
}

/// <summary>
/// Request to associate documents with user after registration
/// </summary>
public record AssociateDocumentsRequest
{
    public Guid SessionToken { get; init; }
    public Guid UserId { get; init; }
}
