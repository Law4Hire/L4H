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
        [FromQuery] string? visaType,
        [FromQuery] string? country)
    {
        // If no parameters provided, return default packages for general display
        if (string.IsNullOrEmpty(visaType) && string.IsNullOrEmpty(country))
        {
            return await GetDefaultPricing().ConfigureAwait(false);
        }

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
                        && EF.Functions.Collate(pr.CountryCode, "SQL_Latin1_General_CP1_CI_AS") == EF.Functions.Collate(country, "SQL_Latin1_General_CP1_CI_AS")
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
            Id = pr.Package.Code, // Use code as ID for frontend compatibility
            PackageCode = pr.Package.Code,
            Name = pr.Package.DisplayName,
            DisplayName = pr.Package.DisplayName,
            Description = pr.Package.Description,
            Price = CalculateTotal(pr.BasePrice, pr.TaxRate, pr.FxSurchargeMode),
            BasePrice = pr.BasePrice,
            TaxRate = pr.TaxRate,
            Currency = pr.Currency,
            FxSurchargeMode = pr.FxSurchargeMode,
            Total = CalculateTotal(pr.BasePrice, pr.TaxRate, pr.FxSurchargeMode),
            SortOrder = pr.Package.SortOrder,
            Features = GetPackageFeatures(pr.Package.Code)
        }).ToArray();

        var response = new PricingResponse
        {
            VisaType = visaType ?? string.Empty,
            Country = country ?? string.Empty,
            Packages = packages
        };

        return Ok(response);
    }

    private Task<ActionResult<PricingResponse>> GetDefaultPricing()
    {
        // Return sample packages for general display when no specific visa type is selected
        var packages = new List<PricingPackageResponse>
        {
            new()
            {
                Id = "H1B_BASIC",
                PackageCode = "H1B_BASIC",
                Name = "H-1B Basic Package",
                DisplayName = "H-1B Basic Package",
                Description = "Essential H-1B visa services for skilled workers",
                Price = 2500.00m,
                BasePrice = 2500.00m,
                TaxRate = 0.0m,
                Currency = "USD",
                Total = 2500.00m,
                SortOrder = 1,
                Features = GetPackageFeatures("H1B_BASIC")
            },
            new()
            {
                Id = "H1B_PREMIUM",
                PackageCode = "H1B_PREMIUM",
                Name = "H-1B Premium Package",
                DisplayName = "H-1B Premium Package",
                Description = "Comprehensive H-1B services with priority processing",
                Price = 3500.00m,
                BasePrice = 3500.00m,
                TaxRate = 0.0m,
                Currency = "USD",
                Total = 3500.00m,
                SortOrder = 2,
                Features = GetPackageFeatures("H1B_PREMIUM")
            },
            new()
            {
                Id = "EB2_STANDARD",
                PackageCode = "EB2_STANDARD",
                Name = "EB-2 Green Card Package",
                DisplayName = "EB-2 Green Card Package",
                Description = "Complete EB-2 permanent residence application",
                Price = 5000.00m,
                BasePrice = 5000.00m,
                TaxRate = 0.0m,
                Currency = "USD",
                Total = 5000.00m,
                SortOrder = 3,
                Features = GetPackageFeatures("EB2_STANDARD")
            },
            new()
            {
                Id = "O1_ARTIST",
                PackageCode = "O1_ARTIST",
                Name = "O-1 Extraordinary Ability",
                DisplayName = "O-1 Extraordinary Ability",
                Description = "O-1 visa for individuals with extraordinary abilities",
                Price = 4000.00m,
                BasePrice = 4000.00m,
                TaxRate = 0.0m,
                Currency = "USD",
                Total = 4000.00m,
                SortOrder = 4,
                Features = GetPackageFeatures("O1_ARTIST")
            }
        };

        var response = new PricingResponse
        {
            VisaType = "GENERAL",
            Country = "US",
            Packages = packages.ToArray()
        };

        return Task.FromResult<ActionResult<PricingResponse>>(Ok(response));
    }

    private static string[] GetPackageFeatures(string packageCode)
    {
        return packageCode switch
        {
            "H1B_BASIC" => new[]
            {
                "Form preparation and filing",
                "Initial consultation",
                "Basic document review",
                "Email support"
            },
            "H1B_PREMIUM" => new[]
            {
                "Form preparation and filing",
                "Initial consultation",
                "Comprehensive document review",
                "Priority email and phone support",
                "Status tracking",
                "Amendment filing included"
            },
            "EB2_STANDARD" => new[]
            {
                "Complete I-140 preparation",
                "PERM labor certification",
                "Priority date monitoring",
                "Adjustment of status filing",
                "Family member applications"
            },
            "O1_ARTIST" => new[]
            {
                "Extraordinary ability documentation",
                "Expert consultation letters",
                "Portfolio preparation",
                "Form preparation and filing",
                "Premium processing option"
            },
            _ => new[]
            {
                "Professional consultation",
                "Document preparation",
                "Form filing",
                "Email support"
            }
        };
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
                                      && EF.Functions.Collate(pr.CountryCode, "SQL_Latin1_General_CP1_CI_AS") == EF.Functions.Collate(request.Country, "SQL_Latin1_General_CP1_CI_AS")
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
        var userIdClaim = User.FindFirst("sub")?.Value;
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
    public string Id { get; set; } = string.Empty; // Frontend compatibility
    public string PackageCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty; // Frontend compatibility
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; } // Frontend compatibility
    public decimal BasePrice { get; set; }
    public decimal TaxRate { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string? FxSurchargeMode { get; set; }
    public decimal Total { get; set; }
    public int SortOrder { get; set; }
    public string[] Features { get; set; } = Array.Empty<string>(); // Frontend compatibility
}

public class SelectPackageRequest
{
    public string VisaType { get; set; } = string.Empty;
    public string PackageCode { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
}