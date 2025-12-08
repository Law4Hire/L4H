using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;

namespace L4H.Infrastructure.SeedData;

/// <summary>
/// Seeds the database with common USCIS forms and their default pricing
/// </summary>
public class USCISFormsSeeder : ISeedTask
{
    public string Name => "USCIS Forms";

    private readonly L4HDbContext _context;
    private readonly ILogger<USCISFormsSeeder> _logger;

    public USCISFormsSeeder(L4HDbContext context, ILogger<USCISFormsSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        // Check if forms already exist
        var existingCount = await _context.USCISForms.CountAsync().ConfigureAwait(false);
        if (existingCount > 0)
        {
            _logger.LogDebug("USCIS forms already exist in database ({Count} forms), skipping seeding", existingCount);
            return;
        }

        _logger.LogInformation("Seeding USCIS forms...");

        var forms = GetDefaultForms();

        foreach (var formData in forms)
        {
            var form = new USCISFormEntity
            {
                FormNumber = formData.FormNumber,
                FormName = formData.FormName,
                Description = formData.Description,
                FormUrl = formData.FormUrl,
                EstimatedTimeMinutes = formData.EstimatedTimeMinutes,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.USCISForms.Add(form);

            // Add default pricing if provided
            if (formData.DefaultPricing != null)
            {
                var pricing = new FormPricingEntity
                {
                    FormId = form.Id,
                    SelfFilePriceUSD = formData.DefaultPricing.SelfFilePrice,
                    ParalegalPriceUSD = formData.DefaultPricing.ParalegalPrice,
                    LawyerPriceUSD = formData.DefaultPricing.LawyerPrice,
                    LLCFeeUSD = formData.DefaultPricing.LLCFee,
                    Description = "Initial default pricing",
                    IsActive = true,
                    EffectiveDate = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.FormPricing.Add(pricing);
            }
        }

        await _context.SaveChangesAsync().ConfigureAwait(false);

        _logger.LogInformation("Seeded {Count} USCIS forms with default pricing", forms.Count);
    }

    private List<FormSeedData> GetDefaultForms()
    {
        return new List<FormSeedData>
        {
            // I-129: Petition for a Nonimmigrant Worker (H-1B, L-1, O-1, etc.)
            new FormSeedData
            {
                FormNumber = "I-129",
                FormName = "Petition for a Nonimmigrant Worker",
                Description = "Used for H-1B, L-1, O-1, P-1, TN and other nonimmigrant worker visas. Required for most employment-based temporary work visas.",
                FormUrl = "https://www.uscis.gov/i-129",
                EstimatedTimeMinutes = 180,
                DefaultPricing = new PricingSeedData
                {
                    SelfFilePrice = null, // Not available for DIY
                    ParalegalPrice = 1500m,
                    LawyerPrice = 3500m,
                    LLCFee = 300m
                }
            },

            // I-140: Immigrant Petition for Alien Workers (EB-1, EB-2, EB-3)
            new FormSeedData
            {
                FormNumber = "I-140",
                FormName = "Immigrant Petition for Alien Workers",
                Description = "Used for employment-based green card categories EB-1, EB-2, and EB-3. First step in the employment-based permanent residence process.",
                FormUrl = "https://www.uscis.gov/i-140",
                EstimatedTimeMinutes = 240,
                DefaultPricing = new PricingSeedData
                {
                    SelfFilePrice = null, // Complex, not recommended for DIY
                    ParalegalPrice = 2500m,
                    LawyerPrice = 5000m,
                    LLCFee = 500m
                }
            },

            // I-485: Application to Register Permanent Residence or Adjust Status
            new FormSeedData
            {
                FormNumber = "I-485",
                FormName = "Application to Register Permanent Residence or Adjust Status",
                Description = "Final step to obtain a green card for applicants already in the United States. Filed concurrently with or after I-140 approval.",
                FormUrl = "https://www.uscis.gov/i-485",
                EstimatedTimeMinutes = 300,
                DefaultPricing = new PricingSeedData
                {
                    SelfFilePrice = 1200m,
                    ParalegalPrice = 2000m,
                    LawyerPrice = 4000m,
                    LLCFee = 400m
                }
            },

            // I-765: Application for Employment Authorization
            new FormSeedData
            {
                FormNumber = "I-765",
                FormName = "Application for Employment Authorization",
                Description = "Used to request work authorization (EAD) while I-485 is pending or for other eligible immigration categories.",
                FormUrl = "https://www.uscis.gov/i-765",
                EstimatedTimeMinutes = 90,
                DefaultPricing = new PricingSeedData
                {
                    SelfFilePrice = 300m,
                    ParalegalPrice = 500m,
                    LawyerPrice = 800m,
                    LLCFee = 100m
                }
            },

            // I-131: Application for Travel Document
            new FormSeedData
            {
                FormNumber = "I-131",
                FormName = "Application for Travel Document",
                Description = "Used to request Advance Parole to travel while I-485 is pending or to obtain a Re-entry Permit.",
                FormUrl = "https://www.uscis.gov/i-131",
                EstimatedTimeMinutes = 90,
                DefaultPricing = new PricingSeedData
                {
                    SelfFilePrice = 300m,
                    ParalegalPrice = 500m,
                    LawyerPrice = 800m,
                    LLCFee = 100m
                }
            },

            // I-907: Request for Premium Processing Service
            new FormSeedData
            {
                FormNumber = "I-907",
                FormName = "Request for Premium Processing Service",
                Description = "Requests expedited 15-day processing for certain employment-based petitions including I-129 and I-140.",
                FormUrl = "https://www.uscis.gov/i-907",
                EstimatedTimeMinutes = 30,
                DefaultPricing = new PricingSeedData
                {
                    SelfFilePrice = 150m,
                    ParalegalPrice = 250m,
                    LawyerPrice = 500m,
                    LLCFee = 50m
                }
            },

            // I-539: Application to Extend/Change Nonimmigrant Status
            new FormSeedData
            {
                FormNumber = "I-539",
                FormName = "Application to Extend/Change Nonimmigrant Status",
                Description = "Used to extend stay or change to another nonimmigrant status while in the United States.",
                FormUrl = "https://www.uscis.gov/i-539",
                EstimatedTimeMinutes = 120,
                DefaultPricing = new PricingSeedData
                {
                    SelfFilePrice = 500m,
                    ParalegalPrice = 1000m,
                    LawyerPrice = 2000m,
                    LLCFee = 200m
                }
            },

            // I-129S: Nonimmigrant Petition Based on Blanket L Petition
            new FormSeedData
            {
                FormNumber = "I-129S",
                FormName = "Nonimmigrant Petition Based on Blanket L Petition",
                Description = "Used for L-1 visa petitions under an approved blanket L petition for qualifying multinational companies.",
                FormUrl = "https://www.uscis.gov/i-129s",
                EstimatedTimeMinutes = 120,
                DefaultPricing = new PricingSeedData
                {
                    SelfFilePrice = null,
                    ParalegalPrice = 1200m,
                    LawyerPrice = 2500m,
                    LLCFee = 250m
                }
            },

            // I-693: Report of Medical Examination and Vaccination Record
            new FormSeedData
            {
                FormNumber = "I-693",
                FormName = "Report of Medical Examination and Vaccination Record",
                Description = "Medical examination required for adjustment of status applicants. Must be completed by a USCIS-designated civil surgeon.",
                FormUrl = "https://www.uscis.gov/i-693",
                EstimatedTimeMinutes = 60,
                DefaultPricing = new PricingSeedData
                {
                    SelfFilePrice = 200m, // Coordination with civil surgeon
                    ParalegalPrice = 300m,
                    LawyerPrice = 500m,
                    LLCFee = 50m
                }
            },

            // I-864: Affidavit of Support
            new FormSeedData
            {
                FormNumber = "I-864",
                FormName = "Affidavit of Support Under Section 213A of the INA",
                Description = "Required for family-based immigration to show the immigrant will not become a public charge. Sponsor must meet income requirements.",
                FormUrl = "https://www.uscis.gov/i-864",
                EstimatedTimeMinutes = 90,
                DefaultPricing = new PricingSeedData
                {
                    SelfFilePrice = 400m,
                    ParalegalPrice = 600m,
                    LawyerPrice = 1000m,
                    LLCFee = 100m
                }
            },

            // DS-160: Online Nonimmigrant Visa Application
            new FormSeedData
            {
                FormNumber = "DS-160",
                FormName = "Online Nonimmigrant Visa Application",
                Description = "State Department form required for most nonimmigrant visa applicants applying at U.S. consulates abroad.",
                FormUrl = "https://ceac.state.gov/genniv/",
                EstimatedTimeMinutes = 120,
                DefaultPricing = new PricingSeedData
                {
                    SelfFilePrice = 200m,
                    ParalegalPrice = 400m,
                    LawyerPrice = 800m,
                    LLCFee = 100m
                }
            },

            // DS-156E: Treaty Trader/Investor Application (E-2)
            new FormSeedData
            {
                FormNumber = "DS-156E",
                FormName = "Treaty Trader/Investor Application",
                Description = "Additional form required for E-2 treaty investor visa applicants at U.S. consulates.",
                FormUrl = "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/forms/ds-156e.html",
                EstimatedTimeMinutes = 90,
                DefaultPricing = new PricingSeedData
                {
                    SelfFilePrice = null,
                    ParalegalPrice = 1500m,
                    LawyerPrice = 3000m,
                    LLCFee = 300m
                }
            },

            // G-28: Notice of Entry of Appearance as Attorney or Accredited Representative
            new FormSeedData
            {
                FormNumber = "G-28",
                FormName = "Notice of Entry of Appearance as Attorney or Accredited Representative",
                Description = "Form used by attorneys and accredited representatives to enter their appearance in immigration matters.",
                FormUrl = "https://www.uscis.gov/g-28",
                EstimatedTimeMinutes = 15,
                DefaultPricing = new PricingSeedData
                {
                    SelfFilePrice = null, // Not applicable for self-filers
                    ParalegalPrice = null, // Included in service fee
                    LawyerPrice = null, // Included in service fee
                    LLCFee = 0m
                }
            },

            // I-130: Petition for Alien Relative (Family-based)
            new FormSeedData
            {
                FormNumber = "I-130",
                FormName = "Petition for Alien Relative",
                Description = "First step for family-based immigration. U.S. citizen or permanent resident petitions for qualifying family member.",
                FormUrl = "https://www.uscis.gov/i-130",
                EstimatedTimeMinutes = 150,
                DefaultPricing = new PricingSeedData
                {
                    SelfFilePrice = 600m,
                    ParalegalPrice = 1200m,
                    LawyerPrice = 2500m,
                    LLCFee = 250m
                }
            },

            // I-90: Application to Replace Permanent Resident Card
            new FormSeedData
            {
                FormNumber = "I-90",
                FormName = "Application to Replace Permanent Resident Card",
                Description = "Used to renew, replace, or update a green card (Permanent Resident Card).",
                FormUrl = "https://www.uscis.gov/i-90",
                EstimatedTimeMinutes = 60,
                DefaultPricing = new PricingSeedData
                {
                    SelfFilePrice = 300m,
                    ParalegalPrice = 500m,
                    LawyerPrice = 1000m,
                    LLCFee = 100m
                }
            }
        };
    }

    // Helper classes for seeding
    private class FormSeedData
    {
        public string FormNumber { get; set; } = string.Empty;
        public string FormName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? FormUrl { get; set; }
        public int? EstimatedTimeMinutes { get; set; }
        public PricingSeedData? DefaultPricing { get; set; }
    }

    private class PricingSeedData
    {
        public decimal? SelfFilePrice { get; set; }
        public decimal? ParalegalPrice { get; set; }
        public decimal? LawyerPrice { get; set; }
        public decimal LLCFee { get; set; }
    }
}
