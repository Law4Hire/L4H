using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;

namespace L4H.Infrastructure.Services;

public class ClientService : IClientService
{
    private readonly L4HDbContext _context;
    private readonly ILogger<ClientService> _logger;

    public ClientService(L4HDbContext context, ILogger<ClientService> logger)
    {
        _context = context;
        _logger = logger;
    }

    #region Client Management

    public async Task<Client?> GetClientByIdAsync(int clientId)
    {
        return await _context.Clients
            .Include(c => c.AssignedAttorney)
            .Include(c => c.Cases)
                .ThenInclude(c => c.StatusHistory)
            .Include(c => c.Documents)
            .Include(c => c.TimeEntries)
            .FirstOrDefaultAsync(c => c.Id == clientId);
    }

    public async Task<IEnumerable<Client>> GetAllClientsAsync()
    {
        return await _context.Clients
            .Include(c => c.AssignedAttorney)
            .Include(c => c.Cases)
            .OrderBy(c => c.LastName)
            .ThenBy(c => c.FirstName)
            .ToListAsync();
    }

    public async Task<IEnumerable<Client>> GetClientsByAttorneyAsync(int attorneyId)
    {
        return await _context.Clients
            .Include(c => c.AssignedAttorney)
            .Include(c => c.Cases)
            .Where(c => c.AssignedAttorneyId == attorneyId)
            .OrderBy(c => c.LastName)
            .ThenBy(c => c.FirstName)
            .ToListAsync();
    }

    public async Task<IEnumerable<Client>> SearchClientsAsync(string? searchTerm = null, int? attorneyId = null, CaseStatus? caseStatus = null)
    {
        var query = _context.Clients
            .Include(c => c.AssignedAttorney)
            .Include(c => c.Cases)
            .AsQueryable();

        // Filter by search term (name or email)
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var lowerSearchTerm = searchTerm.ToLower();
            query = query.Where(c => 
                c.FirstName.ToLower().Contains(lowerSearchTerm) ||
                c.LastName.ToLower().Contains(lowerSearchTerm) ||
                c.Email.ToLower().Contains(lowerSearchTerm));
        }

        // Filter by assigned attorney
        if (attorneyId.HasValue)
        {
            query = query.Where(c => c.AssignedAttorneyId == attorneyId.Value);
        }

        // Filter by case status
        if (caseStatus.HasValue)
        {
            query = query.Where(c => c.Cases.Any(cs => cs.Status == caseStatus.Value));
        }

        return await query
            .OrderBy(c => c.LastName)
            .ThenBy(c => c.FirstName)
            .ToListAsync();
    }

    public async Task<Client> CreateClientAsync(Client client, string createdBy)
    {
        client.CreatedAt = DateTime.UtcNow;
        client.UpdatedAt = DateTime.UtcNow;
        client.CreatedBy = createdBy;
        client.UpdatedBy = createdBy;

        _context.Clients.Add(client);
        await _context.SaveChangesAsync();

        await LogClientActionAsync(client.Id, "Created", createdBy, $"Client {client.FirstName} {client.LastName} created");

        _logger.LogInformation("Client {ClientId} created by {CreatedBy}", client.Id, createdBy);
        return client;
    }

    public async Task<Client> UpdateClientAsync(Client client, string updatedBy)
    {
        var existingClient = await _context.Clients.FindAsync(client.Id);
        if (existingClient == null)
        {
            throw new InvalidOperationException($"Client with ID {client.Id} not found");
        }

        // Update fields
        existingClient.FirstName = client.FirstName;
        existingClient.LastName = client.LastName;
        existingClient.Email = client.Email;
        existingClient.Phone = client.Phone;
        existingClient.Address = client.Address;
        existingClient.DateOfBirth = client.DateOfBirth;
        existingClient.CountryOfOrigin = client.CountryOfOrigin;
        existingClient.UpdatedAt = DateTime.UtcNow;
        existingClient.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync();

        await LogClientActionAsync(client.Id, "Updated", updatedBy, "Client information updated");

        _logger.LogInformation("Client {ClientId} updated by {UpdatedBy}", client.Id, updatedBy);
        return existingClient;
    }

    public async Task<bool> DeleteClientAsync(int clientId)
    {
        var client = await _context.Clients
            .Include(c => c.Cases)
            .Include(c => c.TimeEntries)
            .Include(c => c.Documents)
            .FirstOrDefaultAsync(c => c.Id == clientId);

        if (client == null)
        {
            return false;
        }

        // Check if client has active cases
        if (client.Cases.Any(c => c.Status != CaseStatus.Complete && c.Status != CaseStatus.ClosedRejected))
        {
            throw new InvalidOperationException("Cannot delete client with active cases");
        }

        _context.Clients.Remove(client);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Client {ClientId} deleted", clientId);
        return true;
    }

    #endregion

    #region Client Assignment

    public async Task<bool> AssignClientToAttorneyAsync(int clientId, int attorneyId, string assignedBy)
    {
        var client = await _context.Clients.FindAsync(clientId);
        var attorney = await _context.Attorneys.FindAsync(attorneyId);

        if (client == null || attorney == null)
        {
            return false;
        }

        if (!attorney.IsActive)
        {
            throw new InvalidOperationException("Cannot assign client to inactive attorney");
        }

        var previousAttorneyId = client.AssignedAttorneyId;
        client.AssignedAttorneyId = attorneyId;
        client.UpdatedAt = DateTime.UtcNow;
        client.UpdatedBy = assignedBy;

        await _context.SaveChangesAsync();

        var details = previousAttorneyId.HasValue 
            ? $"Client reassigned from Attorney {previousAttorneyId} to Attorney {attorneyId}"
            : $"Client assigned to Attorney {attorneyId}";

        await LogClientActionAsync(clientId, "Assigned", assignedBy, details);

        _logger.LogInformation("Client {ClientId} assigned to Attorney {AttorneyId} by {AssignedBy}", 
            clientId, attorneyId, assignedBy);

        return true;
    }

    public async Task<bool> ReassignClientAsync(int clientId, int newAttorneyId, string reassignedBy)
    {
        return await AssignClientToAttorneyAsync(clientId, newAttorneyId, reassignedBy);
    }

    public async Task<bool> UnassignClientAsync(int clientId, string unassignedBy)
    {
        var client = await _context.Clients.FindAsync(clientId);
        if (client == null)
        {
            return false;
        }

        var previousAttorneyId = client.AssignedAttorneyId;
        client.AssignedAttorneyId = null;
        client.UpdatedAt = DateTime.UtcNow;
        client.UpdatedBy = unassignedBy;

        await _context.SaveChangesAsync();

        await LogClientActionAsync(clientId, "Unassigned", unassignedBy, 
            $"Client unassigned from Attorney {previousAttorneyId}");

        _logger.LogInformation("Client {ClientId} unassigned by {UnassignedBy}", clientId, unassignedBy);
        return true;
    }

    #endregion

    #region Case Management

    public async Task<CannlawCase?> GetCaseByIdAsync(int caseId)
    {
        return await _context.CannlawCases
            .Include(c => c.Client)
            .Include(c => c.StatusHistory)
            .FirstOrDefaultAsync(c => c.Id == caseId);
    }

    public async Task<IEnumerable<CannlawCase>> GetCasesByClientAsync(int clientId)
    {
        return await _context.CannlawCases
            .Include(c => c.StatusHistory)
            .Where(c => c.ClientId == clientId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<CannlawCase> CreateCaseAsync(CannlawCase cannlawCase, string createdBy)
    {
        cannlawCase.CreatedAt = DateTime.UtcNow;
        cannlawCase.UpdatedAt = DateTime.UtcNow;

        _context.CannlawCases.Add(cannlawCase);
        await _context.SaveChangesAsync();

        // Create initial status history entry
        var statusHistory = new CaseStatusHistory
        {
            CaseId = cannlawCase.Id,
            FromStatus = CaseStatus.NotStarted,
            ToStatus = cannlawCase.Status,
            ChangedAt = DateTime.UtcNow,
            ChangedBy = createdBy,
            Notes = "Case created"
        };

        _context.CaseStatusHistories.Add(statusHistory);
        await _context.SaveChangesAsync();

        await LogClientActionAsync(cannlawCase.ClientId, "Case Created", createdBy, 
            $"Case {cannlawCase.Id} ({cannlawCase.CaseType}) created");

        _logger.LogInformation("Case {CaseId} created for Client {ClientId} by {CreatedBy}", 
            cannlawCase.Id, cannlawCase.ClientId, createdBy);

        return cannlawCase;
    }

    public async Task<bool> UpdateCaseStatusAsync(int caseId, CaseStatus newStatus, string updatedBy, string? notes = null)
    {
        var cannlawCase = await _context.CannlawCases.FindAsync(caseId);
        if (cannlawCase == null)
        {
            return false;
        }

        // Validate status transition
        if (!IsValidStatusTransition(cannlawCase.Status, newStatus))
        {
            throw new InvalidOperationException($"Invalid status transition from {cannlawCase.Status} to {newStatus}");
        }

        var previousStatus = cannlawCase.Status;
        cannlawCase.Status = newStatus;
        cannlawCase.UpdatedAt = DateTime.UtcNow;

        if (newStatus == CaseStatus.Complete)
        {
            cannlawCase.CompletionDate = DateTime.UtcNow;
        }

        // Create status history entry
        var statusHistory = new CaseStatusHistory
        {
            CaseId = caseId,
            FromStatus = previousStatus,
            ToStatus = newStatus,
            ChangedAt = DateTime.UtcNow,
            ChangedBy = updatedBy,
            Notes = notes ?? $"Status changed from {previousStatus} to {newStatus}"
        };

        _context.CaseStatusHistories.Add(statusHistory);
        await _context.SaveChangesAsync();

        await LogClientActionAsync(cannlawCase.ClientId, "Case Status Updated", updatedBy, 
            $"Case {caseId} status changed from {previousStatus} to {newStatus}");

        _logger.LogInformation("Case {CaseId} status updated from {PreviousStatus} to {NewStatus} by {UpdatedBy}", 
            caseId, previousStatus, newStatus, updatedBy);

        return true;
    }

    public async Task<IEnumerable<CaseStatusHistory>> GetCaseStatusHistoryAsync(int caseId)
    {
        return await _context.CaseStatusHistories
            .Where(h => h.CaseId == caseId)
            .OrderByDescending(h => h.ChangedAt)
            .ToListAsync();
    }

    #endregion

    #region Role-based Access

    public async Task<IEnumerable<Client>> GetClientsForUserAsync(string userRole, int? attorneyId = null)
    {
        var query = _context.Clients
            .Include(c => c.AssignedAttorney)
            .Include(c => c.Cases)
            .AsQueryable();

        // Admin can see all clients, legal professionals can only see their assigned clients
        if (userRole.Equals("LegalProfessional", StringComparison.OrdinalIgnoreCase) && attorneyId.HasValue)
        {
            query = query.Where(c => c.AssignedAttorneyId == attorneyId.Value);
        }

        return await query
            .OrderBy(c => c.LastName)
            .ThenBy(c => c.FirstName)
            .ToListAsync();
    }

    public async Task<bool> CanUserAccessClientAsync(int clientId, string userRole, int? attorneyId = null)
    {
        // Admin can access all clients
        if (userRole.Equals("Admin", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        // Legal professionals can only access their assigned clients
        if (userRole.Equals("LegalProfessional", StringComparison.OrdinalIgnoreCase) && attorneyId.HasValue)
        {
            var client = await _context.Clients.FindAsync(clientId);
            return client?.AssignedAttorneyId == attorneyId.Value;
        }

        return false;
    }

    #endregion

    #region Audit and Logging

    public async Task LogClientActionAsync(int clientId, string action, string performedBy, string? details = null)
    {
        var auditLog = new AuditLog
        {
            Category = "Client",
            TargetType = "Client",
            TargetId = clientId.ToString(),
            Action = action,
            DetailsJson = details ?? string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync();
    }

    #endregion

    #region Private Helper Methods

    private static bool IsValidStatusTransition(CaseStatus currentStatus, CaseStatus newStatus)
    {
        // Define valid status transitions
        return currentStatus switch
        {
            CaseStatus.NotStarted => newStatus is CaseStatus.InProgress or CaseStatus.ClosedRejected,
            CaseStatus.InProgress => newStatus is CaseStatus.Paid or CaseStatus.ClosedRejected,
            CaseStatus.Paid => newStatus is CaseStatus.FormsCompleted or CaseStatus.ClosedRejected,
            CaseStatus.FormsCompleted => newStatus is CaseStatus.Complete or CaseStatus.ClosedRejected,
            CaseStatus.Complete => false, // Complete cases cannot be changed
            CaseStatus.ClosedRejected => false, // Closed cases cannot be changed
            _ => false
        };
    }

    #endregion
}