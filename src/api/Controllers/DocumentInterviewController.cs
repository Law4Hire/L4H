using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using L4H.Infrastructure.Interfaces;
using L4H.Shared.Models.Dtos;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class DocumentInterviewController : ControllerBase
{
    private readonly IDocumentInterviewService _interviewService;

    public DocumentInterviewController(IDocumentInterviewService interviewService)
    {
        _interviewService = interviewService;
    }

    [HttpGet("forms/{formId}/fields")]
    public async Task<ActionResult<IEnumerable<FormFieldMappingDto>>> GetFields(Guid formId)
    {
        var fields = await _interviewService.GetRequiredFieldsAsync(formId);
        return Ok(fields);
    }

    [HttpPost("forms/{formId}/assemble")]
    public async Task<IActionResult> Assemble(Guid formId, [FromBody] Dictionary<string, string> answers)
    {
        try
        {
            var pdfBytes = await _interviewService.AssembleDocumentAsync(formId, answers);
            return File(pdfBytes, "application/pdf", $"form_{formId}.pdf");
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
}
