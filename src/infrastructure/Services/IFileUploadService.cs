using Microsoft.AspNetCore.Http;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;

namespace L4H.Infrastructure.Services;

public interface IFileUploadService
{
    Task<Document> SaveClientDocumentAsync(
        UserId userId, 
        IFormFile file, 
        string category, 
        string uploadedBy, 
        string? description = null);

    Task<IEnumerable<Document>> GetClientDocumentsAsync(UserId userId);

    Task<Document?> GetDocumentByIdAsync(int documentId);

    Task<DeleteDocumentResult> DeleteDocumentAsync(int documentId);

    Task<string> UploadUSCISFormAsync(IFormFile file, string formNumber);

    Task<string> UploadAttorneyPhotoAsync(IFormFile file, string attorneyName);

    bool IsValidImageFile(IFormFile file);

    Task DeleteFileAsync(string fileUrl);
}

public class DeleteDocumentResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
}
