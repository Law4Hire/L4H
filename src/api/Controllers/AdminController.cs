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
[Route("v1/admin")]
[Authorize]
[Tags("Admin")]
public class AdminController : ControllerBase
{
    private readonly L4HDbContext _context;
    private readonly IStringLocalizer<Shared> _localizer;

    public AdminController(L4HDbContext context, IStringLocalizer<Shared> localizer)
    {
        _context = context;
        _localizer = localizer;
    }

    /// <summary>
    /// Get all visa types with pricing rules for admin management
    /// </summary>
    /// <returns>Visa types with their pricing rules grouped by country and package</returns>
    [HttpGet("pricing/visa-types")]
    [ProducesResponseType(typeof(AdminVisaTypesResponse[]), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AdminVisaTypesResponse[]>> GetAdminVisaTypes()
    {
        if (!IsAdmin())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Admin.Forbidden"]
            });
        }

        var visaTypes = await _context.VisaTypes
            .Include(vt => vt.PricingRules)
                .ThenInclude(pr => pr.Package)
            .OrderBy(vt => vt.Code)
            .ToListAsync().ConfigureAwait(false);

        var response = visaTypes.Select(vt => new AdminVisaTypesResponse
        {
            Id = vt.Id,
            Code = vt.Code,
            Name = vt.Name,
            IsActive = vt.IsActive,
            CreatedAt = vt.CreatedAt,
            UpdatedAt = vt.UpdatedAt,
            PricingRules = vt.PricingRules
                .GroupBy(pr => pr.CountryCode)
                .OrderBy(g => g.Key)
                .Select(countryGroup => new AdminPricingRuleGroup
                {
                    CountryCode = countryGroup.Key,
                    Rules = countryGroup
                        .OrderBy(pr => pr.Package?.SortOrder ?? int.MaxValue)
                        .Select(pr => new AdminPricingRuleResponse
                        {
                            Id = pr.Id,
                            PackageId = pr.PackageId,
                            PackageCode = pr.Package?.Code ?? string.Empty,
                            PackageDisplayName = pr.Package?.DisplayName ?? string.Empty,
                            BasePrice = pr.BasePrice,
                            Currency = pr.Currency,
                            TaxRate = pr.TaxRate,
                            FxSurchargeMode = pr.FxSurchargeMode,
                            IsActive = pr.IsActive,
                            CreatedAt = pr.CreatedAt,
                            UpdatedAt = pr.UpdatedAt
                        }).ToArray()
                }).ToArray()
        }).ToArray();

        // Audit log
        await LogAuditAsync("admin", "pricing_view", "VisaType", "multiple", 
            new { visaTypeCount = visaTypes.Count }).ConfigureAwait(false);

        return Ok(response);
    }

    /// <summary>
    /// Update visa type and its pricing rules
    /// </summary>
    /// <param name="id">Visa type ID</param>
    /// <param name="request">Update request</param>
    /// <returns>Success message</returns>
    [HttpPatch("pricing/visa-types/{id}")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<MessageResponse>> UpdateVisaTypePricing(
        int id, 
        [FromBody] UpdateVisaTypePricingRequest request)
    {
        if (!IsAdmin())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Admin.Forbidden"]
            });
        }

        var visaType = await _context.VisaTypes
            .Include(vt => vt.PricingRules)
            .FirstOrDefaultAsync(vt => vt.Id == id).ConfigureAwait(false);

        if (visaType == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Visa Type Not Found",
                Detail = _localizer["Admin.VisaTypeNotFound"]
            });
        }

        var changes = new List<object>();

        // Update visa type IsActive if provided
        if (request.IsActive.HasValue && visaType.IsActive != request.IsActive.Value)
        {
            var oldValue = visaType.IsActive;
            visaType.IsActive = request.IsActive.Value;
            visaType.UpdatedAt = DateTime.UtcNow;
            changes.Add(new { field = "IsActive", oldValue, newValue = request.IsActive.Value });
        }

        // Update pricing rules if provided
        if (request.PricingRuleUpdates != null)
        {
            foreach (var ruleUpdate in request.PricingRuleUpdates)
            {
                var pricingRule = visaType.PricingRules
                    .FirstOrDefault(pr => pr.Id == ruleUpdate.Id);

                if (pricingRule == null) continue;

                var ruleChanges = new List<object>();

                if (ruleUpdate.BasePrice.HasValue && pricingRule.BasePrice != ruleUpdate.BasePrice.Value)
                {
                    ruleChanges.Add(new { field = "BasePrice", oldValue = pricingRule.BasePrice, newValue = ruleUpdate.BasePrice.Value });
                    pricingRule.BasePrice = ruleUpdate.BasePrice.Value;
                    pricingRule.UpdatedAt = DateTime.UtcNow;
                }

                if (ruleUpdate.TaxRate.HasValue && pricingRule.TaxRate != ruleUpdate.TaxRate.Value)
                {
                    ruleChanges.Add(new { field = "TaxRate", oldValue = pricingRule.TaxRate, newValue = ruleUpdate.TaxRate.Value });
                    pricingRule.TaxRate = ruleUpdate.TaxRate.Value;
                    pricingRule.UpdatedAt = DateTime.UtcNow;
                }

                if (ruleUpdate.IsActive.HasValue && pricingRule.IsActive != ruleUpdate.IsActive.Value)
                {
                    ruleChanges.Add(new { field = "IsActive", oldValue = pricingRule.IsActive, newValue = ruleUpdate.IsActive.Value });
                    pricingRule.IsActive = ruleUpdate.IsActive.Value;
                    pricingRule.UpdatedAt = DateTime.UtcNow;
                }

                if (ruleChanges.Any())
                {
                    changes.Add(new { pricingRuleId = ruleUpdate.Id, changes = ruleChanges });
                }
            }
        }

        if (changes.Any())
        {
            await _context.SaveChangesAsync().ConfigureAwait(false);

            // Audit log
            await LogAuditAsync("admin", "pricing_update", "VisaType", id.ToString(CultureInfo.InvariantCulture), 
                new { changes }).ConfigureAwait(false);
        }

        return Ok(new MessageResponse
        {
            Message = _localizer["Admin.PricingUpdated"]
        });
    }

    /// <summary>
    /// Get all packages for admin management
    /// </summary>
    /// <returns>All packages</returns>
    [HttpGet("pricing/packages")]
    [ProducesResponseType(typeof(AdminPackageResponse[]), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AdminPackageResponse[]>> GetAdminPackages()
    {
        if (!IsAdmin())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Admin.Forbidden"]
            });
        }

        var packages = await _context.Packages
            .OrderBy(p => p.SortOrder)
            .ToListAsync().ConfigureAwait(false);

        var response = packages.Select(p => new AdminPackageResponse
        {
            Id = p.Id,
            Code = p.Code,
            DisplayName = p.DisplayName,
            Description = p.Description,
            SortOrder = p.SortOrder,
            IsActive = p.IsActive,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        }).ToArray();

        // Audit log
        await LogAuditAsync("admin", "packages_view", "Package", "multiple", 
            new { packageCount = packages.Count }).ConfigureAwait(false);

        return Ok(response);
    }

    private bool IsAdmin()
    {
        return User.HasClaim("IsAdmin", "true") || User.IsInRole("Admin");
    }

    private UserId GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdClaim, out var userId))
        {
            return new UserId(userId);
        }
        throw new UnauthorizedAccessException("User ID not found in claims");
    }

    private async Task LogAuditAsync(string category, string action, string targetType, string targetId, object details)
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
        await _context.SaveChangesAsync().ConfigureAwait(false);
    }
}

// DTOs
public class AdminVisaTypesResponse
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public AdminPricingRuleGroup[] PricingRules { get; set; } = Array.Empty<AdminPricingRuleGroup>();
}

public class AdminPricingRuleGroup
{
    public string CountryCode { get; set; } = string.Empty;
    public AdminPricingRuleResponse[] Rules { get; set; } = Array.Empty<AdminPricingRuleResponse>();
}

public class AdminPricingRuleResponse
{
    public int Id { get; set; }
    public int PackageId { get; set; }
    public string PackageCode { get; set; } = string.Empty;
    public string PackageDisplayName { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public string Currency { get; set; } = string.Empty;
    public decimal TaxRate { get; set; }
    public string? FxSurchargeMode { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class AdminPackageResponse
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateVisaTypePricingRequest
{
    public bool? IsActive { get; set; }
    public PricingRuleUpdateRequest[]? PricingRuleUpdates { get; set; }
}

public class PricingRuleUpdateRequest
{
    public int Id { get; set; }
    public decimal? BasePrice { get; set; }
    public decimal? TaxRate { get; set; }
    public bool? IsActive { get; set; }
}