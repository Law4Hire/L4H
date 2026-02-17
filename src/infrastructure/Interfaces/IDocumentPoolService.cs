using L4H.Shared.Models.Dtos;
using L4H.Shared.Enums;
using L4H.Shared.Models;

namespace L4H.Infrastructure.Interfaces;

public interface IDocumentPoolService
{
    Task<IEnumerable<DocumentPoolDto>> GetDocumentsByStatusAsync(VerificationStatus status);
    Task<IEnumerable<DocumentPoolDto>> GetVerifiedDocumentsForUserAsync(UserId userId);
    Task<IEnumerable<DocumentPoolDto>> GetUnassignedDocumentsAsync();
    Task<DocumentPoolDto?> GetDocumentByIdAsync(Guid id);
    Task<DocumentPoolDto> VerifyDocumentAsync(Guid id, VerifyDocumentRequest request);
    Task<DocumentPoolDto> AssignDocumentAsync(Guid id, AssignDocumentRequest request);
    Task<DocumentPoolDto> UpdateNotesAsync(Guid id, string notes);
}
