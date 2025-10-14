using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using L4H.Api.Services;
using L4H.Api.Models;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Json;
using System.Globalization;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/uploads")]
[Authorize]
[Tags("Uploads")]
public class UploadsController : ControllerBase
{
    private readonly L4HDbContext _context;
    private readonly UploadTokenService _tokenService;
    private readonly UploadOptions _uploadOptions;
    private readonly IStringLocalizer<Shared> _localizer;
    private readonly ILogger<UploadsController> _logger;

    // Upload constraints
    private static readonly string[] AllowedExtensions = { ".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg", ".tiff", ".gif", ".heic" };
    private const long MaxUploadSizeMB = 25;
    private const long MaxUploadSizeBytes = MaxUploadSizeMB * 1024 * 1024;

    public UploadsController(
        L4HDbContext context,
        UploadTokenService tokenService,
        IOptions<UploadOptions> uploadOptions,
        IStringLocalizer<Shared> localizer,
        ILogger<UploadsController> logger)
    {
        _context = context;
        _tokenService = tokenService;
        _uploadOptions = uploadOptions.Value;
        _localizer = localizer;
        _logger = logger;
    }

    /// <summary>
    /// Generate presigned URL for file upload
    /// </summary>
    /// <param name="request">Upload presign request</param>
    /// <returns>Presigned upload URL and metadata</returns>
    [HttpPost("presign")]
    [ProducesResponseType<UploadPresignResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> PresignUpload([FromBody] UploadPresignRequest request)
    {
        var userId = GetCurrentUserId();

        // Get the case and verify access
        var caseEntity = await _context.Cases
            .FirstOrDefaultAsync(c => c.Id == request.CaseId).ConfigureAwait(false);

        if (caseEntity == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Case Not Found",
                Detail = _localizer["Cases.NotFound"]
            });
        }

        // Verify case ownership or staff access
        if (caseEntity.UserId != userId && !IsStaff())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Uploads.Forbidden"]
            });
        }

        // Check case status (must be paid or active)
        if (caseEntity.Status != "active" && caseEntity.Status != "paid")
        {
            return Conflict(new ProblemDetails
            {
                Title = "Case Not Paid",
                Detail = _localizer["Uploads.CaseNotPaid"]
            });
        }

        // Validate file size
        var maxSizeBytes = _uploadOptions.MaxSizeMB * 1024 * 1024;
        if (request.SizeBytes > maxSizeBytes)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "File Too Large",
                Detail = _localizer["Uploads.TooLarge"].Value.Replace("{maxSize}", _uploadOptions.MaxSizeMB.ToString(CultureInfo.InvariantCulture))
            });
        }

        // Validate file extension
        var extension = Path.GetExtension(request.Filename).ToLowerInvariant();
        if (!_uploadOptions.AllowedExtensions.Contains(extension.TrimStart('.')))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "File Type Not Allowed",
                Detail = _localizer["Uploads.TypeNotAllowed"]
            });
        }

        // Generate token and gateway URL
        var token = _tokenService.GenerateToken(request.CaseId, request.Filename, request.ContentType, request.SizeBytes);
        var safeFilename = UploadTokenService.GetSafeFilename(request.Filename);
        var key = $"{token}/{safeFilename}";

        try
        {
            // Create upload record in pending state
            var upload = new Upload
            {
                CaseId = request.CaseId,
                OriginalName = request.Filename,
                Mime = request.ContentType,
                SizeBytes = request.SizeBytes,
                Key = key,
                Status = "pending"
            };

            _context.Uploads.Add(upload);

            // Update case activity
            caseEntity.LastActivityAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync().ConfigureAwait(false);

            // Log audit event
            LogAudit("docs", "presign", "Upload", upload.Id.ToString(),
                new { caseId = request.CaseId.Value, filename = request.Filename, sizeBytes = request.SizeBytes });

            var gatewayUrl = $"{_uploadOptions.Gateway.PublicBaseUrl}/gateway/uploads/{token}";
            var response = new UploadPresignResponse
            {
                Key = key,
                Url = gatewayUrl,
                Headers = new Dictionary<string, string>
                {
                    ["Content-Type"] = request.ContentType
                },
                UploadId = upload.Id
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate presigned URL for upload");
            return StatusCode(500, new ProblemDetails
            {
                Title = "Upload Error",
                Detail = "Failed to generate upload URL"
            });
        }
    }

    /// <summary>
    /// Confirm file upload and queue for scanning
    /// </summary>
    /// <param name="request">Upload confirm request</param>
    /// <returns>Upload status</returns>
    [HttpPost("confirm")]
    [ProducesResponseType<UploadConfirmResponse>(StatusCodes.Status202Accepted)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ConfirmUpload([FromBody] UploadConfirmRequest request)
    {
        var userId = GetCurrentUserId();

        // Find the upload record
        var upload = await _context.Uploads
            .Include(u => u.Case)
            .FirstOrDefaultAsync(u => u.Key == request.Key && u.CaseId == request.CaseId).ConfigureAwait(false);

        if (upload == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Upload Not Found",
                Detail = _localizer["Uploads.NotFound"]
            });
        }

        // Verify case access
        if (upload.Case.UserId != userId && !IsStaff())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Uploads.Forbidden"]
            });
        }

        // Check upload status
        if (upload.Status != "pending")
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid Status",
                Detail = _localizer["Uploads.StatusPending"]
            });
        }

        // File existence will be verified by the scan worker
        // For now, just acknowledge the confirmation

        // File is now queued for scanning (background service will pick it up)
        upload.Case.LastActivityAt = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Log audit event
        LogAudit("docs", "confirm", "Upload", upload.Id.ToString(),
            new { caseId = request.CaseId.Value, key = request.Key });

        var response = new UploadConfirmResponse
        {
            Status = upload.Status,
            UploadId = upload.Id
        };

        return Accepted(response);
    }

    /// <summary>
    /// List uploads for a case
    /// </summary>
    /// <param name="caseId">Case ID to list uploads for</param>
    /// <returns>List of uploads</returns>
    [HttpGet("list")]
    [ProducesResponseType<UploadListResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ListUploads([FromQuery] Guid caseId)
    {
        var userId = GetCurrentUserId();
        var caseIdTyped = new CaseId(caseId);

        // Get the case and verify access
        var caseEntity = await _context.Cases
            .FirstOrDefaultAsync(c => c.Id == caseIdTyped).ConfigureAwait(false);

        if (caseEntity == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Case Not Found",
                Detail = _localizer["Cases.NotFound"]
            });
        }

        // Verify case access
        if (caseEntity.UserId != userId && !IsStaff())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Uploads.Forbidden"]
            });
        }

        // Get uploads for the case
        var uploads = await _context.Uploads
            .Where(u => u.CaseId == caseIdTyped)
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync().ConfigureAwait(false);

        var uploadSummaries = uploads.Select(upload => new UploadSummary
        {
            Id = upload.Id,
            OriginalName = upload.OriginalName,
            Mime = upload.Mime,
            SizeBytes = upload.SizeBytes,
            Status = upload.Status,
            CreatedAt = upload.CreatedAt,
            VerdictAt = upload.VerdictAt,
            // For clean files, provide a relative path that can be used later for download
            DownloadUrl = upload.Status == "clean" && !string.IsNullOrEmpty(upload.StorageUrl) 
                ? $"/v1/uploads/download/{upload.Id}" 
                : null
        }).ToList();

        var response = new UploadListResponse
        {
            Uploads = uploadSummaries
        };

        return Ok(response);
    }

    /// <summary>
    /// Get upload limits configuration
    /// </summary>
    /// <returns>Upload limits</returns>
    [HttpGet("limits")]
    [ProducesResponseType<UploadLimitsResponse>(StatusCodes.Status200OK)]
    public IActionResult GetUploadLimits()
    {
        var response = new UploadLimitsResponse
        {
            MaxSizeMB = _uploadOptions.MaxSizeMB,
            AllowedExtensions = _uploadOptions.AllowedExtensions.Select(ext => $".{ext}").ToList()
        };

        return Ok(response);
    }

    private UserId GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user ID in token");
        }
        return new UserId(userId);
    }

    private bool IsStaff()
    {
        return User.HasClaim("IsAdmin", "true") || User.IsInRole("Admin") || User.IsInRole("Staff");
    }

    private void LogAudit(string category, string action, string targetType, string targetId, object details)
    {
        var userId = GetCurrentUserId();
        var auditLog = new AuditLog
        {
            Category = category,
            ActorUserId = userId,
            Action = action,
            TargetType = targetType,
            TargetId = targetId,
            DetailsJson = JsonSerializer.Serialize(details),
            CreatedAt = DateTime.UtcNow
        };

        _context.AuditLogs.Add(auditLog);
        // Note: SaveChangesAsync will be called by the calling method
    }
}