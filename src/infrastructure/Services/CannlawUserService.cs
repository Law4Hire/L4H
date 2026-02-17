using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;

namespace L4H.Infrastructure.Services;

public class CannlawUserService : ICannlawUserService
{
    private readonly L4HDbContext _context;
    private readonly ILogger<CannlawUserService> _logger;

    public CannlawUserService(L4HDbContext context, ILogger<CannlawUserService> logger)
    {
        _context = context;
        _logger = logger;
    }

    #region Client Management

    public async Task<User?> GetClientByIdAsync(UserId userId)
    {
        return await _context.Users
            .Include(u => u.AssignedAttorney)
            .Include(u => u.Cases)
                .ThenInclude(c => c.StatusHistory)
            .Include(u => u.Documents)
            .Include(u => u.TimeEntries)
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

    public async Task<IEnumerable<User>> GetAllClientsAsync()
    {
        // Clients are Users who are not Staff/Admin/LegalProfessional, or just all users?
        // Typically "Clients" in this context are normal users.
        return await _context.Users
            .Include(u => u.AssignedAttorney)
            .Include(u => u.Cases)
            .Where(u => !u.IsStaff && !u.IsAdmin && !u.IsLegalProfessional)
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .ToListAsync();
    }

    public async Task<IEnumerable<User>> GetClientsByAttorneyAsync(int attorneyId)
    {
        return await _context.Users
            .Include(u => u.AssignedAttorney)
            .Include(u => u.Cases)
            .Where(u => u.AssignedAttorneyId == attorneyId)
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .ToListAsync();
    }

    public async Task<IEnumerable<User>> SearchClientsAsync(string? searchTerm = null, int? attorneyId = null, string? caseStatus = null)
    {
        var query = _context.Users
            .Include(u => u.AssignedAttorney)
            .Include(u => u.Cases)
            .Where(u => !u.IsStaff && !u.IsAdmin && !u.IsLegalProfessional) // Only clients
            .AsQueryable();

        // Filter by search term (name or email)
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var lowerSearchTerm = searchTerm.ToLower(CultureInfo.InvariantCulture);
            query = query.Where(u =>
                (u.FirstName != null && u.FirstName.ToLower(CultureInfo.InvariantCulture).Contains(lowerSearchTerm)) ||
                (u.LastName != null && u.LastName.ToLower(CultureInfo.InvariantCulture).Contains(lowerSearchTerm)) ||
                u.Email.ToLower(CultureInfo.InvariantCulture).Contains(lowerSearchTerm));
        }

        // Filter by assigned attorney
        if (attorneyId.HasValue)
        {
            query = query.Where(u => u.AssignedAttorneyId == attorneyId.Value);
        }

        // Filter by case status
        if (!string.IsNullOrEmpty(caseStatus))
        {
            query = query.Where(u => u.Cases.Any(c => c.Status == caseStatus));
        }

        return await query
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .ToListAsync();
    }

    public async Task<User> CreateClientAsync(User client, string createdBy)
    {
        client.CreatedAt = DateTime.UtcNow;
        // PasswordUpdatedAt is required
        client.PasswordUpdatedAt = DateTime.UtcNow;

        _context.Users.Add(client);
        await _context.SaveChangesAsync();

        await LogClientActionAsync(client.Id, "Created", createdBy, $"Client {client.FirstName} {client.LastName} created");

        _logger.LogInformation("Client {UserId} created by {CreatedBy}", client.Id, createdBy);
        return client;
    }

    public async Task<User> UpdateClientAsync(User client, string updatedBy)
    {
        var existingClient = await _context.Users.FindAsync(client.Id);
        if (existingClient == null)
        {
            throw new InvalidOperationException($"Client with ID {client.Id} not found");
        }

        // Update fields
        existingClient.FirstName = client.FirstName;
        existingClient.LastName = client.LastName;
        existingClient.Email = client.Email;
        existingClient.PhoneNumber = client.PhoneNumber;
        existingClient.StreetAddress = client.StreetAddress;
        existingClient.City = client.City;
        existingClient.StateProvince = client.StateProvince;
        existingClient.PostalCode = client.PostalCode;
        existingClient.Country = client.Country;
        existingClient.DateOfBirth = client.DateOfBirth;
        existingClient.Nationality = client.Nationality;
        
        // Note: Users don't have "UpdatedBy" field on the entity itself in this schema, audit log handles it.

        await _context.SaveChangesAsync();

        await LogClientActionAsync(client.Id, "Updated", updatedBy, "Client information updated");

        _logger.LogInformation("Client {UserId} updated by {UpdatedBy}", client.Id, updatedBy);
        return existingClient;
    }

    public async Task<bool> DeleteClientAsync(UserId userId)
    {
        var client = await _context.Users
            .Include(u => u.Cases)
            .Include(u => u.TimeEntries)
            .Include(u => u.Documents)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (client == null)
        {
            return false;
        }

        // Check if client has active cases
        if (client.Cases.Any(c => c.Status != "closed" && c.Status != "denied"))
        {
            throw new InvalidOperationException("Cannot delete client with active cases");
        }

        _context.Users.Remove(client);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Client {UserId} deleted", userId);
        return true;
    }

    #endregion

    #region Client Assignment

    public async Task<bool> AssignClientToAttorneyAsync(UserId userId, int attorneyId, string assignedBy)
    {
        var client = await _context.Users.FindAsync(userId);
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
        
        await _context.SaveChangesAsync();

        var details = previousAttorneyId.HasValue 
            ? $"Client reassigned from Attorney {previousAttorneyId} to Attorney {attorneyId}"
            : $"Client assigned to Attorney {attorneyId}";

        await LogClientActionAsync(userId, "Assigned", assignedBy, details);

        _logger.LogInformation("Client {UserId} assigned to Attorney {AttorneyId} by {AssignedBy}", 
            userId, attorneyId, assignedBy);

        return true;
    }

    public async Task<bool> ReassignClientAsync(UserId userId, int newAttorneyId, string reassignedBy)
    {
        return await AssignClientToAttorneyAsync(userId, newAttorneyId, reassignedBy);
    }

    public async Task<bool> UnassignClientAsync(UserId userId, string unassignedBy)
    {
        var client = await _context.Users.FindAsync(userId);
        if (client == null)
        {
            return false;
        }

        var previousAttorneyId = client.AssignedAttorneyId;
        client.AssignedAttorneyId = null;

        await _context.SaveChangesAsync();

        await LogClientActionAsync(userId, "Unassigned", unassignedBy, 
            $"Client unassigned from Attorney {previousAttorneyId}");

        _logger.LogInformation("Client {UserId} unassigned by {UnassignedBy}", userId, unassignedBy);
        return true;
    }

    #endregion

    #region Case Management

    public async Task<Case?> GetCaseByIdAsync(CaseId caseId)
    {
        return await _context.Cases
            .Include(c => c.User)
            .Include(c => c.StatusHistory) // Now referencing the updated CaseStatusHistory
            .FirstOrDefaultAsync(c => c.Id == caseId);
    }

    public async Task<IEnumerable<Case>> GetCasesByClientAsync(UserId userId)
    {
        return await _context.Cases
            .Include(c => c.StatusHistory)
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<Case> CreateCaseAsync(Case newCase, string createdBy)
    {
        newCase.CreatedAt = DateTime.UtcNow;
        newCase.UpdatedAt = DateTime.UtcNow;

        _context.Cases.Add(newCase);
        await _context.SaveChangesAsync();

        // Create initial status history entry
        var statusHistory = new CaseStatusHistory
        {
            CaseId = newCase.Id,
            FromStatus = "New",
            ToStatus = newCase.Status,
            ChangedAt = DateTime.UtcNow,
            ChangedBy = createdBy,
            Notes = "Case created"
        };

        _context.CaseStatusHistories.Add(statusHistory);
        await _context.SaveChangesAsync();

        await LogClientActionAsync(newCase.UserId, "Case Created", createdBy, 
            $"Case {newCase.Id} created");

        _logger.LogInformation("Case {CaseId} created for Client {UserId} by {CreatedBy}", 
            newCase.Id, newCase.UserId, createdBy);

        return newCase;
    }

    public async Task<bool> UpdateCaseStatusAsync(CaseId caseId, string newStatus, string updatedBy, string? notes = null)
    {
        var caseEntity = await _context.Cases.FindAsync(caseId);
        if (caseEntity == null)
        {
            return false;
        }

        var previousStatus = caseEntity.Status;
        caseEntity.Status = newStatus;
        caseEntity.UpdatedAt = DateTime.UtcNow;

        if (newStatus.Equals("closed", StringComparison.OrdinalIgnoreCase))
        {
            caseEntity.CompletionDate = DateTime.UtcNow;
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

        await LogClientActionAsync(caseEntity.UserId, "Case Status Updated", updatedBy, 
            $"Case {caseId} status changed from {previousStatus} to {newStatus}");

        _logger.LogInformation("Case {CaseId} status updated from {PreviousStatus} to {NewStatus} by {UpdatedBy}", 
            caseId, previousStatus, newStatus, updatedBy);

        return true;
    }

    public async Task<IEnumerable<CaseStatusHistory>> GetCaseStatusHistoryAsync(CaseId caseId)
    {
        return await _context.CaseStatusHistories
            .Where(h => h.CaseId == caseId)
            .OrderByDescending(h => h.ChangedAt)
            .ToListAsync();
    }

    #endregion

    #region Role-based Access

    public async Task<IEnumerable<User>> GetClientsForUserAsync(string userRole, int? attorneyId = null)
    {
        var query = _context.Users
            .Include(u => u.AssignedAttorney)
            .Include(u => u.Cases)
            .Where(u => !u.IsStaff && !u.IsAdmin && !u.IsLegalProfessional)
            .AsQueryable();

        // Admin can see all clients, legal professionals can only see their assigned clients
        if (userRole.Equals("LegalProfessional", StringComparison.OrdinalIgnoreCase) && attorneyId.HasValue)
        {
            query = query.Where(u => u.AssignedAttorneyId == attorneyId.Value);
        }

        return await query
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .ToListAsync();
    }

    public async Task<bool> CanUserAccessClientAsync(UserId userId, string userRole, int? attorneyId = null)
    {
        // Admin can access all clients
        if (userRole.Equals("Admin", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        // Legal professionals can only access their assigned clients
        if (userRole.Equals("LegalProfessional", StringComparison.OrdinalIgnoreCase) && attorneyId.HasValue)
        {
            var client = await _context.Users.FindAsync(userId);
            return client?.AssignedAttorneyId == attorneyId.Value;
        }

        return false;
    }

    #endregion

    #region Audit and Logging

    public async Task LogClientActionAsync(UserId userId, string action, string performedBy, string? details = null)
    {
        var auditLog = new AuditLog
        {
            Category = "Client",
            TargetType = "User",
            TargetId = userId.ToString(),
            Action = action,
            DetailsJson = details ?? string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync();
    }

    #endregion
}