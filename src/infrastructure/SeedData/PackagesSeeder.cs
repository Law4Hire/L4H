using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;

namespace L4H.Infrastructure.SeedData;

public class PackagesSeeder : ISeedTask
{
    private readonly L4HDbContext _context;
    private readonly ILogger<PackagesSeeder> _logger;

    public string Name => "Packages and Pricing";

    public PackagesSeeder(L4HDbContext context, ILogger<PackagesSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        // Check if packages already exist
        if (await _context.Packages.AnyAsync().ConfigureAwait(false))
        {
            _logger.LogInformation("[SEED] Packages already exist, checking for missing ones...");
        }

        var packages = new List<Package>
        {
            new()
            {
                Code = "CONSULT",
                DisplayName = "Initial Consultation",
                Description = "One-hour strategy session with a legal professional",
                SortOrder = 1,
                IsActive = true
            },
            new()
            {
                Code = "BASIC",
                DisplayName = "Basic Filing",
                Description = "Essential form preparation and document review",
                SortOrder = 2,
                IsActive = true
            },
            new()
            {
                Code = "PREMIUM",
                DisplayName = "Premium Service",
                Description = "Full-service representation with priority support",
                SortOrder = 3,
                IsActive = true
            },
            new()
            {
                Code = "PKG_DEAL",
                DisplayName = "Package Deal",
                Description = "Bundle multiple services for a discounted flat rate",
                SortOrder = 4,
                IsActive = true
            },
            new()
            {
                Code = "H1B_BASIC",
                DisplayName = "H-1B Basic Package",
                Description = "Essential H-1B visa services for skilled workers",
                SortOrder = 10,
                IsActive = true
            },
            new()
            {
                Code = "EB2_NIW",
                DisplayName = "EB-2 NIW Package",
                Description = "National Interest Waiver petition and green card application",
                SortOrder = 11,
                IsActive = true
            }
        };

        foreach (var pkg in packages)
        {
            var existing = await _context.Packages.FirstOrDefaultAsync(p => p.Code == pkg.Code).ConfigureAwait(false);
            if (existing == null)
            {
                await _context.Packages.AddAsync(pkg).ConfigureAwait(false);
            }
            else 
            {
                existing.DisplayName = pkg.DisplayName;
                existing.Description = pkg.Description;
                existing.SortOrder = pkg.SortOrder;
            }
        }
        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Pricing Rules - Clear logical defaults
        var visaTypes = await _context.VisaTypes.ToListAsync().ConfigureAwait(false);
        var dbPackages = await _context.Packages.ToListAsync().ConfigureAwait(false);

        if (!visaTypes.Any())
        {
            _logger.LogWarning("[SEED] No VisaTypes found, skipping pricing rules");
            return;
        }

        var pricingRules = new List<PricingRule>();

        void AddRule(string packageCode, string visaCode, decimal price)
        {
            var pkg = dbPackages.FirstOrDefault(p => p.Code == packageCode);
            var visa = visaTypes.FirstOrDefault(v => v.Code == visaCode);
            
            if (pkg != null && visa != null)
            {
                pricingRules.Add(new PricingRule
                {
                    PackageId = pkg.Id,
                    VisaTypeId = visa.Id,
                    CountryCode = "US",
                    Currency = "USD",
                    BasePrice = price,
                    TaxRate = 0,
                    IsActive = true
                });
            }
        }

        // Logical Defaults
        AddRule("CONSULT", "B-1", 150m);
        AddRule("CONSULT", "B-2", 150m);
        AddRule("CONSULT", "H-1B", 250m);
        AddRule("BASIC", "B-1", 1200m);
        AddRule("BASIC", "H-1B", 2500m);
        AddRule("PREMIUM", "H-1B", 4500m);
        AddRule("PKG_DEAL", "H-1B", 6000m);
        AddRule("CONSULT", "NATZ", 200m);
        AddRule("CONSULT", "ADOP", 300m);
        AddRule("CONSULT", "IR-4", 250m);

        foreach (var rule in pricingRules)
        {
            if (!await _context.PricingRules.AnyAsync(r => r.PackageId == rule.PackageId && r.VisaTypeId == rule.VisaTypeId && r.CountryCode == rule.CountryCode).ConfigureAwait(false))
            {
                await _context.PricingRules.AddAsync(rule).ConfigureAwait(false);
            }
        }
        await _context.SaveChangesAsync().ConfigureAwait(false);
        
        _logger.LogInformation("[SEED] Packages and Pricing Rules seeded");
    }
}
