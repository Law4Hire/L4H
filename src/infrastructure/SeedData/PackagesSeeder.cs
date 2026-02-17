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
        _logger.LogInformation("[SEED] Cleaning up existing packages and pricing rules...");
        
        // Remove all pricing rules first due to FK
        var existingRules = await _context.PricingRules.ToListAsync().ConfigureAwait(false);
        _context.PricingRules.RemoveRange(existingRules);
        
        // Remove all packages
        var existingPackages = await _context.Packages.ToListAsync().ConfigureAwait(false);
        _context.Packages.RemoveRange(existingPackages);
        
        await _context.SaveChangesAsync().ConfigureAwait(false);

        var packages = new List<Package>
        {
            new()
            {
                Code = "CONSULT",
                DisplayName = "Initial Consultation",
                Description = "One-hour strategy session with an attorney to evaluate eligibility and plan your case.",
                SortOrder = 1,
                IsActive = true,
                RequiresLawyer = true
            },
            new()
            {
                Code = "LAWYER_FULL",
                DisplayName = "Full Representation (Lawyer-Led)",
                Description = "The whole thing with a money-back guarantee. Full attorney management, drafting, and filing.",
                SortOrder = 2,
                IsActive = true,
                RequiresLawyer = true
            },
            new()
            {
                Code = "PARALEGAL_ASSIST",
                DisplayName = "Paralegal-Assisted Filing",
                Description = "Preparation by a senior paralegal with attorney oversight. Cost-effective professional assistance.",
                SortOrder = 3,
                IsActive = true,
                RequiresLawyer = false
            },
            new()
            {
                Code = "SELF_REVIEW",
                DisplayName = "Self-Filing with Legal Review",
                Description = "You prepare the forms using our platform, and we perform a final expert legal review before you file.",
                SortOrder = 4,
                IsActive = true,
                RequiresLawyer = false
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
        AddRule("LAWYER_FULL", "B-1", 2500m);
        AddRule("LAWYER_FULL", "H-1B", 4500m);
        AddRule("PARALEGAL_ASSIST", "H-1B", 2500m);
        AddRule("SELF_REVIEW", "H-1B", 1200m);
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
