using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using System.Security.Claims;
using System.Text.Json;

namespace L4H.Api.Controllers.Admin;

[ApiController]
[Route("v1/admin/workflows")]
[Authorize(Policy = "IsAdmin")]
public class WorkflowReviewController : ControllerBase
{
    private readonly L4HDbContext _context;
    private readonly IStringLocalizer<Shared> _localizer;
    private readonly ILogger<WorkflowReviewController> _logger;

    public WorkflowReviewController(
        L4HDbContext context,
        IStringLocalizer<Shared> localizer,
        ILogger<WorkflowReviewController> logger)
    {
        _context = context;
        _localizer = localizer;
        _logger = logger;
    }

    [HttpGet("pending")]
    public async Task<ActionResult<WorkflowPendingListResponse>> GetPendingWorkflows(
        [FromQuery] string? visaType = null,
        [FromQuery] string? country = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.WorkflowVersions
            .Where(w => w.Status == "pending_approval");

        if (!string.IsNullOrEmpty(visaType))
        {
            // Find visa type ID
            var visaTypeEntity = await _context.VisaTypes
                .FirstOrDefaultAsync(v => v.Code == visaType, cancellationToken).ConfigureAwait(false);
            if (visaTypeEntity != null)
            {
                query = query.Where(w => w.VisaTypeId == visaTypeEntity.Id);
            }
        }

        if (!string.IsNullOrEmpty(country))
        {
            query = query.Where(w => w.CountryCode == country);
        }

        var workflows = await query
            .Include(w => w.Steps)
            .Include(w => w.Doctors)
            .OrderByDescending(w => w.ScrapedAt)
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        var response = new WorkflowPendingListResponse
        {
            TotalCount = workflows.Count,
            Workflows = workflows.Select(w => new WorkflowPendingSummary
            {
                Id = w.Id,
                VisaTypeId = w.VisaTypeId,
                CountryCode = w.CountryCode,
                Version = w.Version,
                Status = w.Status,
                StatusDisplayName = _localizer["Workflow.PendingStatus"],
                Source = w.Source,
                ScrapedAt = w.ScrapedAt,
                StepCount = w.Steps.Count,
                DoctorCount = w.Doctors.Count
            }).ToList()
        };

        return Ok(response);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<WorkflowLookupResponse>> GetWorkflow(
        Guid id, 
        CancellationToken cancellationToken = default)
    {
        var workflow = await _context.WorkflowVersions
            .Include(w => w.Steps.OrderBy(s => s.Ordinal))
            .Include(w => w.Doctors)
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken).ConfigureAwait(false);

        if (workflow == null)
        {
            return NotFound(new ErrorResponse 
            {
                Message = _localizer["Workflow.NotFound"]
            });
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

        return Ok(response);
    }

    [HttpGet("{id}/diff")]
    public async Task<ActionResult<WorkflowDiffResponse>> GetWorkflowDiff(
        Guid id, 
        CancellationToken cancellationToken = default)
    {
        var workflow = await _context.WorkflowVersions
            .Include(w => w.Steps)
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken).ConfigureAwait(false);

        if (workflow == null)
        {
            return NotFound(new ErrorResponse 
            {
                Message = _localizer["Workflow.NotFound"]
            });
        }

        // Get the latest approved version for comparison
        var latestApproved = await _context.WorkflowVersions
            .Include(w => w.Steps)
            .Where(w => w.CountryCode == workflow.CountryCode && 
                       w.VisaTypeId == workflow.VisaTypeId && 
                       w.Status == "approved")
            .OrderByDescending(w => w.Version)
            .FirstOrDefaultAsync(cancellationToken).ConfigureAwait(false);

        var diff = GenerateDiff(latestApproved, workflow);

        return Ok(diff);
    }

    [HttpPost("{id}/approve")]
    public async Task<ActionResult<ApproveWorkflowResponse>> ApproveWorkflow(
        Guid id,
        [FromBody] ApproveWorkflowRequest request,
        CancellationToken cancellationToken = default)
    {

        var workflow = await _context.WorkflowVersions
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken).ConfigureAwait(false);

        if (workflow == null)
        {
            return NotFound(new ErrorResponse 
            {
                Message = _localizer["Workflow.NotFound"]
            });
        }

        if (workflow.Status != "pending_approval")
        {
            return BadRequest(new ErrorResponse
            {
                Message = _localizer["Workflow.NotPending"]
            });
        }

        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Forbid();
        }

        // Find the highest version number for the same visa type and country
        var maxVersion = await _context.WorkflowVersions
            .Where(w => w.CountryCode == workflow.CountryCode && 
                       w.VisaTypeId == workflow.VisaTypeId)
            .MaxAsync(w => (int?)w.Version, cancellationToken).ConfigureAwait(false) ?? 0;

        // Update the existing workflow to approved status and bump version
        workflow.Status = "approved";
        workflow.Version = maxVersion + 1;
        workflow.ApprovedBy = userId;
        workflow.ApprovedAt = DateTime.UtcNow;
        workflow.Notes = request.Notes;
        workflow.UpdatedAt = DateTime.UtcNow;

        // Invalidate other pending drafts for same visa/country
        var otherPendingDrafts = await _context.WorkflowVersions
            .Where(w => w.Id != id &&
                       w.CountryCode == workflow.CountryCode && 
                       w.VisaTypeId == workflow.VisaTypeId && 
                       w.Status == "pending_approval")
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        foreach (var draft in otherPendingDrafts)
        {
            draft.Status = "superseded";
            draft.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        // Create audit log
        await CreateAuditLogAsync("workflow", "approve", workflow.Id.ToString(), 
            userId.Value, cancellationToken).ConfigureAwait(false);

        _logger.LogInformation(_localizer["Workflow.Approved"], id, userId);

        return Ok(new ApproveWorkflowResponse
        {
            Success = true,
            Message = _localizer["Workflow.ApprovedSuccess"],
            NewVersion = workflow.Version
        });
    }

    [HttpPost("{id}/reject")]
    public async Task<ActionResult<ApproveWorkflowResponse>> RejectWorkflow(
        Guid id,
        [FromBody] RejectWorkflowRequest request,
        CancellationToken cancellationToken = default)
    {
        var workflow = await _context.WorkflowVersions
            .FirstOrDefaultAsync(w => w.Id == id, cancellationToken).ConfigureAwait(false);

        if (workflow == null)
        {
            return NotFound(new ErrorResponse 
            {
                Message = _localizer["Workflow.NotFound"]
            });
        }

        if (workflow.Status != "pending_approval")
        {
            return BadRequest(new ErrorResponse
            {
                Message = _localizer["Workflow.NotPending"]
            });
        }

        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Forbid();
        }

        // Update workflow
        workflow.Status = "rejected";
        workflow.ApprovedBy = userId;
        workflow.ApprovedAt = DateTime.UtcNow;
        workflow.Notes = $"{request.Reason}: {request.Notes}";
        workflow.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        // Create audit log
        await CreateAuditLogAsync("workflow", "reject", workflow.Id.ToString(), 
            userId.Value, cancellationToken).ConfigureAwait(false);

        return Ok(new ApproveWorkflowResponse
        {
            Success = true,
            Message = _localizer["Workflow.RejectedSuccess"],
            NewVersion = workflow.Version
        });
    }

    private static WorkflowDiffResponse GenerateDiff(WorkflowVersion? approved, WorkflowVersion current)
    {
        var diff = new WorkflowDiffResponse
        {
            WorkflowId = current.Id,
            ComparedToId = approved?.Id
        };

        if (approved == null)
        {
            // No previous version - all steps are new
            diff.AddedSteps = current.Steps.Select(s => new WorkflowStepDiff
            {
                Key = s.Key,
                ChangeType = "added",
                NewValue = s.Title,
                Title = s.Title,
                Description = s.Description
            }).ToList();
        }
        else
        {
            var existingSteps = approved.Steps.ToDictionary(s => s.Key);
            var currentSteps = current.Steps.ToDictionary(s => s.Key);

            // Find added steps
            foreach (var step in current.Steps)
            {
                if (!existingSteps.ContainsKey(step.Key))
                {
                    diff.AddedSteps.Add(new WorkflowStepDiff
                    {
                        Key = step.Key,
                        ChangeType = "added",
                        NewValue = step.Title,
                        Title = step.Title,
                        Description = step.Description
                    });
                }
            }

            // Find removed steps
            foreach (var step in approved.Steps)
            {
                if (!currentSteps.ContainsKey(step.Key))
                {
                    diff.RemovedSteps.Add(new WorkflowStepDiff
                    {
                        Key = step.Key,
                        ChangeType = "removed",
                        OldValue = step.Title,
                        Title = step.Title,
                        Description = step.Description
                    });
                }
            }

            // Find modified steps
            foreach (var step in current.Steps)
            {
                if (existingSteps.TryGetValue(step.Key, out var existingStep))
                {
                    if (existingStep.Title != step.Title ||
                        existingStep.Description != step.Description)
                    {
                        diff.ModifiedSteps.Add(new WorkflowStepDiff
                        {
                            Key = step.Key,
                            ChangeType = "title_changed",
                            OldValue = existingStep.Title,
                            NewValue = step.Title,
                            Title = step.Title,
                            Description = step.Description
                        });
                    }
                }
            }
        }

        diff.TotalChanges = diff.AddedSteps.Count + diff.RemovedSteps.Count + diff.ModifiedSteps.Count;
        return diff;
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

    private bool IsAdmin()
    {
        return User.IsInRole("Admin") || User.HasClaim("IsAdmin", "true");
    }

    private async Task CreateAuditLogAsync(string category, string action, string targetId, UserId actorId, CancellationToken cancellationToken)
    {
        var auditLog = new AuditLog
        {
            Category = category,
            Action = action,
            TargetType = "WorkflowVersion",
            TargetId = targetId,
            ActorUserId = actorId,
            DetailsJson = JsonSerializer.Serialize(new { timestamp = DateTime.UtcNow })
        };

        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}