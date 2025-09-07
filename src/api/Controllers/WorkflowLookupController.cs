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
[Route("v1/workflows")]
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
}