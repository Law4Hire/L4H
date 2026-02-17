using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Interfaces;
using L4H.Infrastructure.Services;
using System.Security.Claims;
using L4H.Shared.Models;
using L4H.Shared.Models.Dtos;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/documents")]
[Tags("Documents")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly L4HDbContext _context;
    private readonly IFileUploadService _fileUploadService;
    private readonly ICannlawUserService _userService;

    public DocumentsController(
        L4HDbContext context, 
        IFileUploadService fileUploadService,
        ICannlawUserService userService,
        IDocumentPoolService documentPoolService)
    {
        _context = context;
        _fileUploadService = fileUploadService;
        _userService = userService;
        _documentPoolService = documentPoolService;
    }

    private readonly IDocumentPoolService _documentPoolService;

    /// <summary>
    /// Get verified legal documents for the current user from the document pool
    /// </summary>
    [HttpGet("mine/verified")]
    [ProducesResponseType(typeof(DocumentPoolDto[]), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<DocumentPoolDto>>> GetMyVerified()
    {
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var typedUserId = new UserId(userId);
        var docs = await _documentPoolService.GetVerifiedDocumentsForUserAsync(typedUserId);
        return Ok(docs);
    }

    /// <summary>
    /// Get documents for a specific user with role-based access
    /// </summary>
    [HttpGet("user/{userId}")]
    [ProducesResponseType(typeof(Document[]), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Document[]>> GetUserDocuments(
        Guid userId,
        [FromQuery] DocumentCategory? category = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var uid = new UserId(userId);
        var user = await _userService.GetClientByIdAsync(uid);
        if (user == null)
        {
            return NotFound("User not found");
        }

        // Role-based access check
        var isAdmin = User.HasClaim(c => c.Type == "is_admin" && c.Value.Equals("true", StringComparison.OrdinalIgnoreCase));
        if (!isAdmin)
        {
            var subClaim = User.FindFirst("sub")?.Value;
            if (subClaim != userId.ToString())
            {
                // Check if user is the assigned attorney
                var attorneyIdClaim = User.FindFirst("AttorneyId")?.Value;
                if (!int.TryParse(attorneyIdClaim, out var attorneyId) || user.AssignedAttorneyId != attorneyId)
                {
                    return Forbid("You do not have access to these documents");
                }
            }
        }

        var documents = await _fileUploadService.GetClientDocumentsAsync(uid);
        
        if (category.HasValue)
        {
            documents = documents.Where(d => d.Category == category.Value);
        }

        var result = documents
            .OrderByDescending(d => d.UploadDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToArray();

        return Ok(result);
    }    

    /// <summary>
    /// Upload a document for a user
    /// </summary>
    [HttpPost("user/{userId}/upload")]
    [ProducesResponseType(typeof(Document), StatusCodes.Status201Created)]
    public async Task<ActionResult<Document>> UploadDocument(
        Guid userId,
        IFormFile file,
        [FromForm] string category = "Other",
        [FromForm] string? description = null)
    {
        var uid = new UserId(userId);
        var user = await _userService.GetClientByIdAsync(uid);
        if (user == null) return NotFound("User not found");

        // Role-based access check
        var isAdmin = User.HasClaim(c => c.Type == "is_admin" && c.Value.Equals("true", StringComparison.OrdinalIgnoreCase));
        var subClaim = User.FindFirst("sub")?.Value;
        
        if (!isAdmin && subClaim != userId.ToString())
        {
            var attorneyIdClaim = User.FindFirst("AttorneyId")?.Value;
            if (!int.TryParse(attorneyIdClaim, out var attorneyId) || user.AssignedAttorneyId != attorneyId)
            {
                return Forbid();
            }
        }

        if (file == null || file.Length == 0) return BadRequest("No file provided");

        try
        {
            var uploadedBy = User.FindFirst(ClaimTypes.Email)?.Value ?? "system";
            var document = await _fileUploadService.SaveClientDocumentAsync(uid, file, category, uploadedBy, description);
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
    public async Task<ActionResult<Document>> GetDocument(int id)
    {
        var document = await _fileUploadService.GetDocumentByIdAsync(id);
        if (document == null) return NotFound();

        // Access check
        var isAdmin = User.HasClaim(c => c.Type == "is_admin" && c.Value.Equals("true", StringComparison.OrdinalIgnoreCase));
        if (!isAdmin)
        {
            var subClaim = User.FindFirst("sub")?.Value;
            if (document.UserId == null || subClaim != document.UserId.Value.ToString())
            {
                // Check if user is the assigned attorney
                var user = await _userService.GetClientByIdAsync(document.UserId.Value);
                var attorneyIdClaim = User.FindFirst("AttorneyId")?.Value;
                if (user == null || !int.TryParse(attorneyIdClaim, out var attorneyId) || user.AssignedAttorneyId != attorneyId)
                {
                    return Forbid();
                }
            }
        }

        return Ok(document);
    }

    /// <summary>
    /// Delete a document
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteDocument(int id)
    {
        var document = await _fileUploadService.GetDocumentByIdAsync(id);
        if (document == null) return NotFound();

        // Access check
        var isAdmin = User.HasClaim(c => c.Type == "is_admin" && c.Value.Equals("true", StringComparison.OrdinalIgnoreCase));
        if (!isAdmin)
        {
            var subClaim = User.FindFirst("sub")?.Value;
            if (document.UserId == null || subClaim != document.UserId.Value.ToString())
            {
                // Check if user is the assigned attorney
                var user = await _userService.GetClientByIdAsync(document.UserId.Value);
                var attorneyIdClaim = User.FindFirst("AttorneyId")?.Value;
                if (user == null || !int.TryParse(attorneyIdClaim, out var attorneyId) || user.AssignedAttorneyId != attorneyId)
                {
                    return Forbid();
                }
            }
        }

        var result = await _fileUploadService.DeleteDocumentAsync(id);
        if (!result.Success) return BadRequest(result.ErrorMessage);
        return Ok();
    }
}

