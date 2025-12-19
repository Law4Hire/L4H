using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace L4H.Infrastructure.Services;

public interface IInterviewDocumentService
{
    Task<PresignedUploadResponse> GeneratePresignedUploadAsync(
        Guid sessionToken, Guid questionId, string filename,
        string contentType, long sizeBytes);

    Task<InterviewDocumentUpload> ConfirmUploadAsync(
        Guid sessionToken, Guid uploadId, string storagePath);

    Task<List<InterviewDocumentUpload>> GetSessionDocumentsAsync(Guid sessionToken);

    Task<bool> DeleteDocumentAsync(Guid documentId, Guid sessionToken);

    Task AssociateDocumentsToUserAsync(Guid sessionToken, UserId userId);

    bool ValidateFileType(string filename, string[] allowedTypes);
}

public class InterviewDocumentService : IInterviewDocumentService
{
    private readonly L4HDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly UploadOptions _uploadOptions;

    public InterviewDocumentService(
        L4HDbContext context,
        IConfiguration configuration,
        IOptions<UploadOptions> uploadOptions)
    {
        _context = context;
        _configuration = configuration;
        _uploadOptions = uploadOptions.Value;
    }

    public async Task<PresignedUploadResponse> GeneratePresignedUploadAsync(
        Guid sessionToken,
        Guid questionId,
        string filename,
        string contentType,
        long sizeBytes)
    {
        // Validate session exists
        var session = await _context.InterviewSessions
            .FirstOrDefaultAsync(s => s.AnonymousToken == sessionToken);

        if (session == null)
        {
            throw new InvalidOperationException($"Interview session with token {sessionToken} not found");
        }

        // Validate question exists
        var question = await _context.InterviewQuestions
            .FirstOrDefaultAsync(q => q.Id == questionId);

        if (question == null)
        {
            throw new InvalidOperationException($"Interview question with ID {questionId} not found");
        }

        // Validate file size
        var maxSizeBytes = _uploadOptions.MaxSizeMB * 1024 * 1024;
        if (sizeBytes > maxSizeBytes)
        {
            throw new InvalidOperationException($"File size {sizeBytes} bytes exceeds maximum allowed size of {maxSizeBytes} bytes");
        }

        // Sanitize filename
        var safeFilename = GetSafeFilename(filename);
        var storedFilename = $"{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}_{Guid.NewGuid():N}_{safeFilename}";

        // Generate storage path
        var storagePath = $"interview-sessions/{sessionToken}/{questionId}/{storedFilename}";

        // Create pending upload record
        var upload = new InterviewDocumentUpload
        {
            Id = Guid.NewGuid(),
            InterviewSessionId = session.Id,
            QuestionId = questionId,
            OriginalFileName = filename,
            StoredFileName = storedFilename,
            ContentType = contentType,
            SizeBytes = sizeBytes,
            StoragePath = storagePath,
            Status = "pending",
            UploadedAt = DateTime.UtcNow
        };

        _context.InterviewDocumentUploads.Add(upload);
        await _context.SaveChangesAsync();

        // Generate presigned URL token
        var token = GenerateUploadToken(sessionToken, questionId, storedFilename, contentType, sizeBytes);
        var gatewayUrl = _uploadOptions.Gateway?.PublicBaseUrl ?? "http://localhost:7070";
        var uploadUrl = $"{gatewayUrl}/gateway/uploads/{token}";

        var expiresAt = DateTime.UtcNow.AddMinutes(_uploadOptions.Token?.TtlMinutes ?? 30);

        return new PresignedUploadResponse
        {
            UploadUrl = uploadUrl,
            UploadId = upload.Id,
            ExpiresAt = expiresAt
        };
    }

    public async Task<InterviewDocumentUpload> ConfirmUploadAsync(
        Guid sessionToken,
        Guid uploadId,
        string storagePath)
    {
        // Find the upload record
        var upload = await _context.InterviewDocumentUploads
            .Include(u => u.InterviewSession)
            .FirstOrDefaultAsync(u => u.Id == uploadId);

        if (upload == null)
        {
            throw new InvalidOperationException($"Upload with ID {uploadId} not found");
        }

        // Verify session token matches
        if (upload.InterviewSession.AnonymousToken != sessionToken)
        {
            throw new InvalidOperationException("Session token does not match upload record");
        }

        // Update upload status
        upload.Status = "uploaded";
        upload.StoragePath = storagePath;

        await _context.SaveChangesAsync();

        return upload;
    }

    public async Task<List<InterviewDocumentUpload>> GetSessionDocumentsAsync(Guid sessionToken)
    {
        var session = await _context.InterviewSessions
            .FirstOrDefaultAsync(s => s.AnonymousToken == sessionToken);

        if (session == null)
        {
            throw new InvalidOperationException($"Interview session with token {sessionToken} not found");
        }

        return await _context.InterviewDocumentUploads
            .Where(d => d.InterviewSessionId == session.Id)
            .OrderByDescending(d => d.UploadedAt)
            .ToListAsync();
    }

    public async Task<bool> DeleteDocumentAsync(Guid documentId, Guid sessionToken)
    {
        var document = await _context.InterviewDocumentUploads
            .Include(d => d.InterviewSession)
            .FirstOrDefaultAsync(d => d.Id == documentId);

        if (document == null)
        {
            return false;
        }

        // Verify session token matches
        if (document.InterviewSession.AnonymousToken != sessionToken)
        {
            throw new InvalidOperationException("Session token does not match document");
        }

        // Delete file from storage
        var basePath = _uploadOptions.BasePath ?? "/data/uploads";
        var fullPath = Path.Combine(basePath, document.StoragePath);

        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }

        // Delete database record
        _context.InterviewDocumentUploads.Remove(document);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task AssociateDocumentsToUserAsync(Guid sessionToken, UserId userId)
    {
        var session = await _context.InterviewSessions
            .FirstOrDefaultAsync(s => s.AnonymousToken == sessionToken);

        if (session == null)
        {
            throw new InvalidOperationException($"Interview session with token {sessionToken} not found");
        }

        var documents = await _context.InterviewDocumentUploads
            .Where(d => d.InterviewSessionId == session.Id && d.UserId == null)
            .ToListAsync();

        if (documents.Count == 0)
        {
            return; // No documents to associate
        }

        var basePath = _uploadOptions.BasePath ?? "/data/uploads";

        foreach (var document in documents)
        {
            // Move file from session folder to user folder
            var oldPath = Path.Combine(basePath, document.StoragePath);
            var newStoragePath = $"users/{userId.Value}/interview-documents/{document.QuestionId}/{document.StoredFileName}";
            var newPath = Path.Combine(basePath, newStoragePath);

            // Create directory if it doesn't exist
            var newDirectory = Path.GetDirectoryName(newPath);
            if (newDirectory != null && !Directory.Exists(newDirectory))
            {
                Directory.CreateDirectory(newDirectory);
            }

            // Move file
            if (File.Exists(oldPath))
            {
                File.Move(oldPath, newPath, overwrite: true);
            }

            // Update database record
            document.UserId = userId;
            document.StoragePath = newStoragePath;
            document.AssociatedToUserAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    public bool ValidateFileType(string filename, string[] allowedTypes)
    {
        var extension = Path.GetExtension(filename)?.TrimStart('.').ToLowerInvariant();

        if (string.IsNullOrEmpty(extension))
        {
            return false;
        }

        return allowedTypes.Any(t => t.Equals(extension, StringComparison.OrdinalIgnoreCase));
    }

    private string GenerateUploadToken(
        Guid sessionToken,
        Guid questionId,
        string filename,
        string contentType,
        long sizeBytes)
    {
        var exp = DateTimeOffset.UtcNow.AddMinutes(_uploadOptions.Token?.TtlMinutes ?? 30).ToUnixTimeSeconds();

        var canonicalJson = JsonSerializer.Serialize(new
        {
            sessionToken,
            questionId,
            filename,
            contentType,
            sizeBytes,
            exp
        });

        var signingKey = _uploadOptions.Token?.SigningKey ?? _configuration["Uploads:Token:SigningKey"] ?? "default-key";
        var signature = GenerateHmac(canonicalJson, signingKey);

        var tokenData = new
        {
            sessionToken,
            questionId,
            filename,
            contentType,
            sizeBytes,
            exp,
            signature
        };

        var tokenJson = JsonSerializer.Serialize(tokenData);
        return Base64UrlEncode(Encoding.UTF8.GetBytes(tokenJson));
    }

    private static string GenerateHmac(string data, string key)
    {
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var dataBytes = Encoding.UTF8.GetBytes(data);

        using var hmac = new HMACSHA256(keyBytes);
        var hashBytes = hmac.ComputeHash(dataBytes);
        return Convert.ToBase64String(hashBytes);
    }

    private static string Base64UrlEncode(byte[] input)
    {
        var base64 = Convert.ToBase64String(input);
        return base64.Replace('+', '-').Replace('/', '_').TrimEnd('=');
    }

    private static string GetSafeFilename(string originalFilename)
    {
        // Normalize path separators for cross-platform compatibility
        var normalizedPath = originalFilename.Replace('\\', '/');

        // Remove path traversal attempts and invalid characters
        var filename = Path.GetFileName(normalizedPath);

        // Replace OS-specific invalid characters
        var invalidChars = Path.GetInvalidFileNameChars();
        foreach (var c in invalidChars)
        {
            filename = filename.Replace(c, '_');
        }

        // Also explicitly replace additional unsafe characters
        var additionalUnsafeChars = new[] { '<', '>', ':', '"', '|', '?', '*' };
        foreach (var c in additionalUnsafeChars)
        {
            filename = filename.Replace(c, '_');
        }

        // Additional security: remove leading dots and limit length
        filename = filename.TrimStart('.').Trim();
        if (filename.Length > 255)
        {
            var extension = Path.GetExtension(filename);
            var nameWithoutExt = Path.GetFileNameWithoutExtension(filename);
            filename = nameWithoutExt[..(255 - extension.Length)] + extension;
        }

        return string.IsNullOrWhiteSpace(filename) ? "upload" : filename;
    }
}
