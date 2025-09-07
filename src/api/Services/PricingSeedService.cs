using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;

namespace L4H.Api.Services;

public interface IPricingSeedService
{
    Task SeedPricingDataAsync();
}

public class PricingSeedService : IPricingSeedService
{
    private readonly L4HDbContext _context;
    private readonly ILogger<PricingSeedService> _logger;

    public PricingSeedService(L4HDbContext context, ILogger<PricingSeedService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedPricingDataAsync()
    {
        try
        {
            // Check if data already exists - verify 3 different types of data for safety
            var hasVisaTypes = await _context.VisaTypes.AnyAsync().ConfigureAwait(false);
            var hasPackages = await _context.Packages.AnyAsync().ConfigureAwait(false);
            var hasPricingRules = await _context.PricingRules.AnyAsync().ConfigureAwait(false);
            
            if (hasVisaTypes && hasPackages && hasPricingRules)
            {
                _logger.LogInformation("Pricing seed data already exists (VisaTypes: {HasVisaTypes}, Packages: {HasPackages}, PricingRules: {HasPricingRules}), skipping seed", 
                    hasVisaTypes, hasPackages, hasPricingRules);
                return;
            }

            _logger.LogInformation("Starting pricing data seed (VisaTypes: {HasVisaTypes}, Packages: {HasPackages}, PricingRules: {HasPricingRules})...", 
                hasVisaTypes, hasPackages, hasPricingRules);

            await SeedVisaTypesAsync().ConfigureAwait(false);
            await SeedPackagesAsync().ConfigureAwait(false);
            await SeedPricingRulesAsync().ConfigureAwait(false);

            await _context.SaveChangesAsync().ConfigureAwait(false);
            _logger.LogInformation("Pricing data seed completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding pricing data");
            throw;
        }
    }

    private async Task SeedVisaTypesAsync()
    {
        var visaTypes = new[]
        {
            new VisaType { Code = "H1B", Name = "H-1B Specialty Occupation", IsActive = true },
            new VisaType { Code = "L1A", Name = "L-1A Intracompany Transferee Executive", IsActive = true },
            new VisaType { Code = "L1B", Name = "L-1B Intracompany Transferee Specialized Knowledge", IsActive = true },
            new VisaType { Code = "O1", Name = "O-1 Extraordinary Ability", IsActive = true },
            new VisaType { Code = "EB1A", Name = "EB-1A Extraordinary Ability (Green Card)", IsActive = true },
            new VisaType { Code = "EB1B", Name = "EB-1B Outstanding Researcher (Green Card)", IsActive = true },
            new VisaType { Code = "EB2", Name = "EB-2 Advanced Degree Professional (Green Card)", IsActive = true },
            new VisaType { Code = "B2", Name = "B-2 Tourist Visa", IsActive = true },
            new VisaType { Code = "F1", Name = "F-1 Student Visa", IsActive = true },
            new VisaType { Code = "TN", Name = "TN NAFTA Professional", IsActive = true }
        };

        _context.VisaTypes.AddRange(visaTypes);
        await _context.SaveChangesAsync().ConfigureAwait(false); // Save to get IDs
    }

    private async Task SeedPackagesAsync()
    {
        var packages = new[]
        {
            new Package 
            { 
                Code = "BASIC", 
                DisplayName = "Basic Service", 
                Description = "Essential document preparation and filing support", 
                SortOrder = 1, 
                IsActive = true 
            },
            new Package 
            { 
                Code = "STANDARD", 
                DisplayName = "Standard Service", 
                Description = "Complete case management with attorney consultation", 
                SortOrder = 2, 
                IsActive = true 
            },
            new Package 
            { 
                Code = "PREMIUM", 
                DisplayName = "Premium Service", 
                Description = "Full-service representation with priority support", 
                SortOrder = 3, 
                IsActive = true 
            },
            new Package 
            { 
                Code = "CONSULTATION", 
                DisplayName = "Initial Consultation", 
                Description = "One-hour consultation with immigration attorney", 
                SortOrder = 0, 
                IsActive = true 
            }
        };

        _context.Packages.AddRange(packages);
        await _context.SaveChangesAsync().ConfigureAwait(false); // Save to get IDs
    }

    private async Task SeedPricingRulesAsync()
    {
        // Get visa types and packages
        var visaTypes = await _context.VisaTypes.ToListAsync().ConfigureAwait(false);
        var packages = await _context.Packages.ToListAsync().ConfigureAwait(false);

        var countries = new[] { "US", "CA", "IN", "CN", "GB", "DE", "AU", "MX" };
        var pricingRules = new List<PricingRule>();

        foreach (var visaType in visaTypes)
        {
            foreach (var country in countries)
            {
                // Consultation package - same price for all visa types
                var consultationPackage = packages.First(p => p.Code == "CONSULTATION");
                pricingRules.Add(new PricingRule
                {
                    VisaTypeId = visaType.Id,
                    PackageId = consultationPackage.Id,
                    CountryCode = country,
                    BasePrice = 150.00m,
                    Currency = "USD",
                    TaxRate = GetTaxRateForCountry(country),
                    FxSurchargeMode = GetFxSurchargeMode(country),
                    IsActive = true
                });

                // Basic package - varies by visa complexity
                var basicPackage = packages.First(p => p.Code == "BASIC");
                pricingRules.Add(new PricingRule
                {
                    VisaTypeId = visaType.Id,
                    PackageId = basicPackage.Id,
                    CountryCode = country,
                    BasePrice = GetBasicPriceForVisaType(visaType.Code),
                    Currency = "USD",
                    TaxRate = GetTaxRateForCountry(country),
                    FxSurchargeMode = GetFxSurchargeMode(country),
                    IsActive = true
                });

                // Standard package - 1.5x basic price
                var standardPackage = packages.First(p => p.Code == "STANDARD");
                pricingRules.Add(new PricingRule
                {
                    VisaTypeId = visaType.Id,
                    PackageId = standardPackage.Id,
                    CountryCode = country,
                    BasePrice = Math.Round(GetBasicPriceForVisaType(visaType.Code) * 1.5m, 2),
                    Currency = "USD",
                    TaxRate = GetTaxRateForCountry(country),
                    FxSurchargeMode = GetFxSurchargeMode(country),
                    IsActive = true
                });

                // Premium package - 2.2x basic price
                var premiumPackage = packages.First(p => p.Code == "PREMIUM");
                pricingRules.Add(new PricingRule
                {
                    VisaTypeId = visaType.Id,
                    PackageId = premiumPackage.Id,
                    CountryCode = country,
                    BasePrice = Math.Round(GetBasicPriceForVisaType(visaType.Code) * 2.2m, 2),
                    Currency = "USD",
                    TaxRate = GetTaxRateForCountry(country),
                    FxSurchargeMode = GetFxSurchargeMode(country),
                    IsActive = true
                });
            }
        }

        _context.PricingRules.AddRange(pricingRules);
    }

    private static decimal GetBasicPriceForVisaType(string visaTypeCode)
    {
        return visaTypeCode switch
        {
            "B2" => 500.00m,           // Tourist visa - simplest
            "F1" => 750.00m,           // Student visa
            "TN" => 800.00m,           // NAFTA professional
            "H1B" => 1200.00m,         // H-1B - common but complex
            "L1A" => 1500.00m,         // L-1A executive
            "L1B" => 1400.00m,         // L-1B specialized knowledge
            "O1" => 2000.00m,          // O-1 extraordinary ability
            "EB1A" => 2500.00m,        // Green card - extraordinary ability
            "EB1B" => 2300.00m,        // Green card - outstanding researcher
            "EB2" => 2000.00m,         // Green card - advanced degree
            _ => 1000.00m              // Default price
        };
    }

    private static decimal GetTaxRateForCountry(string countryCode)
    {
        return countryCode switch
        {
            "US" => 0.08m,      // 8% average US sales tax
            "CA" => 0.12m,      // 12% HST/GST
            "GB" => 0.20m,      // 20% VAT
            "DE" => 0.19m,      // 19% VAT
            "AU" => 0.10m,      // 10% GST
            "IN" => 0.18m,      // 18% GST
            "CN" => 0.13m,      // 13% VAT
            "MX" => 0.16m,      // 16% IVA
            _ => 0.10m          // Default 10%
        };
    }

    private static string? GetFxSurchargeMode(string countryCode)
    {
        return countryCode switch
        {
            "US" => null,           // No FX surcharge for USD base
            "CA" => null,           // Close neighbor, no surcharge
            "MX" => null,           // NAFTA partner, no surcharge
            "GB" => "medium",       // Stable currency, medium surcharge
            "DE" => "medium",       // Euro, medium surcharge
            "AU" => "medium",       // Stable currency, medium surcharge
            "IN" => "high",         // Volatile currency, high surcharge
            "CN" => "high",         // Exchange controls, high surcharge
            _ => "medium"           // Default medium surcharge
        };
    }
}