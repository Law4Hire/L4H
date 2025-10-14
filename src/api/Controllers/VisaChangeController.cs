using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using System.Security.Claims;
using System.Text.Json;
using System.Globalization;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/visa-change")]
[Authorize]
[Tags("Visa Change")]
public class VisaChangeController : ControllerBase
{
    private readonly L4HDbContext _context;
    private readonly IStringLocalizer<Shared> _localizer;
    private readonly ILogger<VisaChangeController> _logger;

    public VisaChangeController(
        L4HDbContext context,
        IStringLocalizer<Shared> localizer,
        ILogger<VisaChangeController> logger)
    {
        _context = context;
        _localizer = localizer;
        _logger = logger;
    }

    /// <summary>
    /// Propose a visa type change for a case (staff only)
    /// </summary>
    /// <param name="request">Visa change proposal request</param>
    /// <returns>Visa change proposal response</returns>
    [HttpPost("propose")]
    [ProducesResponseType<VisaChangeProposalResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ProposeVisaChange([FromBody] VisaChangeProposalRequest request)
    {
        var staffUserId = GetCurrentUserId();

        // Verify staff permissions (admin or staff)
        if (!IsStaff())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["VisaChange.StaffOnly"]
            });
        }

        // Get the case with current visa type and package information
        var caseEntity = await _context.Cases
            .Include(c => c.VisaType)
            .Include(c => c.Package)
            .Include(c => c.PriceSnapshots)
            .FirstOrDefaultAsync(c => c.Id == request.CaseId).ConfigureAwait(false);

        if (caseEntity == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Case Not Found",
                Detail = _localizer["Cases.NotFound"]
            });
        }

        if (caseEntity.IsInterviewLocked)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Case Locked",
                Detail = _localizer["VisaChange.CaseLocked"]
            });
        }

        // Check if there's already a pending visa change request for this case
        var existingRequest = await _context.VisaChangeRequests
            .FirstOrDefaultAsync(r => r.CaseId == request.CaseId && r.Status == "pending").ConfigureAwait(false);

        if (existingRequest != null)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Pending Request Exists",
                Detail = _localizer["VisaChange.PendingExists"]
            });
        }

        // Get the new visa type
        var newVisaType = await _context.VisaTypes
            .FirstOrDefaultAsync(v => v.Id == request.NewVisaTypeId && v.IsActive).ConfigureAwait(false);

        if (newVisaType == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Visa Type Not Found",
                Detail = _localizer["VisaChange.VisaTypeNotFound"]
            });
        }

        // Prevent changing to same visa type
        if (caseEntity.VisaTypeId == request.NewVisaTypeId)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Same Visa Type",
                Detail = _localizer["VisaChange.SameVisaType"]
            });
        }

        // Calculate price delta using latest price snapshot
        var priceBreakdown = await CalculatePriceDelta(caseEntity, newVisaType).ConfigureAwait(false);

        if (priceBreakdown == null)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Price Calculation Failed",
                Detail = _localizer["VisaChange.PriceCalculationFailed"]
            });
        }

        // Create the visa change request
        var visaChangeRequest = new VisaChangeRequest
        {
            CaseId = request.CaseId,
            OldVisaTypeId = caseEntity.VisaTypeId ?? 0,
            NewVisaTypeId = request.NewVisaTypeId,
            Status = "pending",
            RequestedByStaffId = staffUserId,
            RequestedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            DeltaAmount = priceBreakdown.Delta,
            Currency = priceBreakdown.Currency,
            BreakdownJson = JsonSerializer.Serialize(priceBreakdown),
            Notes = request.Notes
        };

        _context.VisaChangeRequests.Add(visaChangeRequest);

        // Update case activity
        caseEntity.LastActivityAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Log audit event
        LogAudit("visa_change", "proposed", "VisaChangeRequest", visaChangeRequest.Id.ToString(),
            new { caseId = request.CaseId.Value, oldVisaTypeId = visaChangeRequest.OldVisaTypeId, newVisaTypeId = request.NewVisaTypeId, delta = priceBreakdown.Delta });

        var response = new VisaChangeProposalResponse
        {
            Id = visaChangeRequest.Id,
            CaseId = request.CaseId,
            OldVisaType = caseEntity.VisaType?.Name ?? "Unknown",
            NewVisaType = newVisaType.Name,
            DeltaAmount = priceBreakdown.Delta,
            Currency = priceBreakdown.Currency,
            Status = visaChangeRequest.Status,
            RequestedAt = visaChangeRequest.RequestedAt,
            ExpiresAt = visaChangeRequest.ExpiresAt,
            Notes = request.Notes,
            Breakdown = priceBreakdown
        };

        return Ok(response);
    }

    /// <summary>
    /// Approve or reject a visa change request (client only)
    /// </summary>
    /// <param name="request">Visa change approval request</param>
    /// <returns>Approval response</returns>
    [HttpPost("approve")]
    [ProducesResponseType<VisaChangeApprovalResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ApproveVisaChange([FromBody] VisaChangeApprovalRequest request)
    {
        var userId = GetCurrentUserId();

        // Get the visa change request with related entities
        var visaChangeRequest = await _context.VisaChangeRequests
            .Include(r => r.Case)
            .Include(r => r.OldVisaType)
            .Include(r => r.NewVisaType)
            .FirstOrDefaultAsync(r => r.Id == request.RequestId).ConfigureAwait(false);

        if (visaChangeRequest == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Request Not Found",
                Detail = _localizer["VisaChange.RequestNotFound"]
            });
        }

        // Verify the user owns the case
        if (visaChangeRequest.Case.UserId != userId)
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["VisaChange.ClientOnly"]
            });
        }

        // Check if request is still pending
        if (visaChangeRequest.Status != "pending")
        {
            return Conflict(new ProblemDetails
            {
                Title = "Request Not Pending",
                Detail = _localizer["VisaChange.NotPending"]
            });
        }

        // Check if request has expired
        if (visaChangeRequest.ExpiresAt < DateTime.UtcNow)
        {
            visaChangeRequest.Status = "expired";
            await _context.SaveChangesAsync().ConfigureAwait(false);

            return Conflict(new ProblemDetails
            {
                Title = "Request Expired",
                Detail = _localizer["VisaChange.Expired"]
            });
        }

        DateTime processedAt = DateTime.UtcNow;
        string message;

        if (request.Approved)
        {
            // Approve the change
            visaChangeRequest.Status = "approved";
            visaChangeRequest.ApprovedByClientAt = processedAt;

            // Apply the visa type change to the case
            visaChangeRequest.Case.VisaTypeId = visaChangeRequest.NewVisaTypeId;
            visaChangeRequest.Case.LastActivityAt = DateTimeOffset.UtcNow;

            // Create price delta ledger entry for future Stripe processing
            if (visaChangeRequest.DeltaAmount != 0)
            {
                var ledgerEntry = new PriceDeltaLedger
                {
                    CaseId = visaChangeRequest.CaseId,
                    VisaChangeRequestId = visaChangeRequest.Id,
                    Type = visaChangeRequest.DeltaAmount > 0 ? "charge" : "refund",
                    Amount = Math.Abs(visaChangeRequest.DeltaAmount),
                    Currency = visaChangeRequest.Currency,
                    Description = $"Visa change from {visaChangeRequest.OldVisaType.Code} to {visaChangeRequest.NewVisaType.Code}",
                    Status = PriceDeltaStatus.Pending
                };

                _context.PriceDeltaLedgers.Add(ledgerEntry);
            }

            message = _localizer["VisaChange.Approved"];

            // Log audit event
            LogAudit("visa_change", "approved", "VisaChangeRequest", visaChangeRequest.Id.ToString(),
                new { caseId = visaChangeRequest.CaseId.Value, newVisaTypeId = visaChangeRequest.NewVisaTypeId });
        }
        else
        {
            // Reject the change
            visaChangeRequest.Status = "rejected";
            visaChangeRequest.RejectedByClientAt = processedAt;

            message = _localizer["VisaChange.Rejected"];

            // Log audit event
            LogAudit("visa_change", "rejected", "VisaChangeRequest", visaChangeRequest.Id.ToString(),
                new { caseId = visaChangeRequest.CaseId.Value, reason = request.RejectionReason });
        }

        visaChangeRequest.Case.LastActivityAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);

        var response = new VisaChangeApprovalResponse
        {
            RequestId = request.RequestId,
            Status = visaChangeRequest.Status,
            ProcessedAt = processedAt,
            Message = message
        };

        return Ok(response);
    }

    /// <summary>
    /// Get visa change history for the current user's cases
    /// </summary>
    /// <param name="caseId">Optional case ID to filter by specific case</param>
    /// <returns>Visa change history</returns>
    [HttpGet("history")]
    [ProducesResponseType<VisaChangeHistoryResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVisaChangeHistory([FromQuery] Guid? caseId = null)
    {
        var userId = GetCurrentUserId();

        var query = _context.VisaChangeRequests
            .Include(r => r.Case)
            .Include(r => r.OldVisaType)
            .Include(r => r.NewVisaType)
            .Include(r => r.RequestedByStaff)
            .Where(r => r.Case.UserId == userId);

        if (caseId.HasValue)
        {
            var filterCaseId = new CaseId(caseId.Value);
            query = query.Where(r => r.CaseId == filterCaseId);
        }

        var requests = await query
            .OrderByDescending(r => r.RequestedAt)
            .ToListAsync().ConfigureAwait(false);

        var requestSummaries = requests.Select(r => new VisaChangeRequestSummary
        {
            Id = r.Id,
            OldVisaType = r.OldVisaType.Name,
            NewVisaType = r.NewVisaType.Name,
            DeltaAmount = r.DeltaAmount,
            Currency = r.Currency,
            Status = r.Status,
            RequestedAt = r.RequestedAt,
            ExpiresAt = r.ExpiresAt,
            ProcessedAt = r.ApprovedByClientAt ?? r.RejectedByClientAt,
            RequestedBy = r.RequestedByStaff.Email
        }).ToList();

        var response = new VisaChangeHistoryResponse
        {
            Requests = requestSummaries
        };

        return Ok(response);
    }

    private async Task<VisaChangePriceBreakdown?> CalculatePriceDelta(Case caseEntity, VisaType newVisaType)
    {
        // Get the latest price snapshot for current pricing
        var latestSnapshot = caseEntity.PriceSnapshots
            .OrderByDescending(s => s.CreatedAt)
            .FirstOrDefault();

        if (latestSnapshot == null || caseEntity.PackageId == null)
        {
            return null;
        }

        var package = await _context.Packages.FindAsync(caseEntity.PackageId).ConfigureAwait(false);
        if (package == null) return null;

        // Find pricing rule for new visa type with same package and country
        var newPricingRule = await _context.PricingRules
            .FirstOrDefaultAsync(pr => pr.VisaTypeId == newVisaType.Id
                                      && pr.PackageId == package.Id
                                      && pr.CountryCode == latestSnapshot.CountryCode
                                      && pr.IsActive).ConfigureAwait(false);

        if (newPricingRule == null)
        {
            return null;
        }

        // Calculate new price
        var newPrice = CalculateTotal(newPricingRule.BasePrice, newPricingRule.TaxRate, newPricingRule.FxSurchargeMode);
        var oldPrice = latestSnapshot.Total;
        var delta = newPrice - oldPrice;

        return new VisaChangePriceBreakdown
        {
            OldPrice = oldPrice,
            NewPrice = newPrice,
            Delta = delta,
            Currency = newPricingRule.Currency,
            OldVisaTypeCode = caseEntity.VisaType?.Code ?? "",
            NewVisaTypeCode = newVisaType.Code,
            PackageCode = package.Code,
            CalculatedAt = DateTime.UtcNow
        };
    }

    private static decimal CalculateTotal(decimal basePrice, decimal taxRate, string? fxSurchargeMode)
    {
        var tax = basePrice * taxRate;
        var subtotal = basePrice + tax;

        var fxMultiplier = fxSurchargeMode?.ToLower(CultureInfo.InvariantCulture) switch
        {
            "high" => 1.1m,
            "medium" => 1.05m,
            _ => 1.0m
        };

        return Math.Round(subtotal * fxMultiplier, 2);
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