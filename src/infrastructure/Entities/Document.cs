using System.ComponentModel.DataAnnotations;

namespace L4H.Infrastructure.Entities;

public class Document
{
    public int Id { get; set; }
    
    public int ClientId { get; set; }
    public Client Client { get; set; } = null!;
    
    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string OriginalFileName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(1000)]
    public string FileUrl { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string ContentType { get; set; } = string.Empty;
    
    public long FileSize { get; set; }
    
    public DocumentCategory Category { get; set; } = DocumentCategory.Other;
    
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
    
    public DateTime UploadDate { get; set; } = DateTime.UtcNow;
    
    [Required]
    [MaxLength(255)]
    public string UploadedBy { get; set; } = string.Empty;
    
    // Security and access control
    public bool IsConfidential { get; set; } = false;
    
    [MaxLength(500)]
    public string AccessNotes { get; set; } = string.Empty;
    
    // Audit trail
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    [MaxLength(255)]
    public string LastAccessedBy { get; set; } = string.Empty;
    
    public DateTime? LastAccessedAt { get; set; }
}