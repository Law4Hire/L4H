namespace L4H.Shared.Models.Dtos;

public enum FormFieldMappingStatusDto
{
    Unmapped = 0,
    Mapped = 1,
    Ignored = 2
}

public class FormFieldMappingDto
{
    public Guid Id { get; set; }
    public Guid FormId { get; set; }
    public string PdfFieldId { get; set; } = string.Empty;
    public string? FoxlinDataKey { get; set; }
    public FormFieldMappingStatusDto Status { get; set; }
    public string? FieldType { get; set; }
    public string? DefaultValue { get; set; }
    public bool IsReadOnly { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateFormFieldMappingRequest
{
    public Guid FormId { get; set; }
    public string PdfFieldId { get; set; } = string.Empty;
    public string? FoxlinDataKey { get; set; }
    public string? FieldType { get; set; }
    public string? DefaultValue { get; set; }
    public bool IsReadOnly { get; set; }
}

public class UpdateFormFieldMappingRequest
{
    public string? FoxlinDataKey { get; set; }
    public FormFieldMappingStatusDto Status { get; set; }
}
