using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using L4H.Infrastructure.Services;
using L4H.Shared.Models;
using System.ComponentModel.DataAnnotations;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/interview/documents")]
[AllowAnonymous]  // Must support anonymous users during interview
[Tags("Interview Documents")]
public class InterviewDocumentUploadController : ControllerBase
{
    private readonly IInterviewDocumentService _documentService;
    private readonly ILogger<InterviewDocumentUploadController> _logger;

    public InterviewDocumentUploadController(
        IInterviewDocumentService documentService,
        ILogger<InterviewDocumentUploadController> logger)
    {
        _documentService = documentService;
        _logger = logger;
    }

    /// <summary>
    /// Generate a presigned upload URL for an interview document
    /// </summary>
    /// <remarks>
    /// This endpoint generates a secure, time-limited URL that allows anonymous users
    /// to upload documents during the interview process.
    /// </remarks>
    [HttpPost("presign")]
    [ProducesResponseType(typeof(PresignedUploadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PresignedUploadResponse>> PresignUpload(
        [FromBody] InterviewDocumentPresignRequest request)
    {
        try
        {
            var response = await _documentService.GeneratePresignedUploadAsync(
                request.SessionToken,
                request.QuestionId,
                request.Filename,
                request.ContentType,
                request.SizeBytes);

            _logger.LogInformation(
                "Generated presigned upload URL for session {SessionToken}, question {QuestionId}, file {Filename}",
                request.SessionToken, request.QuestionId, request.Filename);

            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Failed to generate presigned URL: {Message}", ex.Message);
            return BadRequest(new ProblemDetails
            {
                Title = "Upload presign failed",
                Detail = ex.Message,
                Status = StatusCodes.Status400BadRequest
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error generating presigned URL");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal server error",
                Detail = "An unexpected error occurred while generating upload URL",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Confirm successful upload of a document
    /// </summary>
    /// <remarks>
    /// After successfully uploading a file to the presigned URL,
    /// call this endpoint to confirm the upload and update the record status.
    /// </remarks>
    [HttpPost("confirm")]
    [ProducesResponseType(typeof(InterviewDocumentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<InterviewDocumentResponse>> ConfirmUpload(
        [FromBody] ConfirmDocumentUploadRequest request)
    {
        try
        {
            var upload = await _documentService.ConfirmUploadAsync(
                request.SessionToken,
                request.UploadId,
                request.StoragePath);

            _logger.LogInformation(
                "Confirmed upload {UploadId} for session {SessionToken}",
                request.UploadId, request.SessionToken);

            return Ok(new InterviewDocumentResponse
            {
                Id = upload.Id,
                OriginalFileName = upload.OriginalFileName,
                SizeBytes = upload.SizeBytes,
                UploadedAt = upload.UploadedAt,
                Status = upload.Status
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Failed to confirm upload: {Message}", ex.Message);
            return BadRequest(new ProblemDetails
            {
                Title = "Upload confirmation failed",
                Detail = ex.Message,
                Status = StatusCodes.Status400BadRequest
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error confirming upload");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal server error",
                Detail = "An unexpected error occurred while confirming upload",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// List all documents uploaded for an interview session
    /// </summary>
    [HttpGet("list/{sessionToken}")]
    [ProducesResponseType(typeof(List<InterviewDocumentResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<List<InterviewDocumentResponse>>> ListSessionDocuments(
        [FromRoute] Guid sessionToken)
    {
        try
        {
            var documents = await _documentService.GetSessionDocumentsAsync(sessionToken);

            var response = documents.Select(d => new InterviewDocumentResponse
            {
                Id = d.Id,
                OriginalFileName = d.OriginalFileName,
                SizeBytes = d.SizeBytes,
                UploadedAt = d.UploadedAt,
                Status = d.Status
            }).ToList();

            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Failed to list documents: {Message}", ex.Message);
            return BadRequest(new ProblemDetails
            {
                Title = "Failed to list documents",
                Detail = ex.Message,
                Status = StatusCodes.Status400BadRequest
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error listing documents");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal server error",
                Detail = "An unexpected error occurred while listing documents",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Delete a document from the interview session
    /// </summary>
    /// <remarks>
    /// Users can delete documents they've uploaded before completing the interview.
    /// </remarks>
    [HttpDelete("{documentId}")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MessageResponse>> DeleteDocument(
        [FromRoute] Guid documentId,
        [FromBody] DeleteDocumentRequest request)
    {
        try
        {
            var deleted = await _documentService.DeleteDocumentAsync(documentId, request.SessionToken);

            if (!deleted)
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Document not found",
                    Detail = $"Document with ID {documentId} not found",
                    Status = StatusCodes.Status404NotFound
                });
            }

            _logger.LogInformation(
                "Deleted document {DocumentId} for session {SessionToken}",
                documentId, request.SessionToken);

            return Ok(new MessageResponse
            {
                Message = "Document deleted successfully"
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Failed to delete document: {Message}", ex.Message);
            return BadRequest(new ProblemDetails
            {
                Title = "Delete failed",
                Detail = ex.Message,
                Status = StatusCodes.Status400BadRequest
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error deleting document");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal server error",
                Detail = "An unexpected error occurred while deleting document",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Associate all session documents with a user after registration
    /// </summary>
    /// <remarks>
    /// This endpoint is called automatically during the registration process
    /// to move uploaded files from the anonymous session folder to the user's folder.
    /// </remarks>
    [HttpPost("associate-user")]
    [Authorize]  // This requires authentication since user just registered
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MessageResponse>> AssociateDocumentsToUser(
        [FromBody] AssociateDocumentsRequest request)
    {
        try
        {
            var userId = new UserId(request.UserId);
            await _documentService.AssociateDocumentsToUserAsync(request.SessionToken, userId);

            _logger.LogInformation(
                "Associated documents from session {SessionToken} to user {UserId}",
                request.SessionToken, request.UserId);

            return Ok(new MessageResponse
            {
                Message = "Documents successfully associated with user account"
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Failed to associate documents: {Message}", ex.Message);
            return BadRequest(new ProblemDetails
            {
                Title = "Association failed",
                Detail = ex.Message,
                Status = StatusCodes.Status400BadRequest
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error associating documents");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal server error",
                Detail = "An unexpected error occurred while associating documents",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }
}
