using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

/// <summary>
/// Entity representing a citizenship/naturalization case (N-400, N-600)
/// </summary>
public class CitizenshipCase
{
    public Guid Id { get; set; }
    public CaseId CaseId { get; set; }
    public CitizenshipApplicationType ApplicationType { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    // Personal Information
    public string CurrentLegalName { get; set; } = string.Empty;
    public string NameAtBirth { get; set; } = string.Empty;
    public bool HasNameChanged { get; set; }
    public DateTime DateOfBirth { get; set; }
    public string CountryOfBirth { get; set; } = string.Empty;
    public string CityOfBirth { get; set; } = string.Empty;
    public string CurrentNationality { get; set; } = string.Empty;
    public string MaritalStatus { get; set; } = string.Empty;
    
    // Residency Information
    public DateTime? PermanentResidencyDate { get; set; }
    public string GreenCardNumber { get; set; } = string.Empty;
    public int YearsAsResident { get; set; }
    public int MonthsPhysicallyPresent { get; set; }
    public bool ContinuousResidence { get; set; }
    public bool HasAbsencesOver6Months { get; set; }
    
    // Eligibility Information
    public bool MeetsResidencyRequirement { get; set; }
    public bool MeetsPhysicalPresenceRequirement { get; set; }
    public bool HasGoodMoralCharacter { get; set; }
    public bool AttachedToConstitution { get; set; }
    public bool WillingToTakeOath { get; set; }
    public bool HasMilitaryService { get; set; }
    public bool QualifiesForExceptions { get; set; }
    
    // Language Information
    public EnglishProficiencyLevel SpeakingLevel { get; set; }
    public EnglishProficiencyLevel ReadingLevel { get; set; }
    public EnglishProficiencyLevel WritingLevel { get; set; }
    public bool NeedsInterpreter { get; set; }
    public string PreferredLanguage { get; set; } = string.Empty;
    public bool QualifiesForLanguageException { get; set; }
    
    // Background Information
    public bool HasCriminalHistory { get; set; }
    public bool HasTaxIssues { get; set; }
    public bool HasImmigrationViolations { get; set; }
    public bool HasFailedToRegisterForDraft { get; set; }
    public bool HasClaimedUSCitizenshipFalsely { get; set; }
    public bool HasVotedIllegally { get; set; }
    public bool HasBeenDeported { get; set; }
    public bool HasTerroristConnections { get; set; }
    
    // Test Information
    public bool NeedsEnglishTest { get; set; }
    public bool NeedsCivicsTest { get; set; }
    public bool QualifiesForTestExemption { get; set; }
    public string ExemptionReason { get; set; } = string.Empty;
    
    // N-600 Specific Fields
    public bool ParentUSCitizen { get; set; }
    public DateTime? ParentCitizenshipDate { get; set; }
    public bool BornAbroad { get; set; }
    public bool Under18WhenParentNaturalized { get; set; }
    public bool ResidedWithCitizenParent { get; set; }
    public bool HadLegalCustody { get; set; }
    public bool WasPermanentResidentWhenParentNaturalized { get; set; }
    
    // Recommendation Result
    public string RecommendedApplication { get; set; } = string.Empty;
    public string Rationale { get; set; } = string.Empty;
    public bool IsEligible { get; set; }
    public string EligibilityReason { get; set; } = string.Empty;
    public DateTime? EarliestApplicationDate { get; set; }
    public string ProcessingTimeEstimate { get; set; } = string.Empty;
    
    // Navigation properties
    public Case Case { get; set; } = null!;
    public List<CitizenshipDocument> Documents { get; set; } = new();
    public List<CitizenshipTestResult> TestResults { get; set; } = new();
}

/// <summary>
/// Entity for citizenship-related documents
/// </summary>
public class CitizenshipDocument
{
    public Guid Id { get; set; }
    public Guid CitizenshipCaseId { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
    public bool IsRequired { get; set; }
    public bool IsVerified { get; set; }
    public string Notes { get; set; } = string.Empty;
    
    // Navigation properties
    public CitizenshipCase CitizenshipCase { get; set; } = null!;
}

/// <summary>
/// Entity for citizenship test results (English and Civics)
/// </summary>
public class CitizenshipTestResult
{
    public Guid Id { get; set; }
    public Guid CitizenshipCaseId { get; set; }
    public string TestType { get; set; } = string.Empty; // "English" or "Civics"
    public string TestComponent { get; set; } = string.Empty; // "Speaking", "Reading", "Writing" for English
    public bool Passed { get; set; }
    public int? Score { get; set; }
    public int? TotalQuestions { get; set; }
    public DateTime TestDate { get; set; }
    public string TestLocation { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    
    // Navigation properties
    public CitizenshipCase CitizenshipCase { get; set; } = null!;
}