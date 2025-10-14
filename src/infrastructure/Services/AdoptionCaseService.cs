using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace L4H.Infrastructure.Services;

public interface IAdoptionCaseService
{
    Task<AdoptionCase> CreateAdoptionCaseAsync(AdoptionCaseRequest request);
    Task<AdoptionCase?> GetAdoptionCaseAsync(CaseId caseId);
    Task<AdoptionCase> UpdateAdoptionCaseAsync(AdoptionCase adoptionCase);
    Task<AdoptionRecommendationResult> GetAdoptionRecommendationAsync(CaseId caseId);
    Task<List<AdoptionDocument>> GetAdoptionDocumentsAsync(int adoptionCaseId);
    Task<AdoptionDocument> AddAdoptionDocumentAsync(AdoptionDocument document);
    Task<AdoptionDocument> UpdateAdoptionDocumentAsync(AdoptionDocument document);
}

public class AdoptionCaseService : IAdoptionCaseService
{
    private readonly L4HDbContext _context;
    private readonly ILogger<AdoptionCaseService> _logger;

    public AdoptionCaseService(L4HDbContext context, ILogger<AdoptionCaseService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<AdoptionCase> CreateAdoptionCaseAsync(AdoptionCaseRequest request)
    {
        try
        {
            _logger.LogInformation("Creating adoption case for CaseId {CaseId}", request.CaseId);

            var adoptionCase = new AdoptionCase
            {
                CaseId = request.CaseId,
                AdoptionType = (Entities.AdoptionType)request.AdoptionType,
                
                // Child Information
                ChildFirstName = request.Child.FirstName,
                ChildLastName = request.Child.LastName,
                ChildMiddleName = request.Child.MiddleName,
                ChildDateOfBirth = request.Child.DateOfBirth,
                ChildCountryOfBirth = request.Child.CountryOfBirth,
                ChildCityOfBirth = request.Child.CityOfBirth,
                ChildGender = request.Child.Gender,
                ChildHasSpecialNeeds = request.Child.HasSpecialNeeds,
                ChildSpecialNeedsDescription = request.Child.SpecialNeedsDescription,
                ChildMedicalConditions = request.Child.MedicalConditions,
                ChildCurrentLocation = request.Child.CurrentLocation,
                ChildCaregiverInformation = request.Child.CaregiverInformation,
                ChildLanguages = string.Join(",", request.Child.Languages),
                ChildCulturalBackground = request.Child.CulturalBackground,
                
                // Agency Information
                AgencyName = request.Agency.AgencyName,
                AgencyCountry = request.Agency.AgencyCountry,
                AgencyLicenseNumber = request.Agency.AgencyLicenseNumber,
                AgencyContactPersonName = request.Agency.ContactPersonName,
                AgencyContactEmail = request.Agency.ContactEmail,
                AgencyContactPhone = request.Agency.ContactPhone,
                IsAgencyHagueAccredited = request.Agency.IsHagueAccredited,
                AgencyAccreditationNumber = request.Agency.AccreditationNumber,
                AgencyAccreditationExpiry = request.Agency.AccreditationExpiry,
                USPartnerAgency = request.Agency.USPartnerAgency,
                
                // Home Study Information
                IsHomeStudyCompleted = request.HomeStudy.IsCompleted,
                HomeStudyCompletionDate = request.HomeStudy.CompletionDate,
                HomeStudyConductingAgency = request.HomeStudy.ConductingAgency,
                HomeStudySocialWorkerName = request.HomeStudy.SocialWorkerName,
                HomeStudySocialWorkerLicense = request.HomeStudy.SocialWorkerLicense,
                HomeStudyExpirationDate = request.HomeStudy.ExpirationDate,
                IsBackgroundCheckCompleted = request.HomeStudy.BackgroundCheckCompleted,
                IsFinancialAssessmentCompleted = request.HomeStudy.FinancialAssessmentCompleted,
                IsHomeInspectionCompleted = request.HomeStudy.HomeInspectionCompleted,
                AreReferencesVerified = request.HomeStudy.ReferencesVerified,
                HomeStudyRecommendationStatus = request.HomeStudy.RecommendationStatus,
                HomeStudyRequiredUpdates = string.Join(",", request.HomeStudy.RequiredUpdates),
                
                // Adoptive Parents Information
                IsMarriedCouple = request.Parents.IsMarriedCouple,
                PrimaryParentName = request.Parents.PrimaryParentName,
                SpouseName = request.Parents.SpouseName,
                MarriageDurationYears = request.Parents.MarriageDurationYears,
                HasPreviousChildren = request.Parents.HasPreviousChildren,
                NumberOfChildren = request.Parents.NumberOfChildren,
                MotivationForAdoption = request.Parents.MotivationForAdoption,
                HasAdoptionExperience = request.Parents.HasAdoptionExperience,
                PreviousAdoptionDetails = request.Parents.PreviousAdoptionDetails,
                HasInfertilityIssues = request.Parents.HasInfertilityIssues,
                PreferredChildAge = request.Parents.PreferredChildAge,
                PreferredChildGender = request.Parents.PreferredChildGender,
                WillingToAdoptSpecialNeeds = request.Parents.WillingToAdoptSpecialNeeds,
                AcceptableSpecialNeeds = string.Join(",", request.Parents.AcceptableSpecialNeeds),
                
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.AdoptionCases.Add(adoptionCase);
            await _context.SaveChangesAsync().ConfigureAwait(false);

            _logger.LogInformation("Created adoption case with Id {AdoptionCaseId} for CaseId {CaseId}", 
                adoptionCase.Id, request.CaseId);

            return adoptionCase;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating adoption case for CaseId {CaseId}", request.CaseId);
            throw;
        }
    }

    public async Task<AdoptionCase?> GetAdoptionCaseAsync(CaseId caseId)
    {
        try
        {
            return await _context.AdoptionCases
                .Include(ac => ac.Case)
                .FirstOrDefaultAsync(ac => ac.CaseId == caseId).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving adoption case for CaseId {CaseId}", caseId);
            throw;
        }
    }

    public async Task<AdoptionCase> UpdateAdoptionCaseAsync(AdoptionCase adoptionCase)
    {
        try
        {
            adoptionCase.UpdatedAt = DateTime.UtcNow;
            _context.AdoptionCases.Update(adoptionCase);
            await _context.SaveChangesAsync().ConfigureAwait(false);

            _logger.LogInformation("Updated adoption case with Id {AdoptionCaseId}", adoptionCase.Id);
            return adoptionCase;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating adoption case with Id {AdoptionCaseId}", adoptionCase.Id);
            throw;
        }
    }

    public async Task<AdoptionRecommendationResult> GetAdoptionRecommendationAsync(CaseId caseId)
    {
        try
        {
            var adoptionCase = await GetAdoptionCaseAsync(caseId).ConfigureAwait(false);
            if (adoptionCase == null)
            {
                throw new InvalidOperationException($"Adoption case not found for CaseId {caseId}");
            }

            var recommendation = new AdoptionRecommendationResult();

            // Determine visa type based on adoption completion status
            if (adoptionCase.IsAdoptionCompleted)
            {
                recommendation.RecommendedVisaType = Shared.Models.AdoptionVisaType.IR3;
                recommendation.Rationale = "IR-3 visa is recommended because the adoption has been completed abroad. " +
                    "This visa is for children whose adoption was finalized in their country of birth by US citizen parents.";
            }
            else
            {
                recommendation.RecommendedVisaType = Shared.Models.AdoptionVisaType.IR4;
                recommendation.Rationale = "IR-4 visa is recommended because the adoption will be completed in the United States. " +
                    "This visa is for children who will complete their adoption process in the US.";
            }

            // Assess eligibility
            var eligibilityIssues = new List<string>();
            
            if (!adoptionCase.IsHomeStudyCompleted)
            {
                eligibilityIssues.Add("Home study must be completed and approved");
            }
            
            if (adoptionCase.HomeStudyExpirationDate.HasValue && 
                adoptionCase.HomeStudyExpirationDate.Value < DateTime.UtcNow)
            {
                eligibilityIssues.Add("Home study has expired and needs to be updated");
            }
            
            if (!adoptionCase.IsAgencyHagueAccredited && adoptionCase.AdoptionType == Entities.AdoptionType.International)
            {
                eligibilityIssues.Add("International adoptions typically require a Hague-accredited agency");
            }

            recommendation.IsEligible = eligibilityIssues.Count == 0;
            recommendation.EligibilityReason = recommendation.IsEligible 
                ? "All basic requirements appear to be met" 
                : string.Join("; ", eligibilityIssues);

            // Required documents
            recommendation.RequiredDocuments = GetRequiredDocuments(adoptionCase);
            
            // Next steps
            recommendation.NextSteps = GetNextSteps(adoptionCase);
            
            // Potential issues
            recommendation.PotentialIssues = GetPotentialIssues(adoptionCase);

            return recommendation;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating adoption recommendation for CaseId {CaseId}", caseId);
            throw;
        }
    }

    public async Task<List<AdoptionDocument>> GetAdoptionDocumentsAsync(int adoptionCaseId)
    {
        try
        {
            return await _context.AdoptionDocuments
                .Include(ad => ad.Upload)
                .Where(ad => ad.AdoptionCaseId == adoptionCaseId)
                .OrderBy(ad => ad.DocumentType)
                .ThenBy(ad => ad.CreatedAt)
                .ToListAsync().ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving adoption documents for AdoptionCaseId {AdoptionCaseId}", adoptionCaseId);
            throw;
        }
    }

    public async Task<AdoptionDocument> AddAdoptionDocumentAsync(AdoptionDocument document)
    {
        try
        {
            document.CreatedAt = DateTime.UtcNow;
            document.UpdatedAt = DateTime.UtcNow;
            
            _context.AdoptionDocuments.Add(document);
            await _context.SaveChangesAsync().ConfigureAwait(false);

            _logger.LogInformation("Added adoption document {DocumentType} for AdoptionCaseId {AdoptionCaseId}", 
                document.DocumentType, document.AdoptionCaseId);

            return document;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding adoption document {DocumentType} for AdoptionCaseId {AdoptionCaseId}", 
                document.DocumentType, document.AdoptionCaseId);
            throw;
        }
    }

    public async Task<AdoptionDocument> UpdateAdoptionDocumentAsync(AdoptionDocument document)
    {
        try
        {
            document.UpdatedAt = DateTime.UtcNow;
            _context.AdoptionDocuments.Update(document);
            await _context.SaveChangesAsync().ConfigureAwait(false);

            _logger.LogInformation("Updated adoption document with Id {DocumentId}", document.Id);
            return document;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating adoption document with Id {DocumentId}", document.Id);
            throw;
        }
    }

    private static List<string> GetRequiredDocuments(AdoptionCase adoptionCase)
    {
        var documents = new List<string>();

        // Child documents
        documents.Add("Child's birth certificate");
        documents.Add("Child's passport");
        documents.Add("Child's medical records");
        documents.Add("Recent photographs of child");

        if (adoptionCase.IsAdoptionCompleted)
        {
            documents.Add("Final adoption decree from foreign court");
        }
        else
        {
            documents.Add("Legal custody documents or guardianship papers");
        }

        // Parent documents
        documents.Add("Birth certificates of adoptive parents");
        if (adoptionCase.IsMarriedCouple)
        {
            documents.Add("Marriage certificate");
        }
        documents.Add("Financial documents (tax returns, bank statements)");
        documents.Add("Employment verification letters");
        documents.Add("Medical examinations for adoptive parents");
        documents.Add("Criminal background checks");
        documents.Add("Child abuse clearances");

        // Home study and agency documents
        documents.Add("Completed home study report");
        documents.Add("Agency recommendation letter");

        // USCIS forms
        documents.Add("Form I-600A (Application for Advance Processing)");
        if (adoptionCase.IsAdoptionCompleted)
        {
            documents.Add("Form I-600 (Petition to Classify Orphan as Immediate Relative)");
        }

        return documents;
    }

    private static List<string> GetNextSteps(AdoptionCase adoptionCase)
    {
        var steps = new List<string>();

        if (!adoptionCase.IsHomeStudyCompleted)
        {
            steps.Add("Complete home study with approved agency");
        }

        if (!adoptionCase.HasI600APetition)
        {
            steps.Add("File Form I-600A with USCIS");
        }

        if (adoptionCase.IsAdoptionCompleted && !adoptionCase.HasI600Petition)
        {
            steps.Add("File Form I-600 with USCIS");
        }

        steps.Add("Gather all required documentation");
        steps.Add("Schedule consular interview at US embassy/consulate");
        steps.Add("Complete medical examination for child");
        steps.Add("Obtain child's immigrant visa");
        steps.Add("Travel to US with child");

        if (!adoptionCase.IsAdoptionCompleted)
        {
            steps.Add("Complete adoption process in US state court");
            steps.Add("Apply for Certificate of Citizenship (Form N-600)");
        }

        return steps;
    }

    private static List<string> GetPotentialIssues(AdoptionCase adoptionCase)
    {
        var issues = new List<string>();

        if (adoptionCase.ChildHasSpecialNeeds)
        {
            issues.Add("Special needs children may require additional medical documentation and evaluations");
        }

        if (!adoptionCase.IsAgencyHagueAccredited && adoptionCase.AdoptionType == Entities.AdoptionType.International)
        {
            issues.Add("Non-Hague accredited agencies may face additional scrutiny and requirements");
        }

        if (adoptionCase.HomeStudyExpirationDate.HasValue && 
            adoptionCase.HomeStudyExpirationDate.Value < DateTime.UtcNow.AddMonths(6))
        {
            issues.Add("Home study expires soon and may need updating during the process");
        }

        var childAge = DateTime.UtcNow.Year - adoptionCase.ChildDateOfBirth.Year;
        if (childAge >= 16)
        {
            issues.Add("Older children may require additional documentation and interviews");
        }

        if (!adoptionCase.IsMarriedCouple)
        {
            issues.Add("Single parent adoptions may face additional requirements in some countries");
        }

        return issues;
    }
}