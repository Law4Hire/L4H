using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using System.Security.Claims;
using L4H.Api.Authorization;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/clients")]
[Tags("Clients")]
[Authorize]
public class ClientsController : ControllerBase
{
    private readonly L4HDbContext _context;

    public ClientsController(L4HDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get clients based on user role - admins see all, legal professionals see assigned
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "IsAdminOrLegalProfessional")]
    [ProducesResponseType(typeof(Client[]), StatusCodes.Status200OK)]
    public async Task<ActionResult<Client[]>> GetClients(
        [FromQuery] string? search = null,
        [FromQuery] int? attorneyId = null,
        [FromQuery] CaseStatus? caseStatus = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _context.Clients
            .Include(c => c.AssignedAttorney)
            .Include(c => c.Cases)
            .AsQueryable();

        // Role-based filtering
        var isAdmin = User.HasClaim("is_admin", "true") || User.HasClaim("is_admin", "True");
        if (!isAdmin)
        {
            // Legal professionals only see their assigned clients
            var attorneyIdClaim = User.FindFirst("attorney_id")?.Value;
            if (int.TryParse(attorneyIdClaim, out var userAttorneyId))
            {
                query = query.Where(c => c.AssignedAttorneyId == userAttorneyId);
            }
            else
            {
                return Ok(Array.Empty<Client>());
            }
        }

        // Apply search filters
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(c => 
                c.FirstName.ToLower().Contains(searchLower) ||
                c.LastName.ToLower().Contains(searchLower) ||
                c.Email.ToLower().Contains(searchLower));
        }

        if (attorneyId.HasValue)
        {
            query = query.Where(c => c.AssignedAttorneyId == attorneyId.Value);
        }

        if (caseStatus.HasValue)
        {
            query = query.Where(c => c.Cases.Any(cs => cs.Status == caseStatus.Value));
        }

        // Apply pagination
        var totalCount = await query.CountAsync();
        var clients = await query
            .OrderBy(c => c.LastName)
            .ThenBy(c => c.FirstName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToArrayAsync();

        Response.Headers.Append("X-Total-Count", totalCount.ToString());
        Response.Headers.Append("X-Page", page.ToString());
        Response.Headers.Append("X-Page-Size", pageSize.ToString());

        return Ok(clients);
    }    
/// <summary>
    /// Get a specific client by ID with role-based access
    /// </summary>
    [HttpGet("{id}")]
    [ClientAccessAuthorization]
    [Authorize(Policy = "IsAdminOrLegalProfessional")]
    [ProducesResponseType(typeof(Client), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<Client>> GetClient(int id)
    {
        var query = _context.Clients
            .Include(c => c.AssignedAttorney)
            .Include(c => c.Cases)
                .ThenInclude(cs => cs.StatusHistory)
            .Include(c => c.Documents)
            .Include(c => c.TimeEntries)
                .ThenInclude(te => te.Attorney)
            .AsQueryable();

        // Role-based filtering (though ClientAccessAuthorization attribute handles this too)
        var isAdmin = User.HasClaim("is_admin", "true") || User.HasClaim("is_admin", "True");
        if (!isAdmin)
        {
            var attorneyIdClaim = User.FindFirst("attorney_id")?.Value;
            if (int.TryParse(attorneyIdClaim, out var attorneyId))
            {
                query = query.Where(c => c.AssignedAttorneyId == attorneyId);
            }
            else
            {
                return Forbid();
            }
        }

        var client = await query.FirstOrDefaultAsync(c => c.Id == id);

        if (client == null)
        {
            return NotFound();
        }

        return Ok(client);
    }

    /// <summary>
    /// Create a new client (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "IsAdmin")]
    [ProducesResponseType(typeof(Client), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Client>> CreateClient([FromBody] Client client)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Set audit fields
        var userEmail = User.FindFirst("email")?.Value ?? "system";
        client.CreatedBy = userEmail;
        client.UpdatedBy = userEmail;
        client.CreatedAt = DateTime.UtcNow;
        client.UpdatedAt = DateTime.UtcNow;

        _context.Clients.Add(client);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetClient), new { id = client.Id }, client);
    }

    /// <summary>
    /// Update client information
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> UpdateClient(int id, [FromBody] Client clientUpdate)
    {
        var existingClient = await _context.Clients.FirstOrDefaultAsync(c => c.Id == id);
        if (existingClient == null)
        {
            return NotFound();
        }

        // Role-based access check
        var isAdmin = User.HasClaim("is_admin", "true");
        if (!isAdmin)
        {
            var userIdClaim = User.FindFirst("sub")?.Value;
            if (!int.TryParse(userIdClaim, out var userId) || existingClient.AssignedAttorneyId != userId)
            {
                return Forbid();
            }
        }

        // Update fields
        existingClient.FirstName = clientUpdate.FirstName;
        existingClient.LastName = clientUpdate.LastName;
        existingClient.Email = clientUpdate.Email;
        existingClient.Phone = clientUpdate.Phone;
        existingClient.Address = clientUpdate.Address;
        existingClient.DateOfBirth = clientUpdate.DateOfBirth;
        existingClient.CountryOfOrigin = clientUpdate.CountryOfOrigin;
        existingClient.UpdatedAt = DateTime.UtcNow;
        existingClient.UpdatedBy = User.FindFirst("email")?.Value ?? "system";

        await _context.SaveChangesAsync();
        return Ok();
    }

    /// <summary>
    /// Assign or reassign client to attorney (Admin only)
    /// </summary>
    [HttpPut("{id}/assign")]
    [Authorize(Policy = "IsAdmin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> AssignClient(int id, [FromBody] AssignClientRequest request)
    {
        var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == id);
        if (client == null)
        {
            return NotFound("Client not found");
        }

        // Validate attorney exists and is active
        var attorney = await _context.Attorneys.FirstOrDefaultAsync(a => a.Id == request.AttorneyId && a.IsActive);
        if (attorney == null)
        {
            return BadRequest("Attorney not found or inactive");
        }

        client.AssignedAttorneyId = request.AttorneyId;
        client.UpdatedAt = DateTime.UtcNow;
        client.UpdatedBy = User.FindFirst("email")?.Value ?? "system";

        await _context.SaveChangesAsync();
        return Ok();
    }

    /// <summary>
    /// Search clients with advanced filtering (Admin only)
    /// </summary>
    [HttpGet("search")]
    [Authorize(Policy = "IsAdmin")]
    [ProducesResponseType(typeof(Client[]), StatusCodes.Status200OK)]
    public async Task<ActionResult<Client[]>> SearchClients(
        [FromQuery] string? name = null,
        [FromQuery] string? email = null,
        [FromQuery] int? attorneyId = null,
        [FromQuery] CaseStatus? status = null,
        [FromQuery] string? countryOfOrigin = null,
        [FromQuery] DateTime? createdAfter = null,
        [FromQuery] DateTime? createdBefore = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var query = _context.Clients
            .Include(c => c.AssignedAttorney)
            .Include(c => c.Cases)
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrWhiteSpace(name))
        {
            var nameLower = name.ToLower();
            query = query.Where(c => 
                c.FirstName.ToLower().Contains(nameLower) ||
                c.LastName.ToLower().Contains(nameLower));
        }

        if (!string.IsNullOrWhiteSpace(email))
        {
            query = query.Where(c => c.Email.ToLower().Contains(email.ToLower()));
        }

        if (attorneyId.HasValue)
        {
            query = query.Where(c => c.AssignedAttorneyId == attorneyId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(c => c.Cases.Any(cs => cs.Status == status.Value));
        }

        if (!string.IsNullOrWhiteSpace(countryOfOrigin))
        {
            query = query.Where(c => c.CountryOfOrigin.ToLower().Contains(countryOfOrigin.ToLower()));
        }

        if (createdAfter.HasValue)
        {
            query = query.Where(c => c.CreatedAt >= createdAfter.Value);
        }

        if (createdBefore.HasValue)
        {
            query = query.Where(c => c.CreatedAt <= createdBefore.Value);
        }

        var totalCount = await query.CountAsync();
        var clients = await query
            .OrderBy(c => c.LastName)
            .ThenBy(c => c.FirstName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToArrayAsync();

        Response.Headers.Append("X-Total-Count", totalCount.ToString());
        return Ok(clients);
    }

    /// <summary>
    /// Delete a client (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Policy = "IsAdmin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> DeleteClient(int id)
    {
        var client = await _context.Clients
            .Include(c => c.Cases)
            .Include(c => c.TimeEntries)
            .Include(c => c.Documents)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (client == null)
        {
            return NotFound();
        }

        // Check if client has active cases or time entries
        if (client.Cases.Any(c => c.Status != CaseStatus.Complete && c.Status != CaseStatus.ClosedRejected))
        {
            return BadRequest("Cannot delete client with active cases");
        }

        if (client.TimeEntries.Any(te => !te.IsBilled))
        {
            return BadRequest("Cannot delete client with unbilled time entries");
        }

        _context.Clients.Remove(client);
        await _context.SaveChangesAsync();

        return Ok();
    }
}

public class AssignClientRequest
{
    public int AttorneyId { get; set; }
}