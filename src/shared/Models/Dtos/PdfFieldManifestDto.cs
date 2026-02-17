namespace L4H.Shared.Models.Dtos;

public class PdfFieldManifestDto
{
    public string FieldId { get; set; } = string.Empty;
    public string FieldType { get; set; } = string.Empty; // e.g., Textbox, Checkbox, Choice
    public string? DefaultValue { get; set; }
    public bool IsReadOnly { get; set; }
    public bool IsRequired { get; set; }
    public List<string>? Options { get; set; } // For dropdowns/radios
}
