using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class FormInstance
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public CaseId CaseId { get; set; }
    public Guid TemplateId { get; set; }
    public string DataSnapshotJson { get; set; } = string.Empty;
    public string PdfPath { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Case Case { get; set; } = null!;
    public FormTemplate Template { get; set; } = null!;
}