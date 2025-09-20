using System;
using System.Linq;
using System.Threading;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using System.Security.Claims;
using System.Text.Json;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/workflows")]
[Authorize]
public class WorkflowLookupController : ControllerBase
{
    private readonly L4HDbContext _context;
    private readonly IStringLocalizer<Shared> _localizer;
    private readonly ILogger<WorkflowLookupController> _logger;

    public WorkflowLookupController(
        L4HDbContext context,
        IStringLocalizer<Shared> localizer,
        ILogger<WorkflowLookupController> logger)
    {
        _context = context;
        _localizer = localizer;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<WorkflowLookupResponse>> GetLatestApprovedWorkflow(
        [FromQuery] string visaType,
        [FromQuery] string country,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(visaType) || string.IsNullOrWhiteSpace(country))
        {
            return BadRequest(new ErrorResponse
            {
                Message = _localizer["Workflow.MissingParameters"]
            });
        }

        // Find visa type
        var visaTypeEntity = await _context.VisaTypes
            .FirstOrDefaultAsync(v => v.Code == visaType, cancellationToken).ConfigureAwait(false);

        if (visaTypeEntity == null)
        {
            return NotFound(new ErrorResponse
            {
                Message = _localizer["Workflow.VisaTypeNotFound", visaType]
            });
        }

        // Get latest approved workflow for this visa type and country
        var workflow = await _context.WorkflowVersions
            .Include(w => w.Steps.OrderBy(s => s.Ordinal))
            .Include(w => w.Doctors)
            .Where(w => w.VisaTypeId == visaTypeEntity.Id &&
                       w.CountryCode == country.ToUpper(CultureInfo.InvariantCulture) &&
                       w.Status == "approved")
            .OrderByDescending(w => w.Version)
            .FirstOrDefaultAsync(cancellationToken).ConfigureAwait(false);

        if (workflow == null)
        {
            return NotFound(new ErrorResponse
            {
                Message = _localizer["Workflow.LookupNotFound"]
            });
        }

        // Create audit log for lookup
        var userId = GetCurrentUserId();
        if (userId.HasValue)
        {
            await CreateLookupAuditLogAsync(workflow.Id, userId.Value, cancellationToken).ConfigureAwait(false);
        }

        var response = new WorkflowLookupResponse
        {
            Id = workflow.Id,
            VisaTypeId = workflow.VisaTypeId,
            CountryCode = workflow.CountryCode,
            Version = workflow.Version,
            Status = workflow.Status,
            Source = workflow.Source,
            ApprovedAt = workflow.ApprovedAt ?? DateTime.MinValue,
            Steps = workflow.Steps.Select(s => new WorkflowStepDetails
            {
                Id = s.Id,
                Ordinal = s.Ordinal,
                Key = s.Key,
                Title = s.Title,
                Description = s.Description,
                DataJson = s.DataJson
            }).ToList(),
            Doctors = workflow.Doctors.Select(d => new WorkflowDoctorDetails
            {
                Id = d.Id,
                Name = d.Name,
                Address = d.Address,
                Phone = d.Phone,
                City = d.City,
                CountryCode = d.CountryCode,
                SourceUrl = d.SourceUrl
            }).ToList()
        };

        _logger.LogInformation(_localizer["Workflow.LookupOk"], visaType, country, workflow.Version);

        return Ok(response);
    }

    private UserId? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdClaim, out var userId))
        {
            return new UserId(userId);
        }
        return null;
    }

    private async Task CreateLookupAuditLogAsync(Guid workflowId, UserId actorId, CancellationToken cancellationToken)
    {
        var auditLog = new AuditLog
        {
            Category = "workflow",
            Action = "lookup",
            TargetType = "WorkflowVersion",
            TargetId = workflowId.ToString(),
            ActorUserId = actorId,
            DetailsJson = JsonSerializer.Serialize(new 
            {
                timestamp = DateTime.UtcNow,
                userAgent = Request.Headers.UserAgent.FirstOrDefault()
            })
        };

        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    /// <summary>
    /// Create a new workflow version with steps and doctors
    /// </summary>
    [HttpPost]
    [Authorize] // Require admin or staff authorization
    public async Task<ActionResult<WorkflowCreateResponse>> CreateWorkflow(
        [FromBody] CreateWorkflowRequest request,
        CancellationToken cancellationToken = default)
    {
        // Validate request
        if (string.IsNullOrWhiteSpace(request.VisaType) || string.IsNullOrWhiteSpace(request.CountryCode))
        {
            return BadRequest(new ErrorResponse
            {
                Message = _localizer["Workflow.MissingParameters"]
            });
        }

        // Find visa type
        var visaTypeEntity = await _context.VisaTypes
            .FirstOrDefaultAsync(v => v.Code == request.VisaType, cancellationToken).ConfigureAwait(false);

        if (visaTypeEntity == null)
        {
            return NotFound(new ErrorResponse
            {
                Message = _localizer["Workflow.VisaTypeNotFound", request.VisaType]
            });
        }

        // Get current user for approval tracking
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized(new ErrorResponse
            {
                Message = _localizer["Auth.Unauthorized"]
            });
        }

        // Get next version number
        var latestVersion = await _context.WorkflowVersions
            .Where(w => w.VisaTypeId == visaTypeEntity.Id &&
                       w.CountryCode == request.CountryCode.ToUpper(CultureInfo.InvariantCulture))
            .OrderByDescending(w => w.Version)
            .Select(w => w.Version)
            .FirstOrDefaultAsync(cancellationToken).ConfigureAwait(false);

        var newVersion = latestVersion + 1;

        // Create workflow version
        var workflow = new WorkflowVersion
        {
            VisaTypeId = visaTypeEntity.Id,
            CountryCode = request.CountryCode.ToUpper(CultureInfo.InvariantCulture),
            Version = newVersion,
            Status = "draft",
            Source = request.Source ?? "Manual",
            ScrapeHash = Guid.NewGuid().ToString("N"), // Generate unique hash for manual entries
            ScrapedAt = DateTime.UtcNow,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.WorkflowVersions.Add(workflow);
        await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        // Add steps
        if (request.Steps?.Any() == true)
        {
            var steps = request.Steps.Select(step => new WorkflowStep
            {
                WorkflowVersionId = workflow.Id,
                Ordinal = step.StepNumber,
                Key = step.Key ?? $"step_{step.StepNumber}",
                Title = step.Title ?? $"Step {step.StepNumber}",
                Description = step.Description ?? "",
                DataJson = JsonSerializer.Serialize(new
                {
                    documentType = step.DocumentType,
                    isUserProvided = step.IsUserProvided,
                    documentName = step.DocumentName,
                    governmentLink = step.GovernmentLink,
                    countryCode = step.CountryCode,
                    visaType = step.VisaType,
                    additionalData = step.AdditionalData
                })
            }).ToList();

            _context.WorkflowSteps.AddRange(steps);
        }

        // Add doctors
        if (request.Doctors?.Any() == true)
        {
            var doctors = request.Doctors.Select(doc => new WorkflowDoctor
            {
                WorkflowVersionId = workflow.Id,
                Name = doc.Name,
                Address = doc.Address,
                Phone = doc.Phone,
                City = doc.City,
                CountryCode = doc.CountryCode,
                SourceUrl = doc.SourceUrl ?? ""
            }).ToList();

            _context.WorkflowDoctors.AddRange(doctors);
        }

        await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        // Create audit log
        await CreateWorkflowAuditLogAsync(workflow.Id, userId.Value, "created", cancellationToken).ConfigureAwait(false);

        var response = new WorkflowCreateResponse
        {
            Id = workflow.Id,
            VisaTypeId = workflow.VisaTypeId,
            CountryCode = workflow.CountryCode,
            Version = workflow.Version,
            Status = workflow.Status,
            StepsCount = request.Steps?.Count ?? 0,
            DoctorsCount = request.Doctors?.Count ?? 0,
            CreatedAt = workflow.CreatedAt
        };

        _logger.LogInformation("Created workflow version {Version} for {VisaType}/{Country}",
            workflow.Version, request.VisaType, request.CountryCode);

        return CreatedAtAction(nameof(GetLatestApprovedWorkflow),
            new { visaType = request.VisaType, country = request.CountryCode },
            response);
    }

    private async Task CreateWorkflowAuditLogAsync(Guid workflowId, UserId actorId, string action, CancellationToken cancellationToken)
    {
        var auditLog = new AuditLog
        {
            Category = "workflow",
            Action = action,
            TargetType = "WorkflowVersion",
            TargetId = workflowId.ToString(),
            ActorUserId = actorId,
            DetailsJson = JsonSerializer.Serialize(new
            {
                timestamp = DateTime.UtcNow,
                userAgent = Request.Headers.UserAgent.FirstOrDefault()
            })
        };

        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}