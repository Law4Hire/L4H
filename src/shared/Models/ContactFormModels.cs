namespace L4H.Shared.Models;

/// <summary>
/// Contact form submission request
/// </summary>
public class ContactFormRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string ConsultationType { get; set; } = "general";
}

/// <summary>
/// Contact form submission response
/// </summary>
public class ContactFormResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? ReferenceId { get; set; }
}
