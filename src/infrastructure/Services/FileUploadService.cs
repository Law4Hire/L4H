using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using System.Text.RegularExpressions;

namespace L4H.Infrastructure.Services;

public class FileUploadService : IFileUploadService
{
    private readonly L4HDbContext _context;
    private readonly ILogger<FileUploadService> _logger;
    private readonly string _uploadPath;

    public FileUploadService(
        L4HDbContext context, 
        ILogger<FileUploadService> logger,
        IConfiguration configuration)
    {
        _context = context;
        _logger = logger;
        _uploadPath = configuration["FileStorage:BasePath"] 
                      ?? configuration["Uploads:BasePath"] 
                      ?? Path.Combine(AppContext.BaseDirectory, "uploads");
    }

    public async Task<Document> SaveClientDocumentAsync(
        UserId userId, 
        IFormFile file, 
        string category, 
        string uploadedBy, 
        string? description = null)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException($"User {userId} not found");
        }

        // Generate safe filename
        var safeFileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var relativePath = Path.Combine("clients", userId.Value.ToString(), safeFileName);
        var fullPath = Path.Combine(_uploadPath, relativePath);

        // Create directory
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        // Save file
        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Create document record
        var document = new Document
        {
            UserId = userId,
            FileName = safeFileName,
            OriginalFileName = file.FileName,
            FileUrl = relativePath.Replace("\\", "/"),
            ContentType = file.ContentType,
            Category = Enum.Parse<DocumentCategory>(category),
            Description = description ?? string.Empty,
            UploadedBy = uploadedBy,
            UploadDate = DateTime.UtcNow
        };

        _context.Documents.Add(document);
        await _context.SaveChangesAsync();

        // Audit log
        var auditLog = new AuditLog
        {
            Category = "Document",
            TargetType = "User",
            TargetId = userId.ToString(),
            Action = "Upload",
            DetailsJson = $"Document uploaded: {file.FileName}",
            ActorUserId = null, // Can be set if we have the actor ID
            CreatedAt = DateTime.UtcNow
        };
        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync();

        return document;
    }

    public async Task<IEnumerable<Document>> GetClientDocumentsAsync(UserId userId)
    {
        return await _context.Documents
            .Where(d => d.UserId == userId)
            .OrderByDescending(d => d.UploadDate)
            .ToListAsync();
    }

    public async Task<Document?> GetDocumentByIdAsync(int documentId)
    {
        return await _context.Documents
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == documentId);
    }

    public async Task<DeleteDocumentResult> DeleteDocumentAsync(int documentId)
    {
        var document = await _context.Documents.FindAsync(documentId);
        if (document == null) return new DeleteDocumentResult { Success = false, ErrorMessage = "Document not found" };

        try
        {
            // Delete physical file
            var fullPath = Path.Combine(_uploadPath, document.FileUrl.Replace("/", "\\"));
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }

            _context.Documents.Remove(document);
            await _context.SaveChangesAsync();
            return new DeleteDocumentResult { Success = true };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting document {DocumentId}", documentId);
            return new DeleteDocumentResult { Success = false, ErrorMessage = "An error occurred while deleting the file" };
        }
    }

    public async Task<string> UploadUSCISFormAsync(IFormFile file, string formNumber)
    {
        var safeFileName = $"form_{formNumber.Replace(" ", "_")}.pdf";
        var relativePath = Path.Combine("images", "forms", safeFileName);
        var fullPath = Path.Combine(_uploadPath, relativePath);

        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return "/api/v1/uploads/" + relativePath.Replace("\\", "/");
    }

    public async Task<string> UploadAttorneyPhotoAsync(IFormFile file)
    {
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var baseName = Path.GetFileNameWithoutExtension(file.FileName);
        var safeBase = Regex.Replace(baseName, @"[^a-zA-Z0-9\-_]", "_");
        var uniqueName = $"{DateTimeOffset.UtcNow:yyyyMMddHHmmssff}_{safeBase}{ext}";
        var relativePath = Path.Combine("images", "attorneys", uniqueName);
        var fullPath = Path.Combine(_uploadPath, relativePath);

        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return "/api/v1/uploads/" + relativePath.Replace("\\", "/");
    }

    public bool IsValidImageFile(IFormFile file)
    {
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".tiff", ".tif", ".heic" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        return allowedExtensions.Contains(ext);
    }

    public async Task DeleteFileAsync(string fileUrl)
    {
        const string prefix = "/api/v1/uploads/";
        var relativePath = fileUrl;
        
        if (relativePath.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            relativePath = relativePath.Substring(prefix.Length);
        }
        else
        {
            relativePath = relativePath.TrimStart('/');
        }

        var fullPath = Path.Combine(_uploadPath, relativePath.Replace("/", "\\"));
        
        if (File.Exists(fullPath))
        {
            await Task.Run(() => File.Delete(fullPath));
        }
    }
}
