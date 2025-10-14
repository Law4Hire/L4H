using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

/// <summary>
/// Entity for tracking international adoption cases (IR-3, IR-4)
/// </summary>
public class AdoptionCase
{
    public int Id { get; set; }
    public CaseId CaseId { get; set; }
    public Case Case { get; set; } = null!;
    
    public AdoptionType AdoptionType { get; set; }
    public AdoptionVisaType RecommendedVisaType { get; set; }
    
    // Child Information
    public string ChildFirstName { get; set; } = string.Empty;
    public string ChildLastName { get; set; } = string.Empty;
    public string ChildMiddleName { get; set; } = string.Empty;
    public DateTime ChildDateOfBirth { get; set; }
    public string ChildCountryOfBirth { get; set; } = string.Empty;
    public string ChildCityOfBirth { get; set; } = string.Empty;
    public string ChildGender { get; set; } = string.Empty;
    public bool ChildHasSpecialNeeds { get; set; }
    public string ChildSpecialNeedsDescription { get; set; } = string.Empty;
    public string ChildMedicalConditions { get; set; } = string.Empty;
    public string ChildCurrentLocation { get; set; } = string.Empty;
    public string ChildCaregiverInformation { get; set; } = string.Empty;
    public string ChildLanguages { get; set; } = string.Empty; // JSON array
    public string ChildCulturalBackground { get; set; } = string.Empty;
    
    // Adoption Status
    public bool IsAdoptionCompleted { get; set; }
    public DateTime? AdoptionCompletionDate { get; set; }
    public bool WillCompleteAdoptionInUS { get; set; }
    public bool HasLegalCustody { get; set; }
    public DateTime? CustodyDate { get; set; }
    
    // Agency Information
    public string AgencyName { get; set; } = string.Empty;
    public string AgencyCountry { get; set; } = string.Empty;
    public string AgencyLicenseNumber { get; set; } = string.Empty;
    public string AgencyContactPersonName { get; set; } = string.Empty;
    public string AgencyContactEmail { get; set; } = string.Empty;
    public string AgencyContactPhone { get; set; } = string.Empty;
    public bool IsAgencyHagueAccredited { get; set; }
    public string AgencyAccreditationNumber { get; set; } = string.Empty;
    public DateTime? AgencyAccreditationExpiry { get; set; }
    public string USPartnerAgency { get; set; } = string.Empty;
    
    // Home Study Information
    public bool IsHomeStudyCompleted { get; set; }
    public DateTime? HomeStudyCompletionDate { get; set; }
    public string HomeStudyConductingAgency { get; set; } = string.Empty;
    public string HomeStudySocialWorkerName { get; set; } = string.Empty;
    public string HomeStudySocialWorkerLicense { get; set; } = string.Empty;
    public DateTime? HomeStudyExpirationDate { get; set; }
    public bool IsBackgroundCheckCompleted { get; set; }
    public bool IsFinancialAssessmentCompleted { get; set; }
    public bool IsHomeInspectionCompleted { get; set; }
    public bool AreReferencesVerified { get; set; }
    public string HomeStudyRecommendationStatus { get; set; } = string.Empty;
    public string HomeStudyRequiredUpdates { get; set; } = string.Empty; // JSON array
    
    // Adoptive Parents Information
    public bool IsMarriedCouple { get; set; }
    public string PrimaryParentName { get; set; } = string.Empty;
    public string SpouseName { get; set; } = string.Empty;
    public int MarriageDurationYears { get; set; }
    public bool HasPreviousChildren { get; set; }
    public int NumberOfChildren { get; set; }
    public string MotivationForAdoption { get; set; } = string.Empty;
    public bool HasAdoptionExperience { get; set; }
    public string PreviousAdoptionDetails { get; set; } = string.Empty;
    public bool HasInfertilityIssues { get; set; }
    public string PreferredChildAge { get; set; } = string.Empty;
    public string PreferredChildGender { get; set; } = string.Empty;
    public bool WillingToAdoptSpecialNeeds { get; set; }
    public string AcceptableSpecialNeeds { get; set; } = string.Empty; // JSON array
    
    // Documentation Status
    public bool HasChildBirthCertificate { get; set; }
    public bool HasChildPassport { get; set; }
    public bool HasAdoptionDecree { get; set; }
    public bool HasChildMedicalRecords { get; set; }
    public bool HasChildPhotographs { get; set; }
    public bool HasParentBirthCertificates { get; set; }
    public bool HasMarriageCertificate { get; set; }
    public bool HasDivorceCertificates { get; set; }
    public bool HasFinancialDocuments { get; set; }
    public bool HasEmploymentVerification { get; set; }
    public bool HasMedicalExaminations { get; set; }
    public bool HasCriminalBackgroundChecks { get; set; }
    public bool HasChildAbuseChecks { get; set; }
    public bool HasHomeStudyReport { get; set; }
    public bool HasAgencyRecommendation { get; set; }
    public bool HasI600APetition { get; set; }
    public bool HasI600Petition { get; set; }
    
    // Eligibility Assessment
    public bool IsEligible { get; set; }
    public string EligibilityReason { get; set; } = string.Empty;
    public string RecommendationRationale { get; set; } = string.Empty;
    public string RequiredDocuments { get; set; } = string.Empty; // JSON array
    public string NextSteps { get; set; } = string.Empty; // JSON array
    public string PotentialIssues { get; set; } = string.Empty; // JSON array
    
    // Audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = string.Empty;
    public string UpdatedBy { get; set; } = string.Empty;
}

public enum AdoptionType
{
    International = 1,
    Domestic = 2,
    Relative = 3,
    StepParent = 4
}

public enum AdoptionVisaType
{
    IR3 = 1, // Adoption completed abroad
    IR4 = 2  // Adoption to be completed in US
}