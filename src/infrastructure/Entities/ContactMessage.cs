using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace L4H.Infrastructure.Entities;

[Table("ContactMessages")]
public class ContactMessage
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Phone { get; set; }

    [MaxLength(200)]
    public string? Subject { get; set; }

    [Required]
    [MaxLength(4000)]
    public string Message { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? ConsultationType { get; set; }

    [Required]
    [MaxLength(50)]
    public string ReferenceId { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsProcessed { get; set; }

    public DateTime? ProcessedAt { get; set; }

    [MaxLength(255)]
    public string? ProcessedBy { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}
