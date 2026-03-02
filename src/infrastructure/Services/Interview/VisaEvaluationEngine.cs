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

        // Logic Alignment: Filter by 'intent_type' if present
        var intentType = answers.FirstOrDefault(a => a.QuestionKey.Equals("intent_type", StringComparison.OrdinalIgnoreCase))?.AnswerValue;
        if (!string.IsNullOrEmpty(intentType))
        {
            profileFiltered = profileFiltered.Where(v => IsCompatibleWithIntent(v, intentType)).ToList();
        }

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
            // Future age filtering logic here
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

        // Code-Review Regression Fix: Filter null AnswerValues before conversion
        var answerDict = answers
            .Where(a => a.AnswerValue != null)
            .ToDictionary(
                a => a.QuestionKey,
                a => a.AnswerValue!,
                StringComparer.OrdinalIgnoreCase);

        // Logic Alignment: Map AI-captured intents and Category selections to Legal Vocabulary
        if (answerDict.TryGetValue("ai_agent_initial_purpose", out var aiPurpose) ||
            answerDict.TryGetValue("intent_purpose", out aiPurpose) ||
            answerDict.TryGetValue("category", out aiPurpose))
        {
            // Vocabulary Harmonization: category values → purpose
            string mappedPurpose = aiPurpose.ToLower() switch
            {
                "work" or "work_visa" or "green_card_employment" => "professional",
                "study" or "student_visa" => "student",
                "tourism" or "visit" or "vacation" or "visitor_visa" => "visitor",
                "investment" or "eb5" or "investor" => "investor",
                "family" or "green_card_family" or "family_petition" => "family",
                _ => aiPurpose
            };

            if (!answerDict.ContainsKey("purpose"))
            {
                answerDict["purpose"] = mappedPurpose;
            }
        }

        // Vocabulary Mismatch Fix: map employment_status and educational_goals to purpose
        // when category hasn't been answered yet — prevents incorrect NotEligible verdicts
        // for H-1B/F-1 at the employment/education branching stage.
        if (!answerDict.ContainsKey("purpose"))
        {
            if (answerDict.TryGetValue("educational_goals", out var eduGoal) &&
                eduGoal.Equals("yes", StringComparison.OrdinalIgnoreCase))
            {
                answerDict["purpose"] = "student";
            }
            else if (answerDict.TryGetValue("employment_status", out var empStatus) &&
                     empStatus is "employed_full" or "employed_part" or "self_employed")
            {
                answerDict["purpose"] = "professional";
            }
            else if (answerDict.TryGetValue("employment_status", out var empStatus2) &&
                     empStatus2.Equals("student", StringComparison.OrdinalIgnoreCase))
            {
                answerDict["purpose"] = "student";
            }
        }

        // Guard: if category/purpose not yet established, no specific evaluator can fire
        // correctly — keep every compatible visa as Potential rather than eliminating it.
        // This prevents the "B-1 singularity" where B-1 wins by default because all
        // specifically-evaluated visas return NotEligible before purpose is known.
        if (!answerDict.ContainsKey("purpose"))
        {
            result.Status = EligibilityStatus.Potential;
            result.MatchScore = 40;
            result.Explanation = $"{visa.Name} is being evaluated — more information needed.";
            result.MissingInformation.Add("Category / purpose not yet specified");
            result.VisaType = visa;
            result.RequiredDocuments = GetRequiredDocuments(visa);
            result.KeyBenefits = GetKeyBenefits(visa);
            return result;
        }

        // Evaluate based on visa code
        switch (visa.Code.ToUpper(CultureInfo.InvariantCulture))
        {
            case "B-1": // Business Visitor (must be evaluated explicitly — not via EvaluateGeneric)
                result = EvaluateB1(visa, answerDict, user);
                break;

            case "B-2": // Tourist/Visitor
                result = EvaluateB2(visa, answerDict, user);
                break;

            case "B-1/B-2": // Combined
                result = EvaluateB1B2(visa, answerDict, user);
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

    private VisaEvaluationResult EvaluateB1(VisaType visa, Dictionary<string, string> answers, User? user)
    {
        var result = new VisaEvaluationResult { MatchScore = 40 };

        bool hasBusinessPurpose = answers.TryGetValue("purpose", out var purpose) &&
            (purpose.Contains("visitor", StringComparison.OrdinalIgnoreCase) ||
             purpose.Contains("business", StringComparison.OrdinalIgnoreCase));

        bool hasOtherIntent = answers.TryGetValue("purpose", out var p) &&
            (p.Contains("professional", StringComparison.OrdinalIgnoreCase) ||
             p.Contains("student", StringComparison.OrdinalIgnoreCase) ||
             p.Contains("investor", StringComparison.OrdinalIgnoreCase));

        if (hasBusinessPurpose && !hasOtherIntent)
        {
            result.Status = EligibilityStatus.Eligible;
            result.MatchScore = 80;
            result.Explanation = "You are visiting for temporary business activities (meetings, conferences, negotiations).";
        }
        else if (hasBusinessPurpose)
        {
            result.Status = EligibilityStatus.Potential;
            result.MatchScore = 55;
            result.Explanation = "B-1 is for business visits, but your other stated goals may require a specialized visa.";
        }
        else
        {
            result.Status = EligibilityStatus.NotEligible;
            result.MatchScore = 10;
            result.Explanation = "B-1 visa is for temporary business visitors only.";
        }

        return result;
    }

    private VisaEvaluationResult EvaluateB1B2(VisaType visa, Dictionary<string, string> answers, User? user)
    {
        var result = new VisaEvaluationResult { MatchScore = 40 };

        bool hasVisitorPurpose = answers.TryGetValue("purpose", out var purpose) &&
            (purpose.Contains("visitor", StringComparison.OrdinalIgnoreCase) ||
             purpose.Contains("visit", StringComparison.OrdinalIgnoreCase) ||
             purpose.Contains("vacation", StringComparison.OrdinalIgnoreCase) ||
             purpose.Contains("business", StringComparison.OrdinalIgnoreCase));

        if (hasVisitorPurpose)
        {
            result.Status = EligibilityStatus.Potential;
            result.MatchScore = 70;
            result.Explanation = "B-1/B-2 combined visa may cover both business and tourism purposes.";
        }
        else
        {
            result.Status = EligibilityStatus.NotEligible;
            result.MatchScore = 10;
            result.Explanation = "B-1/B-2 combined visa is for business and/or tourism visits.";
        }

        return result;
    }

    private VisaEvaluationResult EvaluateB2(VisaType visa, Dictionary<string, string> answers, User? user)
    {
        var result = new VisaEvaluationResult { MatchScore = 40 };

        // Code-Review Regression Fix: Remove redundant 'tourism' comparison
        bool hasVisitPurpose = answers.TryGetValue("purpose", out var purpose) &&
            (purpose.Contains("visitor", StringComparison.OrdinalIgnoreCase) ||
             purpose.Contains("visit", StringComparison.OrdinalIgnoreCase) ||
             purpose.Contains("vacation", StringComparison.OrdinalIgnoreCase));

        // Fix B-1 bias: Only give high score if explicitly for tourism/visit and NOT for work/study
        bool hasOtherIntent = answers.TryGetValue("purpose", out var p) && 
            (p.Contains("professional", StringComparison.OrdinalIgnoreCase) || 
             p.Contains("student", StringComparison.OrdinalIgnoreCase) ||
             p.Contains("investor", StringComparison.OrdinalIgnoreCase));

        if (hasVisitPurpose && !hasOtherIntent)
        {
            result.Status = EligibilityStatus.Eligible;
            result.MatchScore = 85; 
            result.Explanation = "You are visiting the US for tourism/vacation purposes.";
        }
        else if (hasVisitPurpose)
        {
            result.Status = EligibilityStatus.Potential;
            result.MatchScore = 60;
            result.Explanation = "B-2 is an option for temporary visits, but your other stated goals might be better served by a specialized visa.";
        }
        else
        {
            result.Status = EligibilityStatus.NotEligible;
            result.MatchScore = 10;
            result.Explanation = "B-2 visa is for tourism and temporary visits.";
        }

        return result;
    }

    private VisaEvaluationResult EvaluateH1B(VisaType visa, Dictionary<string, string> answers, User? user)
    {
        var result = new VisaEvaluationResult { MatchScore = 30 };

        bool hasWorkPurpose = answers.TryGetValue("purpose", out var purpose) &&
            (purpose.Contains("professional", StringComparison.OrdinalIgnoreCase) || 
             purpose.Contains("employment", StringComparison.OrdinalIgnoreCase) ||
             purpose.Contains("work", StringComparison.OrdinalIgnoreCase));

        bool hasEmployerSponsor = answers.TryGetValue("employer_sponsor", out var sponsor) &&
            (sponsor.Equals("yes", StringComparison.OrdinalIgnoreCase) || sponsor.Equals("true", StringComparison.OrdinalIgnoreCase));

        bool hasBachelors = answers.TryGetValue("education_level", out var education) &&
            (education.Contains("bachelor", StringComparison.OrdinalIgnoreCase) ||
             education.Contains("master", StringComparison.OrdinalIgnoreCase) ||
             education.Contains("phd", StringComparison.OrdinalIgnoreCase) ||
             education.Contains("doctorate", StringComparison.OrdinalIgnoreCase) ||
             education.Contains("professional", StringComparison.OrdinalIgnoreCase));

        if (hasWorkPurpose && hasEmployerSponsor && hasBachelors)
        {
            result.Status = EligibilityStatus.Eligible;
            result.MatchScore = 95;
            result.Explanation = "You have a US employer sponsor and a bachelor's degree or higher, making you highly eligible for an H-1B visa.";
        }
        else if (hasWorkPurpose)
        {
            result.Status = EligibilityStatus.Potential;
            result.MatchScore = hasEmployerSponsor || hasBachelors ? 75 : 55;
            result.Explanation = "H-1B is a primary option for professional employment. We need to verify your employer sponsorship and education level.";
            
            if (!hasEmployerSponsor) result.MissingInformation.Add("US employer sponsorship");
            if (!hasBachelors) result.MissingInformation.Add("Bachelor's degree or higher");
        }
        else
        {
            result.Status = EligibilityStatus.NotEligible;
            result.MatchScore = 15;
            result.Explanation = "H-1B visa is for professional work in specialty occupations.";
        }

        return result;
    }

    private VisaEvaluationResult EvaluateF1(VisaType visa, Dictionary<string, string> answers, User? user)
    {
        var result = new VisaEvaluationResult { MatchScore = 30 };

        bool hasStudyPurpose = answers.TryGetValue("purpose", out var purpose) &&
            (purpose.Contains("student", StringComparison.OrdinalIgnoreCase) ||
             purpose.Contains("study", StringComparison.OrdinalIgnoreCase) ||
             purpose.Contains("education", StringComparison.OrdinalIgnoreCase));

        if (hasStudyPurpose)
        {
            result.Status = EligibilityStatus.Eligible;
            result.MatchScore = 92;
            result.Explanation = "You are coming to study in the US, making the F-1 student visa your primary option.";
        }
        else if (answers.TryGetValue("intent_type", out var intent) && intent.Contains("nonimmigrant", StringComparison.OrdinalIgnoreCase) && hasStudyPurpose)
        {
            result.Status = EligibilityStatus.Eligible;
            result.MatchScore = 92;
        }
        else
        {
            result.Status = EligibilityStatus.NotEligible;
            result.MatchScore = 15;
            result.Explanation = "F-1 visa is for academic studies.";
        }

        return result;
    }

    private VisaEvaluationResult EvaluateO1(VisaType visa, Dictionary<string, string> answers, User? user)
    {
        var result = new VisaEvaluationResult { MatchScore = 20 };

        bool hasWorkPurpose = answers.TryGetValue("purpose", out var purpose) &&
            (purpose.Contains("professional", StringComparison.OrdinalIgnoreCase) || purpose.Contains("work", StringComparison.OrdinalIgnoreCase));

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
            result.Explanation = "O-1 visa is for individuals with extraordinary ability.";
            result.MissingInformation.Add("Evidence of extraordinary ability");
        }
        else
        {
            result.Status = EligibilityStatus.NotEligible;
            result.MatchScore = 10;
            result.Explanation = "O-1 visa is for work requiring extraordinary ability.";
        }

        return result;
    }

    private VisaEvaluationResult EvaluateEB5(VisaType visa, Dictionary<string, string> answers, User? user)
    {
        var result = new VisaEvaluationResult { MatchScore = 20 };

        bool hasInvestmentPurpose = answers.TryGetValue("purpose", out var purpose) &&
            (purpose.Contains("investor", StringComparison.OrdinalIgnoreCase) || purpose.Contains("invest", StringComparison.OrdinalIgnoreCase));

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
            result.Explanation = "EB-5 requires investment of $800,000 (TEA) or $1,050,000 (non-TEA).";
            result.MissingInformation.Add("Investment capital availability");
        }
        else
        {
            result.Status = EligibilityStatus.NotEligible;
            result.MatchScore = 10;
            result.Explanation = "EB-5 is for immigrant investors.";
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
            result.Explanation = "You are married to a US citizen, making you eligible for an immediate relative immigrant visa.";
        }
        else if (hasFamilyPurpose)
        {
            result.Status = EligibilityStatus.Potential;
            result.MatchScore = 55;
            result.Explanation = "Family-based immigration requires a qualifying family relationship.";
            result.MissingInformation.Add("US citizen or permanent resident family relationship");
        }
        else
        {
            result.Status = EligibilityStatus.NotEligible;
            result.MatchScore = 15;
            result.Explanation = "This is a family-based visa.";
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
            result.Explanation = "You are adopting a child from another country.";
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
            result.Explanation = "You may be eligible for US citizenship through naturalization.";
        }
        else
        {
            result.Status = EligibilityStatus.NotEligible;
            result.MatchScore = 10;
            result.Explanation = "Citizenship/naturalization requires existing permanent resident status.";
        }

        return result;
    }

    private VisaEvaluationResult EvaluateGeneric(VisaType visa, Dictionary<string, string> answers, User? user)
    {
        var result = new VisaEvaluationResult
        {
            Status = EligibilityStatus.Potential,
            MatchScore = 50,
            Explanation = $"{visa.Name} may be an option depending on your specific circumstances."
        };

        result.MissingInformation.Add("Detailed information about your situation");

        return result;
    }

    #endregion

    private List<string> GetRequiredDocuments(VisaType visa)
    {
        var docs = new List<string> { "Valid Passport", "Passport Photos", "Application Form" };

        switch (visa.Code.ToUpper(CultureInfo.InvariantCulture))
        {
            case "H-1B":
                docs.AddRange(new[] { "LCA", "Form I-129", "Educational Credentials", "Resume/CV" });
                break;
            case "F-1":
                docs.AddRange(new[] { "Form I-20", "SEVIS Receipt", "Academic Transcripts", "Acceptance Letter" });
                break;
            case "B-2":
                docs.AddRange(new[] { "Travel Itinerary", "Proof of Ties", "Financial Statements" });
                break;
            case "EB-5":
                docs.AddRange(new[] { "Form I-526", "Source of Funds", "Business Plan" });
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
                benefits.AddRange(new[] { "Work up to 6 years", "Dual intent", "H-4 EAD for spouse" });
                break;
            case "F-1":
                benefits.AddRange(new[] { "Study in US", "On-campus work", "OPT/STEM OPT" });
                break;
            case "B-2":
                benefits.AddRange(new[] { "Stay up to 6 months", "Tourism/Visit", "Medical treatment" });
                break;
            case "EB-5":
                benefits.AddRange(new[] { "Green Card", "No sponsor needed", "Family included" });
                break;
        }

        return benefits;
    }

    private bool IsCompatibleWithIntent(VisaType visa, string intentType)
    {
        var code = visa.Code.ToUpper(CultureInfo.InvariantCulture);
        bool isImmigrantIntent = intentType.Equals("immigrant", StringComparison.OrdinalIgnoreCase);

        // List of Immigrant Visa Codes
        var immigrantCodes = new[] { "IR-1", "CR-1", "EB-1", "EB-2", "EB-3", "EB-4", "EB-5", "N-400", "N-600", "NATZ", "ADOP" };
        
        bool isImmigrantVisa = immigrantCodes.Any(c => code.Contains(c));

        // Note: Some codes like F1-IM are for family preference but might be handled specifically.
        if (code.Contains("F1-IM") || code.Contains("F2A") || code.Contains("F2B") || code.Contains("F3-IM") || code.Contains("F4"))
        {
            isImmigrantVisa = true;
        }

        return isImmigrantIntent == isImmigrantVisa;
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
