using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using System.Security.Claims;
using System.Text.Json;
using System.Globalization;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/pricing")]
[Tags("Pricing")]
public class PricingController : ControllerBase
{
    private readonly L4HDbContext _context;
    private readonly ILogger<PricingController> _logger;

    public PricingController(L4HDbContext context, ILogger<PricingController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get available packages and pricing for one or more visa types
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PricingResponse>> GetPricing(
        [FromQuery] string[]? visaType,
        [FromQuery] string? country)
    {
        _logger.LogInformation("GetPricing called for Visas: {VisaTypes}, Country: {Country}", 
            visaType != null ? string.Join(", ", visaType) : "null", country);

        // If no parameters provided, return all active packages for US
        if ((visaType == null || visaType.Length == 0) && string.IsNullOrEmpty(country))
        {
            var allRules = await _context.PricingRules
                .Include(pr => pr.Package)
                .Where(pr => pr.IsActive && pr.Package.IsActive && pr.CountryCode == "US")
                .OrderBy(pr => pr.Package.SortOrder)
                .ToListAsync().ConfigureAwait(false);

            if (allRules.Any())
            {
                // Group by package to handle duplicates if any
                var pkgList = allRules.GroupBy(r => r.Package.Code)
                    .Select(g => {
                        var first = g.First();
                        var prices = g.Select(r => CalculateTotal(r.BasePrice, r.TaxRate, r.FxSurchargeMode)).ToList();
                        return new PricingPackageResponse
                        {
                            Id = first.Package.Code,
                            PackageCode = first.Package.Code,
                            Name = first.Package.DisplayName,
                            DisplayName = first.Package.DisplayName,
                            Description = first.Package.Description,
                            Price = prices.Min(),
                            MaxPrice = prices.Max() > prices.Min() ? prices.Max() : null,
                            BasePrice = first.BasePrice,
                            TaxRate = first.TaxRate,
                            Currency = first.Currency,
                            FxSurchargeMode = first.FxSurchargeMode,
                            Total = prices.Min(),
                            SortOrder = first.Package.SortOrder,
                            Features = GetPackageFeatures(first.Package.Code)
                        };
                    })
                    .OrderBy(p => p.SortOrder)
                    .ToArray();

                return Ok(new PricingResponse { VisaType = "GENERAL", Country = "US", Packages = pkgList });
            }

            return await GetDefaultPricing().ConfigureAwait(false);
        }

        var countryCode = country ?? "US";

        // Find all matching visa type entities
        var visaTypeEntities = await _context.VisaTypes
            .Where(v => visaType.Contains(v.Code) && v.IsActive)
            .ToListAsync().ConfigureAwait(false);

        if (!visaTypeEntities.Any())
        {
            return await GetDefaultPricing().ConfigureAwait(false);
        }

        var visaTypeIds = visaTypeEntities.Select(v => v.Id).ToList();

        // Get all active pricing rules for these visa types
        var pricingRules = await _context.PricingRules
            .Include(pr => pr.Package)
            .Where(pr => visaTypeIds.Contains(pr.VisaTypeId)
                        && pr.CountryCode == countryCode
                        && pr.IsActive
                        && pr.Package.IsActive)
            .ToListAsync().ConfigureAwait(false);

        if (!pricingRules.Any())
        {
            return await GetDefaultPricing().ConfigureAwait(false);
        }

        // Group by Package to handle multiple visa types per package
        var packages = pricingRules.GroupBy(pr => pr.Package.Code)
            .Select(group => {
                var first = group.First();
                var prices = group.Select(r => CalculateTotal(r.BasePrice, r.TaxRate, r.FxSurchargeMode)).ToList();
                var minPrice = prices.Min();
                var maxPrice = prices.Max();

                return new PricingPackageResponse
                {
                    Id = first.Package.Code,
                    PackageCode = first.Package.Code,
                    Name = first.Package.DisplayName,
                    DisplayName = first.Package.DisplayName,
                    Description = first.Package.Description,
                    Price = minPrice,
                    MaxPrice = maxPrice > minPrice ? maxPrice : null,
                    BasePrice = first.BasePrice,
                    TaxRate = first.TaxRate,
                    Currency = first.Currency,
                    FxSurchargeMode = first.FxSurchargeMode,
                    Total = minPrice,
                    SortOrder = first.Package.SortOrder,
                    Features = GetPackageFeatures(first.Package.Code)
                };
            })
            .OrderBy(p => p.SortOrder)
            .ToArray();

        var response = new PricingResponse
        {
            VisaType = string.Join(", ", visaTypeEntities.Select(v => v.Code)),
            Country = countryCode,
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
    [HttpPost("/api/v1/cases/{id}/package")]
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
                Detail = "Case not found."
            });
        }

        // Check access: owner or admin
        if (caseEntity.UserId != userId && !IsAdmin())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = "Access denied."
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
                Detail = "The specified visa type was not found."
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
                Detail = "No active pricing rule found for this combination."
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
    public decimal Price { get; set; } // Frontend compatibility (Min price)
    public decimal? MaxPrice { get; set; }
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
