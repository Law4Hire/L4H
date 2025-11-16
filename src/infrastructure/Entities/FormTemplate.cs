using L4H.Shared.Models;
using System.Text.Json.Serialization;

namespace L4H.Infrastructure.Entities;

public class FormTemplate
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string? VisaTypeId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Version { get; set; } = 1;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [JsonIgnore]

    public ICollection<FormField> Fields { get; set; } = new List<FormField>();
    [JsonIgnore]

    public ICollection<FieldBinding> Bindings { get; set; } = new List<FieldBinding>();
    [JsonIgnore]

    public ICollection<FormInstance> Instances { get; set; } = new List<FormInstance>();
}