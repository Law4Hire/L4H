namespace L4H.Shared.Models;

/// <summary>
/// Models for Citizenship and Naturalization Workflows (N-400, N-600)
/// These models support the citizenship process for permanent residents and derived citizens
/// </summary>

public class CitizenshipApplicationRequest
{
    public CaseId CaseId { get; set; }
    public CitizenshipApplicationType ApplicationType { get; set; }
    public PersonalInformation Personal { get; set; } = new();
    public ResidencyInformation Residency { get; set; } = new();
    public EligibilityInformation Eligibility { get; set; } = new();
    public LanguageInformation Language { get; set; } = new();
    public BackgroundInformation Background { get; set; } = new();
}

public class PersonalInformation
{
    public string CurrentLegalName { get; set; } = string.Empty;
    public string NameAtBirth { get; set; } = string.Empty;
    public bool HasNameChanged { get; set; }
    public List<NameChangeRecord> NameChanges { get; set; } = new();
    public DateTime DateOfBirth { get; set; }
    public string CountryOfBirth { get; set; } = string.Empty;
    public string CityOfBirth { get; set; } = string.Empty;
    public string CurrentNationality { get; set; } = string.Empty;
    public List<string> PreviousNationalities { get; set; } = new();
    public string MaritalStatus { get; set; } = string.Empty;
    public SpouseInformation? Spouse { get; set; }
    public List<ChildInformation> Children { get; set; } = new();
}

public class NameChangeRecord
{
    public string PreviousName { get; set; } = string.Empty;
    public string NewName { get; set; } = string.Empty;
    public DateTime ChangeDate { get; set; }
    public string ReasonForChange { get; set; } = string.Empty;
    public string LegalDocumentType { get; set; } = string.Empty;
}

public class SpouseInformation
{
    public string FullName { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string CountryOfBirth { get; set; } = string.Empty;
    public DateTime MarriageDate { get; set; }
    public string MarriageLocation { get; set; } = string.Empty;
    public bool IsUSCitizen { get; set; }
    public DateTime? CitizenshipDate { get; set; }
    public bool IsPermanentResident { get; set; }
    public DateTime? PermanentResidencyDate { get; set; }
    public string ImmigrationStatus { get; set; } = string.Empty;
}

public class ResidencyInformation
{
    public DateTime PermanentResidencyDate { get; set; }
    public string GreenCardNumber { get; set; } = string.Empty;
    public int YearsAsResident { get; set; }
    public int MonthsPhysicallyPresent { get; set; }
    public bool ContinuousResidence { get; set; }
    public List<AbsenceRecord> AbsencesFromUS { get; set; } = new();
    public List<AddressHistory> AddressHistory { get; set; } = new();
    public List<EmploymentHistory> EmploymentHistory { get; set; } = new();
}

public class AbsenceRecord
{
    public DateTime DepartureDate { get; set; }
    public DateTime ReturnDate { get; set; }
    public int DaysAbsent { get; set; }
    public string Destination { get; set; } = string.Empty;
    public string ReasonForTravel { get; set; } = string.Empty;
    public bool WasOver6Months { get; set; }
    public bool WasOver1Year { get; set; }
}

public class AddressHistory
{
    public string StreetAddress { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string ZipCode { get; set; } = string.Empty;
    public DateTime FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public bool IsCurrent { get; set; }
}

public class EmploymentHistory
{
    public string EmployerName { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public string EmployerAddress { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsCurrent { get; set; }
    public string ReasonForLeaving { get; set; } = string.Empty;
}

public class EligibilityInformation
{
    public bool MeetsResidencyRequirement { get; set; }
    public bool MeetsPhysicalPresenceRequirement { get; set; }
    public bool HasGoodMoralCharacter { get; set; }
    public bool AttachedToConstitution { get; set; }
    public bool WillingToTakeOath { get; set; }
    public MilitaryServiceInformation? MilitaryService { get; set; }
    public bool QualifiesForExceptions { get; set; }
    public List<string> ApplicableExceptions { get; set; } = new();
}

public class MilitaryServiceInformation
{
    public bool HasServed { get; set; }
    public string Branch { get; set; } = string.Empty;
    public DateTime ServiceStartDate { get; set; }
    public DateTime ServiceEndDate { get; set; }
    public string DischargeType { get; set; } = string.Empty;
    public bool ServedInCombat { get; set; }
    public bool QualifiesForMilitaryNaturalization { get; set; }
}

public class LanguageInformation
{
    public EnglishProficiencyLevel SpeakingLevel { get; set; }
    public EnglishProficiencyLevel ReadingLevel { get; set; }
    public EnglishProficiencyLevel WritingLevel { get; set; }
    public bool NeedsInterpreter { get; set; }
    public string PreferredLanguage { get; set; } = string.Empty;
    public bool HasDisability { get; set; }
    public string DisabilityDescription { get; set; } = string.Empty;
    public bool QualifiesForLanguageException { get; set; }
    public string ExceptionReason { get; set; } = string.Empty;
}

public class BackgroundInformation
{
    public bool HasCriminalHistory { get; set; }
    public List<CriminalRecord> CriminalRecords { get; set; } = new();
    public bool HasTaxIssues { get; set; }
    public string TaxIssueDescription { get; set; } = string.Empty;
    public bool HasImmigrationViolations { get; set; }
    public string ImmigrationViolationDescription { get; set; } = string.Empty;
    public bool HasFailedToRegisterForDraft { get; set; }
    public bool HasClaimedUSCitizenshipFalsely { get; set; }
    public bool HasVotedIllegally { get; set; }
    public bool HasBeenDeported { get; set; }
    public bool HasTerroristConnections { get; set; }
}

public class CriminalRecord
{
    public string OffenseType { get; set; } = string.Empty;
    public DateTime OffenseDate { get; set; }
    public string Location { get; set; } = string.Empty;
    public string Disposition { get; set; } = string.Empty;
    public string Sentence { get; set; } = string.Empty;
    public bool WasConvicted { get; set; }
    public bool WasSentenceCompleted { get; set; }
    public DateTime? SentenceCompletionDate { get; set; }
}

public class CitizenshipTestInformation
{
    public bool NeedsEnglishTest { get; set; }
    public bool NeedsCivicsTest { get; set; }
    public EnglishTestResults? EnglishResults { get; set; }
    public CivicsTestResults? CivicsResults { get; set; }
    public bool QualifiesForTestExemption { get; set; }
    public string ExemptionReason { get; set; } = string.Empty;
}

public class EnglishTestResults
{
    public bool SpeakingPassed { get; set; }
    public bool ReadingPassed { get; set; }
    public bool WritingPassed { get; set; }
    public DateTime TestDate { get; set; }
    public string TestLocation { get; set; } = string.Empty;
}

public class CivicsTestResults
{
    public bool Passed { get; set; }
    public int Score { get; set; }
    public int TotalQuestions { get; set; }
    public DateTime TestDate { get; set; }
    public string TestLocation { get; set; } = string.Empty;
    public List<string> IncorrectAnswers { get; set; } = new();
}

public class CitizenshipInterviewAnswers
{
    public CitizenshipApplicationType ApplicationType { get; set; }
    public string CurrentStatus { get; set; } = string.Empty;
    public DateTime? GreenCardDate { get; set; }
    public int ResidencyYears { get; set; }
    public int PhysicalPresenceMonths { get; set; }
    public bool ContinuousResidence { get; set; }
    public bool AbsencesOver6Months { get; set; }
    public bool EnglishProficient { get; set; }
    public bool CivicsKnowledge { get; set; }
    public bool GoodMoralCharacter { get; set; }
    public bool CriminalHistory { get; set; }
    public bool TaxCompliance { get; set; }
    public bool MilitaryService { get; set; }
    public bool OathWillingness { get; set; }
    public bool AttachmentToConstitution { get; set; }
    public bool MarriedToUSCitizen { get; set; }
    public bool ParentUSCitizen { get; set; }
    public bool BornAbroad { get; set; }
    public bool Under18WhenParentNaturalized { get; set; }
}

public enum CitizenshipApplicationType
{
    N400_Naturalization,
    N600_CertificateOfCitizenship,
    N600K_CitizenshipForAdoptedChild
}

public enum EnglishProficiencyLevel
{
    None,
    Basic,
    Intermediate,
    Advanced,
    Native
}

public class CitizenshipRecommendationResult
{
    public CitizenshipApplicationType RecommendedApplication { get; set; }
    public string Rationale { get; set; } = string.Empty;
    public bool IsEligible { get; set; }
    public string EligibilityReason { get; set; } = string.Empty;
    public List<string> RequiredDocuments { get; set; } = new();
    public List<string> NextSteps { get; set; } = new();
    public List<string> PotentialIssues { get; set; } = new();
    public CitizenshipTestInformation TestRequirements { get; set; } = new();
    public DateTime? EarliestApplicationDate { get; set; }
    public string ProcessingTimeEstimate { get; set; } = string.Empty;
}