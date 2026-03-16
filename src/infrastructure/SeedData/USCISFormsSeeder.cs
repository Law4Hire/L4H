using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;

namespace L4H.Infrastructure.SeedData;

/// <summary>
/// Seeds the database with the complete list of 100+ USCIS forms and their default pricing
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
        _logger.LogInformation("Checking USCIS forms seeding status...");

        var forms = GetDefaultForms();
        int addedCount = 0;

        foreach (var formData in forms)
        {
            // Check if form already exists by FormNumber
            var existing = await _context.USCISForms
                .FirstOrDefaultAsync(f => f.FormNumber == formData.FormNumber)
                .ConfigureAwait(false);

            if (existing == null)
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
                addedCount++;

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
        }

        if (addedCount > 0)
        {
            await _context.SaveChangesAsync().ConfigureAwait(false);
            _logger.LogInformation("Seeded {Count} NEW USCIS forms into the database", addedCount);
        }
        else
        {
            _logger.LogInformation("No new USCIS forms needed to be seeded.");
        }
    }

    private List<FormSeedData> GetDefaultForms()
    {
        return new List<FormSeedData>
        {
            // --- Group 1: Nonimmigrant Visa Applications (Abroad) ---
            new FormSeedData { FormNumber = "DS-160", FormName = "Online Nonimmigrant Visa Application", Description = "State Department form required for most nonimmigrant visa applicants applying at U.S. consulates abroad.", FormUrl = "https://ceac.state.gov/genniv/", EstimatedTimeMinutes = 120, DefaultPricing = new PricingSeedData { SelfFilePrice = 200m, ParalegalPrice = 400m, LawyerPrice = 800m, LLCFee = 100m } },
            new FormSeedData { FormNumber = "DS-156", FormName = "Nonimmigrant Visa Application", Description = "Nonimmigrant Visa Application (Paper Version)", EstimatedTimeMinutes = 90 },
            new FormSeedData { FormNumber = "DS-156E", FormName = "Treaty Trader/Investor Application", Description = "Additional form required for E-2 treaty investor visa applicants at U.S. consulates.", FormUrl = "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/forms/ds-156e.html", EstimatedTimeMinutes = 90, DefaultPricing = new PricingSeedData { SelfFilePrice = null, ParalegalPrice = 1500m, LawyerPrice = 3000m, LLCFee = 300m } },
            new FormSeedData { FormNumber = "DS-230", FormName = "Application for Immigrant Visa and Alien Registration", Description = "Application for Immigrant Visa and Alien Registration", EstimatedTimeMinutes = 120 },
            new FormSeedData { FormNumber = "DS-260", FormName = "Immigrant Visa Electronic Application", Description = "Immigrant Visa Electronic Application", EstimatedTimeMinutes = 120 },
            new FormSeedData { FormNumber = "DS-261", FormName = "Choice of Address and Agent", Description = "Choice of Address and Agent", EstimatedTimeMinutes = 15 },

            // --- Group 2: Naturalization & Citizenship ---
            new FormSeedData { FormNumber = "N-400", FormName = "Application for Naturalization", Description = "Application for Naturalization", FormUrl = "https://www.uscis.gov/n-400", EstimatedTimeMinutes = 180, DefaultPricing = new PricingSeedData { SelfFilePrice = 500m, ParalegalPrice = 1000m, LawyerPrice = 2000m, LLCFee = 200m } },
            new FormSeedData { FormNumber = "N-600", FormName = "Application for Certificate of Citizenship", Description = "Application for Certificate of Citizenship", EstimatedTimeMinutes = 120 },
            new FormSeedData { FormNumber = "N-600K", FormName = "Citizenship and Issuance of Certificate Under Section 322", Description = "Citizenship and Issuance of Certificate Under Section 322", EstimatedTimeMinutes = 120 },
            new FormSeedData { FormNumber = "N-300", FormName = "Application to File Declaration of Intention", Description = "Application to File Declaration of Intention", EstimatedTimeMinutes = 45 },
            new FormSeedData { FormNumber = "N-336", FormName = "Request for a Hearing on a Decision in Naturalization Proceedings", Description = "Request for a Hearing on a Decision in Naturalization Proceedings", EstimatedTimeMinutes = 90 },
            new FormSeedData { FormNumber = "N-426", FormName = "Request for Certification of Military or Naval Service", Description = "Request for Certification of Military or Naval Service", EstimatedTimeMinutes = 30 },
            new FormSeedData { FormNumber = "N-470", FormName = "Application to Preserve Residence for Naturalization Purposes", Description = "Application to Preserve Residence for Naturalization Purposes", EstimatedTimeMinutes = 60 },
            new FormSeedData { FormNumber = "N-565", FormName = "Application for Replacement Naturalization/Citizenship Document", Description = "Application for Replacement Naturalization/Citizenship Document", EstimatedTimeMinutes = 60 },
            new FormSeedData { FormNumber = "N-644", FormName = "Application for Posthumous Citizenship", Description = "Application for Posthumous Citizenship", EstimatedTimeMinutes = 60 },
            new FormSeedData { FormNumber = "N-648", FormName = "Medical Certification for Disability Exceptions", Description = "Medical Certification for Disability Exceptions", EstimatedTimeMinutes = 60 },

            // --- Group 3: Green Card Adjustment & Maintenance ---
            new FormSeedData { FormNumber = "I-485", FormName = "Application to Register Permanent Residence or Adjust Status", Description = "Final step to obtain a green card for applicants already in the United States.", FormUrl = "https://www.uscis.gov/i-485", EstimatedTimeMinutes = 300, DefaultPricing = new PricingSeedData { SelfFilePrice = 1200m, ParalegalPrice = 2000m, LawyerPrice = 4000m, LLCFee = 400m } },
            new FormSeedData { FormNumber = "I-485A", FormName = "Supplement A to Form I-485, Adjustment of Status Under Section 245(i)", Description = "Supplement A to Form I-485, Adjustment of Status Under Section 245(i)", EstimatedTimeMinutes = 60 },
            new FormSeedData { FormNumber = "I-485J", FormName = "Confirmation of Valid Job Offer or Request for Job Portability", Description = "Confirmation of Valid Job Offer or Request for Job Portability", EstimatedTimeMinutes = 45 },
            new FormSeedData { FormNumber = "I-90", FormName = "Application to Replace Permanent Resident Card", Description = "Used to renew, replace, or update a green card (Permanent Resident Card).", FormUrl = "https://www.uscis.gov/i-90", EstimatedTimeMinutes = 60, DefaultPricing = new PricingSeedData { SelfFilePrice = 300m, ParalegalPrice = 500m, LawyerPrice = 1000m, LLCFee = 100m } },
            new FormSeedData { FormNumber = "I-751", FormName = "Petition to Remove Conditions on Residence", Description = "Petition to Remove Conditions on Residence", EstimatedTimeMinutes = 120 },
            new FormSeedData { FormNumber = "I-829", FormName = "Petition by Investor to Remove Conditions on Permanent Resident Status", Description = "Petition by Investor to Remove Conditions on Permanent Resident Status", EstimatedTimeMinutes = 120 },
            new FormSeedData { FormNumber = "I-693", FormName = "Report of Medical Examination and Vaccination Record", Description = "Medical examination required for adjustment of status applicants.", FormUrl = "https://www.uscis.gov/i-693", EstimatedTimeMinutes = 60, DefaultPricing = new PricingSeedData { SelfFilePrice = 200m, ParalegalPrice = 300m, LawyerPrice = 500m, LLCFee = 50m } },
            new FormSeedData { FormNumber = "I-698", FormName = "Application to Adjust Status from Temporary to Permanent Resident", Description = "Application to Adjust Status from Temporary to Permanent Resident", EstimatedTimeMinutes = 120 },

            // --- Group 4: Family-Based Petitions ---
            new FormSeedData { FormNumber = "I-130", FormName = "Petition for Alien Relative", Description = "First step for family-based immigration.", FormUrl = "https://www.uscis.gov/i-130", EstimatedTimeMinutes = 150, DefaultPricing = new PricingSeedData { SelfFilePrice = 600m, ParalegalPrice = 1200m, LawyerPrice = 2500m, LLCFee = 250m } },
            new FormSeedData { FormNumber = "I-129F", FormName = "Petition for Alien Fiancé(e)", Description = "Petition for Alien Fiancé(e)", EstimatedTimeMinutes = 90 },
            new FormSeedData { FormNumber = "I-600", FormName = "Petition to Classify Orphan as an Immediate Relative", Description = "Petition to Classify Orphan as an Immediate Relative", EstimatedTimeMinutes = 120 },
            new FormSeedData { FormNumber = "I-600A", FormName = "Application for Advance Processing of Orphan Petition", Description = "Application for Advance Processing of Orphan Petition", EstimatedTimeMinutes = 120 },
            new FormSeedData { FormNumber = "I-730", FormName = "Refugee/Asylee Relative Petition", Description = "Refugee/Asylee Relative Petition", EstimatedTimeMinutes = 90 },
            new FormSeedData { FormNumber = "I-800", FormName = "Petition to Classify Convention Adoptee as an Immediate Relative", Description = "Petition to Classify Convention Adoptee as an Immediate Relative", EstimatedTimeMinutes = 120 },
            new FormSeedData { FormNumber = "I-800A", FormName = "Suitability to Adopt a Child from a Convention Country", Description = "Suitability to Adopt a Child from a Convention Country", EstimatedTimeMinutes = 120 },
            new FormSeedData { FormNumber = "I-864", FormName = "Affidavit of Support Under Section 213A of the INA", Description = "Required for family-based immigration.", FormUrl = "https://www.uscis.gov/i-864", EstimatedTimeMinutes = 90, DefaultPricing = new PricingSeedData { SelfFilePrice = 400m, ParalegalPrice = 600m, LawyerPrice = 1000m, LLCFee = 100m } },
            new FormSeedData { FormNumber = "I-864A", FormName = "Contract Between Sponsor and Household Member", Description = "Contract Between Sponsor and Household Member", EstimatedTimeMinutes = 45 },
            new FormSeedData { FormNumber = "I-864EZ", FormName = "Affidavit of Support Under Section 213A of the INA", Description = "Affidavit of Support Under Section 213A of the INA", EstimatedTimeMinutes = 45 },
            new FormSeedData { FormNumber = "I-864W", FormName = "Exemption for Intending Immigrant's Affidavit of Support", Description = "Exemption for Intending Immigrant's Affidavit of Support", EstimatedTimeMinutes = 30 },

            // --- Group 5: Employment-Based Petitions ---
            new FormSeedData { FormNumber = "I-129", FormName = "Petition for a Nonimmigrant Worker", Description = "Used for H-1B, L-1, O-1, etc.", FormUrl = "https://www.uscis.gov/i-129", EstimatedTimeMinutes = 180, DefaultPricing = new PricingSeedData { SelfFilePrice = null, ParalegalPrice = 1500m, LawyerPrice = 3500m, LLCFee = 300m } },
            new FormSeedData { FormNumber = "I-140", FormName = "Immigrant Petition for Alien Workers", Description = "EB-1, EB-2, EB-3.", FormUrl = "https://www.uscis.gov/i-140", EstimatedTimeMinutes = 240, DefaultPricing = new PricingSeedData { SelfFilePrice = null, ParalegalPrice = 2500m, LawyerPrice = 5000m, LLCFee = 500m } },
            new FormSeedData { FormNumber = "I-129CW", FormName = "Petition for a CNMI-Only Nonimmigrant Transitional Worker", Description = "Petition for a CNMI-Only Nonimmigrant Transitional Worker", EstimatedTimeMinutes = 120 },
            new FormSeedData { FormNumber = "I-129CWR", FormName = "Semiannual Report for CW-1 Employers", Description = "Semiannual Report for CW-1 Employers", EstimatedTimeMinutes = 60 },
            new FormSeedData { FormNumber = "I-129S", FormName = "Nonimmigrant Petition Based on Blanket L Petition", Description = "Multinational companies L-1.", FormUrl = "https://www.uscis.gov/i-129s", EstimatedTimeMinutes = 120, DefaultPricing = new PricingSeedData { SelfFilePrice = null, ParalegalPrice = 1200m, LawyerPrice = 2500m, LLCFee = 250m } },
            new FormSeedData { FormNumber = "I-140G", FormName = "Immigrant Petition for the Gold Card Program", Description = "Immigrant Petition for the Gold Card Program", EstimatedTimeMinutes = 120 },
            new FormSeedData { FormNumber = "I-905", FormName = "Authorization to Issue Certification for Health Care Workers", Description = "Authorization to Issue Certification for Health Care Workers", EstimatedTimeMinutes = 60 },
            new FormSeedData { FormNumber = "I-907", FormName = "Request for Premium Processing Service", Description = "Expedited 15-day processing.", FormUrl = "https://www.uscis.gov/i-907", EstimatedTimeMinutes = 30, DefaultPricing = new PricingSeedData { SelfFilePrice = 150m, ParalegalPrice = 250m, LawyerPrice = 500m, LLCFee = 50m } },

            // --- Group 6: Humanitarian & Asylum ---
            new FormSeedData { FormNumber = "I-589", FormName = "Application for Asylum and for Withholding of Removal", Description = "Application for Asylum and for Withholding of Removal", EstimatedTimeMinutes = 240 },
            new FormSeedData { FormNumber = "I-817", FormName = "Application for Family Unity Benefits", Description = "Application for Family Unity Benefits", EstimatedTimeMinutes = 120 },
            new FormSeedData { FormNumber = "I-821", FormName = "Application for Temporary Protected Status", Description = "Application for Temporary Protected Status", EstimatedTimeMinutes = 90 },
            new FormSeedData { FormNumber = "I-821D", FormName = "Consideration of Deferred Action for Childhood Arrivals", Description = "Consideration of Deferred Action for Childhood Arrivals", EstimatedTimeMinutes = 120 },
            new FormSeedData { FormNumber = "I-854", FormName = "Inter-Agency Alien Witness and Informant Record", Description = "Inter-Agency Alien Witness and Informant Record", EstimatedTimeMinutes = 60 },
            new FormSeedData { FormNumber = "I-881", FormName = "Application for Suspension of Deportation or Special Rule Cancellation", Description = "Application for Suspension of Deportation or Special Rule Cancellation", EstimatedTimeMinutes = 180 },
            new FormSeedData { FormNumber = "I-914", FormName = "Application for T Nonimmigrant Status", Description = "Application for T Nonimmigrant Status", EstimatedTimeMinutes = 180 },
            new FormSeedData { FormNumber = "I-918", FormName = "Petition for U Nonimmigrant Status", Description = "Petition for U Nonimmigrant Status", EstimatedTimeMinutes = 180 },
            new FormSeedData { FormNumber = "I-929", FormName = "Petition for Qualifying Family Member of a U-1 Nonimmigrant", Description = "Petition for Qualifying Family Member of a U-1 Nonimmigrant", EstimatedTimeMinutes = 120 },

            // --- Group 7: Investor Programs ---
            new FormSeedData { FormNumber = "I-526", FormName = "Immigrant Petition by Standalone Investor", Description = "Immigrant Petition by Standalone Investor", EstimatedTimeMinutes = 240 },
            new FormSeedData { FormNumber = "I-526E", FormName = "Immigrant Petition by Regional Center Investor", Description = "Immigrant Petition by Regional Center Investor", EstimatedTimeMinutes = 240 },
            new FormSeedData { FormNumber = "I-924", FormName = "Application for Regional Center Designation", Description = "Application for Regional Center Designation", EstimatedTimeMinutes = 300 },
            new FormSeedData { FormNumber = "I-924A", FormName = "Annual Certification of Regional Center", Description = "Annual Certification of Regional Center", EstimatedTimeMinutes = 120 },
            new FormSeedData { FormNumber = "I-941", FormName = "Application for Entrepreneur Parole", Description = "Application for Entrepreneur Parole", EstimatedTimeMinutes = 180 },
            new FormSeedData { FormNumber = "I-956", FormName = "Application for Regional Center Designation", Description = "Application for Regional Center Designation", EstimatedTimeMinutes = 300 },
            new FormSeedData { FormNumber = "I-956F", FormName = "Approval of an Investment in a Commercial Enterprise", Description = "Approval of an Investment in a Commercial Enterprise", EstimatedTimeMinutes = 240 },
            new FormSeedData { FormNumber = "I-956G", FormName = "Regional Center Annual Statement", Description = "Regional Center Annual Statement", EstimatedTimeMinutes = 120 },
            new FormSeedData { FormNumber = "I-956H", FormName = "Bona Fides of Persons Involved with Regional Center Program", Description = "Bona Fides of Persons Involved with Regional Center Program", EstimatedTimeMinutes = 60 },
            new FormSeedData { FormNumber = "I-956K", FormName = "Registration for Direct and Third-Party Promoters", Description = "Registration for Direct and Third-Party Promoters", EstimatedTimeMinutes = 60 },

            // --- Group 8: Waivers & Appeals ---
            new FormSeedData { FormNumber = "I-191", FormName = "Application for Relief Under Former Section 212(c) of the INA", Description = "Application for Relief Under Former Section 212(c) of the INA", EstimatedTimeMinutes = 120 },
            new FormSeedData { FormNumber = "I-192", FormName = "Application for Advance Permission to Enter as a Nonimmigrant", Description = "Application for Advance Permission to Enter as a Nonimmigrant", EstimatedTimeMinutes = 120 },
            new FormSeedData { FormNumber = "I-193", FormName = "Application for Waiver of Passport and/or Visa", Description = "Application for Waiver of Passport and/or Visa", EstimatedTimeMinutes = 60 },
            new FormSeedData { FormNumber = "I-212", FormName = "Application for Permission to Reapply for Admission After Deportation", Description = "Application for Permission to Reapply for Admission After Deportation", EstimatedTimeMinutes = 120 },
            new FormSeedData { FormNumber = "I-290B", FormName = "Notice of Appeal or Motion", Description = "Notice of Appeal or Motion", EstimatedTimeMinutes = 90 },
            new FormSeedData { FormNumber = "I-601", FormName = "Application for Waiver of Grounds of Inadmissibility", Description = "Application for Waiver of Grounds of Inadmissibility", EstimatedTimeMinutes = 180 },
            new FormSeedData { FormNumber = "I-601A", FormName = "Application for Provisional Unlawful Presence Waiver", Description = "Application for Provisional Unlawful Presence Waiver", EstimatedTimeMinutes = 180 },
            new FormSeedData { FormNumber = "I-612", FormName = "Application for Waiver of the Foreign Residence Requirement", Description = "Application for Waiver of the Foreign Residence Requirement", EstimatedTimeMinutes = 120 },
            new FormSeedData { FormNumber = "I-690", FormName = "Application for Waiver of Grounds of Inadmissibility Under Sections 245A or 210", Description = "Application for Waiver of Grounds of Inadmissibility Under Sections 245A or 210", EstimatedTimeMinutes = 120 },
            new FormSeedData { FormNumber = "I-694", FormName = "Notice of Appeal of Decision Under Sections 210 or 245A", Description = "Notice of Appeal of Decision Under Sections 210 or 245A", EstimatedTimeMinutes = 120 },

            // --- Group 9: Administrative & Status Maintenance ---
            new FormSeedData { FormNumber = "AR-11", FormName = "Alien's Change of Address Card", Description = "Alien's Change of Address Card", EstimatedTimeMinutes = 15 },
            new FormSeedData { FormNumber = "G-28", FormName = "Notice of Entry of Appearance as Attorney or Accredited Representative", Description = "Notice of Entry of Appearance as Attorney or Accredited Representative", EstimatedTimeMinutes = 15 },
            new FormSeedData { FormNumber = "G-28I", FormName = "Notice of Entry of Appearance as Attorney Outside the US", Description = "Notice of Entry of Appearance as Attorney Outside the US", EstimatedTimeMinutes = 15 },
            new FormSeedData { FormNumber = "G-325A", FormName = "Biographic Information (for Deferred Action)", Description = "Biographic Information (for Deferred Action)", EstimatedTimeMinutes = 30 },
            new FormSeedData { FormNumber = "G-325R", FormName = "Biographic Information (Registration)", Description = "Biographic Information (Registration)", EstimatedTimeMinutes = 30 },
            new FormSeedData { FormNumber = "G-639", FormName = "Freedom of Information/Privacy Act Request", Description = "Freedom of Information/Privacy Act Request", EstimatedTimeMinutes = 30 },
            new FormSeedData { FormNumber = "G-845", FormName = "Verification Request", Description = "Verification Request", EstimatedTimeMinutes = 30 },
            new FormSeedData { FormNumber = "G-884", FormName = "Request for the Return of Original Documents", Description = "Request for the Return of Original Documents", EstimatedTimeMinutes = 30 },
            new FormSeedData { FormNumber = "G-1041", FormName = "Genealogy Index Search Request", Description = "Genealogy Index Search Request", EstimatedTimeMinutes = 30 },
            new FormSeedData { FormNumber = "G-1041A", FormName = "Genealogy Records Request", Description = "Genealogy Records Request", EstimatedTimeMinutes = 30 },
            new FormSeedData { FormNumber = "G-1145", FormName = "E-Notification of Application/Petition Acceptance", Description = "E-Notification of Application/Petition Acceptance", EstimatedTimeMinutes = 5 },
            new FormSeedData { FormNumber = "G-1256", FormName = "Declaration for Interpreted USCIS Interview", Description = "Declaration for Interpreted USCIS Interview", EstimatedTimeMinutes = 15 },
            new FormSeedData { FormNumber = "G-1450", FormName = "Authorization for Credit Card Transactions", Description = "Authorization for Credit Card Transactions", EstimatedTimeMinutes = 5 },
            new FormSeedData { FormNumber = "G-1566", FormName = "Request for Certificate of Non-Existence", Description = "Request for Certificate of Non-Existence", EstimatedTimeMinutes = 15 },
            new FormSeedData { FormNumber = "I-9", FormName = "Employment Eligibility Verification", Description = "Employment Eligibility Verification", EstimatedTimeMinutes = 20 },
            new FormSeedData { FormNumber = "I-102", FormName = "Application for Replacement/Initial Nonimmigrant Arrival-Departure Document", Description = "Application for Replacement/Initial Nonimmigrant Arrival-Departure Document", EstimatedTimeMinutes = 45 },
            new FormSeedData { FormNumber = "I-131A", FormName = "Application for Carrier Documentation", Description = "Application for Carrier Documentation", EstimatedTimeMinutes = 60 },
            new FormSeedData { FormNumber = "I-134", FormName = "Declaration of Financial Support", Description = "Declaration of Financial Support", EstimatedTimeMinutes = 60 },
            new FormSeedData { FormNumber = "I-566", FormName = "Interagency Record of Request for A, G, or NATO Dependent Employment Authorization", Description = "Interagency Record of Request for A, G, or NATO Dependent Employment Authorization", EstimatedTimeMinutes = 60 },
            new FormSeedData { FormNumber = "I-765V", FormName = "Employment Authorization for Abused Nonimmigrant Spouse", Description = "Employment Authorization for Abused Nonimmigrant Spouse", EstimatedTimeMinutes = 90 },
            new FormSeedData { FormNumber = "I-824", FormName = "Application for Action on an Approved Application or Petition", Description = "Application for Action on an Approved Application or Petition", EstimatedTimeMinutes = 45 },
            new FormSeedData { FormNumber = "I-865", FormName = "Sponsor's Notice of Change of Address", Description = "Sponsor's Notice of Change of Address", EstimatedTimeMinutes = 15 },
            new FormSeedData { FormNumber = "I-910", FormName = "Application for Civil Surgeon Designation", Description = "Application for Civil Surgeon Designation", EstimatedTimeMinutes = 60 },
            new FormSeedData { FormNumber = "I-912", FormName = "Request for Fee Waiver", Description = "Request for Fee Waiver", EstimatedTimeMinutes = 60 },
            new FormSeedData { FormNumber = "I-945", FormName = "Public Charge Bond", Description = "Public Charge Bond", EstimatedTimeMinutes = 60 }
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
