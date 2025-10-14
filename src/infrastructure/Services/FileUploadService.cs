using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Formats;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Data;

namespace L4H.Infrastructure.Services;

public interface IFileUploadService
{
    // Attorney photo management
    Task<string> UploadAttorneyPhotoAsync(IFormFile file, string attorneyName);
    Task<string> ProcessAttorneyPhotoAsync(IFormFile file, int attorneyId);
    
    // Client document management
    Task<Document> UploadClientDocumentAsync(IFormFile file, int clientId, DocumentCategory category, string uploadedBy, string? description = null);
    Task<IEnumerable<Document>> GetClientDocumentsAsync(int clientId, DocumentCategory? category = null);
    Task<Document?> GetDocumentByIdAsync(int documentId);
    Task<bool> DeleteDocumentAsync(int documentId, string deletedBy);
    Task<Document> UpdateDocumentMetadataAsync(int documentId, string? description = null, DocumentCategory? category = null, bool? isConfidential = null);
    
    // File operations
    Task<bool> DeleteFileAsync(string filePath);
    Task<byte[]> GetFileContentAsync(string filePath);
    Task<bool> FileExistsAsync(string filePath);
    
    // Validation
    bool IsValidImageFile(IFormFile file);
    bool IsValidDocumentFile(IFormFile file);
    
    // Security and access control
    Task<bool> CanUserAccessDocumentAsync(int documentId, string userRole, int? attorneyId = null);
    Task LogDocumentAccessAsync(int documentId, string accessedBy, string action);
    
    // File organization and metadata
    Task<long> GetTotalStorageUsedAsync(int? clientId = null);
    Task<Dictionary<DocumentCategory, int>> GetDocumentCountByCategoryAsync(int clientId);
    
    // Virus scanning (placeholder for future implementation)
    Task<bool> ScanFileForVirusesAsync(string filePath);
}

public class FileUploadService : IFileUploadService
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<FileUploadService> _logger;
    private readonly L4HDbContext _context;
    
    private readonly string[] _allowedImageExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
    private readonly string[] _allowedDocumentExtensions = { ".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".webp" };
    private readonly long _maxImageFileSize = 5 * 1024 * 1024; // 5MB
    private readonly long _maxDocumentFileSize = 10 * 1024 * 1024; // 10MB
    
    public FileUploadService(IWebHostEnvironment environment, ILogger<FileUploadService> logger, L4HDbContext context)
    {
        _environment = environment;
        _logger = logger;
        _context = context;
    }

    public async Task<string> UploadAttorneyPhotoAsync(IFormFile file, string attorneyName)
    {
        if (!IsValidImageFile(file))
        {
            throw new ArgumentException("Invalid image file format or size");
        }

        try
        {
            // Create uploads directory if it doesn't exist
            var uploadsPath = Path.Combine(_environment.WebRootPath, "uploads", "attorneys");
            Directory.CreateDirectory(uploadsPath);

            // Generate unique filename
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var sanitizedName = SanitizeFileName(attorneyName);
            var fileName = $"{sanitizedName}_{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadsPath, fileName);

            // Process and save the image
            using var image = await Image.LoadAsync(file.OpenReadStream());
            
            // Resize image to standard attorney photo size (400x400)
            image.Mutate(x => x.Resize(new ResizeOptions
            {
                Size = new Size(400, 400),
                Mode = ResizeMode.Crop,
                Position = AnchorPositionMode.Center
            }));

            // Save with optimization
            await image.SaveAsync(filePath, GetEncoder(fileExtension));

            // Return relative URL path
            return $"/uploads/attorneys/{fileName}";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading attorney photo for {AttorneyName}", attorneyName);
            throw new InvalidOperationException("Failed to upload attorney photo", ex);
        }
    }

    public async Task<string> UploadClientDocumentAsync(IFormFile file, int clientId, string category)
    {
        if (!IsValidDocumentFile(file))
        {
            throw new ArgumentException("Invalid document file format or size");
        }

        try
        {
            // Create uploads directory if it doesn't exist
            var uploadsPath = Path.Combine(_environment.WebRootPath, "uploads", "clients", clientId.ToString(), category);
            Directory.CreateDirectory(uploadsPath);

            // Generate unique filename
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var originalName = Path.GetFileNameWithoutExtension(file.FileName);
            var sanitizedName = SanitizeFileName(originalName);
            var fileName = $"{sanitizedName}_{DateTime.UtcNow:yyyyMMdd_HHmmss}{fileExtension}";
            var filePath = Path.Combine(uploadsPath, fileName);

            // Save the file
            using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream);

            // Return relative URL path
            return $"/uploads/clients/{clientId}/{category}/{fileName}";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading document for client {ClientId}", clientId);
            throw new InvalidOperationException("Failed to upload client document", ex);
        }
    }

    public Task<bool> DeleteFileAsync(string filePath)
    {
        try
        {
            if (string.IsNullOrEmpty(filePath))
                return Task.FromResult(false);

            // Convert relative URL to physical path
            var physicalPath = Path.Combine(_environment.WebRootPath, filePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

            if (File.Exists(physicalPath))
            {
                File.Delete(physicalPath);
                return Task.FromResult(true);
            }

            return Task.FromResult(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file {FilePath}", filePath);
            return Task.FromResult(false);
        }
    }

    public async Task<string> ProcessAttorneyPhotoAsync(IFormFile file, int attorneyId)
    {
        var attorney = await _context.Attorneys.FindAsync(attorneyId);
        if (attorney == null)
        {
            throw new ArgumentException($"Attorney with ID {attorneyId} not found");
        }

        // Delete existing photo if it exists
        if (!string.IsNullOrEmpty(attorney.PhotoUrl))
        {
            await DeleteFileAsync(attorney.PhotoUrl);
        }

        // Upload new photo
        var photoUrl = await UploadAttorneyPhotoAsync(file, attorney.Name);

        // Update attorney record
        attorney.PhotoUrl = photoUrl;
        attorney.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Attorney photo updated for Attorney {AttorneyId}", attorneyId);
        return photoUrl;
    }

    public async Task<Document> UploadClientDocumentAsync(IFormFile file, int clientId, DocumentCategory category, string uploadedBy, string? description = null)
    {
        if (!IsValidDocumentFile(file))
        {
            throw new ArgumentException("Invalid document file format or size");
        }

        // Verify client exists
        var client = await _context.Clients.FindAsync(clientId);
        if (client == null)
        {
            throw new ArgumentException($"Client with ID {clientId} not found");
        }

        try
        {
            // Create uploads directory if it doesn't exist
            var categoryName = category.ToString().ToLowerInvariant();
            var uploadsPath = Path.Combine(_environment.WebRootPath, "uploads", "clients", clientId.ToString(), categoryName);
            Directory.CreateDirectory(uploadsPath);

            // Generate unique filename
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var originalName = Path.GetFileNameWithoutExtension(file.FileName);
            var sanitizedName = SanitizeFileName(originalName);
            var fileName = $"{sanitizedName}_{DateTime.UtcNow:yyyyMMdd_HHmmss}_{Guid.NewGuid():N}{fileExtension}";
            var filePath = Path.Combine(uploadsPath, fileName);

            // Save the file
            using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream);

            // Perform virus scan (placeholder)
            var fileUrl = $"/uploads/clients/{clientId}/{categoryName}/{fileName}";
            if (!await ScanFileForVirusesAsync(filePath))
            {
                // Delete file if virus detected
                File.Delete(filePath);
                throw new InvalidOperationException("File failed security scan");
            }

            // Create document record
            var document = new Document
            {
                ClientId = clientId,
                FileName = fileName,
                OriginalFileName = file.FileName,
                FileUrl = fileUrl,
                ContentType = file.ContentType,
                FileSize = file.Length,
                Category = category,
                Description = description ?? string.Empty,
                UploadedBy = uploadedBy,
                UploadDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Documents.Add(document);
            await _context.SaveChangesAsync();

            await LogDocumentAccessAsync(document.Id, uploadedBy, "Upload");

            _logger.LogInformation("Document {DocumentId} uploaded for Client {ClientId} by {UploadedBy}", 
                document.Id, clientId, uploadedBy);

            return document;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading document for client {ClientId}", clientId);
            throw new InvalidOperationException("Failed to upload client document", ex);
        }
    }

    public async Task<IEnumerable<Document>> GetClientDocumentsAsync(int clientId, DocumentCategory? category = null)
    {
        var query = _context.Documents
            .Where(d => d.ClientId == clientId);

        if (category.HasValue)
        {
            query = query.Where(d => d.Category == category.Value);
        }

        return await query
            .OrderByDescending(d => d.UploadDate)
            .ToListAsync();
    }

    public async Task<Document?> GetDocumentByIdAsync(int documentId)
    {
        return await _context.Documents
            .Include(d => d.Client)
            .FirstOrDefaultAsync(d => d.Id == documentId);
    }

    public async Task<bool> DeleteDocumentAsync(int documentId, string deletedBy)
    {
        var document = await _context.Documents.FindAsync(documentId);
        if (document == null)
        {
            return false;
        }

        try
        {
            // Delete physical file
            await DeleteFileAsync(document.FileUrl);

            // Log the deletion
            await LogDocumentAccessAsync(documentId, deletedBy, "Delete");

            // Remove from database
            _context.Documents.Remove(document);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Document {DocumentId} deleted by {DeletedBy}", documentId, deletedBy);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting document {DocumentId}", documentId);
            return false;
        }
    }

    public async Task<Document> UpdateDocumentMetadataAsync(int documentId, string? description = null, DocumentCategory? category = null, bool? isConfidential = null)
    {
        var document = await _context.Documents.FindAsync(documentId);
        if (document == null)
        {
            throw new ArgumentException($"Document with ID {documentId} not found");
        }

        if (description != null)
        {
            document.Description = description;
        }

        if (category.HasValue)
        {
            document.Category = category.Value;
        }

        if (isConfidential.HasValue)
        {
            document.IsConfidential = isConfidential.Value;
        }

        document.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Document {DocumentId} metadata updated", documentId);
        return document;
    }

    public async Task<byte[]> GetFileContentAsync(string filePath)
    {
        var physicalPath = Path.Combine(_environment.WebRootPath, filePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
        
        if (!File.Exists(physicalPath))
        {
            throw new FileNotFoundException($"File not found: {filePath}");
        }

        return await File.ReadAllBytesAsync(physicalPath);
    }

    public Task<bool> FileExistsAsync(string filePath)
    {
        var physicalPath = Path.Combine(_environment.WebRootPath, filePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
        return Task.FromResult(File.Exists(physicalPath));
    }

    public bool IsValidImageFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return false;

        if (file.Length > _maxImageFileSize)
            return false;

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_allowedImageExtensions.Contains(extension))
            return false;

        // Additional MIME type validation
        var allowedMimeTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/webp" };
        return allowedMimeTypes.Contains(file.ContentType.ToLowerInvariant());
    }

    public bool IsValidDocumentFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return false;

        if (file.Length > _maxDocumentFileSize)
            return false;

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_allowedDocumentExtensions.Contains(extension))
            return false;

        // Additional MIME type validation for documents
        var allowedMimeTypes = new[] 
        { 
            "application/pdf", 
            "application/msword", 
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/jpeg", "image/jpg", "image/png", "image/webp"
        };
        return allowedMimeTypes.Contains(file.ContentType.ToLowerInvariant());
    }

    public async Task<bool> CanUserAccessDocumentAsync(int documentId, string userRole, int? attorneyId = null)
    {
        var document = await _context.Documents
            .Include(d => d.Client)
            .FirstOrDefaultAsync(d => d.Id == documentId);

        if (document == null)
        {
            return false;
        }

        // Admin can access all documents
        if (userRole.Equals("Admin", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        // Legal professionals can only access documents of their assigned clients
        if (userRole.Equals("LegalProfessional", StringComparison.OrdinalIgnoreCase) && attorneyId.HasValue)
        {
            return document.Client.AssignedAttorneyId == attorneyId.Value;
        }

        // Clients can access their own documents (if client role is implemented)
        if (userRole.Equals("Client", StringComparison.OrdinalIgnoreCase))
        {
            // This would require client user ID mapping
            return false; // Placeholder - implement when client portal is added
        }

        return false;
    }

    public async Task LogDocumentAccessAsync(int documentId, string accessedBy, string action)
    {
        var auditLog = new AuditLog
        {
            Category = "Document",
            TargetType = "Document",
            TargetId = documentId.ToString(),
            Action = action,
            DetailsJson = $"Document {action.ToLower()} operation",
            CreatedAt = DateTime.UtcNow
        };

        _context.AuditLogs.Add(auditLog);

        // Update document access tracking
        var document = await _context.Documents.FindAsync(documentId);
        if (document != null)
        {
            document.LastAccessedBy = accessedBy;
            document.LastAccessedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    public async Task<long> GetTotalStorageUsedAsync(int? clientId = null)
    {
        var query = _context.Documents.AsQueryable();

        if (clientId.HasValue)
        {
            query = query.Where(d => d.ClientId == clientId.Value);
        }

        return await query.SumAsync(d => d.FileSize);
    }

    public async Task<Dictionary<DocumentCategory, int>> GetDocumentCountByCategoryAsync(int clientId)
    {
        return await _context.Documents
            .Where(d => d.ClientId == clientId)
            .GroupBy(d => d.Category)
            .ToDictionaryAsync(g => g.Key, g => g.Count());
    }

    public async Task<bool> ScanFileForVirusesAsync(string filePath)
    {
        // Placeholder for virus scanning implementation
        // In a real implementation, this would integrate with an antivirus service
        // such as ClamAV, Windows Defender, or a cloud-based scanning service
        
        await Task.Delay(100); // Simulate scanning delay
        
        // For now, always return true (no virus detected)
        // TODO: Implement actual virus scanning
        _logger.LogDebug("Virus scan completed for file: {FilePath} (placeholder implementation)", filePath);
        return true;
    }

    private static string SanitizeFileName(string fileName)
    {
        // Remove invalid characters and replace spaces with underscores
        var invalidChars = Path.GetInvalidFileNameChars();
        var sanitized = new string(fileName.Where(c => !invalidChars.Contains(c)).ToArray());
        return sanitized.Replace(" ", "_").ToLowerInvariant();
    }

    private static IImageEncoder GetEncoder(string extension)
    {
        return extension switch
        {
            ".jpg" or ".jpeg" => new JpegEncoder { Quality = 85 },
            ".png" => new PngEncoder(),
            ".webp" => new WebpEncoder { Quality = 85 },
            _ => new JpegEncoder { Quality = 85 }
        };
    }
}