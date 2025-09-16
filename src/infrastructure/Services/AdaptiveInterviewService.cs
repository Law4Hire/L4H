using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace L4H.Infrastructure.Services;

public interface IAdaptiveInterviewService
{
    Task<InterviewQuestion> GetNextQuestionAsync(Dictionary<string, string> answers);
    Task<RecommendationResult> GetRecommendationAsync(Dictionary<string, string> answers);
    Task<bool> IsCompleteAsync(Dictionary<string, string> answers);
}

public class InterviewQuestion
{
    public string Key { get; set; } = string.Empty;
    public string Question { get; set; } = string.Empty;
    public string Type { get; set; } = "select"; // select, radio, text
    public List<InterviewOption> Options { get; set; } = new();
    public bool Required { get; set; } = true;
    public int RemainingVisaTypes { get; set; }
}

public class InterviewOption
{
    public string Value { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class AdaptiveInterviewService : IAdaptiveInterviewService
{
    private readonly L4HDbContext _context;
    private readonly ILogger<AdaptiveInterviewService> _logger;

    public AdaptiveInterviewService(L4HDbContext context, ILogger<AdaptiveInterviewService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<InterviewQuestion> GetNextQuestionAsync(Dictionary<string, string> answers)
    {
        // Get remaining possible visa types based on current answers
        var possibleVisaTypes = await GetPossibleVisaTypesAsync(answers).ConfigureAwait(false);

        _logger.LogInformation($"Current answers: {string.Join(", ", answers.Select(kvp => $"{kvp.Key}={kvp.Value}"))}");
        _logger.LogInformation($"Remaining visa types: {possibleVisaTypes.Count}");

        // If only one visa type remains, we're done
        if (possibleVisaTypes.Count <= 1)
        {
            return new InterviewQuestion
            {
                Key = "complete",
                Question = "Interview Complete",
                RemainingVisaTypes = possibleVisaTypes.Count
            };
        }

        // Determine the best question to narrow down the remaining visa types
        return await GetBestDiscriminatingQuestionAsync(possibleVisaTypes, answers).ConfigureAwait(false);
    }

    public async Task<bool> IsCompleteAsync(Dictionary<string, string> answers)
    {
        var possibleVisaTypes = await GetPossibleVisaTypesAsync(answers).ConfigureAwait(false);
        return possibleVisaTypes.Count <= 1;
    }

    public async Task<RecommendationResult> GetRecommendationAsync(Dictionary<string, string> answers)
    {
        var possibleVisaTypes = await GetPossibleVisaTypesAsync(answers).ConfigureAwait(false);

        if (possibleVisaTypes.Count == 0)
        {
            // Fallback to B-2 Tourist if no match
            var b2 = await _context.VisaTypes.FirstOrDefaultAsync(v => v.Code == "B-2").ConfigureAwait(false);
            return new RecommendationResult
            {
                VisaTypeId = b2?.Id ?? 1,
                Rationale = "Based on your answers, a B-2 Tourist Visa may be most appropriate. Please consult with an immigration attorney for personalized advice."
            };
        }

        var recommendedVisa = possibleVisaTypes.First();
        var rationale = GenerateRationale(recommendedVisa, answers);

        return new RecommendationResult
        {
            VisaTypeId = recommendedVisa.Id,
            Rationale = rationale
        };
    }

    private async Task<List<VisaType>> GetPossibleVisaTypesAsync(Dictionary<string, string> answers)
    {
        var allVisaTypes = await _context.VisaTypes.Where(v => v.IsActive).ToListAsync().ConfigureAwait(false);

        // Apply filtering rules based on answers
        return allVisaTypes.Where(visa => IsVisaTypePossible(visa, answers)).ToList();
    }

    private static bool IsVisaTypePossible(VisaType visa, Dictionary<string, string> answers)
    {
        var purpose = answers.GetValueOrDefault("purpose", "").ToLowerInvariant();
        var employerSponsor = answers.GetValueOrDefault("employerSponsor", "").ToLowerInvariant();
        var isGovernmentOfficial = answers.GetValueOrDefault("governmentOfficial", "").ToLowerInvariant();
        var isDiplomat = answers.GetValueOrDefault("diplomat", "").ToLowerInvariant();
        var educationLevel = answers.GetValueOrDefault("educationLevel", "").ToLowerInvariant();
        var workExperience = answers.GetValueOrDefault("workExperience", "").ToLowerInvariant();
        var nationality = answers.GetValueOrDefault("nationality", "").ToLowerInvariant();
        var hasJobOffer = answers.GetValueOrDefault("hasJobOffer", "").ToLowerInvariant();
        var isStudent = answers.GetValueOrDefault("isStudent", "").ToLowerInvariant();
        var studyLevel = answers.GetValueOrDefault("studyLevel", "").ToLowerInvariant();
        var isInvestor = answers.GetValueOrDefault("isInvestor", "").ToLowerInvariant();
        var investmentAmount = answers.GetValueOrDefault("investmentAmount", "").ToLowerInvariant();

        // Diplomatic visas (A-1, A-2, A-3)
        if (visa.Code.StartsWith("A-"))
        {
            if (isGovernmentOfficial == "yes" || isDiplomat == "yes")
            {
                if (visa.Code == "A-1") return isDiplomat == "yes" && (purpose == "diplomatic" || purpose == "official");
                if (visa.Code == "A-2") return isGovernmentOfficial == "yes" && purpose == "official";
                if (visa.Code == "A-3") return answers.ContainsKey("workingForDiplomat") && answers["workingForDiplomat"] == "yes";
            }
            return false;
        }

        // Family-based visas (need to handle first since they often take priority)
        if (purpose == "family")
        {
            var familyRelationship = answers.GetValueOrDefault("familyRelationship", "").ToLowerInvariant();
            var usFamilyStatus = answers.GetValueOrDefault("usFamilyStatus", "").ToLowerInvariant();

            // K-1 Fiancé(e) visa
            if (visa.Code == "K-1") return familyRelationship == "fiance" && usFamilyStatus == "citizen";

            // CR-1/IR-1 Spouse of U.S. citizen (immediate relative)
            if (visa.Code == "CR-1" || visa.Code == "IR-1") return familyRelationship == "spouse" && usFamilyStatus == "citizen";

            // F2A Spouse of permanent resident
            if (visa.Code == "F-2A") return familyRelationship == "spouse" && usFamilyStatus == "permanent_resident";

            // IR-2/IR-5 Parent/Child of U.S. citizen
            if (visa.Code == "IR-2" || visa.Code == "IR-5") return (familyRelationship == "parent" || familyRelationship == "child") && usFamilyStatus == "citizen";

            // If family purpose but doesn't match family visa, likely not this visa type
            if (visa.Code.StartsWith("B-") || visa.Code.StartsWith("H-") || visa.Code.StartsWith("F-1") || visa.Code.StartsWith("M-")) return false;
        }

        // Business/Tourism visas (B-1, B-2)
        if (visa.Code == "B-1") return purpose == "business" && employerSponsor != "yes";
        if (visa.Code == "B-2") return purpose == "tourism" || purpose == "visit" || purpose == "medical";

        // Transit visas (C-1, C-2, etc.)
        if (visa.Code.StartsWith("C-")) return purpose == "transit";

        // Crew visas (D)
        if (visa.Code == "D") return purpose == "crew" || answers.GetValueOrDefault("isCrew", "") == "yes";

        // Student visas (F-1, M-1, J-1)
        if (visa.Code == "F-1") return isStudent == "yes" && studyLevel == "academic";
        if (visa.Code == "M-1") return isStudent == "yes" && studyLevel == "vocational";
        if (visa.Code == "J-1") return purpose == "exchange" || answers.GetValueOrDefault("exchangeProgram", "") == "yes";

        // Work visas require employer sponsorship
        if (visa.Code.StartsWith("H-") || visa.Code.StartsWith("L-") || visa.Code.StartsWith("O-") || visa.Code.StartsWith("P-"))
        {
            if (employerSponsor != "yes" && hasJobOffer != "yes") return false;
        }

        // H-1B: Specialty occupation
        if (visa.Code == "H-1B")
        {
            return purpose == "employment" && employerSponsor == "yes" &&
                   (educationLevel == "bachelor" || educationLevel == "master" || educationLevel == "phd");
        }

        // H-2A/H-2B: Temporary agricultural/non-agricultural workers
        if (visa.Code == "H-2A") return purpose == "employment" && answers.GetValueOrDefault("workType", "") == "agricultural";
        if (visa.Code == "H-2B") return purpose == "employment" && answers.GetValueOrDefault("workType", "") == "seasonal";

        // L-1: Intracompany transferee
        if (visa.Code == "L-1")
        {
            return purpose == "employment" && employerSponsor == "yes" &&
                   answers.GetValueOrDefault("sameCompany", "") == "yes";
        }

        // O-1: Extraordinary ability
        if (visa.Code == "O-1")
        {
            return purpose == "employment" && employerSponsor == "yes" &&
                   answers.GetValueOrDefault("extraordinaryAbility", "") == "yes";
        }

        // Investment visas (EB-5, E-1, E-2)
        if (visa.Code == "EB-5")
        {
            return isInvestor == "yes" &&
                   (investmentAmount == "500000+" || investmentAmount == "1000000+");
        }

        if (visa.Code == "E-1" || visa.Code == "E-2")
        {
            return purpose == "investment" || purpose == "trade" || isInvestor == "yes";
        }

        // Default: allow if no specific rules exclude it
        return true;
    }

    private static Task<InterviewQuestion> GetBestDiscriminatingQuestionAsync(List<VisaType> possibleVisaTypes, Dictionary<string, string> answers)
    {
        // Determine which question would best narrow down the remaining visa types
        var questions = GetPossibleQuestions();

        foreach (var question in questions)
        {
            if (answers.ContainsKey(question.Key)) continue; // Already answered

            // Calculate how well this question discriminates between remaining visa types
            var discriminationScore = CalculateDiscriminationScore(question, possibleVisaTypes, answers);
            if (discriminationScore > 0)
            {
                question.RemainingVisaTypes = possibleVisaTypes.Count;
                return Task.FromResult(question);
            }
        }

        // Fallback question if no good discriminator found
        return Task.FromResult(new InterviewQuestion
        {
            Key = "nationality",
            Question = "What is your nationality?",
            Type = "text",
            Required = true,
            RemainingVisaTypes = possibleVisaTypes.Count
        });
    }

    private static List<InterviewQuestion> GetPossibleQuestions()
    {
        return new List<InterviewQuestion>
        {
            new()
            {
                Key = "purpose",
                Question = "What is your primary purpose for coming to the United States?",
                Type = "select",
                Options = new()
                {
                    new() { Value = "tourism", Label = "Tourism/Vacation", Description = "Leisure travel, sightseeing, visiting friends or family" },
                    new() { Value = "business", Label = "Business", Description = "Meetings, conferences, negotiations, consulting" },
                    new() { Value = "employment", Label = "Employment", Description = "Working in the United States" },
                    new() { Value = "study", Label = "Study", Description = "Academic or vocational education" },
                    new() { Value = "diplomatic", Label = "Diplomatic", Description = "Official government business" },
                    new() { Value = "official", Label = "Official Government", Description = "Government employee on official duty" },
                    new() { Value = "investment", Label = "Investment", Description = "Starting or investing in a business" },
                    new() { Value = "exchange", Label = "Exchange Program", Description = "Cultural or educational exchange" },
                    new() { Value = "transit", Label = "Transit", Description = "Passing through the US to another destination" },
                    new() { Value = "medical", Label = "Medical Treatment", Description = "Seeking medical care in the US" },
                    new() { Value = "family", Label = "Family/Personal", Description = "Joining family members or spouse in the US" }
                }
            },
            new()
            {
                Key = "employerSponsor",
                Question = "Do you have a U.S. employer who will sponsor your visa?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I have a confirmed job offer with sponsorship" },
                    new() { Value = "no", Label = "No", Description = "I do not have employer sponsorship" }
                }
            },
            new()
            {
                Key = "governmentOfficial",
                Question = "Are you a government official representing your country?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I am an official government representative" },
                    new() { Value = "no", Label = "No", Description = "I am not a government official" }
                }
            },
            new()
            {
                Key = "diplomat",
                Question = "Are you a diplomat, ambassador, or high-ranking government official?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I am a diplomat or high-ranking official" },
                    new() { Value = "no", Label = "No", Description = "I am not a diplomat" }
                }
            },
            new()
            {
                Key = "educationLevel",
                Question = "What is your highest level of education?",
                Type = "select",
                Options = new()
                {
                    new() { Value = "highschool", Label = "High School", Description = "High school diploma or equivalent" },
                    new() { Value = "bachelor", Label = "Bachelor's Degree", Description = "4-year college degree" },
                    new() { Value = "master", Label = "Master's Degree", Description = "Graduate degree" },
                    new() { Value = "phd", Label = "Doctorate (PhD)", Description = "Doctoral degree" },
                    new() { Value = "other", Label = "Other", Description = "Other professional qualifications" }
                }
            },
            new()
            {
                Key = "isStudent",
                Question = "Are you planning to study in the United States?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I will be enrolled in a U.S. educational institution" },
                    new() { Value = "no", Label = "No", Description = "I am not planning to study" }
                }
            },
            new()
            {
                Key = "studyLevel",
                Question = "What type of education will you pursue?",
                Type = "select",
                Options = new()
                {
                    new() { Value = "academic", Label = "Academic Study", Description = "University, college, or academic program" },
                    new() { Value = "vocational", Label = "Vocational Training", Description = "Technical or vocational school" }
                }
            },
            new()
            {
                Key = "isInvestor",
                Question = "Are you planning to invest in a U.S. business?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I plan to invest in or start a business" },
                    new() { Value = "no", Label = "No", Description = "I am not planning to invest" }
                }
            },
            new()
            {
                Key = "investmentAmount",
                Question = "How much do you plan to invest?",
                Type = "select",
                Options = new()
                {
                    new() { Value = "under100k", Label = "Under $100,000", Description = "Less than $100,000" },
                    new() { Value = "100k-500k", Label = "$100,000 - $500,000", Description = "Between $100,000 and $500,000" },
                    new() { Value = "500000+", Label = "$500,000 or more", Description = "$500,000 or more" },
                    new() { Value = "1000000+", Label = "$1,000,000 or more", Description = "$1,000,000 or more" }
                }
            },
            new()
            {
                Key = "extraordinaryAbility",
                Question = "Do you have extraordinary ability in sciences, arts, education, business, or athletics?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I have demonstrated extraordinary ability with national or international recognition" },
                    new() { Value = "no", Label = "No", Description = "I do not have extraordinary ability" }
                }
            },
            new()
            {
                Key = "sameCompany",
                Question = "Will you be working for the same company that employs you abroad?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I will transfer within the same company" },
                    new() { Value = "no", Label = "No", Description = "I will work for a different company" }
                }
            },
            new()
            {
                Key = "familyRelationship",
                Question = "What is your relationship to your U.S. family member?",
                Type = "select",
                Options = new()
                {
                    new() { Value = "spouse", Label = "Spouse", Description = "Married to a U.S. citizen or permanent resident" },
                    new() { Value = "parent", Label = "Parent", Description = "Child of a U.S. citizen or permanent resident" },
                    new() { Value = "child", Label = "Child", Description = "Parent of a U.S. citizen" },
                    new() { Value = "sibling", Label = "Sibling", Description = "Brother or sister of a U.S. citizen" },
                    new() { Value = "fiance", Label = "Fiancé(e)", Description = "Engaged to a U.S. citizen" },
                    new() { Value = "other", Label = "Other relative", Description = "Other family member" }
                }
            },
            new()
            {
                Key = "usFamilyStatus",
                Question = "What is your U.S. family member's status?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "citizen", Label = "U.S. Citizen", Description = "Born in the U.S. or naturalized citizen" },
                    new() { Value = "permanent_resident", Label = "Permanent Resident", Description = "Green card holder" },
                    new() { Value = "other", Label = "Other status", Description = "Other immigration status" }
                }
            }
        };
    }

    private static double CalculateDiscriminationScore(InterviewQuestion question, List<VisaType> possibleVisaTypes, Dictionary<string, string> answers)
    {
        // Simple scoring: return 1 if the question helps discriminate, 0 if not useful
        var testAnswers = new Dictionary<string, string>(answers);

        double bestScore = 0;
        foreach (var option in question.Options)
        {
            testAnswers[question.Key] = option.Value;
            var remainingTypes = possibleVisaTypes.Where(v => IsVisaTypePossible(v, testAnswers)).Count();
            var score = possibleVisaTypes.Count - remainingTypes;
            if (score > bestScore) bestScore = score;
        }

        return bestScore;
    }

    private static string GenerateRationale(VisaType visaType, Dictionary<string, string> answers)
    {
        var purpose = answers.GetValueOrDefault("purpose", "");
        var employerSponsor = answers.GetValueOrDefault("employerSponsor", "");

        return visaType.Code switch
        {
            "A-1" => "Based on your diplomatic status and official purpose, an A-1 Diplomatic Visa is recommended for heads of state, ambassadors, and high-ranking diplomatic officials.",
            "A-2" => "Based on your government official status, an A-2 Official Visa is recommended for government employees on official business.",
            "B-1" => "Based on your business purpose without employer sponsorship, a B-1 Business Visitor Visa is recommended for temporary business activities.",
            "B-2" => "Based on your tourism or personal visit purpose, a B-2 Tourist Visa is recommended for temporary pleasure travel.",
            "F-1" => "Based on your study plans at an academic institution, an F-1 Academic Student Visa is recommended.",
            "H-1B" => "Based on your employment purpose with employer sponsorship and professional qualifications, an H-1B Specialty Occupation Visa is recommended.",
            "L-1" => "Based on your intracompany transfer with the same employer, an L-1 Intracompany Transferee Visa is recommended.",
            "O-1" => "Based on your extraordinary ability and employer sponsorship, an O-1 Extraordinary Ability Visa is recommended.",
            "EB-5" => "Based on your significant investment plans, an EB-5 Immigrant Investor Visa is recommended.",
            "K-1" => "Based on your engagement to a U.S. citizen, a K-1 Fiancé(e) Visa is recommended to enter the U.S. for marriage.",
            "CR-1" or "IR-1" => "Based on your marriage to a U.S. citizen, an IR-1/CR-1 Immediate Relative Spouse Visa is recommended for permanent residence.",
            "F-2A" => "Based on your marriage to a U.S. permanent resident, an F-2A Family Preference Visa is recommended.",
            "IR-2" or "IR-5" => "Based on your immediate family relationship to a U.S. citizen, this Immediate Relative Visa is recommended for permanent residence.",
            _ => $"Based on your answers, a {visaType.Name} visa appears most appropriate for your situation. Please consult with an immigration attorney for personalized guidance."
        };
    }
}