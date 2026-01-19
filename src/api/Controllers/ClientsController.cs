using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using System.Security.Claims;
using L4H.Api.Authorization;
using L4H.Shared.Models; // Added missing using directive

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/clients")]
[Authorize(Policy = "IsAdminOrLegalProfessional")]
[Tags("Clients")]
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
    [ProducesResponseType(typeof(Client[]), StatusCodes.Status200OK)]
    public async Task<ActionResult<Client[]>> GetClients(
        [FromQuery] string? search = null,
        [FromQuery] int? attorneyId = null,
        [FromQuery] CaseStatus? caseStatus = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        // Sync removed for stability
        // await SyncUsersToClients();

        var query = _context.Clients
            .Include(c => c.AssignedAttorney)
            .Include(c => c.Cases)
            .AsQueryable();

        // Role-based filtering
        var isAdmin = User.HasClaim(c => c.Type == "is_admin" && c.Value.Equals("true", StringComparison.OrdinalIgnoreCase));
        if (!isAdmin)
        {
            // Legal professionals only see their assigned clients
            int? userAttorneyId = null;
            var attorneyIdClaim = User.FindFirst("attorney_id")?.Value;
            
            if (int.TryParse(attorneyIdClaim, out var id))
            {
                userAttorneyId = id;
            }
            else
            {
                // Fallback: Look up user in DB to get AttorneyId if claim is missing
                var userIdClaim = User.FindFirst("sub")?.Value;
                if (Guid.TryParse(userIdClaim, out var userId))
                {
                    var user = await _context.Users.FindAsync(new UserId(userId));
                    userAttorneyId = user?.AttorneyId;
                }
            }

            if (userAttorneyId.HasValue)
            {
                // Find clients directly assigned OR clients with cases assigned to this attorney
                // Case -> User -> Email -> Client
                var assignedCaseUserEmails = _context.Cases
                    .Where(c => c.AssignedStaffId == userAttorneyId.Value)
                    .Select(c => c.User.Email);

                query = query.Where(c => 
                    c.AssignedAttorneyId == userAttorneyId.Value || 
                    assignedCaseUserEmails.Contains(c.Email));
            }
            else
            {
                return Ok(Array.Empty<Client>());
            }
        }

        // Apply search filters
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLowerInvariant();
            query = query.Where(c => 
                c.FirstName.ToLowerInvariant().Contains(searchLower) || 
                c.LastName.ToLowerInvariant().Contains(searchLower) || 
                c.Email.ToLowerInvariant().Contains(searchLower));
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
    /// Sync clients from user accounts (Admin only)
    /// </summary>
    [HttpPost("sync")]
    [Authorize(Policy = "IsAdmin")]
    public async Task<IActionResult> SyncClients()
    {
        await SyncUsersToClients();
        return Ok(new { message = "Client sync completed." });
    }

    private async Task SyncUsersToClients()
    {
        try
        {
            // Optimize: Use DB-side filtering to find missing clients
            var missingUsers = await _context.Users
                .Where(u => !u.IsStaff && !u.IsAdmin)
                .Where(u => !_context.Clients.Any(c => c.Email == u.Email))
                .ToListAsync();

            if (missingUsers.Any())
            {
                var newClients = missingUsers.Select(u => new Client
                {
                    FirstName = u.FirstName ?? "Unknown",
                    LastName = u.LastName ?? "Unknown",
                    Email = u.Email,
                    Phone = u.PhoneNumber ?? "",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    CreatedBy = "System (Sync)"
                }).ToList();

                _context.Clients.AddRange(newClients);
                await _context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            // Log error but don't fail the request
            Console.WriteLine($"Error syncing clients: {ex.Message}");
        }
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
        var isAdmin = User.HasClaim(c => c.Type == "is_admin" && (c.Value == "true" || c.Value == "True"));
        if (!isAdmin)
        {
            var attorneyIdClaim = User.FindFirst("attorney_id")?.Value;
            if (!int.TryParse(attorneyIdClaim, out var attorneyId) || existingClient.AssignedAttorneyId != attorneyId)
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

        // Sync changes to linked User account if exists
        var linkedUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == existingClient.Email);
        if (linkedUser != null)
        {
            linkedUser.FirstName = clientUpdate.FirstName;
            linkedUser.LastName = clientUpdate.LastName ?? ""; // Ensure not null
            // We do not update User email here to avoid locking user out without verification
        }

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
    /// Get time entries for a specific client
    /// </summary>
    [HttpGet("{id}/time-entries")]
    [Authorize(Policy = "IsAdminOrLegalProfessional")]
    public async Task<ActionResult<IEnumerable<TimeEntry>>> GetClientTimeEntries(int id)
    {
        var entries = await _context.TimeEntries
            .Include(te => te.Attorney)
            .Where(te => te.ClientId == id)
            .OrderByDescending(te => te.StartTime)
            .ToListAsync();

        return Ok(entries);
    }

    /// <summary>
    /// Get documents for a specific client
    /// </summary>
    [HttpGet("{id}/documents")]
    [Authorize(Policy = "IsAdminOrLegalProfessional")]
    public async Task<ActionResult<IEnumerable<Document>>> GetClientDocuments(int id)
    {
        var docs = await _context.Documents
            .Where(d => d.ClientId == id)
            .OrderByDescending(d => d.UploadDate)
            .ToListAsync();

        return Ok(docs);
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
                    var nameLower = name.ToLowerInvariant();
                    query = query.Where(c => 
                        c.FirstName.ToLowerInvariant().Contains(nameLower) || 
                        c.LastName.ToLowerInvariant().Contains(nameLower));
                }
        
                if (!string.IsNullOrWhiteSpace(email))
                {
                    query = query.Where(c => c.Email.ToLowerInvariant().Contains(email.ToLowerInvariant()));
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
                    query = query.Where(c => c.CountryOfOrigin.ToLowerInvariant().Contains(countryOfOrigin.ToLowerInvariant()));
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
