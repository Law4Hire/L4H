using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace L4H.Infrastructure.Services;

/// <summary>
/// Service for managing citizenship and naturalization cases (N-400, N-600)
/// </summary>
public interface ICitizenshipCaseService
{
    Task<CitizenshipCase> CreateCitizenshipCaseAsync(CaseId caseId, CitizenshipApplicationRequest request);
    Task<CitizenshipCase?> GetCitizenshipCaseAsync(CaseId caseId);
    Task<CitizenshipCase> UpdateCitizenshipCaseAsync(CitizenshipCase citizenshipCase);
    Task<CitizenshipRecommendationResult> GetCitizenshipRecommendationAsync(CitizenshipInterviewAnswers answers);
    Task<List<string>> GetRequiredDocumentsAsync(CitizenshipApplicationType applicationType);
    Task<bool> IsEligibleForCitizenshipAsync(CitizenshipInterviewAnswers answers);
    Task<CitizenshipTestInformation> GetTestRequirementsAsync(CitizenshipInterviewAnswers answers);
}

public class CitizenshipCaseService : ICitizenshipCaseService
{
    private readonly L4HDbContext _context;
    private readonly ILogger<CitizenshipCaseService> _logger;

    public CitizenshipCaseService(L4HDbContext context, ILogger<CitizenshipCaseService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<CitizenshipCase> CreateCitizenshipCaseAsync(CaseId caseId, CitizenshipApplicationRequest request)
    {
        _logger.LogInformation("Creating citizenship case for CaseId: {CaseId}, Type: {ApplicationType}", 
            caseId, request.ApplicationType);

        var citizenshipCase = new CitizenshipCase
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            ApplicationType = request.ApplicationType,
            Status = "Created",
            CreatedAt = DateTime.UtcNow,
            
            // Personal Information
            CurrentLegalName = request.Personal.CurrentLegalName,
            NameAtBirth = request.Personal.NameAtBirth,
            HasNameChanged = request.Personal.HasNameChanged,
            DateOfBirth = request.Personal.DateOfBirth,
            CountryOfBirth = request.Personal.CountryOfBirth,
            CityOfBirth = request.Personal.CityOfBirth,
            CurrentNationality = request.Personal.CurrentNationality,
            MaritalStatus = request.Personal.MaritalStatus,
            
            // Residency Information
            PermanentResidencyDate = request.Residency.PermanentResidencyDate,
            GreenCardNumber = request.Residency.GreenCardNumber,
            YearsAsResident = request.Residency.YearsAsResident,
            MonthsPhysicallyPresent = request.Residency.MonthsPhysicallyPresent,
            ContinuousResidence = request.Residency.ContinuousResidence,
            HasAbsencesOver6Months = request.Residency.AbsencesFromUS.Any(a => a.WasOver6Months),
            
            // Eligibility Information
            MeetsResidencyRequirement = request.Eligibility.MeetsResidencyRequirement,
            MeetsPhysicalPresenceRequirement = request.Eligibility.MeetsPhysicalPresenceRequirement,
            HasGoodMoralCharacter = request.Eligibility.HasGoodMoralCharacter,
            AttachedToConstitution = request.Eligibility.AttachedToConstitution,
            WillingToTakeOath = request.Eligibility.WillingToTakeOath,
            HasMilitaryService = request.Eligibility.MilitaryService?.HasServed ?? false,
            QualifiesForExceptions = request.Eligibility.QualifiesForExceptions,
            
            // Language Information
            SpeakingLevel = request.Language.SpeakingLevel,
            ReadingLevel = request.Language.ReadingLevel,
            WritingLevel = request.Language.WritingLevel,
            NeedsInterpreter = request.Language.NeedsInterpreter,
            PreferredLanguage = request.Language.PreferredLanguage,
            QualifiesForLanguageException = request.Language.QualifiesForLanguageException,
            
            // Background Information
            HasCriminalHistory = request.Background.HasCriminalHistory,
            HasTaxIssues = request.Background.HasTaxIssues,
            HasImmigrationViolations = request.Background.HasImmigrationViolations,
            HasFailedToRegisterForDraft = request.Background.HasFailedToRegisterForDraft,
            HasClaimedUSCitizenshipFalsely = request.Background.HasClaimedUSCitizenshipFalsely,
            HasVotedIllegally = request.Background.HasVotedIllegally,
            HasBeenDeported = request.Background.HasBeenDeported,
            HasTerroristConnections = request.Background.HasTerroristConnections
        };

        _context.CitizenshipCases.Add(citizenshipCase);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        _logger.LogInformation("Created citizenship case with Id: {CitizenshipCaseId}", citizenshipCase.Id);
        return citizenshipCase;
    }

    public async Task<CitizenshipCase?> GetCitizenshipCaseAsync(CaseId caseId)
    {
        return await _context.CitizenshipCases
            .Include(c => c.Documents)
            .Include(c => c.TestResults)
            .FirstOrDefaultAsync(c => c.CaseId == caseId).ConfigureAwait(false);
    }

    public async Task<CitizenshipCase> UpdateCitizenshipCaseAsync(CitizenshipCase citizenshipCase)
    {
        citizenshipCase.UpdatedAt = DateTime.UtcNow;
        _context.CitizenshipCases.Update(citizenshipCase);
        await _context.SaveChangesAsync().ConfigureAwait(false);
        return citizenshipCase;
    }

    public async Task<CitizenshipRecommendationResult> GetCitizenshipRecommendationAsync(CitizenshipInterviewAnswers answers)
    {
        _logger.LogInformation("Generating citizenship recommendation for application type: {ApplicationType}", 
            answers.ApplicationType);

        var result = new CitizenshipRecommendationResult();

        // Determine eligibility and recommended application type
        if (answers.ApplicationType == CitizenshipApplicationType.N400_Naturalization || 
            answers.CurrentStatus == "permanent_resident")
        {
            result = await EvaluateN400EligibilityAsync(answers).ConfigureAwait(false);
        }
        else if (answers.ApplicationType == CitizenshipApplicationType.N600_CertificateOfCitizenship ||
                 answers.CurrentStatus == "derived_citizen" || 
                 answers.CurrentStatus == "us_citizen_born_abroad")
        {
            result = await EvaluateN600EligibilityAsync(answers).ConfigureAwait(false);
        }
        else
        {
            result.IsEligible = false;
            result.EligibilityReason = "Unable to determine appropriate citizenship application based on current status.";
        }

        // Add test requirements
        result.TestRequirements = await GetTestRequirementsAsync(answers).ConfigureAwait(false);

        // Add required documents
        result.RequiredDocuments = await GetRequiredDocumentsAsync(result.RecommendedApplication).ConfigureAwait(false);

        // Add next steps
        result.NextSteps = GetNextSteps(result.RecommendedApplication, result.IsEligible);

        _logger.LogInformation("Citizenship recommendation completed: {RecommendedApplication}, Eligible: {IsEligible}", 
            result.RecommendedApplication, result.IsEligible);

        return result;
    }

    private static Task<CitizenshipRecommendationResult> EvaluateN400EligibilityAsync(CitizenshipInterviewAnswers answers)
    {
        var result = new CitizenshipRecommendationResult
        {
            RecommendedApplication = CitizenshipApplicationType.N400_Naturalization
        };

        var issues = new List<string>();

        // Check residency requirements
        var requiredYears = answers.MarriedToUSCitizen ? 3 : 5;
        if (answers.ResidencyYears < requiredYears)
        {
            issues.Add($"Insufficient residency period. Need {requiredYears} years, have {answers.ResidencyYears} years.");
        }

        // Check physical presence
        var requiredMonths = answers.MarriedToUSCitizen ? 18 : 30;
        if (answers.PhysicalPresenceMonths < requiredMonths)
        {
            issues.Add($"Insufficient physical presence. Need {requiredMonths} months, have {answers.PhysicalPresenceMonths} months.");
        }

        // Check continuous residence
        if (!answers.ContinuousResidence)
        {
            issues.Add("Continuous residence requirement not met.");
        }

        // Check good moral character
        if (!answers.GoodMoralCharacter || answers.CriminalHistory)
        {
            issues.Add("Good moral character requirement may not be met due to criminal history.");
        }

        // Check English and civics requirements (with exceptions)
        if (!answers.EnglishProficient && !QualifiesForEnglishException(answers))
        {
            issues.Add("English proficiency requirement not met and no qualifying exception.");
        }

        if (!answers.CivicsKnowledge && !QualifiesForCivicsException(answers))
        {
            issues.Add("Civics knowledge requirement not met and no qualifying exception.");
        }

        // Check oath willingness
        if (!answers.OathWillingness || !answers.AttachmentToConstitution)
        {
            issues.Add("Must be willing to take oath of allegiance and show attachment to Constitution.");
        }

        result.IsEligible = !issues.Any();
        result.EligibilityReason = result.IsEligible 
            ? "Meets all requirements for N-400 naturalization."
            : string.Join(" ", issues);

        result.Rationale = result.IsEligible
            ? $"Eligible for N-400 naturalization based on {(answers.MarriedToUSCitizen ? "3-year rule (married to US citizen)" : "5-year rule")}."
            : $"Not currently eligible for N-400 naturalization: {result.EligibilityReason}";

        // Calculate earliest application date if not eligible yet
        if (!result.IsEligible && answers.GreenCardDate.HasValue)
        {
            var earliestDate = answers.GreenCardDate.Value.AddYears(requiredYears).AddDays(-90); // Can apply 90 days early
            if (earliestDate > DateTime.Now)
            {
                result.EarliestApplicationDate = earliestDate;
            }
        }

        result.ProcessingTimeEstimate = "8-12 months";
        result.PotentialIssues = issues;

        return Task.FromResult(result);
    }

    private static Task<CitizenshipRecommendationResult> EvaluateN600EligibilityAsync(CitizenshipInterviewAnswers answers)
    {
        var result = new CitizenshipRecommendationResult
        {
            RecommendedApplication = CitizenshipApplicationType.N600_CertificateOfCitizenship
        };

        var issues = new List<string>();

        // Check if parent is/was US citizen
        if (!answers.ParentUSCitizen)
        {
            issues.Add("At least one parent must be a US citizen.");
        }

        // Check if born abroad
        if (!answers.BornAbroad)
        {
            issues.Add("N-600 is typically for those born outside the United States.");
        }

        // For children under 18 when parent naturalized
        if (answers.Under18WhenParentNaturalized)
        {
            // Check additional requirements for derived citizenship
            // This is a simplified check - actual requirements are more complex
            if (!answers.ParentUSCitizen)
            {
                issues.Add("Parent must have been or become a US citizen before child's 18th birthday.");
            }
        }

        result.IsEligible = !issues.Any();
        result.EligibilityReason = result.IsEligible 
            ? "Meets requirements for N-600 Certificate of Citizenship."
            : string.Join(" ", issues);

        result.Rationale = result.IsEligible
            ? "Eligible for N-600 Certificate of Citizenship to document existing US citizenship."
            : $"Not eligible for N-600: {result.EligibilityReason}";

        result.ProcessingTimeEstimate = "10-14 months";
        result.PotentialIssues = issues;

        return Task.FromResult(result);
    }

    private static bool QualifiesForEnglishException(CitizenshipInterviewAnswers answers)
    {
        // Age and residency exceptions for English requirement
        var age = DateTime.Now.Year - (answers.GreenCardDate?.Year ?? DateTime.Now.Year);
        
        // 50+ years old and 20+ years as permanent resident
        if (age >= 50 && answers.ResidencyYears >= 20) return true;
        
        // 65+ years old and 5+ years as permanent resident  
        if (age >= 65 && answers.ResidencyYears >= 5) return true;
        
        // 65+ years old and 20+ years as permanent resident
        if (age >= 65 && answers.ResidencyYears >= 20) return true;

        return false;
    }

    private static bool QualifiesForCivicsException(CitizenshipInterviewAnswers answers)
    {
        // Similar age and residency exceptions for civics requirement
        return QualifiesForEnglishException(answers);
    }

    public Task<List<string>> GetRequiredDocumentsAsync(CitizenshipApplicationType applicationType)
    {
        return Task.FromResult(applicationType switch
        {
            CitizenshipApplicationType.N400_Naturalization => new List<string>
            {
                "Form N-400 (Application for Naturalization)",
                "Copy of Permanent Resident Card (Green Card)",
                "Copy of passport or travel document",
                "Two passport-style photos",
                "Marriage certificate (if applicable)",
                "Divorce decree (if applicable)",
                "Tax returns for last 5 years",
                "Selective Service registration (if applicable)",
                "Court records (if any arrests or citations)"
            },
            CitizenshipApplicationType.N600_CertificateOfCitizenship => new List<string>
            {
                "Form N-600 (Application for Certificate of Citizenship)",
                "Copy of birth certificate",
                "Copy of parent's birth certificate or naturalization certificate",
                "Evidence of parent-child relationship",
                "Copy of parent's marriage certificate (if applicable)",
                "Two passport-style photos",
                "Evidence of parent's physical presence in US (if born abroad to US citizen)"
            },
            _ => new List<string>()
        });
    }

    public async Task<bool> IsEligibleForCitizenshipAsync(CitizenshipInterviewAnswers answers)
    {
        var recommendation = await GetCitizenshipRecommendationAsync(answers).ConfigureAwait(false);
        return recommendation.IsEligible;
    }

    public Task<CitizenshipTestInformation> GetTestRequirementsAsync(CitizenshipInterviewAnswers answers)
    {
        var testInfo = new CitizenshipTestInformation();

        if (answers.ApplicationType == CitizenshipApplicationType.N400_Naturalization)
        {
            // English test requirements
            testInfo.NeedsEnglishTest = !QualifiesForEnglishException(answers);
            
            // Civics test requirements  
            testInfo.NeedsCivicsTest = !QualifiesForCivicsException(answers);
            
            if (QualifiesForEnglishException(answers) || QualifiesForCivicsException(answers))
            {
                testInfo.QualifiesForTestExemption = true;
                testInfo.ExemptionReason = "Qualifies for age and residency-based test exemption.";
            }
        }
        else
        {
            // N-600 typically doesn't require English or civics tests
            testInfo.NeedsEnglishTest = false;
            testInfo.NeedsCivicsTest = false;
            testInfo.QualifiesForTestExemption = true;
            testInfo.ExemptionReason = "N-600 applications do not require English or civics tests.";
        }

        return Task.FromResult(testInfo);
    }

    private static List<string> GetNextSteps(CitizenshipApplicationType applicationType, bool isEligible)
    {
        if (!isEligible)
        {
            return new List<string>
            {
                "Address eligibility requirements before applying",
                "Consult with an immigration attorney",
                "Gather additional documentation as needed"
            };
        }

        return applicationType switch
        {
            CitizenshipApplicationType.N400_Naturalization => new List<string>
            {
                "Complete Form N-400",
                "Gather required documents",
                "Submit application with filing fee",
                "Attend biometrics appointment",
                "Prepare for English and civics tests",
                "Attend naturalization interview",
                "Take oath of allegiance ceremony"
            },
            CitizenshipApplicationType.N600_CertificateOfCitizenship => new List<string>
            {
                "Complete Form N-600",
                "Gather required documents",
                "Submit application with filing fee",
                "Attend biometrics appointment (if required)",
                "Wait for processing and approval"
            },
            _ => new List<string>()
        };
    }
}