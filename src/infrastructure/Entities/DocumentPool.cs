using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using L4H.Shared.Models;
using L4H.Shared.Enums;

namespace L4H.Infrastructure.Entities;

[Table("DocumentPool")]
public class DocumentPool
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(255)]
    public string OriginalFileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string StorageFileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string FileUrl { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string ContentType { get; set; } = string.Empty;

    public long FileSize { get; set; }

    public VerificationStatus Status { get; set; } = VerificationStatus.Pending;

    // Optional assignment
    public UserId? AssignedUserId { get; set; }
    
    [ForeignKey(nameof(AssignedUserId))]
    public virtual User? AssignedUser { get; set; }

    public CaseId? AssignedCaseId { get; set; }
    
    [ForeignKey(nameof(AssignedCaseId))]
    public virtual Case? AssignedCase { get; set; }

    // Verification Info
    public bool IsVerified { get; set; }
    
    public DateTime? VerifiedAt { get; set; }
    
    public int? VerifiedByStaffId { get; set; } // Matches Attorney.Id

    [ForeignKey(nameof(VerifiedByStaffId))]
    public virtual Attorney? VerifiedByStaff { get; set; }

    public string? RejectionReason { get; set; }

    [MaxLength(1000)]
    public string? InternalNotes { get; set; }

    // Metadata
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    
    [MaxLength(255)]
    public string UploadedBy { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
