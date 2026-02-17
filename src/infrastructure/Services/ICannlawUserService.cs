using L4H.Infrastructure.Entities;
using L4H.Shared.Models;

namespace L4H.Infrastructure.Services;

public interface ICannlawUserService
{
    // Client Management
    Task<User?> GetClientByIdAsync(UserId userId);
    Task<IEnumerable<User>> GetAllClientsAsync();
    Task<IEnumerable<User>> GetClientsByAttorneyAsync(int attorneyId);
    Task<IEnumerable<User>> SearchClientsAsync(string? searchTerm = null, int? attorneyId = null, string? caseStatus = null);
    Task<User> CreateClientAsync(User client, string createdBy);
    Task<User> UpdateClientAsync(User client, string updatedBy);
    Task<bool> DeleteClientAsync(UserId userId);

    // Client Assignment
    Task<bool> AssignClientToAttorneyAsync(UserId userId, int attorneyId, string assignedBy);
    Task<bool> ReassignClientAsync(UserId userId, int newAttorneyId, string reassignedBy);
    Task<bool> UnassignClientAsync(UserId userId, string unassignedBy);

    // Case Management
    Task<Case?> GetCaseByIdAsync(CaseId caseId);
    Task<IEnumerable<Case>> GetCasesByClientAsync(UserId userId);
    Task<Case> CreateCaseAsync(Case newCase, string createdBy);
    Task<bool> UpdateCaseStatusAsync(CaseId caseId, string newStatus, string updatedBy, string? notes = null);
    Task<IEnumerable<CaseStatusHistory>> GetCaseStatusHistoryAsync(CaseId caseId);

    // Role-based Access
    Task<IEnumerable<User>> GetClientsForUserAsync(string userRole, int? attorneyId = null);
    Task<bool> CanUserAccessClientAsync(UserId userId, string userRole, int? attorneyId = null);

    // Audit
    Task LogClientActionAsync(UserId userId, string action, string performedBy, string? details = null);
}