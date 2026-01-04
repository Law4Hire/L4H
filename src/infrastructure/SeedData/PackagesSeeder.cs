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
                Code = "H1B_BASIC",
                DisplayName = "H-1B Basic Package",
                Description = "Essential H-1B visa services for skilled workers",
                SortOrder = 1,
                IsActive = true
            },
            new()
            {
                Code = "H1B_PREMIUM",
                DisplayName = "H-1B Premium Package",
                Description = "Comprehensive H-1B services with priority processing",
                SortOrder = 2,
                IsActive = true
            },
            new()
            {
                Code = "EB2_STANDARD",
                DisplayName = "EB-2 Green Card Package",
                Description = "Complete EB-2 permanent residence application",
                SortOrder = 3,
                IsActive = true
            },
            new()
            {
                Code = "O1_ARTIST",
                DisplayName = "O-1 Extraordinary Ability",
                Description = "O-1 visa for individuals with extraordinary abilities",
                SortOrder = 4,
                IsActive = true
            },
            new()
            {
                Code = "L1_TRANSFER",
                DisplayName = "L-1 Intracompany Transfer",
                Description = "For executives and specialized knowledge employees transferring to the US",
                SortOrder = 5,
                IsActive = true
            },
            new()
            {
                Code = "MARRIAGE_GC",
                DisplayName = "Marriage Green Card",
                Description = "Spousal sponsorship for permanent residence",
                SortOrder = 6,
                IsActive = true
            }
        };

        foreach (var pkg in packages)
        {
            if (!await _context.Packages.AnyAsync(p => p.Code == pkg.Code).ConfigureAwait(false))
            {
                await _context.Packages.AddAsync(pkg).ConfigureAwait(false);
            }
        }
        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Pricing Rules
        // We need VisaTypes
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

        AddRule("H1B_BASIC", "H-1B", 2500m);
        AddRule("H1B_PREMIUM", "H-1B", 3500m);
        AddRule("EB2_STANDARD", "H-1B", 5000m); // Fallback mapping if EB-2 missing
        AddRule("O1_ARTIST", "O-1", 4000m);
        AddRule("L1_TRANSFER", "L-1", 4500m);
        AddRule("MARRIAGE_GC", "B-2", 3000m); // Mapping to B-2 as placeholder if needed

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
