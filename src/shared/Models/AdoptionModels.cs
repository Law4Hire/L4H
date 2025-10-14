namespace L4H.Shared.Models;

/// <summary>
/// Models for International Adoption Workflows (IR-3, IR-4)
/// These models support the adoption process for US Citizens adopting foreign children
/// </summary>

public class AdoptionCaseRequest
{
    public CaseId CaseId { get; set; }
    public AdoptionType AdoptionType { get; set; }
    public ChildInformation Child { get; set; } = new();
    public AdoptionAgencyInformation Agency { get; set; } = new();
    public HomeStudyInformation HomeStudy { get; set; } = new();
    public AdoptiveParentsInformation Parents { get; set; } = new();
}

public class ChildInformation
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string MiddleName { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string CountryOfBirth { get; set; } = string.Empty;
    public string CityOfBirth { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public bool HasSpecialNeeds { get; set; }
    public string SpecialNeedsDescription { get; set; } = string.Empty;
    public string MedicalConditions { get; set; } = string.Empty;
    public string CurrentLocation { get; set; } = string.Empty;
    public string CaregiverInformation { get; set; } = string.Empty;
    public List<string> Languages { get; set; } = new();
    public string CulturalBackground { get; set; } = string.Empty;
}

public class AdoptionAgencyInformation
{
    public string AgencyName { get; set; } = string.Empty;
    public string AgencyCountry { get; set; } = string.Empty;
    public string AgencyLicenseNumber { get; set; } = string.Empty;
    public string ContactPersonName { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public bool IsHagueAccredited { get; set; }
    public string AccreditationNumber { get; set; } = string.Empty;
    public DateTime AccreditationExpiry { get; set; }
    public string USPartnerAgency { get; set; } = string.Empty;
}

public class HomeStudyInformation
{
    public bool IsCompleted { get; set; }
    public DateTime CompletionDate { get; set; }
    public string ConductingAgency { get; set; } = string.Empty;
    public string SocialWorkerName { get; set; } = string.Empty;
    public string SocialWorkerLicense { get; set; } = string.Empty;
    public DateTime ExpirationDate { get; set; }
    public bool BackgroundCheckCompleted { get; set; }
    public bool FinancialAssessmentCompleted { get; set; }
    public bool HomeInspectionCompleted { get; set; }
    public bool ReferencesVerified { get; set; }
    public string RecommendationStatus { get; set; } = string.Empty;
    public List<string> RequiredUpdates { get; set; } = new();
}

public class AdoptiveParentsInformation
{
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
    public List<string> AcceptableSpecialNeeds { get; set; } = new();
}

public class AdoptionDocumentation
{
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
}

public class AdoptionInterviewAnswers
{
    public AdoptionType AdoptionType { get; set; }
    public bool AdoptionCompleted { get; set; }
    public DateTime? AdoptionDate { get; set; }
    public bool WillCompleteInUS { get; set; }
    public bool HasLegalCustody { get; set; }
    public DateTime? CustodyDate { get; set; }
    public string ChildCountry { get; set; } = string.Empty;
    public string ChildAge { get; set; } = string.Empty;
    public bool HasSpecialNeeds { get; set; }
    public bool HomeStudyCompleted { get; set; }
    public bool AgencyApproved { get; set; }
    public bool FinanciallyCapable { get; set; }
    public bool CriminalBackgroundClear { get; set; }
    public bool MedicalClearance { get; set; }
    public bool CulturalPreparation { get; set; }
    public bool PostAdoptionSupport { get; set; }
}

public enum AdoptionType
{
    International,
    Domestic,
    Relative,
    StepParent
}

public enum AdoptionVisaType
{
    IR3, // Adoption completed abroad
    IR4  // Adoption to be completed in US
}

public class AdoptionRecommendationResult
{
    public AdoptionVisaType RecommendedVisaType { get; set; }
    public string Rationale { get; set; } = string.Empty;
    public List<string> RequiredDocuments { get; set; } = new();
    public List<string> NextSteps { get; set; } = new();
    public List<string> PotentialIssues { get; set; } = new();
    public bool IsEligible { get; set; }
    public string EligibilityReason { get; set; } = string.Empty;
}