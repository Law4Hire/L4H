namespace L4H.Infrastructure.Entities;

public class FieldBinding
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TemplateId { get; set; }
    public Guid FormFieldId { get; set; }
    public string DataKey { get; set; } = string.Empty; // e.g., "profile.address", "case.user.birthDate"

    // Navigation properties
    public FormTemplate Template { get; set; } = null!;
    public FormField FormField { get; set; } = null!;
}