using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Interfaces;
using L4H.Shared.Models.Dtos;
using L4H.Shared.Enums;
using L4H.Shared.Models;

namespace L4H.Infrastructure.Services;

public class DocumentPoolService : IDocumentPoolService
{
    private readonly L4HDbContext _context;
    private readonly ILogger<DocumentPoolService> _logger;

    public DocumentPoolService(L4HDbContext context, ILogger<DocumentPoolService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<DocumentPoolDto>> GetDocumentsByStatusAsync(VerificationStatus status)
    {
        return await _context.DocumentPool
            .Where(d => d.Status == status)
            .Select(d => MapToDto(d))
            .ToListAsync();
    }

    public async Task<IEnumerable<DocumentPoolDto>> GetVerifiedDocumentsForUserAsync(UserId userId)
    {
        return await _context.DocumentPool
            .Where(d => d.AssignedUserId == userId && d.IsVerified == true)
            .Select(d => MapToDto(d))
            .ToListAsync();
    }

    public async Task<IEnumerable<DocumentPoolDto>> GetUnassignedDocumentsAsync()
    {
        return await _context.DocumentPool
            .Where(d => d.Status == VerificationStatus.Unassigned || (d.AssignedUserId == null && d.AssignedCaseId == null))
            .Select(d => MapToDto(d))
            .ToListAsync();
    }

    public async Task<DocumentPoolDto?> GetDocumentByIdAsync(Guid id)
    {
        var doc = await _context.DocumentPool.FindAsync(id);
        return doc != null ? MapToDto(doc) : null;
    }

    public async Task<DocumentPoolDto> VerifyDocumentAsync(Guid id, VerifyDocumentRequest request)
    {
        var doc = await _context.DocumentPool.FindAsync(id) 
            ?? throw new KeyNotFoundException($"Document {id} not found.");

        doc.IsVerified = request.Approve;
        doc.Status = request.Approve ? VerificationStatus.Verified : VerificationStatus.Rejected;
        doc.VerifiedAt = DateTime.UtcNow;
        doc.VerifiedByStaffId = request.StaffId;
        doc.RejectionReason = request.RejectionReason;
        doc.InternalNotes = request.InternalNotes ?? doc.InternalNotes;
        doc.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        _logger.LogInformation("Document {DocId} verification updated to {Status} by Staff {StaffId}", id, doc.Status, request.StaffId);

        return MapToDto(doc);
    }

    public async Task<DocumentPoolDto> AssignDocumentAsync(Guid id, AssignDocumentRequest request)
    {
        var doc = await _context.DocumentPool.FindAsync(id) 
            ?? throw new KeyNotFoundException($"Document {id} not found.");

        doc.AssignedUserId = request.UserId;
        doc.AssignedCaseId = request.CaseId;
        doc.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        _logger.LogInformation("Document {DocId} assigned to User {UserId} / Case {CaseId}", id, request.UserId, request.CaseId);

        return MapToDto(doc);
    }

    public async Task<DocumentPoolDto> UpdateNotesAsync(Guid id, string notes)
    {
        var doc = await _context.DocumentPool.FindAsync(id) 
            ?? throw new KeyNotFoundException($"Document {id} not found.");

        doc.InternalNotes = notes;
        doc.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToDto(doc);
    }

    private static DocumentPoolDto MapToDto(DocumentPool d) => new()
    {
        Id = d.Id,
        OriginalFileName = d.OriginalFileName,
        FileUrl = d.FileUrl,
        FileSize = d.FileSize,
        Status = d.Status,
        IsVerified = d.IsVerified,
        AssignedUserId = d.AssignedUserId,
        AssignedCaseId = d.AssignedCaseId,
        VerifiedAt = d.VerifiedAt,
        VerifiedByStaffId = d.VerifiedByStaffId,
        RejectionReason = d.RejectionReason,
        InternalNotes = d.InternalNotes,
        UploadedAt = d.UploadedAt,
        UploadedBy = d.UploadedBy
    };
}
