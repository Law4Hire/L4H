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
[Route("v1/pricing")]
[Tags("Pricing")]
public class PricingController : ControllerBase
{
    private readonly L4HDbContext _context;
    private readonly IStringLocalizer<Shared> _localizer;

    public PricingController(L4HDbContext context, IStringLocalizer<Shared> localizer)
    {
        _context = context;
        _localizer = localizer;
    }

    /// <summary>
    /// Get available packages and pricing for a visa type and country
    /// </summary>
    /// <param name="visaType">Visa type code (e.g., H1B, B2)</param>
    /// <param name="country">Country code (ISO-2, e.g., US, IN)</param>
    /// <returns>Available packages with pricing</returns>
    [HttpGet]
    [ProducesResponseType(typeof(PricingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PricingResponse>> GetPricing(
        [FromQuery] string visaType, 
        [FromQuery] string country)
    {
        if (string.IsNullOrEmpty(country))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Missing Country",
                Detail = _localizer["Pricing.MissingCountry"]
            });
        }

        // Find the visa type
        var visaTypeEntity = await _context.VisaTypes
            .FirstOrDefaultAsync(v => v.Code == visaType && v.IsActive).ConfigureAwait(false);

        if (visaTypeEntity == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Visa Type Not Found",
                Detail = _localizer["Pricing.MissingVisaType"]
            });
        }

        // Get all active pricing rules for this visa type and country
        var pricingRules = await _context.PricingRules
            .Include(pr => pr.Package)
            .Where(pr => pr.VisaTypeId == visaTypeEntity.Id 
                        && pr.CountryCode.ToUpper(CultureInfo.InvariantCulture) == country.ToUpper(CultureInfo.InvariantCulture)
                        && pr.IsActive 
                        && pr.Package.IsActive)
            .OrderBy(pr => pr.Package.SortOrder)
            .ToListAsync().ConfigureAwait(false);

        if (!pricingRules.Any())
        {
            return NotFound(new ProblemDetails
            {
                Title = "No Pricing Available",
                Detail = _localizer["Pricing.NoActiveRule"]
            });
        }

        var packages = pricingRules.Select(pr => new PricingPackageResponse
        {
            PackageCode = pr.Package.Code,
            DisplayName = pr.Package.DisplayName,
            Description = pr.Package.Description,
            BasePrice = pr.BasePrice,
            TaxRate = pr.TaxRate,
            Currency = pr.Currency,
            FxSurchargeMode = pr.FxSurchargeMode,
            Total = CalculateTotal(pr.BasePrice, pr.TaxRate, pr.FxSurchargeMode),
            SortOrder = pr.Package.SortOrder
        }).ToArray();

        var response = new PricingResponse
        {
            VisaType = visaType,
            Country = country,
            Packages = packages
        };

        return Ok(response);
    }

    /// <summary>
    /// Select a package for a case and create a price snapshot
    /// </summary>
    /// <param name="id">Case ID</param>
    /// <param name="request">Package selection request</param>
    /// <returns>Price snapshot</returns>
    [HttpPost("/v1/cases/{id}/package")]
    [Authorize]
    [ProducesResponseType(typeof(PriceSnapshotResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PriceSnapshotResponse>> SelectPackage(
        Guid id, 
        [FromBody] SelectPackageRequest request)
    {
        var caseId = new CaseId(id);
        var userId = GetCurrentUserId();

        // Find the case
        var caseEntity = await _context.Cases
            .FirstOrDefaultAsync(c => c.Id == caseId).ConfigureAwait(false);

        if (caseEntity == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Case Not Found",
                Detail = _localizer["Cases.NotFound"]
            });
        }

        // Check access: owner or admin
        if (caseEntity.UserId != userId && !IsAdmin())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["Cases.Forbidden"]
            });
        }

        // Find visa type and package
        var visaType = await _context.VisaTypes
            .FirstOrDefaultAsync(v => v.Code == request.VisaType && v.IsActive).ConfigureAwait(false);
        
        var package = await _context.Packages
            .FirstOrDefaultAsync(p => p.Code == request.PackageCode && p.IsActive).ConfigureAwait(false);

        if (visaType == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Visa Type Not Found",
                Detail = _localizer["Pricing.MissingVisaType"]
            });
        }

        if (package == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Package Not Found",
                Detail = "Package not found or not active."
            });
        }

        // Find pricing rule
        var pricingRule = await _context.PricingRules
            .FirstOrDefaultAsync(pr => pr.VisaTypeId == visaType.Id
                                      && pr.PackageId == package.Id
                                      && pr.CountryCode.ToUpper(CultureInfo.InvariantCulture) == request.Country.ToUpper(CultureInfo.InvariantCulture)
                                      && pr.IsActive).ConfigureAwait(false);

        if (pricingRule == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Pricing Rule Not Found",
                Detail = _localizer["Pricing.NoActiveRule"]
            });
        }

        // Calculate total
        var total = CalculateTotal(pricingRule.BasePrice, pricingRule.TaxRate, pricingRule.FxSurchargeMode);

        // Create breakdown
        var breakdown = new
        {
            basePrice = pricingRule.BasePrice,
            taxRate = pricingRule.TaxRate,
            tax = pricingRule.BasePrice * pricingRule.TaxRate,
            fxSurchargeMode = pricingRule.FxSurchargeMode,
            total = total
        };

        // Update case
        caseEntity.VisaTypeId = visaType.Id;
        caseEntity.PackageId = package.Id;
        caseEntity.LastActivityAt = DateTimeOffset.UtcNow;

        // Create price snapshot
        var snapshot = new CasePriceSnapshot
        {
            CaseId = caseId,
            VisaTypeCode = visaType.Code,
            PackageCode = package.Code,
            CountryCode = request.Country.ToUpper(CultureInfo.InvariantCulture),
            BreakdownJson = JsonSerializer.Serialize(breakdown),
            Total = total,
            Currency = pricingRule.Currency,
            CreatedAt = DateTime.UtcNow
        };

        _context.CasePriceSnapshots.Add(snapshot);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Audit log
        await LogAuditAsync("pricing", "package_selected", "Case", id.ToString(),
            new { visaType = request.VisaType, packageCode = request.PackageCode, country = request.Country, total }).ConfigureAwait(false);

        var response = new PriceSnapshotResponse
        {
            Id = snapshot.Id,
            VisaTypeCode = snapshot.VisaTypeCode,
            PackageCode = snapshot.PackageCode,
            CountryCode = snapshot.CountryCode,
            Total = snapshot.Total,
            Currency = snapshot.Currency,
            CreatedAt = snapshot.CreatedAt
        };

        return Ok(response);
    }

    private static decimal CalculateTotal(decimal basePrice, decimal taxRate, string? fxSurchargeMode)
    {
        var tax = basePrice * taxRate;
        var subtotal = basePrice + tax;

        // Simple FX logic for now - could be enhanced later
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
        if (Guid.TryParse(userIdClaim, out var userId))
        {
            return new UserId(userId);
        }
        throw new UnauthorizedAccessException("User ID not found in claims");
    }

    private bool IsAdmin()
    {
        return User.HasClaim("IsAdmin", "true") || User.IsInRole("Admin");
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
public class PricingResponse
{
    public string VisaType { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public PricingPackageResponse[] Packages { get; set; } = Array.Empty<PricingPackageResponse>();
}

public class PricingPackageResponse
{
    public string PackageCode { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public decimal TaxRate { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string? FxSurchargeMode { get; set; }
    public decimal Total { get; set; }
    public int SortOrder { get; set; }
}

public class SelectPackageRequest
{
    public string VisaType { get; set; } = string.Empty;
    public string PackageCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
}