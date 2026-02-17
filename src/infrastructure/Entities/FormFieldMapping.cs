using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace L4H.Infrastructure.Entities;

public enum FormFieldMappingStatus
{
    Unmapped = 0,
    Mapped = 1,
    Ignored = 2
}

[Table("FormFieldMappings")]
public class FormFieldMapping
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid FormId { get; set; }

    [Required]
    [MaxLength(255)]
    public string PdfFieldId { get; set; } = string.Empty;

    /// <summary>
    /// The dot-notation path to the user data point (e.g. "User.FirstName", "Case.Petitioner.Address.Zip")
    /// </summary>
    [MaxLength(255)]
    public string? FoxlinDataKey { get; set; }

    public FormFieldMappingStatus Status { get; set; } = FormFieldMappingStatus.Unmapped;

    public string? FieldType { get; set; } // Text, Checkbox, etc. stored for reference
    public string? DefaultValue { get; set; }
    public bool IsReadOnly { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    [ForeignKey(nameof(FormId))]
    public virtual USCISFormEntity? Form { get; set; }
}
