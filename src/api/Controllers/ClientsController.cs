using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using L4H.Infrastructure.Services;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using L4H.Api.DTOs;
using System.Security.Claims;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/clients")]
[Authorize(Policy = "IsAdminOrLegalProfessional")]
[Tags("Clients")]
public class ClientsController : ControllerBase
{
    private readonly ICannlawUserService _userService;
    private readonly ILogger<ClientsController> _logger;

    public ClientsController(ICannlawUserService userService, ILogger<ClientsController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>
    /// Get clients based on user role - admins see all, legal professionals see assigned
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ClientDto[]), StatusCodes.Status200OK)]
    public async Task<ActionResult<ClientDto[]>> GetClients(
        [FromQuery] string? search = null,
        [FromQuery] int? attorneyId = null,
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var isAdmin = User.HasClaim(c => c.Type == "is_admin" && c.Value.Equals("true", StringComparison.OrdinalIgnoreCase));
        var userRole = isAdmin ? "Admin" : "LegalProfessional";
        
        int? userAttorneyId = null;
        if (!isAdmin)
        {
            var attorneyIdClaim = User.FindFirst("AttorneyId")?.Value;
            if (int.TryParse(attorneyIdClaim, out var id))
            {
                userAttorneyId = id;
            }
        }

        var users = await _userService.SearchClientsAsync(search, attorneyId ?? userAttorneyId, status);
        
        // Manual mapping for now, should use AutoMapper later
        var dtos = users.Select(u => new ClientDto
        {
            Id = u.Id,
            Email = u.Email,
            FirstName = u.FirstName,
            LastName = u.LastName,
            PhoneNumber = u.PhoneNumber,
            Address = $"{u.StreetAddress} {u.City}".Trim(),
            Country = u.Country,
            AssignedAttorneyId = u.AssignedAttorneyId,
            AssignedAttorneyName = u.AssignedAttorney?.Name,
            Cases = u.Cases.Select(c => new ClientCaseDto
            {
                Id = c.Id,
                Status = c.Status,
                VisaType = c.VisaType?.Name,
                CreatedAt = c.CreatedAt
            }).ToList()
        }).ToArray();

        return Ok(dtos);
    }

    /// <summary>
    /// Get a specific client by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ClientDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ClientDto>> GetClient(Guid id)
    {
        var userId = new UserId(id);
        var user = await _userService.GetClientByIdAsync(userId);

        if (user == null)
        {
            return NotFound();
        }

        // Access check
        var isAdmin = User.HasClaim(c => c.Type == "is_admin" && c.Value.Equals("true", StringComparison.OrdinalIgnoreCase));
        if (!isAdmin)
        {
            var attorneyIdClaim = User.FindFirst("AttorneyId")?.Value;
            if (!int.TryParse(attorneyIdClaim, out var attorneyId) || user.AssignedAttorneyId != attorneyId)
            {
                return Forbid();
            }
        }

        var dto = new ClientDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            PhoneNumber = user.PhoneNumber,
            Address = $"{user.StreetAddress} {user.City}".Trim(),
            Country = user.Country,
            AssignedAttorneyId = user.AssignedAttorneyId,
            AssignedAttorneyName = user.AssignedAttorney?.Name,
            Cases = user.Cases.Select(c => new ClientCaseDto
            {
                Id = c.Id,
                Status = c.Status,
                VisaType = c.VisaType?.Name,
                CreatedAt = c.CreatedAt
            }).ToList()
        };

        return Ok(dto);
    }

    /// <summary>
    /// Update client information
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateClient(Guid id, [FromBody] UpdateClientRequest request)
    {
        var userId = new UserId(id);
        var existing = await _userService.GetClientByIdAsync(userId);
        if (existing == null) return NotFound();

        // Update properties
        if (request.FirstName != null) existing.FirstName = request.FirstName;
        if (request.LastName != null) existing.LastName = request.LastName;
        if (request.Email != null) existing.Email = request.Email;
        if (request.Phone != null) existing.PhoneNumber = request.Phone;
        if (request.DateOfBirth != null) existing.DateOfBirth = request.DateOfBirth;

        var updatedBy = User.FindFirst(ClaimTypes.Email)?.Value ?? "system";
        await _userService.UpdateClientAsync(existing, updatedBy);

        return Ok();
    }

    /// <summary>
    /// Delete a client
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Policy = "IsAdmin")]
    public async Task<ActionResult> DeleteClient(Guid id)
    {
        var userId = new UserId(id);
        var success = await _userService.DeleteClientAsync(userId);
        if (!success) return NotFound();
        return Ok();
    }
}
