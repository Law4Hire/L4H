using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using L4H.Infrastructure.Interfaces;
using L4H.Shared.Models;
using L4H.Shared.Models.Dtos;
using L4H.Shared.Enums;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize(Policy = "IsLegalProfessional")]
public class DocumentPoolController : ControllerBase
{
    private readonly IDocumentPoolService _documentPoolService;

    public DocumentPoolController(IDocumentPoolService documentPoolService)
    {
        _documentPoolService = documentPoolService;
    }

    [HttpGet("status/{status}")]
    public async Task<ActionResult<IEnumerable<DocumentPoolDto>>> GetByStatus(VerificationStatus status)
    {
        var docs = await _documentPoolService.GetDocumentsByStatusAsync(status);
        return Ok(docs);
    }

    [HttpGet("unassigned")]
    public async Task<ActionResult<IEnumerable<DocumentPoolDto>>> GetUnassigned()
    {
        var docs = await _documentPoolService.GetUnassignedDocumentsAsync();
        return Ok(docs);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DocumentPoolDto>> GetById(Guid id)
    {
        var doc = await _documentPoolService.GetDocumentByIdAsync(id);
        if (doc == null) return NotFound();
        return Ok(doc);
    }

    [HttpPatch("{id}/verify")]
    public async Task<ActionResult<DocumentPoolDto>> Verify(Guid id, [FromBody] VerifyDocumentRequest request)
    {
        try
        {
            var doc = await _documentPoolService.VerifyDocumentAsync(id, request);
            return Ok(doc);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPatch("{id}/assign")]
    public async Task<ActionResult<DocumentPoolDto>> Assign(Guid id, [FromBody] AssignDocumentRequest request)
    {
        try
        {
            var doc = await _documentPoolService.AssignDocumentAsync(id, request);
            return Ok(doc);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPatch("{id}/notes")]
    public async Task<ActionResult<DocumentPoolDto>> UpdateNotes(Guid id, [FromBody] string notes)
    {
        try
        {
            var doc = await _documentPoolService.UpdateNotesAsync(id, notes);
            return Ok(doc);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
