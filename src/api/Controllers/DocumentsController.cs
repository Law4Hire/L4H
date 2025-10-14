using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Services;
using System.Security.Claims;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/documents")]
[Tags("Documents")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly L4HDbContext _context;
    private readonly IFileUploadService _fileUploadService;

    public DocumentsController(L4HDbContext context, IFileUploadService fileUploadService)
    {
        _context = context;
        _fileUploadService = fileUploadService;
    }

    /// <summary>
    /// Get documents for a specific client with role-based access
    /// </summary>
    [HttpGet("client/{clientId}")]
    [ProducesResponseType(typeof(Document[]), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Document[]>> GetClientDocuments(
        int clientId,
        [FromQuery] DocumentCategory? category = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        // Verify client exists and user has access
        var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == clientId);
        if (client == null)
        {
            return NotFound("Client not found");
        }

        // Role-based access check
        var isAdmin = User.HasClaim("is_admin", "true");
        if (!isAdmin)
        {
            var userIdClaim = User.FindFirst("sub")?.Value;
            if (!int.TryParse(userIdClaim, out var userId) || client.AssignedAttorneyId != userId)
            {
                return Forbid("You can only access documents for your assigned clients");
            }
        }

        var query = _context.Documents
            .Where(d => d.ClientId == clientId)
            .AsQueryable();

        if (category.HasValue)
        {
            query = query.Where(d => d.Category == category.Value);
        }

        var totalCount = await query.CountAsync();
        var documents = await query
            .OrderByDescending(d => d.UploadDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToArrayAsync();

        Response.Headers.Append("X-Total-Count", totalCount.ToString());
        return Ok(documents);
    }    
/// <summary>
    /// Upload a document for a client
    /// </summary>
    [HttpPost("client/{clientId}/upload")]
    [ProducesResponseType(typeof(Document), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Document>> UploadDocument(
        int clientId,
        IFormFile file,
        [FromForm] DocumentCategory category = DocumentCategory.Other,
        [FromForm] string? description = null,
        [FromForm] bool isConfidential = false)
    {
        // Verify client exists and user has access
        var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == clientId);
        if (client == null)
        {
            return NotFound("Client not found");
        }

        // Role-based access check
        var isAdmin = User.HasClaim("is_admin", "true");
        if (!isAdmin)
        {
            var userIdClaim = User.FindFirst("sub")?.Value;
            if (!int.TryParse(userIdClaim, out var userId) || client.AssignedAttorneyId != userId)
            {
                return Forbid("You can only upload documents for your assigned clients");
            }
        }

        if (file == null || file.Length == 0)
        {
            return BadRequest("No file provided");
        }

        try
        {
            // Upload the file and create document record
            var uploadedBy = User.FindFirst("email")?.Value ?? "system";
            var document = await _fileUploadService.UploadClientDocumentAsync(file, clientId, category, uploadedBy, description);

            _context.Documents.Add(document);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDocument), new { id = document.Id }, document);
        }
        catch (Exception ex)
        {
            return BadRequest($"Failed to upload document: {ex.Message}");
        }
    }

    /// <summary>
    /// Get a specific document by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(Document), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Document>> GetDocument(int id)
    {
        var document = await _context.Documents
            .Include(d => d.Client)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (document == null)
        {
            return NotFound();
        }

        // Role-based access check
        var isAdmin = User.HasClaim("is_admin", "true");
        if (!isAdmin)
        {
            var userIdClaim = User.FindFirst("sub")?.Value;
            if (!int.TryParse(userIdClaim, out var userId) || document.Client.AssignedAttorneyId != userId)
            {
                return Forbid();
            }
        }

        // Update last accessed information
        document.LastAccessedBy = User.FindFirst("email")?.Value ?? "system";
        document.LastAccessedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(document);
    }

    /// <summary>
    /// Download a document file
    /// </summary>
    [HttpGet("{id}/download")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DownloadDocument(int id)
    {
        var document = await _context.Documents
            .Include(d => d.Client)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (document == null)
        {
            return NotFound();
        }

        // Role-based access check
        var isAdmin = User.HasClaim("is_admin", "true");
        if (!isAdmin)
        {
            var userIdClaim = User.FindFirst("sub")?.Value;
            if (!int.TryParse(userIdClaim, out var userId) || document.Client.AssignedAttorneyId != userId)
            {
                return Forbid();
            }
        }

        try
        {
            // Get physical file path
            var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var filePath = Path.Combine(webRootPath, document.FileUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound("File not found on disk");
            }

            // Update last accessed information
            document.LastAccessedBy = User.FindFirst("email")?.Value ?? "system";
            document.LastAccessedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            return File(fileBytes, document.ContentType, document.OriginalFileName);
        }
        catch (Exception ex)
        {
            return BadRequest($"Failed to download document: {ex.Message}");
        }
    }   
 /// <summary>
    /// Update document metadata
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> UpdateDocument(int id, [FromBody] UpdateDocumentRequest request)
    {
        var document = await _context.Documents
            .Include(d => d.Client)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (document == null)
        {
            return NotFound();
        }

        // Role-based access check
        var isAdmin = User.HasClaim("is_admin", "true");
        if (!isAdmin)
        {
            var userIdClaim = User.FindFirst("sub")?.Value;
            if (!int.TryParse(userIdClaim, out var userId) || document.Client.AssignedAttorneyId != userId)
            {
                return Forbid();
            }
        }

        // Update fields
        if (request.Category.HasValue)
        {
            document.Category = request.Category.Value;
        }

        if (!string.IsNullOrWhiteSpace(request.Description))
        {
            document.Description = request.Description;
        }

        if (request.IsConfidential.HasValue)
        {
            document.IsConfidential = request.IsConfidential.Value;
        }

        if (!string.IsNullOrWhiteSpace(request.AccessNotes))
        {
            document.AccessNotes = request.AccessNotes;
        }

        document.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok();
    }

    /// <summary>
    /// Delete a document
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteDocument(int id)
    {
        var document = await _context.Documents
            .Include(d => d.Client)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (document == null)
        {
            return NotFound();
        }

        // Role-based access check
        var isAdmin = User.HasClaim("is_admin", "true");
        if (!isAdmin)
        {
            var userIdClaim = User.FindFirst("sub")?.Value;
            if (!int.TryParse(userIdClaim, out var userId) || document.Client.AssignedAttorneyId != userId)
            {
                return Forbid();
            }
        }

        try
        {
            // Delete physical file
            await _fileUploadService.DeleteFileAsync(document.FileUrl);

            // Delete database record
            _context.Documents.Remove(document);
            await _context.SaveChangesAsync();

            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest($"Failed to delete document: {ex.Message}");
        }
    }

    /// <summary>
    /// Search documents across all clients (Admin only)
    /// </summary>
    [HttpGet("search")]
    [Authorize(Policy = "IsAdmin")]
    [ProducesResponseType(typeof(Document[]), StatusCodes.Status200OK)]
    public async Task<ActionResult<Document[]>> SearchDocuments(
        [FromQuery] string? fileName = null,
        [FromQuery] DocumentCategory? category = null,
        [FromQuery] int? clientId = null,
        [FromQuery] string? uploadedBy = null,
        [FromQuery] DateTime? uploadedAfter = null,
        [FromQuery] DateTime? uploadedBefore = null,
        [FromQuery] bool? isConfidential = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var query = _context.Documents
            .Include(d => d.Client)
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrWhiteSpace(fileName))
        {
            query = query.Where(d => d.OriginalFileName.ToLower().Contains(fileName.ToLower()) ||
                                   d.Description.ToLower().Contains(fileName.ToLower()));
        }

        if (category.HasValue)
        {
            query = query.Where(d => d.Category == category.Value);
        }

        if (clientId.HasValue)
        {
            query = query.Where(d => d.ClientId == clientId.Value);
        }

        if (!string.IsNullOrWhiteSpace(uploadedBy))
        {
            query = query.Where(d => d.UploadedBy.ToLower().Contains(uploadedBy.ToLower()));
        }

        if (uploadedAfter.HasValue)
        {
            query = query.Where(d => d.UploadDate >= uploadedAfter.Value);
        }

        if (uploadedBefore.HasValue)
        {
            query = query.Where(d => d.UploadDate <= uploadedBefore.Value);
        }

        if (isConfidential.HasValue)
        {
            query = query.Where(d => d.IsConfidential == isConfidential.Value);
        }

        var totalCount = await query.CountAsync();
        var documents = await query
            .OrderByDescending(d => d.UploadDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToArrayAsync();

        Response.Headers.Append("X-Total-Count", totalCount.ToString());
        return Ok(documents);
    }

    /// <summary>
    /// Get document categories
    /// </summary>
    [HttpGet("categories")]
    [ProducesResponseType(typeof(DocumentCategoryInfo[]), StatusCodes.Status200OK)]
    public ActionResult<DocumentCategoryInfo[]> GetDocumentCategories()
    {
        var categories = Enum.GetValues<DocumentCategory>()
            .Select(c => new DocumentCategoryInfo
            {
                Value = (int)c,
                Name = c.ToString(),
                DisplayName = GetCategoryDisplayName(c)
            })
            .ToArray();

        return Ok(categories);
    }

    private static string GetCategoryDisplayName(DocumentCategory category)
    {
        return category switch
        {
            DocumentCategory.PersonalDocuments => "Personal Documents",
            DocumentCategory.GovernmentForms => "Government Forms",
            DocumentCategory.SupportingEvidence => "Supporting Evidence",
            DocumentCategory.Correspondence => "Correspondence",
            DocumentCategory.Legal => "Legal Documents",
            DocumentCategory.Other => "Other",
            _ => category.ToString()
        };
    }
}

// Request/Response Models
public class UpdateDocumentRequest
{
    public DocumentCategory? Category { get; set; }
    public string? Description { get; set; }
    public bool? IsConfidential { get; set; }
    public string? AccessNotes { get; set; }
}

public class DocumentCategoryInfo
{
    public int Value { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
}