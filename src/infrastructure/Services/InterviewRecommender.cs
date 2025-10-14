using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace L4H.Infrastructure.Services;

public interface IInterviewRecommender
{
    Task<RecommendationResult> GetRecommendationAsync(Dictionary<string, string> answers, string? nationality = null);
}

public class RecommendationResult
{
    public int VisaTypeId { get; set; }
    public string Rationale { get; set; } = string.Empty;
}

public class RuleBasedRecommender : IInterviewRecommender
{
    private readonly L4HDbContext _context;

    public RuleBasedRecommender(L4HDbContext context)
    {
        _context = context;
    }

    public async Task<RecommendationResult> GetRecommendationAsync(Dictionary<string, string> answers, string? nationality = null)
    {
        // Simple deterministic rules based on answers
        var purpose = answers.GetValueOrDefault("purpose", "").ToLowerInvariant();
        var hasEmployerSponsor = answers.GetValueOrDefault("hasEmployerSponsor", "").ToLowerInvariant();
        var adoptionType = answers.GetValueOrDefault("adoptionType", "").ToLowerInvariant();
        var adoptionCompleted = answers.GetValueOrDefault("adoptionCompleted", "").ToLowerInvariant();

        RecommendationResult result;

        // Handle adoption cases first
        if (purpose == "adoption" || adoptionType == "international")
        {
            if (adoptionCompleted == "yes")
            {
                result = new RecommendationResult
                {
                    VisaTypeId = await GetVisaTypeIdByCodeAsync("IR-3").ConfigureAwait(false),
                    Rationale = "Based on your completed international adoption, an IR-3 visa is recommended. This visa is for children whose adoption was finalized in their country of birth by US citizen parents."
                };
            }
            else if (adoptionCompleted == "no")
            {
                result = new RecommendationResult
                {
                    VisaTypeId = await GetVisaTypeIdByCodeAsync("IR-4").ConfigureAwait(false),
                    Rationale = "Based on your pending adoption completion, an IR-4 visa is recommended. This visa is for children who will complete their adoption process in the United States."
                };
            }
            else
            {
                // Default to IR-4 if adoption status is unclear
                result = new RecommendationResult
                {
                    VisaTypeId = await GetVisaTypeIdByCodeAsync("IR-4").ConfigureAwait(false),
                    Rationale = "Based on your international adoption case, an IR-4 visa is recommended. Please consult with an adoption attorney to determine if the adoption should be completed abroad (IR-3) or in the US (IR-4)."
                };
            }
        }
        else if (purpose == "tourism" || purpose == "tourist" || purpose == "visit")
        {
            result = new RecommendationResult
            {
                VisaTypeId = await GetVisaTypeIdByCodeAsync("B-2").ConfigureAwait(false), // B-2 Tourist Visa
                Rationale = "Based on your purpose of travel, a B-2 Tourist Visa is recommended."
            };
        }
        else if (purpose == "employment" || purpose == "work")
        {
            if (hasEmployerSponsor == "true" || hasEmployerSponsor == "yes")
            {
                result = new RecommendationResult
                {
                    VisaTypeId = await GetVisaTypeIdByCodeAsync("H-1B").ConfigureAwait(false), // H-1B Specialty Occupation
                    Rationale = "Based on your employment purpose and employer sponsorship, an H-1B Specialty Occupation Visa is recommended."
                };
            }
            else
            {
                // Fallback to B2 if no sponsor
                result = new RecommendationResult
                {
                    VisaTypeId = await GetVisaTypeIdByCodeAsync("B-2").ConfigureAwait(false), // B-2 Tourist Visa  
                    Rationale = "Based on your purpose of travel, a B-2 Tourist Visa is recommended."
                };
            }
        }
        else
        {
            // Default fallback to B2
            result = new RecommendationResult
            {
                VisaTypeId = await GetVisaTypeIdByCodeAsync("B-2").ConfigureAwait(false), // B-2 Tourist Visa
                Rationale = "Based on your purpose of travel, a B-2 Tourist Visa is recommended."
            };
        }

        return result;
    }

    private async Task<int> GetVisaTypeIdByCodeAsync(string code)
    {
        var visaType = await _context.VisaTypes.FirstOrDefaultAsync(v => v.Code == code).ConfigureAwait(false);
        if (visaType != null)
        {
            return visaType.Id;
        }

        // Fallback: try to find B-2 as default
        var b2VisaType = await _context.VisaTypes.FirstOrDefaultAsync(v => v.Code == "B-2").ConfigureAwait(false);
        if (b2VisaType != null)
        {
            return b2VisaType.Id;
        }

        // Final fallback: use any visa type
        var anyVisaType = await _context.VisaTypes.FirstOrDefaultAsync().ConfigureAwait(false);
        return anyVisaType?.Id ?? 1;
    }
}