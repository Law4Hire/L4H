namespace L4H.Infrastructure.Entities;

/// <summary>
/// Entity for tracking adoption-specific documents and their status
/// </summary>
public class AdoptionDocument
{
    public int Id { get; set; }
    public int AdoptionCaseId { get; set; }
    public AdoptionCase AdoptionCase { get; set; } = null!;
    
    public AdoptionDocumentType DocumentType { get; set; }
    public string DocumentName { get; set; } = string.Empty;
    public string DocumentDescription { get; set; } = string.Empty;
    public AdoptionDocumentStatus Status { get; set; }
    
    // File information
    public Guid? UploadId { get; set; }
    public Upload? Upload { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string ContentType { get; set; } = string.Empty;
    
    // Document metadata
    public DateTime? DocumentDate { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public string IssuingAuthority { get; set; } = string.Empty;
    public string DocumentNumber { get; set; } = string.Empty;
    public bool IsTranslationRequired { get; set; }
    public bool IsNotarized { get; set; }
    public bool IsApostilled { get; set; }
    
    // Verification status
    public bool IsVerified { get; set; }
    public DateTime? VerificationDate { get; set; }
    public string VerifiedBy { get; set; } = string.Empty;
    public string VerificationNotes { get; set; } = string.Empty;
    
    // Review status
    public bool RequiresReview { get; set; }
    public DateTime? ReviewDate { get; set; }
    public string ReviewedBy { get; set; } = string.Empty;
    public string ReviewNotes { get; set; } = string.Empty;
    public string ReviewStatus { get; set; } = string.Empty;
    
    // Audit fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = string.Empty;
    public string UpdatedBy { get; set; } = string.Empty;
}

public enum AdoptionDocumentType
{
    // Child Documents
    ChildBirthCertificate = 1,
    ChildPassport = 2,
    ChildMedicalRecords = 3,
    ChildPhotographs = 4,
    AdoptionDecree = 5,
    ChildAbandonmentDecree = 6,
    ChildDeathCertificateOfParents = 7,
    ChildRelinquishmentDocument = 8,
    
    // Parent Documents
    ParentBirthCertificates = 20,
    MarriageCertificate = 21,
    DivorceCertificates = 22,
    DeathCertificateOfSpouse = 23,
    FinancialDocuments = 24,
    EmploymentVerification = 25,
    MedicalExaminations = 26,
    CriminalBackgroundChecks = 27,
    ChildAbuseChecks = 28,
    
    // Home Study Documents
    HomeStudyReport = 40,
    HomeStudyUpdate = 41,
    SocialWorkerRecommendation = 42,
    ReferenceLetters = 43,
    
    // Agency Documents
    AgencyRecommendation = 60,
    AgencyLicense = 61,
    HagueAccreditation = 62,
    
    // USCIS Forms
    I600APetition = 80,
    I600Petition = 81,
    I864AffidavitOfSupport = 82,
    DS230Application = 83,
    
    // Other
    PowerOfAttorney = 100,
    TranslatedDocuments = 101,
    NotarizedDocuments = 102,
    ApostilledDocuments = 103
}

public enum AdoptionDocumentStatus
{
    NotStarted = 1,
    InProgress = 2,
    Submitted = 3,
    UnderReview = 4,
    Approved = 5,
    Rejected = 6,
    RequiresRevision = 7,
    Expired = 8,
    NotRequired = 9
}