namespace L4H.Shared.Models;

// Form Template DTOs
public class CreateFormTemplateRequest
{
    public string? VisaTypeId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<CreateFormFieldRequest> Fields { get; set; } = new();
    public List<CreateFieldBindingRequest> Bindings { get; set; } = new();
}

public class CreateFormFieldRequest
{
    public string Name { get; set; } = string.Empty;
    public string LabelKey { get; set; } = string.Empty;
    public FormFieldTypeDto Type { get; set; } = FormFieldTypeDto.Text;
    public bool Required { get; set; } = false;
    public string? DataKey { get; set; }
}

public class CreateFieldBindingRequest
{
    public string FieldName { get; set; } = string.Empty;
    public string DataKey { get; set; } = string.Empty;
}

public enum FormFieldTypeDto
{
    Text,
    Date,
    Select,
    Checkbox
}

public class FormTemplateResponse
{
    public Guid Id { get; set; }
    public string? VisaTypeId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Version { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<FormFieldResponse> Fields { get; set; } = new();
    public List<FieldBindingResponse> Bindings { get; set; } = new();
}

public class FormFieldResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string LabelKey { get; set; } = string.Empty;
    public FormFieldTypeDto Type { get; set; }
    public bool Required { get; set; }
    public string? DataKey { get; set; }
}

public class FieldBindingResponse
{
    public Guid Id { get; set; }
    public Guid FormFieldId { get; set; }
    public string DataKey { get; set; } = string.Empty;
}

// Form Generation DTOs
public class GenerateFormRequest
{
    public CaseId CaseId { get; set; }
    public Dictionary<string, object?> Overrides { get; set; } = new();
}

public class GenerateFormResponse
{
    public Guid InstanceId { get; set; }
    public Guid TemplateId { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public string PdfPath { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

// Form Instance DTOs
public class FormInstanceResponse
{
    public Guid Id { get; set; }
    public CaseId CaseId { get; set; }
    public Guid TemplateId { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public string TemplateCode { get; set; } = string.Empty;
    public string PdfPath { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class FormInstanceListResponse
{
    public List<FormInstanceResponse> Instances { get; set; } = new();
    public int TotalCount { get; set; }
}

// Admin Settings DTOs
public class AdminSettingsResponse
{
    public RetentionSettings Retention { get; set; } = new();
    public UploadSettings Uploads { get; set; } = new();
    public SchedulingSettings Scheduling { get; set; } = new();
}

public class RetentionSettings
{
    public int PiiDays { get; set; } = 365;
    public int RecordingsDays { get; set; } = 730;
    public int MedicalDays { get; set; } = 60;
    public int HighSensitivityDays { get; set; } = 30;
}

public class UploadSettings
{
    public int MaxUploadSizeMB { get; set; } = 25;
    public string AllowedExtensionsCsv { get; set; } = string.Empty;
}

public class SchedulingSettings
{
    public int BufferAfterMinutes { get; set; } = 15;
    public int MaxReschedulesPerSide { get; set; } = 3;
    public bool PaymentRequiredToSchedule { get; set; } = true;
}

public class UpdateAdminSettingsRequest
{
    public RetentionSettings? Retention { get; set; }
    public UploadSettings? Uploads { get; set; }
    public SchedulingSettings? Scheduling { get; set; }
}