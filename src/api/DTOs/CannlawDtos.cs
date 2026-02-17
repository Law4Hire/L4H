using System.ComponentModel.DataAnnotations;
using L4H.Shared.Models;

namespace L4H.Api.DTOs;

public class ClientDto
{
    public UserId Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? Country { get; set; }
    public int? AssignedAttorneyId { get; set; }
    public string? AssignedAttorneyName { get; set; }
    public List<ClientCaseDto> Cases { get; set; } = new();
}

public class ClientCaseDto
{
    public CaseId Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? VisaType { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateClientRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    public string FirstName { get; set; } = string.Empty;
    
    [Required]
    public string LastName { get; set; } = string.Empty;
    
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public int? AssignedAttorneyId { get; set; }
}

public class UpdateClientRequest
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? CountryOfOrigin { get; set; }
}

public class AssignClientRequest
{
    public int AttorneyId { get; set; }
}
