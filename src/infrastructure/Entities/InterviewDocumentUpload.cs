using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

/// <summary>
/// Tracks documents uploaded during interview sessions.
/// Supports both anonymous (pre-registration) and authenticated users.
/// Files are initially stored in session-specific folders and moved to user folders upon registration.
/// </summary>
public class InterviewDocumentUpload
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Interview session this upload belongs to
    /// </summary>
    public Guid InterviewSessionId { get; set; }

    /// <summary>
    /// Question that prompted this upload
    /// </summary>
    public Guid QuestionId { get; set; }

    /// <summary>
    /// Original filename as uploaded by user
    /// </summary>
    public string OriginalFileName { get; set; } = string.Empty;

    /// <summary>
    /// Unique filename in storage (timestamp + sanitized name)
    /// </summary>
    public string StoredFileName { get; set; } = string.Empty;

    /// <summary>
    /// MIME content type
    /// </summary>
    public string ContentType { get; set; } = string.Empty;

    /// <summary>
    /// File size in bytes
    /// </summary>
    public long SizeBytes { get; set; }

    /// <summary>
    /// Relative path in storage
    /// Format: interview-sessions/{sessionToken}/{questionId}/{storedFileName}
    /// Or: users/{userId}/interview-documents/{questionId}/{storedFileName}
    /// </summary>
    public string StoragePath { get; set; } = string.Empty;

    /// <summary>
    /// Upload status: pending, uploaded, verified, failed
    /// </summary>
    public string Status { get; set; } = "pending";

    /// <summary>
    /// When the file was uploaded
    /// </summary>
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// User ID (null until registration completes)
    /// Set when user registers and files are associated to their account
    /// </summary>
    public UserId? UserId { get; set; }

    /// <summary>
    /// When the upload was associated to a user account
    /// </summary>
    public DateTime? AssociatedToUserAt { get; set; }

    // Navigation properties
    public InterviewSession InterviewSession { get; set; } = null!;
    public InterviewQuestionEntity Question { get; set; } = null!;
    public User? User { get; set; }
}
