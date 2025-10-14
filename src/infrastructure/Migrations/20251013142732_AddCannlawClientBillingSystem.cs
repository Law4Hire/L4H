using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace L4H.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCannlawClientBillingSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsLegalProfessional",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "AdoptionCases",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AdoptionType = table.Column<int>(type: "int", nullable: false),
                    RecommendedVisaType = table.Column<int>(type: "int", nullable: false),
                    ChildFirstName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ChildLastName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ChildMiddleName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ChildDateOfBirth = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ChildCountryOfBirth = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ChildCityOfBirth = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ChildGender = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ChildHasSpecialNeeds = table.Column<bool>(type: "bit", nullable: false),
                    ChildSpecialNeedsDescription = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    ChildMedicalConditions = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    ChildCurrentLocation = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ChildCaregiverInformation = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    ChildLanguages = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ChildCulturalBackground = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    IsAdoptionCompleted = table.Column<bool>(type: "bit", nullable: false),
                    AdoptionCompletionDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    WillCompleteAdoptionInUS = table.Column<bool>(type: "bit", nullable: false),
                    HasLegalCustody = table.Column<bool>(type: "bit", nullable: false),
                    CustodyDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AgencyName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    AgencyCountry = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    AgencyLicenseNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    AgencyContactPersonName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    AgencyContactEmail = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    AgencyContactPhone = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsAgencyHagueAccredited = table.Column<bool>(type: "bit", nullable: false),
                    AgencyAccreditationNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    AgencyAccreditationExpiry = table.Column<DateTime>(type: "datetime2", nullable: true),
                    USPartnerAgency = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    IsHomeStudyCompleted = table.Column<bool>(type: "bit", nullable: false),
                    HomeStudyCompletionDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    HomeStudyConductingAgency = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    HomeStudySocialWorkerName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    HomeStudySocialWorkerLicense = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    HomeStudyExpirationDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsBackgroundCheckCompleted = table.Column<bool>(type: "bit", nullable: false),
                    IsFinancialAssessmentCompleted = table.Column<bool>(type: "bit", nullable: false),
                    IsHomeInspectionCompleted = table.Column<bool>(type: "bit", nullable: false),
                    AreReferencesVerified = table.Column<bool>(type: "bit", nullable: false),
                    HomeStudyRecommendationStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    HomeStudyRequiredUpdates = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    IsMarriedCouple = table.Column<bool>(type: "bit", nullable: false),
                    PrimaryParentName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SpouseName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    MarriageDurationYears = table.Column<int>(type: "int", nullable: false),
                    HasPreviousChildren = table.Column<bool>(type: "bit", nullable: false),
                    NumberOfChildren = table.Column<int>(type: "int", nullable: false),
                    MotivationForAdoption = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    HasAdoptionExperience = table.Column<bool>(type: "bit", nullable: false),
                    PreviousAdoptionDetails = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    HasInfertilityIssues = table.Column<bool>(type: "bit", nullable: false),
                    PreferredChildAge = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PreferredChildGender = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    WillingToAdoptSpecialNeeds = table.Column<bool>(type: "bit", nullable: false),
                    AcceptableSpecialNeeds = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    HasChildBirthCertificate = table.Column<bool>(type: "bit", nullable: false),
                    HasChildPassport = table.Column<bool>(type: "bit", nullable: false),
                    HasAdoptionDecree = table.Column<bool>(type: "bit", nullable: false),
                    HasChildMedicalRecords = table.Column<bool>(type: "bit", nullable: false),
                    HasChildPhotographs = table.Column<bool>(type: "bit", nullable: false),
                    HasParentBirthCertificates = table.Column<bool>(type: "bit", nullable: false),
                    HasMarriageCertificate = table.Column<bool>(type: "bit", nullable: false),
                    HasDivorceCertificates = table.Column<bool>(type: "bit", nullable: false),
                    HasFinancialDocuments = table.Column<bool>(type: "bit", nullable: false),
                    HasEmploymentVerification = table.Column<bool>(type: "bit", nullable: false),
                    HasMedicalExaminations = table.Column<bool>(type: "bit", nullable: false),
                    HasCriminalBackgroundChecks = table.Column<bool>(type: "bit", nullable: false),
                    HasChildAbuseChecks = table.Column<bool>(type: "bit", nullable: false),
                    HasHomeStudyReport = table.Column<bool>(type: "bit", nullable: false),
                    HasAgencyRecommendation = table.Column<bool>(type: "bit", nullable: false),
                    HasI600APetition = table.Column<bool>(type: "bit", nullable: false),
                    HasI600Petition = table.Column<bool>(type: "bit", nullable: false),
                    IsEligible = table.Column<bool>(type: "bit", nullable: false),
                    EligibilityReason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    RecommendationRationale = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    RequiredDocuments = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    NextSteps = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    PotentialIssues = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    UpdatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdoptionCases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AdoptionCases_Cases_CaseId",
                        column: x => x.CaseId,
                        principalTable: "Cases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Attorneys",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Bio = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PhotoUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Credentials = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PracticeAreas = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Languages = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DirectPhone = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DirectEmail = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    OfficeLocation = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    DefaultHourlyRate = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsManagingAttorney = table.Column<bool>(type: "bit", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Attorneys", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CitizenshipCases",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ApplicationType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CurrentLegalName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    NameAtBirth = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    HasNameChanged = table.Column<bool>(type: "bit", nullable: false),
                    DateOfBirth = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CountryOfBirth = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CityOfBirth = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CurrentNationality = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    MaritalStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PermanentResidencyDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    GreenCardNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    YearsAsResident = table.Column<int>(type: "int", nullable: false),
                    MonthsPhysicallyPresent = table.Column<int>(type: "int", nullable: false),
                    ContinuousResidence = table.Column<bool>(type: "bit", nullable: false),
                    HasAbsencesOver6Months = table.Column<bool>(type: "bit", nullable: false),
                    MeetsResidencyRequirement = table.Column<bool>(type: "bit", nullable: false),
                    MeetsPhysicalPresenceRequirement = table.Column<bool>(type: "bit", nullable: false),
                    HasGoodMoralCharacter = table.Column<bool>(type: "bit", nullable: false),
                    AttachedToConstitution = table.Column<bool>(type: "bit", nullable: false),
                    WillingToTakeOath = table.Column<bool>(type: "bit", nullable: false),
                    HasMilitaryService = table.Column<bool>(type: "bit", nullable: false),
                    QualifiesForExceptions = table.Column<bool>(type: "bit", nullable: false),
                    SpeakingLevel = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ReadingLevel = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    WritingLevel = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    NeedsInterpreter = table.Column<bool>(type: "bit", nullable: false),
                    PreferredLanguage = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    QualifiesForLanguageException = table.Column<bool>(type: "bit", nullable: false),
                    HasCriminalHistory = table.Column<bool>(type: "bit", nullable: false),
                    HasTaxIssues = table.Column<bool>(type: "bit", nullable: false),
                    HasImmigrationViolations = table.Column<bool>(type: "bit", nullable: false),
                    HasFailedToRegisterForDraft = table.Column<bool>(type: "bit", nullable: false),
                    HasClaimedUSCitizenshipFalsely = table.Column<bool>(type: "bit", nullable: false),
                    HasVotedIllegally = table.Column<bool>(type: "bit", nullable: false),
                    HasBeenDeported = table.Column<bool>(type: "bit", nullable: false),
                    HasTerroristConnections = table.Column<bool>(type: "bit", nullable: false),
                    NeedsEnglishTest = table.Column<bool>(type: "bit", nullable: false),
                    NeedsCivicsTest = table.Column<bool>(type: "bit", nullable: false),
                    QualifiesForTestExemption = table.Column<bool>(type: "bit", nullable: false),
                    ExemptionReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ParentUSCitizen = table.Column<bool>(type: "bit", nullable: false),
                    ParentCitizenshipDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    BornAbroad = table.Column<bool>(type: "bit", nullable: false),
                    Under18WhenParentNaturalized = table.Column<bool>(type: "bit", nullable: false),
                    ResidedWithCitizenParent = table.Column<bool>(type: "bit", nullable: false),
                    HadLegalCustody = table.Column<bool>(type: "bit", nullable: false),
                    WasPermanentResidentWhenParentNaturalized = table.Column<bool>(type: "bit", nullable: false),
                    RecommendedApplication = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Rationale = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    IsEligible = table.Column<bool>(type: "bit", nullable: false),
                    EligibilityReason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    EarliestApplicationDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ProcessingTimeEstimate = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CitizenshipCases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CitizenshipCases_Cases_CaseId",
                        column: x => x.CaseId,
                        principalTable: "Cases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ServiceCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IconUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SiteConfigurations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FirmName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    ManagingAttorney = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    PrimaryPhone = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    PrimaryFocusStatement = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Locations = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SocialMediaPlatforms = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UniqueSellingPoints = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LogoUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteConfigurations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AdoptionDocuments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AdoptionCaseId = table.Column<int>(type: "int", nullable: false),
                    DocumentType = table.Column<int>(type: "int", nullable: false),
                    DocumentName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    DocumentDescription = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    UploadId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    FileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    FilePath = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DocumentDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ExpirationDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IssuingAuthority = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    DocumentNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsTranslationRequired = table.Column<bool>(type: "bit", nullable: false),
                    IsNotarized = table.Column<bool>(type: "bit", nullable: false),
                    IsApostilled = table.Column<bool>(type: "bit", nullable: false),
                    IsVerified = table.Column<bool>(type: "bit", nullable: false),
                    VerificationDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    VerifiedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    VerificationNotes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    RequiresReview = table.Column<bool>(type: "bit", nullable: false),
                    ReviewDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReviewedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ReviewNotes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    ReviewStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    UpdatedBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdoptionDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AdoptionDocuments_AdoptionCases_AdoptionCaseId",
                        column: x => x.AdoptionCaseId,
                        principalTable: "AdoptionCases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AdoptionDocuments_Uploads_UploadId",
                        column: x => x.UploadId,
                        principalTable: "Uploads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "BillingRates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AttorneyId = table.Column<int>(type: "int", nullable: false),
                    ServiceType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    HourlyRate = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    EffectiveDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiryDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    UpdatedBy = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillingRates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BillingRates_Attorneys_AttorneyId",
                        column: x => x.AttorneyId,
                        principalTable: "Attorneys",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Clients",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FirstName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Address = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    DateOfBirth = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CountryOfOrigin = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    AssignedAttorneyId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    UpdatedBy = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clients", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Clients_Attorneys_AssignedAttorneyId",
                        column: x => x.AssignedAttorneyId,
                        principalTable: "Attorneys",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "CitizenshipDocuments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CitizenshipCaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DocumentType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    FilePath = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsRequired = table.Column<bool>(type: "bit", nullable: false),
                    IsVerified = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CitizenshipDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CitizenshipDocuments_CitizenshipCases_CitizenshipCaseId",
                        column: x => x.CitizenshipCaseId,
                        principalTable: "CitizenshipCases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CitizenshipTestResults",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CitizenshipCaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TestType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TestComponent = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Passed = table.Column<bool>(type: "bit", nullable: false),
                    Score = table.Column<int>(type: "int", nullable: true),
                    TotalQuestions = table.Column<int>(type: "int", nullable: true),
                    TestDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TestLocation = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CitizenshipTestResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CitizenshipTestResults_CitizenshipCases_CitizenshipCaseId",
                        column: x => x.CitizenshipCaseId,
                        principalTable: "CitizenshipCases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LegalServices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ServiceCategoryId = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LegalServices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LegalServices_ServiceCategories_ServiceCategoryId",
                        column: x => x.ServiceCategoryId,
                        principalTable: "ServiceCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CannlawCases",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClientId = table.Column<int>(type: "int", nullable: false),
                    CaseType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletionDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    GovernmentCaseNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    RejectionReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CannlawCases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CannlawCases_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Documents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClientId = table.Column<int>(type: "int", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    OriginalFileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    FileUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    UploadDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UploadedBy = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    IsConfidential = table.Column<bool>(type: "bit", nullable: false),
                    AccessNotes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastAccessedBy = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    LastAccessedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Documents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Documents_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TimeEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClientId = table.Column<int>(type: "int", nullable: false),
                    AttorneyId = table.Column<int>(type: "int", nullable: false),
                    StartTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Duration = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    HourlyRate = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    BillableAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    IsBilled = table.Column<bool>(type: "bit", nullable: false),
                    BilledDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TimeEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TimeEntries_Attorneys_AttorneyId",
                        column: x => x.AttorneyId,
                        principalTable: "Attorneys",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TimeEntries_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CaseStatusHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CaseId = table.Column<int>(type: "int", nullable: false),
                    FromStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ToStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    ChangedBy = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    ChangedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CaseStatusHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CaseStatusHistories_CannlawCases_CaseId",
                        column: x => x.CaseId,
                        principalTable: "CannlawCases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AdoptionCases_AdoptionType",
                table: "AdoptionCases",
                column: "AdoptionType");

            migrationBuilder.CreateIndex(
                name: "IX_AdoptionCases_CaseId",
                table: "AdoptionCases",
                column: "CaseId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AdoptionCases_ChildCountryOfBirth",
                table: "AdoptionCases",
                column: "ChildCountryOfBirth");

            migrationBuilder.CreateIndex(
                name: "IX_AdoptionCases_CreatedAt",
                table: "AdoptionCases",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AdoptionCases_RecommendedVisaType",
                table: "AdoptionCases",
                column: "RecommendedVisaType");

            migrationBuilder.CreateIndex(
                name: "IX_AdoptionDocuments_AdoptionCaseId",
                table: "AdoptionDocuments",
                column: "AdoptionCaseId");

            migrationBuilder.CreateIndex(
                name: "IX_AdoptionDocuments_CreatedAt",
                table: "AdoptionDocuments",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AdoptionDocuments_DocumentType",
                table: "AdoptionDocuments",
                column: "DocumentType");

            migrationBuilder.CreateIndex(
                name: "IX_AdoptionDocuments_ExpirationDate",
                table: "AdoptionDocuments",
                column: "ExpirationDate");

            migrationBuilder.CreateIndex(
                name: "IX_AdoptionDocuments_Status",
                table: "AdoptionDocuments",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_AdoptionDocuments_UploadId",
                table: "AdoptionDocuments",
                column: "UploadId");

            migrationBuilder.CreateIndex(
                name: "IX_BillingRates_AttorneyId",
                table: "BillingRates",
                column: "AttorneyId");

            migrationBuilder.CreateIndex(
                name: "IX_BillingRates_EffectiveDate",
                table: "BillingRates",
                column: "EffectiveDate");

            migrationBuilder.CreateIndex(
                name: "IX_BillingRates_IsActive",
                table: "BillingRates",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_CannlawCases_ClientId",
                table: "CannlawCases",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_CannlawCases_StartDate",
                table: "CannlawCases",
                column: "StartDate");

            migrationBuilder.CreateIndex(
                name: "IX_CannlawCases_Status",
                table: "CannlawCases",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_CaseStatusHistories_CaseId",
                table: "CaseStatusHistories",
                column: "CaseId");

            migrationBuilder.CreateIndex(
                name: "IX_CaseStatusHistories_ChangedAt",
                table: "CaseStatusHistories",
                column: "ChangedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CitizenshipCases_ApplicationType",
                table: "CitizenshipCases",
                column: "ApplicationType");

            migrationBuilder.CreateIndex(
                name: "IX_CitizenshipCases_CaseId",
                table: "CitizenshipCases",
                column: "CaseId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CitizenshipCases_CreatedAt",
                table: "CitizenshipCases",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CitizenshipCases_Status",
                table: "CitizenshipCases",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_CitizenshipDocuments_CitizenshipCaseId",
                table: "CitizenshipDocuments",
                column: "CitizenshipCaseId");

            migrationBuilder.CreateIndex(
                name: "IX_CitizenshipDocuments_DocumentType",
                table: "CitizenshipDocuments",
                column: "DocumentType");

            migrationBuilder.CreateIndex(
                name: "IX_CitizenshipDocuments_IsRequired",
                table: "CitizenshipDocuments",
                column: "IsRequired");

            migrationBuilder.CreateIndex(
                name: "IX_CitizenshipTestResults_CitizenshipCaseId",
                table: "CitizenshipTestResults",
                column: "CitizenshipCaseId");

            migrationBuilder.CreateIndex(
                name: "IX_CitizenshipTestResults_TestDate",
                table: "CitizenshipTestResults",
                column: "TestDate");

            migrationBuilder.CreateIndex(
                name: "IX_CitizenshipTestResults_TestType",
                table: "CitizenshipTestResults",
                column: "TestType");

            migrationBuilder.CreateIndex(
                name: "IX_Clients_AssignedAttorneyId",
                table: "Clients",
                column: "AssignedAttorneyId");

            migrationBuilder.CreateIndex(
                name: "IX_Clients_CreatedAt",
                table: "Clients",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Clients_Email",
                table: "Clients",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_Category",
                table: "Documents",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_ClientId",
                table: "Documents",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_IsConfidential",
                table: "Documents",
                column: "IsConfidential");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_UploadDate",
                table: "Documents",
                column: "UploadDate");

            migrationBuilder.CreateIndex(
                name: "IX_LegalServices_ServiceCategoryId",
                table: "LegalServices",
                column: "ServiceCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_TimeEntries_AttorneyId",
                table: "TimeEntries",
                column: "AttorneyId");

            migrationBuilder.CreateIndex(
                name: "IX_TimeEntries_ClientId",
                table: "TimeEntries",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_TimeEntries_IsBilled",
                table: "TimeEntries",
                column: "IsBilled");

            migrationBuilder.CreateIndex(
                name: "IX_TimeEntries_StartTime",
                table: "TimeEntries",
                column: "StartTime");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdoptionDocuments");

            migrationBuilder.DropTable(
                name: "BillingRates");

            migrationBuilder.DropTable(
                name: "CaseStatusHistories");

            migrationBuilder.DropTable(
                name: "CitizenshipDocuments");

            migrationBuilder.DropTable(
                name: "CitizenshipTestResults");

            migrationBuilder.DropTable(
                name: "Documents");

            migrationBuilder.DropTable(
                name: "LegalServices");

            migrationBuilder.DropTable(
                name: "SiteConfigurations");

            migrationBuilder.DropTable(
                name: "TimeEntries");

            migrationBuilder.DropTable(
                name: "AdoptionCases");

            migrationBuilder.DropTable(
                name: "CannlawCases");

            migrationBuilder.DropTable(
                name: "CitizenshipCases");

            migrationBuilder.DropTable(
                name: "ServiceCategories");

            migrationBuilder.DropTable(
                name: "Clients");

            migrationBuilder.DropTable(
                name: "Attorneys");

            migrationBuilder.DropColumn(
                name: "IsLegalProfessional",
                table: "Users");
        }
    }
}
