namespace L4H.Infrastructure.Entities;

public enum FormFieldType
{
    Text,
    Date,
    Select,
    Checkbox
}

public class FormField
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TemplateId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string LabelKey { get; set; } = string.Empty;
    public FormFieldType Type { get; set; } = FormFieldType.Text;
    public bool Required { get; set; } = false;
    public string? DataKey { get; set; }

    // Navigation properties
    public FormTemplate Template { get; set; } = null!;
    public ICollection<FieldBinding> Bindings { get; set; } = new List<FieldBinding>();
}