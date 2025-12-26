namespace L4H.Api.DTOs;

public class AttorneyRequestDto
{
    public string? Name { get; set; }
    public string? Title { get; set; }
    public string? Bio { get; set; }
    public string? PhotoUrl { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? DirectPhone { get; set; }
    public string? DirectEmail { get; set; }
    public string? OfficeLocation { get; set; }
    public decimal DefaultHourlyRate { get; set; }
    public string? Credentials { get; set; }
    public string? PracticeAreas { get; set; }
    public string? Languages { get; set; }
    public bool IsActive { get; set; }
    public bool IsManagingAttorney { get; set; }
    public int DisplayOrder { get; set; }
}
