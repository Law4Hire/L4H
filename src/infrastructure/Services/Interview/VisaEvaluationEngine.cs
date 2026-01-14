using System.Globalization;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace L4H.Infrastructure.Services.Interview;

/// <summary>
/// Unified visa evaluation engine - single source of truth for visa eligibility
/// </summary>
public class VisaEvaluationEngine : IVisaEvaluationEngine
{
    private readonly L4HDbContext _context;
    private readonly ILogger<VisaEvaluationEngine> _logger;

    public VisaEvaluationEngine(L4HDbContext context, ILogger<VisaEvaluationEngine> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<VisaEvaluationResult>> EvaluateAllVisasAsync(
        List<InterviewQA> answers,
        User? user = null)
    {
        // 1. Get all active visa types with related data (prevent N+1 queries)
        var allVisas = await _context.VisaTypes
            .Include(v => v.PricingRules)
            .Where(v => v.IsActive)
            .ToListAsync();

        // 2. Filter by user profile (age, nationality, etc.)
        var profileFiltered = FilterByUserProfile(allVisas, user);

        // 3. Evaluate each visa against answers
        var evaluated = new List<VisaEvaluationResult>();

        foreach (var visa in profileFiltered)
        {
            var evaluation = EvaluateVisa(visa, answers, user);
            evaluated.Add(evaluation);
        }

        // 4. Sort and rank: Eligible first, then by score
        var ranked = evaluated
            .OrderBy(e => e.Status) // Eligible=1, Potential=2, NotEligible=3
            .ThenByDescending(e => e.MatchScore)
            .Select((e, index) => { e.Rank = index + 1; return e; })
            .ToList();

        return ranked;
    }

    public async Task<List<VisaType>> GetRemainingVisasAsync(
        List<InterviewQA> answers,
        User? user = null)
    {
        var allEvaluations = await EvaluateAllVisasAsync(answers, user);

        // Return visas that are Eligible or Potential (not definitively ruled out)
        return allEvaluations
            .Where(e => e.Status != EligibilityStatus.NotEligible)
            .Select(e => e.VisaType)
            .ToList();
    }

    public async Task<bool> HasSufficientInformationAsync(
        List<InterviewQA> answers,
        List<VisaType> remainingVisas)
    {
        // Complete if:
        // - 3 or fewer visas remain (clear direction)
        // - OR 8+ questions answered (enough info)
        // - OR no commercially available visas remain

        if (remainingVisas.Count <= 3) return true;
        if (answers.Count >= 8) return true;
        if (!remainingVisas.Any(v => v.PricingRules.Count > 0)) return true;

        return false;
    }

    #region Private Helper Methods

    private List<VisaType> FilterByUserProfile(List<VisaType> visas, User? user)
    {
        if (user == null) return visas;

        var filtered = new List<VisaType>(visas);

        // Age-based filtering
        if (user.DateOfBirth.HasValue)
        {
            var age = CalculateAge(user.DateOfBirth.Value);

            // Example: some visas have age restrictions
            // filtered = filtered.Where(v => !v.HasAgeRestriction || age >= v.MinAge && age <= v.MaxAge).ToList();
        }

        // Nationality-based filtering
        if (!string.IsNullOrEmpty(user.Nationality))
        {
            // Example: some visas are not available to certain nationalities
            // filtered = filtered.Where(v => IsNationalityEligible(v, user.Nationality)).ToList();
        }

        return filtered;
    }

    private VisaEvaluationResult EvaluateVisa(VisaType visa, List<InterviewQA> answers, User? user)
    {
        var result = new VisaEvaluationResult
        {
            VisaType = visa,
            Status = EligibilityStatus.Potential,
            MatchScore = 50, // Default score
            RequiredDocuments = GetRequiredDocuments(visa),
            KeyBenefits = GetKeyBenefits(visa)
        };

        // Extract answer values for easy access
        var answerDict = answers.ToDictionary(
            a => a.QuestionKey,
            a => a.AnswerValue,
            StringComparer.OrdinalIgnoreCase);

        // Evaluate based on visa code
        switch (visa.Code.ToUpper(CultureInfo.InvariantCulture))
        {
            case "B-2": // Tourist/Visitor
                result = EvaluateB2(visa, answerDict, user);
                break;

            case "H-1B": // Skilled Worker
                result = EvaluateH1B(visa, answerDict, user);
                break;

            case "F-1": // Student
                result = EvaluateF1(visa, answerDict, user);
                break;

            case "O-1": // Extraordinary Ability
                result = EvaluateO1(visa, answerDict, user);
                break;

            case "EB-5": // Investor
                result = EvaluateEB5(visa, answerDict, user);
                break;

            case "IR-1": // Spouse of US Citizen
            case "CR-1":
                result = EvaluateFamilySpouse(visa, answerDict, user);
                break;

            case "IR-3": // Adopted Child (Hague)
            case "IR-4": // Adopted Child (Non-Hague)
            case "ADOP": // Adoption Services
                result = EvaluateAdoption(visa, answerDict, user);
                break;

            case "N-400": // Naturalization
            case "N-600": // Certificate of Citizenship
            case "NATZ": // Naturalization
                result = EvaluateCitizenship(visa, answerDict, user);
                break;

            case "F1-IM": // Family F1
            case "F2A":
            case "F2B":
            case "F3-IM":
            case "F4":
                result = EvaluateFamilySpouse(visa, answerDict, user); // Broader family logic
                break;

            default:
                // Generic evaluation
                result = EvaluateGeneric(visa, answerDict, user);
                break;
        }

        result.VisaType = visa;
        result.RequiredDocuments = GetRequiredDocuments(visa);
        result.KeyBenefits = GetKeyBenefits(visa);

        return result;
    }

    #region Visa-Specific Evaluations

    private VisaEvaluationResult EvaluateB2(VisaType visa, Dictionary<string, string> answers, User? user)
    {
        var result = new VisaEvaluationResult();

        if (answers.TryGetValue("purpose", out var purpose) &&
            (purpose.Contains("tourism", StringComparison.OrdinalIgnoreCase) ||
             purpose.Contains("visit", StringComparison.OrdinalIgnoreCase) ||
             purpose.Contains("vacation", StringComparison.OrdinalIgnoreCase)))
        {
            result.Status = EligibilityStatus.Eligible;
            result.MatchScore = 95;
            result.Explanation = "You are visiting the US for tourism/vacation purposes, which is the primary use case for a B-2 visitor visa.";
        }
        else
        {
            result.Status = EligibilityStatus.NotEligible;
            result.MatchScore = 20;
            result.Explanation = "B-2 visa is for tourism and temporary visits. Your purpose does not match this category.";
        }

        return result;
    }

    private VisaEvaluationResult EvaluateH1B(VisaType visa, Dictionary<string, string> answers, User? user)
    {
        var result = new VisaEvaluationResult { MatchScore = 30 };

        bool hasWorkPurpose = answers.TryGetValue("purpose", out var purpose) &&
            purpose.Contains("work", StringComparison.OrdinalIgnoreCase);

        bool hasEmployerSponsor = answers.TryGetValue("employer_sponsor", out var sponsor) &&
            (sponsor.Equals("yes", StringComparison.OrdinalIgnoreCase) || sponsor.Equals("true", StringComparison.OrdinalIgnoreCase));

        bool isPermanent = answers.TryGetValue("duration", out var duration) &&
            (duration.Contains("permanent", StringComparison.OrdinalIgnoreCase) || duration.Contains("long", StringComparison.OrdinalIgnoreCase));

        bool hasBachelors = answers.TryGetValue("education_level", out var education) &&
            (education.Contains("bachelor", StringComparison.OrdinalIgnoreCase) ||
             education.Contains("master", StringComparison.OrdinalIgnoreCase) ||
             education.Contains("phd", StringComparison.OrdinalIgnoreCase) ||
             education.Contains("doctorate", StringComparison.OrdinalIgnoreCase));

        if (hasWorkPurpose && hasEmployerSponsor && hasBachelors)
        {
            result.Status = EligibilityStatus.Eligible;
            result.MatchScore = 90;
            result.Explanation = "You have a US employer sponsor and a bachelor's degree or higher, making you eligible for an H-1B visa for specialty occupation employment.";
        }
        else if (hasWorkPurpose && hasEmployerSponsor)
        {
            result.Status = EligibilityStatus.Potential;
            result.MatchScore = 65;
            result.Explanation = "You have a US employer sponsor. H-1B requires a bachelor's degree or equivalent for specialty occupations.";
            result.MissingInformation.Add("Education level (bachelor's degree or higher required)");
        }
        else if (hasWorkPurpose)
        {
            result.Status = EligibilityStatus.Potential;
            result.MatchScore = 40;
            result.Explanation = "H-1B visa requires a US employer sponsor and bachelor's degree for specialty occupations.";
            result.MissingInformation.Add("US employer sponsorship");
            if (!hasBachelors) result.MissingInformation.Add("Bachelor's degree or higher");
        }
        else
        {
            result.Status = EligibilityStatus.NotEligible;
            result.MatchScore = 15;
            result.Explanation = "H-1B visa is for professional work in specialty occupations. Your purpose does not match this category.";
        }

        return result;
    }

    private VisaEvaluationResult EvaluateF1(VisaType visa, Dictionary<string, string> answers, User? user)
    {
        var result = new VisaEvaluationResult { MatchScore = 30 };

        bool hasStudyPurpose = answers.TryGetValue("purpose", out var purpose) &&
            (purpose.Contains("study", StringComparison.OrdinalIgnoreCase) ||
             purpose.Contains("student", StringComparison.OrdinalIgnoreCase) ||
             purpose.Contains("education", StringComparison.OrdinalIgnoreCase));

        if (hasStudyPurpose)
        {
            result.Status = EligibilityStatus.Eligible;
            result.MatchScore = 90;
            result.Explanation = "You are coming to study in the US, which makes you eligible for an F-1 student visa.";
        }
        else
        {
            result.Status = EligibilityStatus.NotEligible;
            result.MatchScore = 15;
            result.Explanation = "F-1 visa is for academic studies. Your purpose does not match this category.";
        }

        return result;
    }

    private VisaEvaluationResult EvaluateO1(VisaType visa, Dictionary<string, string> answers, User? user)
    {
        var result = new VisaEvaluationResult { MatchScore = 20 };

        bool hasWorkPurpose = answers.TryGetValue("purpose", out var purpose) &&
            purpose.Contains("work", StringComparison.OrdinalIgnoreCase);

        bool hasExtraordinaryAbility = answers.TryGetValue("extraordinary_ability", out var ability) &&
            ability.Equals("yes", StringComparison.OrdinalIgnoreCase);

        if (hasWorkPurpose && hasExtraordinaryAbility)
        {
            result.Status = EligibilityStatus.Eligible;
            result.MatchScore = 85;
            result.Explanation = "You have demonstrated extraordinary ability in your field, making you potentially eligible for an O-1 visa.";
        }
        else if (hasWorkPurpose)
        {
            result.Status = EligibilityStatus.Potential;
            result.MatchScore = 45;
            result.Explanation = "O-1 visa is for individuals with extraordinary ability. You'll need to demonstrate sustained national or international acclaim.";
            result.MissingInformation.Add("Evidence of extraordinary ability (awards, recognition, publications, etc.)");
        }
        else
        {
            result.Status = EligibilityStatus.NotEligible;
            result.MatchScore = 10;
            result.Explanation = "O-1 visa is for work requiring extraordinary ability. Your purpose does not match this category.";
        }

        return result;
    }

    private VisaEvaluationResult EvaluateEB5(VisaType visa, Dictionary<string, string> answers, User? user)
    {
        var result = new VisaEvaluationResult { MatchScore = 20 };

        bool hasInvestmentPurpose = answers.TryGetValue("purpose", out var purpose) &&
            purpose.Contains("invest", StringComparison.OrdinalIgnoreCase);

        bool hasInvestmentCapital = answers.TryGetValue("investment_capital", out var capital) &&
            (capital.Contains("800000", StringComparison.OrdinalIgnoreCase) ||
             capital.Contains("1050000", StringComparison.OrdinalIgnoreCase) ||
             capital.Contains("yes", StringComparison.OrdinalIgnoreCase));

        if (hasInvestmentPurpose && hasInvestmentCapital)
        {
            result.Status = EligibilityStatus.Eligible;
            result.MatchScore = 88;
            result.Explanation = "You have the capital to invest ($800,000-$1,050,000) making you eligible for an EB-5 immigrant investor visa.";
        }
        else if (hasInvestmentPurpose)
        {
            result.Status = EligibilityStatus.Potential;
            result.MatchScore = 50;
            result.Explanation = "EB-5 requires investment of $800,000 (TEA) or $1,050,000 (non-TEA) and creating 10 full-time jobs.";
            result.MissingInformation.Add("Investment capital availability ($800K-$1.05M)");
        }
        else
        {
            result.Status = EligibilityStatus.NotEligible;
            result.MatchScore = 10;
            result.Explanation = "EB-5 is for immigrant investors. Your purpose does not match this category.";
        }

        return result;
    }

    private VisaEvaluationResult EvaluateFamilySpouse(VisaType visa, Dictionary<string, string> answers, User? user)
    {
        var result = new VisaEvaluationResult { MatchScore = 30 };

        bool hasFamilyPurpose = answers.TryGetValue("purpose", out var purpose) &&
            purpose.Contains("family", StringComparison.OrdinalIgnoreCase);

        bool hasUSCitizenSpouse = answers.TryGetValue("us_citizen_spouse", out var spouse) &&
            spouse.Equals("yes", StringComparison.OrdinalIgnoreCase);

        if (hasFamilyPurpose && hasUSCitizenSpouse)
        {
            result.Status = EligibilityStatus.Eligible;
            result.MatchScore = 95;
            result.Explanation = "You are married to a US citizen, making you eligible for an immediate relative immigrant visa (IR-1/CR-1).";
        }
        else if (hasFamilyPurpose)
        {
            result.Status = EligibilityStatus.Potential;
            result.MatchScore = 55;
            result.Explanation = "Family-based immigration requires a qualifying family relationship with a US citizen or permanent resident.";
            result.MissingInformation.Add("US citizen or permanent resident family relationship");
        }
        else
        {
            result.Status = EligibilityStatus.NotEligible;
            result.MatchScore = 15;
            result.Explanation = "This is a family-based visa. Your purpose does not match this category.";
        }

        return result;
    }

    private VisaEvaluationResult EvaluateAdoption(VisaType visa, Dictionary<string, string> answers, User? user)
    {
        var result = new VisaEvaluationResult { MatchScore = 20 };

        bool hasAdoptionPurpose = answers.TryGetValue("purpose", out var purpose) &&
            purpose.Contains("adoption", StringComparison.OrdinalIgnoreCase);

        if (hasAdoptionPurpose)
        {
            result.Status = EligibilityStatus.Eligible;
            result.MatchScore = 90;
            result.Explanation = "You are adopting a child from another country. Adoption visas (IR-3/IR-4) facilitate this process.";
        }
        else
        {
            result.Status = EligibilityStatus.NotEligible;
            result.MatchScore = 10;
            result.Explanation = "This visa is specifically for international adoption cases.";
        }

        return result;
    }

    private VisaEvaluationResult EvaluateCitizenship(VisaType visa, Dictionary<string, string> answers, User? user)
    {
        var result = new VisaEvaluationResult { MatchScore = 20 };

        bool hasCitizenshipPurpose = answers.TryGetValue("purpose", out var purpose) &&
            purpose.Contains("citizenship", StringComparison.OrdinalIgnoreCase);

        bool hasPermanentResident = answers.TryGetValue("permanent_resident", out var pr) &&
            pr.Equals("yes", StringComparison.OrdinalIgnoreCase);

        if (hasCitizenshipPurpose || hasPermanentResident)
        {
            result.Status = EligibilityStatus.Eligible;
            result.MatchScore = 85;
            result.Explanation = "You may be eligible for US citizenship through naturalization (N-400) if you've been a permanent resident for 3-5 years.";
        }
        else
        {
            result.Status = EligibilityStatus.NotEligible;
            result.MatchScore = 10;
            result.Explanation = "Citizenship/naturalization requires existing permanent resident status or other qualifying circumstances.";
        }

        return result;
    }

    private VisaEvaluationResult EvaluateGeneric(VisaType visa, Dictionary<string, string> answers, User? user)
    {
        // Generic scoring based on visa category
        var result = new VisaEvaluationResult
        {
            Status = EligibilityStatus.Potential,
            MatchScore = 50,
            Explanation = $"{visa.Name} may be an option depending on your specific circumstances. Further evaluation needed."
        };

        result.MissingInformation.Add("Detailed information about your specific situation");

        return result;
    }

    #endregion

    private List<string> GetRequiredDocuments(VisaType visa)
    {
        // This would ideally come from database configuration
        // For now, return common documents based on visa type

        var docs = new List<string> { "Valid Passport", "Passport Photos", "Application Form" };

        switch (visa.Code.ToUpper(CultureInfo.InvariantCulture))
        {
            case "H-1B":
                docs.AddRange(new[] {
                    "Labor Condition Application (LCA)",
                    "Form I-129 Petition",
                    "Educational Credentials",
                    "Employment Letter",
                    "Resume/CV"
                });
                break;

            case "F-1":
                docs.AddRange(new[] {
                    "Form I-20",
                    "SEVIS Fee Receipt",
                    "Academic Transcripts",
                    "Financial Support Evidence",
                    "Acceptance Letter"
                });
                break;

            case "B-2":
                docs.AddRange(new[] {
                    "Travel Itinerary",
                    "Proof of Ties to Home Country",
                    "Financial Statements",
                    "Return Ticket"
                });
                break;

            case "EB-5":
                docs.AddRange(new[] {
                    "Form I-526 Petition",
                    "Source of Funds Documentation",
                    "Business Plan",
                    "Economic Analysis",
                    "Investment Documents"
                });
                break;
        }

        return docs;
    }

    private List<string> GetKeyBenefits(VisaType visa)
    {
        var benefits = new List<string>();

        switch (visa.Code.ToUpper(CultureInfo.InvariantCulture))
        {
            case "H-1B":
                benefits.AddRange(new[] {
                    "Work authorization for up to 6 years",
                    "Dual intent (can pursue green card)",
                    "Spouse can apply for work authorization (H-4 EAD)",
                    "Renewable in 3-year increments"
                });
                break;

            case "F-1":
                benefits.AddRange(new[] {
                    "Study at US educational institutions",
                    "On-campus employment allowed",
                    "Optional Practical Training (OPT) available",
                    "STEM OPT extension possible (24 months)"
                });
                break;

            case "B-2":
                benefits.AddRange(new[] {
                    "Stay up to 6 months per visit",
                    "Multiple entry possible",
                    "Tourism and family visits",
                    "Medical treatment allowed"
                });
                break;

            case "EB-5":
                benefits.AddRange(new[] {
                    "Direct path to permanent residence",
                    "No employer sponsor required",
                    "Family members included",
                    "Live and work anywhere in US"
                });
                break;

            case "O-1":
                benefits.AddRange(new[] {
                    "For individuals with extraordinary ability",
                    "No annual cap or lottery",
                    "Initially up to 3 years",
                    "Unlimited 1-year extensions"
                });
                break;

            case "IR-1":
            case "CR-1":
                benefits.AddRange(new[] {
                    "Immediate permanent residence",
                    "No waiting period for work authorization",
                    "Path to citizenship after 3 years",
                    "Sponsor is immediate family member"
                });
                break;
        }

        return benefits;
    }

    private int CalculateAge(DateTime dateOfBirth)
    {
        var today = DateTime.Today;
        var age = today.Year - dateOfBirth.Year;
        if (dateOfBirth.Date > today.AddYears(-age)) age--;
        return age;
    }

    #endregion
}
