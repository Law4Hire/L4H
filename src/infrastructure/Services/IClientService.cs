using L4H.Infrastructure.Entities;

namespace L4H.Infrastructure.Services;

public interface IClientService
{
    // Client management
    Task<Client?> GetClientByIdAsync(int clientId);
    Task<IEnumerable<Client>> GetAllClientsAsync();
    Task<IEnumerable<Client>> GetClientsByAttorneyAsync(int attorneyId);
    Task<IEnumerable<Client>> SearchClientsAsync(string? searchTerm = null, int? attorneyId = null, CaseStatus? caseStatus = null);
    Task<Client> CreateClientAsync(Client client, string createdBy);
    Task<Client> UpdateClientAsync(Client client, string updatedBy);
    Task<bool> DeleteClientAsync(int clientId);

    // Client assignment
    Task<bool> AssignClientToAttorneyAsync(int clientId, int attorneyId, string assignedBy);
    Task<bool> ReassignClientAsync(int clientId, int newAttorneyId, string reassignedBy);
    Task<bool> UnassignClientAsync(int clientId, string unassignedBy);

    // Case management
    Task<CannlawCase?> GetCaseByIdAsync(int caseId);
    Task<IEnumerable<CannlawCase>> GetCasesByClientAsync(int clientId);
    Task<CannlawCase> CreateCaseAsync(CannlawCase cannlawCase, string createdBy);
    Task<bool> UpdateCaseStatusAsync(int caseId, CaseStatus newStatus, string updatedBy, string? notes = null);
    Task<IEnumerable<CaseStatusHistory>> GetCaseStatusHistoryAsync(int caseId);

    // Role-based filtering
    Task<IEnumerable<Client>> GetClientsForUserAsync(string userRole, int? attorneyId = null);
    Task<bool> CanUserAccessClientAsync(int clientId, string userRole, int? attorneyId = null);

    // Audit and logging
    Task LogClientActionAsync(int clientId, string action, string performedBy, string? details = null);
}