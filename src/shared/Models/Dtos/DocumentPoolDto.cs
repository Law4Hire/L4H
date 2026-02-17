using L4H.Shared.Enums;
using L4H.Shared.Models;

namespace L4H.Shared.Models.Dtos;

public class DocumentPoolDto
{
    public Guid Id { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public VerificationStatus Status { get; set; }
    public bool IsVerified { get; set; }
    public UserId? AssignedUserId { get; set; }
    public CaseId? AssignedCaseId { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public int? VerifiedByStaffId { get; set; }
    public string? RejectionReason { get; set; }
    public string? InternalNotes { get; set; }
    public DateTime UploadedAt { get; set; }
    public string UploadedBy { get; set; } = string.Empty;
}

public class VerifyDocumentRequest
{
    public bool Approve { get; set; }
    public string? RejectionReason { get; set; }
    public string? InternalNotes { get; set; }
    public int StaffId { get; set; }
}

public class AssignDocumentRequest
{
    public UserId? UserId { get; set; }
    public CaseId? CaseId { get; set; }
}
