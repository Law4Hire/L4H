IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [Countries] (
        [Id] int NOT NULL IDENTITY,
        [Iso2] nvarchar(2) NOT NULL,
        [Iso3] nvarchar(3) NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [IsActive] bit NOT NULL,
        CONSTRAINT [PK_Countries] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [CountryServiceMappings] (
        [Id] uniqueidentifier NOT NULL,
        [Service] nvarchar(100) NOT NULL,
        [FromCountry] nvarchar(2) NOT NULL,
        [ToCountry] nvarchar(2) NOT NULL,
        [Notes] nvarchar(1000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_CountryServiceMappings] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [FormTemplates] (
        [Id] uniqueidentifier NOT NULL,
        [VisaTypeId] nvarchar(50) NULL,
        [Code] nvarchar(50) NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Version] int NOT NULL,
        [Description] nvarchar(1000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_FormTemplates] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [Packages] (
        [Id] int NOT NULL IDENTITY,
        [Code] nvarchar(50) NOT NULL,
        [DisplayName] nvarchar(200) NOT NULL,
        [Description] nvarchar(1000) NOT NULL,
        [SortOrder] int NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Packages] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [RetentionQueues] (
        [Id] uniqueidentifier NOT NULL,
        [Category] nvarchar(50) NOT NULL,
        [TargetId] nvarchar(100) NOT NULL,
        [Action] nvarchar(20) NOT NULL,
        [EnqueuedAt] datetime2 NOT NULL,
        [ProcessedAt] datetime2 NULL,
        CONSTRAINT [PK_RetentionQueues] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [ScrapedDocuments] (
        [Id] uniqueidentifier NOT NULL,
        [CountryCode] nvarchar(2) NOT NULL,
        [VisaTypeCode] nvarchar(10) NOT NULL,
        [Source] nvarchar(50) NOT NULL,
        [Url] nvarchar(2000) NOT NULL,
        [FetchedAt] datetime2 NOT NULL,
        [Sha256] nvarchar(64) NOT NULL,
        [Content] nvarchar(max) NOT NULL,
        [HeadersJson] nvarchar(2000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_ScrapedDocuments] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [Users] (
        [Id] uniqueidentifier NOT NULL,
        [Email] nvarchar(255) NOT NULL,
        [PasswordHash] nvarchar(500) NOT NULL,
        [EmailVerified] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [PasswordUpdatedAt] datetime2 NOT NULL,
        [FailedLoginCount] int NOT NULL,
        [LockoutUntil] datetimeoffset NULL,
        [IsAdmin] bit NOT NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [USSubdivisions] (
        [Id] int NOT NULL IDENTITY,
        [Code] nvarchar(10) NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [IsState] bit NOT NULL,
        [IsTerritory] bit NOT NULL,
        CONSTRAINT [PK_USSubdivisions] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [VisaClasses] (
        [Id] int NOT NULL IDENTITY,
        [Code] nvarchar(10) NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [GeneralCategory] nvarchar(100) NULL,
        [IsActive] bit NOT NULL,
        CONSTRAINT [PK_VisaClasses] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [VisaTypes] (
        [Id] int NOT NULL IDENTITY,
        [Code] nvarchar(10) NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_VisaTypes] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [WebhookEvents] (
        [Id] uniqueidentifier NOT NULL,
        [StripeEventId] nvarchar(200) NOT NULL,
        [EventType] nvarchar(100) NOT NULL,
        [Provider] int NOT NULL,
        [EventId] nvarchar(max) NOT NULL,
        [Type] nvarchar(max) NOT NULL,
        [Status] int NOT NULL,
        [Hash] nvarchar(max) NULL,
        [ReceivedAt] datetime2 NOT NULL,
        [ProcessingError] nvarchar(2000) NULL,
        [ProcessedAt] datetimeoffset NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_WebhookEvents] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [FormFields] (
        [Id] uniqueidentifier NOT NULL,
        [TemplateId] uniqueidentifier NOT NULL,
        [Name] nvarchar(100) NOT NULL,
        [LabelKey] nvarchar(200) NOT NULL,
        [Type] nvarchar(20) NOT NULL,
        [Required] bit NOT NULL,
        [DataKey] nvarchar(200) NULL,
        CONSTRAINT [PK_FormFields] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_FormFields_FormTemplates_TemplateId] FOREIGN KEY ([TemplateId]) REFERENCES [FormTemplates] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [AdminSettings] (
        [Id] uniqueidentifier NOT NULL,
        [Key] nvarchar(200) NOT NULL,
        [Value] nvarchar(2000) NOT NULL,
        [Description] nvarchar(500) NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [UpdatedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_AdminSettings] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AdminSettings_Users_UpdatedByUserId] FOREIGN KEY ([UpdatedByUserId]) REFERENCES [Users] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [AuditLogs] (
        [Id] bigint NOT NULL IDENTITY,
        [Category] nvarchar(50) NOT NULL,
        [ActorUserId] uniqueidentifier NULL,
        [Action] nvarchar(100) NOT NULL,
        [TargetType] nvarchar(100) NOT NULL,
        [TargetId] nvarchar(100) NOT NULL,
        [DetailsJson] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AuditLogs_Users_ActorUserId] FOREIGN KEY ([ActorUserId]) REFERENCES [Users] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [AvailabilityBlocks] (
        [Id] uniqueidentifier NOT NULL,
        [StaffId] uniqueidentifier NOT NULL,
        [StartTime] datetime2 NOT NULL,
        [EndTime] datetime2 NOT NULL,
        [TimeZone] nvarchar(100) NOT NULL,
        [Type] nvarchar(50) NOT NULL,
        [Reason] nvarchar(500) NULL,
        [IsRecurring] bit NOT NULL,
        [RecurrencePattern] nvarchar(2000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [ExpiresAt] datetime2 NULL,
        CONSTRAINT [PK_AvailabilityBlocks] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AvailabilityBlocks_Users_StaffId] FOREIGN KEY ([StaffId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [DailyDigestQueues] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [ItemsJson] nvarchar(4000) NOT NULL,
        [LastSentAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_DailyDigestQueues] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_DailyDigestQueues_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [GuardianLinks] (
        [Id] uniqueidentifier NOT NULL,
        [ChildUserId] uniqueidentifier NOT NULL,
        [GuardianUserId] uniqueidentifier NOT NULL,
        [AttestationId] uniqueidentifier NOT NULL,
        [Status] nvarchar(50) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_GuardianLinks] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_GuardianLinks_Users_ChildUserId] FOREIGN KEY ([ChildUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_GuardianLinks_Users_GuardianUserId] FOREIGN KEY ([GuardianUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [PasswordResetTokens] (
        [Id] int NOT NULL IDENTITY,
        [UserId] uniqueidentifier NOT NULL,
        [TokenHash] nvarchar(500) NOT NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [UsedAt] datetime2 NULL,
        CONSTRAINT [PK_PasswordResetTokens] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PasswordResetTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [RememberMeTokens] (
        [Id] int NOT NULL IDENTITY,
        [UserId] uniqueidentifier NOT NULL,
        [TokenHash] nvarchar(500) NOT NULL,
        [IssuedAt] datetime2 NOT NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [RevokedAt] datetime2 NULL,
        CONSTRAINT [PK_RememberMeTokens] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RememberMeTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [Cases] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [Status] nvarchar(50) NOT NULL,
        [LastActivityAt] datetimeoffset NOT NULL,
        [VisaTypeId] int NULL,
        [PackageId] int NULL,
        [AssignedStaffId] uniqueidentifier NULL,
        [IsInterviewLocked] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Cases] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Cases_Packages_PackageId] FOREIGN KEY ([PackageId]) REFERENCES [Packages] ([Id]),
        CONSTRAINT [FK_Cases_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Cases_VisaTypes_VisaTypeId] FOREIGN KEY ([VisaTypeId]) REFERENCES [VisaTypes] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [PricingRules] (
        [Id] int NOT NULL IDENTITY,
        [VisaTypeId] int NOT NULL,
        [PackageId] int NOT NULL,
        [CountryCode] nvarchar(2) NOT NULL,
        [BasePrice] decimal(18,2) NOT NULL,
        [Currency] nvarchar(3) NOT NULL,
        [FxSurchargeMode] nvarchar(50) NULL,
        [TaxRate] decimal(5,4) NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_PricingRules] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PricingRules_Packages_PackageId] FOREIGN KEY ([PackageId]) REFERENCES [Packages] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_PricingRules_VisaTypes_VisaTypeId] FOREIGN KEY ([VisaTypeId]) REFERENCES [VisaTypes] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [WorkflowVersions] (
        [Id] uniqueidentifier NOT NULL,
        [VisaTypeId] int NOT NULL,
        [CountryCode] nvarchar(2) NOT NULL,
        [Version] int NOT NULL,
        [Status] nvarchar(50) NOT NULL,
        [Source] nvarchar(50) NOT NULL,
        [ScrapeHash] nvarchar(100) NOT NULL,
        [ScrapedAt] datetime2 NOT NULL,
        [ApprovedBy] uniqueidentifier NULL,
        [ApprovedAt] datetime2 NULL,
        [Notes] nvarchar(2000) NULL,
        [SummaryJson] nvarchar(4000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_WorkflowVersions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_WorkflowVersions_Users_ApprovedBy] FOREIGN KEY ([ApprovedBy]) REFERENCES [Users] ([Id]),
        CONSTRAINT [FK_WorkflowVersions_VisaTypes_VisaTypeId] FOREIGN KEY ([VisaTypeId]) REFERENCES [VisaTypes] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [FieldBindings] (
        [Id] uniqueidentifier NOT NULL,
        [TemplateId] uniqueidentifier NOT NULL,
        [FormFieldId] uniqueidentifier NOT NULL,
        [DataKey] nvarchar(200) NOT NULL,
        CONSTRAINT [PK_FieldBindings] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_FieldBindings_FormFields_FormFieldId] FOREIGN KEY ([FormFieldId]) REFERENCES [FormFields] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_FieldBindings_FormTemplates_TemplateId] FOREIGN KEY ([TemplateId]) REFERENCES [FormTemplates] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [Appointments] (
        [Id] uniqueidentifier NOT NULL,
        [CaseId] uniqueidentifier NOT NULL,
        [StaffUserId] uniqueidentifier NOT NULL,
        [ScheduledStart] datetimeoffset NOT NULL,
        [ScheduledEnd] datetimeoffset NOT NULL,
        [Type] nvarchar(50) NOT NULL,
        [Status] nvarchar(50) NOT NULL,
        [TimeZone] nvarchar(max) NOT NULL,
        [TimezoneOffsetMinutes] int NOT NULL,
        [Notes] nvarchar(1000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [ConfirmedAt] datetime2 NULL,
        [CompletedAt] datetime2 NULL,
        [CancelledAt] datetime2 NULL,
        [CancellationReason] nvarchar(500) NULL,
        CONSTRAINT [PK_Appointments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Appointments_Cases_CaseId] FOREIGN KEY ([CaseId]) REFERENCES [Cases] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Appointments_Users_StaffUserId] FOREIGN KEY ([StaffUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [CasePriceSnapshots] (
        [Id] int NOT NULL IDENTITY,
        [CaseId] uniqueidentifier NOT NULL,
        [VisaTypeCode] nvarchar(10) NOT NULL,
        [PackageCode] nvarchar(50) NOT NULL,
        [CountryCode] nvarchar(2) NOT NULL,
        [BreakdownJson] nvarchar(max) NOT NULL,
        [Total] decimal(18,2) NOT NULL,
        [Currency] nvarchar(3) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_CasePriceSnapshots] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CasePriceSnapshots_Cases_CaseId] FOREIGN KEY ([CaseId]) REFERENCES [Cases] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [FormInstances] (
        [Id] uniqueidentifier NOT NULL,
        [CaseId] uniqueidentifier NOT NULL,
        [TemplateId] uniqueidentifier NOT NULL,
        [DataSnapshotJson] nvarchar(max) NOT NULL,
        [PdfPath] nvarchar(1000) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_FormInstances] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_FormInstances_Cases_CaseId] FOREIGN KEY ([CaseId]) REFERENCES [Cases] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_FormInstances_FormTemplates_TemplateId] FOREIGN KEY ([TemplateId]) REFERENCES [FormTemplates] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [InterviewSessions] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [CaseId] uniqueidentifier NOT NULL,
        [Status] nvarchar(50) NOT NULL,
        [StartedAt] datetime2 NOT NULL,
        [FinishedAt] datetime2 NULL,
        [LockedAt] datetime2 NULL,
        CONSTRAINT [PK_InterviewSessions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_InterviewSessions_Cases_CaseId] FOREIGN KEY ([CaseId]) REFERENCES [Cases] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_InterviewSessions_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [Invoices] (
        [Id] uniqueidentifier NOT NULL,
        [CaseId] uniqueidentifier NOT NULL,
        [InvoiceNumber] nvarchar(20) NOT NULL,
        [SequentialNumber] int NOT NULL,
        [Year] int NOT NULL,
        [Currency] nvarchar(3) NOT NULL,
        [Total] decimal(18,2) NOT NULL,
        [Status] nvarchar(50) NOT NULL,
        [StripeCheckoutSessionId] nvarchar(200) NULL,
        [PaidAt] datetimeoffset NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Invoices] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Invoices_Cases_CaseId] FOREIGN KEY ([CaseId]) REFERENCES [Cases] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [MessageThreads] (
        [Id] uniqueidentifier NOT NULL,
        [CaseId] uniqueidentifier NOT NULL,
        [Subject] nvarchar(200) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [LastMessageAt] datetime2 NOT NULL,
        CONSTRAINT [PK_MessageThreads] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MessageThreads_Cases_CaseId] FOREIGN KEY ([CaseId]) REFERENCES [Cases] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [Uploads] (
        [Id] uniqueidentifier NOT NULL,
        [CaseId] uniqueidentifier NOT NULL,
        [OriginalName] nvarchar(255) NOT NULL,
        [Mime] nvarchar(100) NOT NULL,
        [SizeBytes] bigint NOT NULL,
        [Key] nvarchar(500) NOT NULL,
        [Status] nvarchar(50) NOT NULL,
        [StorageUrl] nvarchar(1000) NULL,
        [VerdictAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Uploads] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Uploads_Cases_CaseId] FOREIGN KEY ([CaseId]) REFERENCES [Cases] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [VisaChangeRequests] (
        [Id] uniqueidentifier NOT NULL,
        [CaseId] uniqueidentifier NOT NULL,
        [OldVisaTypeId] int NOT NULL,
        [NewVisaTypeId] int NOT NULL,
        [Status] nvarchar(50) NOT NULL,
        [RequestedByStaffId] uniqueidentifier NOT NULL,
        [RequestedAt] datetime2 NOT NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [ApprovedByClientAt] datetime2 NULL,
        [RejectedByClientAt] datetime2 NULL,
        [DeltaAmount] decimal(18,2) NOT NULL,
        [Currency] nvarchar(3) NOT NULL,
        [BreakdownJson] nvarchar(max) NULL,
        [Notes] nvarchar(1000) NULL,
        CONSTRAINT [PK_VisaChangeRequests] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_VisaChangeRequests_Cases_CaseId] FOREIGN KEY ([CaseId]) REFERENCES [Cases] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_VisaChangeRequests_Users_RequestedByStaffId] FOREIGN KEY ([RequestedByStaffId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_VisaChangeRequests_VisaTypes_NewVisaTypeId] FOREIGN KEY ([NewVisaTypeId]) REFERENCES [VisaTypes] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_VisaChangeRequests_VisaTypes_OldVisaTypeId] FOREIGN KEY ([OldVisaTypeId]) REFERENCES [VisaTypes] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [VisaRecommendations] (
        [Id] uniqueidentifier NOT NULL,
        [CaseId] uniqueidentifier NOT NULL,
        [VisaTypeId] int NOT NULL,
        [Rationale] nvarchar(2000) NULL,
        [LockedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UserId] uniqueidentifier NULL,
        CONSTRAINT [PK_VisaRecommendations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_VisaRecommendations_Cases_CaseId] FOREIGN KEY ([CaseId]) REFERENCES [Cases] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_VisaRecommendations_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]),
        CONSTRAINT [FK_VisaRecommendations_VisaTypes_VisaTypeId] FOREIGN KEY ([VisaTypeId]) REFERENCES [VisaTypes] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [WorkflowDoctors] (
        [Id] uniqueidentifier NOT NULL,
        [WorkflowVersionId] uniqueidentifier NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Address] nvarchar(500) NOT NULL,
        [Phone] nvarchar(50) NULL,
        [City] nvarchar(100) NOT NULL,
        [CountryCode] nvarchar(2) NOT NULL,
        [SourceUrl] nvarchar(1000) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_WorkflowDoctors] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_WorkflowDoctors_WorkflowVersions_WorkflowVersionId] FOREIGN KEY ([WorkflowVersionId]) REFERENCES [WorkflowVersions] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [WorkflowSteps] (
        [Id] uniqueidentifier NOT NULL,
        [WorkflowVersionId] uniqueidentifier NOT NULL,
        [Ordinal] int NOT NULL,
        [Key] nvarchar(100) NOT NULL,
        [Title] nvarchar(500) NOT NULL,
        [Description] nvarchar(2000) NOT NULL,
        [DataJson] nvarchar(4000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_WorkflowSteps] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_WorkflowSteps_WorkflowVersions_WorkflowVersionId] FOREIGN KEY ([WorkflowVersionId]) REFERENCES [WorkflowVersions] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [Meetings] (
        [Id] uniqueidentifier NOT NULL,
        [AppointmentId] uniqueidentifier NOT NULL,
        [Provider] nvarchar(50) NOT NULL,
        [MeetingId] nvarchar(200) NOT NULL,
        [JoinUrl] nvarchar(1000) NOT NULL,
        [WaitingRoom] bit NOT NULL,
        [Recording] bit NOT NULL,
        [ConsentAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Meetings] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Meetings_Appointments_AppointmentId] FOREIGN KEY ([AppointmentId]) REFERENCES [Appointments] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [RescheduleProposals] (
        [Id] uniqueidentifier NOT NULL,
        [AppointmentId] uniqueidentifier NOT NULL,
        [InitiatedBy] nvarchar(50) NOT NULL,
        [Status] nvarchar(50) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [RespondedAt] datetime2 NULL,
        [RejectionReason] nvarchar(500) NULL,
        [Option1StartTime] datetime2 NOT NULL,
        [Option2StartTime] datetime2 NOT NULL,
        [Option3StartTime] datetime2 NOT NULL,
        [DurationMinutes] int NOT NULL,
        [TimeZone] nvarchar(100) NOT NULL,
        [TimezoneOffsetMinutes] int NOT NULL,
        [ChosenOption] int NULL,
        CONSTRAINT [PK_RescheduleProposals] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RescheduleProposals_Appointments_AppointmentId] FOREIGN KEY ([AppointmentId]) REFERENCES [Appointments] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [InterviewQAs] (
        [Id] uniqueidentifier NOT NULL,
        [SessionId] uniqueidentifier NOT NULL,
        [StepNumber] int NOT NULL,
        [QuestionKey] nvarchar(200) NOT NULL,
        [AnswerValue] nvarchar(2000) NOT NULL,
        [AnsweredAt] datetime2 NOT NULL,
        CONSTRAINT [PK_InterviewQAs] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_InterviewQAs_InterviewSessions_SessionId] FOREIGN KEY ([SessionId]) REFERENCES [InterviewSessions] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [Payments] (
        [Id] uniqueidentifier NOT NULL,
        [InvoiceId] uniqueidentifier NOT NULL,
        [StripePaymentIntentId] nvarchar(200) NOT NULL,
        [StripeCheckoutSessionId] nvarchar(max) NULL,
        [Status] int NOT NULL,
        [Currency] nvarchar(3) NOT NULL,
        [Amount] decimal(18,2) NOT NULL,
        [PaidAt] datetimeoffset NULL,
        [FailureReason] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Payments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Payments_Invoices_InvoiceId] FOREIGN KEY ([InvoiceId]) REFERENCES [Invoices] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [Refunds] (
        [Id] uniqueidentifier NOT NULL,
        [InvoiceId] uniqueidentifier NOT NULL,
        [StripeRefundId] nvarchar(200) NOT NULL,
        [Status] nvarchar(50) NOT NULL,
        [Currency] nvarchar(3) NOT NULL,
        [Amount] decimal(18,2) NOT NULL,
        [Reason] nvarchar(200) NOT NULL,
        [ProcessedAt] datetimeoffset NULL,
        [FailureReason] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Refunds] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Refunds_Invoices_InvoiceId] FOREIGN KEY ([InvoiceId]) REFERENCES [Invoices] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [Messages] (
        [Id] uniqueidentifier NOT NULL,
        [ThreadId] uniqueidentifier NOT NULL,
        [SenderUserId] uniqueidentifier NOT NULL,
        [Body] nvarchar(4000) NOT NULL,
        [SentAt] datetime2 NOT NULL,
        [Channel] nvarchar(50) NOT NULL,
        [ReadByJson] nvarchar(2000) NULL,
        CONSTRAINT [PK_Messages] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Messages_MessageThreads_ThreadId] FOREIGN KEY ([ThreadId]) REFERENCES [MessageThreads] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Messages_Users_SenderUserId] FOREIGN KEY ([SenderUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE TABLE [PriceDeltaLedgers] (
        [Id] uniqueidentifier NOT NULL,
        [CaseId] uniqueidentifier NOT NULL,
        [VisaChangeRequestId] uniqueidentifier NULL,
        [Type] nvarchar(50) NOT NULL,
        [Direction] int NOT NULL,
        [Amount] decimal(18,2) NOT NULL,
        [Currency] nvarchar(3) NOT NULL,
        [Description] nvarchar(500) NOT NULL,
        [Reason] nvarchar(max) NULL,
        [Status] int NOT NULL,
        [ApprovedByUserId] uniqueidentifier NULL,
        [ApprovedAt] datetime2 NULL,
        [StripePaymentIntentId] nvarchar(200) NULL,
        [StripeRefundId] nvarchar(200) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [ProcessedAt] datetime2 NULL,
        [ProcessorResponse] nvarchar(2000) NULL,
        CONSTRAINT [PK_PriceDeltaLedgers] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PriceDeltaLedgers_Cases_CaseId] FOREIGN KEY ([CaseId]) REFERENCES [Cases] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_PriceDeltaLedgers_Users_ApprovedByUserId] FOREIGN KEY ([ApprovedByUserId]) REFERENCES [Users] ([Id]),
        CONSTRAINT [FK_PriceDeltaLedgers_VisaChangeRequests_VisaChangeRequestId] FOREIGN KEY ([VisaChangeRequestId]) REFERENCES [VisaChangeRequests] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE UNIQUE INDEX [IX_AdminSettings_Key] ON [AdminSettings] ([Key]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_AdminSettings_UpdatedAt] ON [AdminSettings] ([UpdatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_AdminSettings_UpdatedByUserId] ON [AdminSettings] ([UpdatedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_Appointments_CaseId] ON [Appointments] ([CaseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_Appointments_ScheduledStart] ON [Appointments] ([ScheduledStart]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_Appointments_StaffUserId] ON [Appointments] ([StaffUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_Appointments_Status] ON [Appointments] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_ActorUserId] ON [AuditLogs] ([ActorUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_Category] ON [AuditLogs] ([Category]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_CreatedAt] ON [AuditLogs] ([CreatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_TargetType] ON [AuditLogs] ([TargetType]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_AvailabilityBlocks_EndTime] ON [AvailabilityBlocks] ([EndTime]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_AvailabilityBlocks_StaffId] ON [AvailabilityBlocks] ([StaffId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_AvailabilityBlocks_StartTime] ON [AvailabilityBlocks] ([StartTime]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_AvailabilityBlocks_Type] ON [AvailabilityBlocks] ([Type]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_CasePriceSnapshots_CaseId] ON [CasePriceSnapshots] ([CaseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_Cases_PackageId] ON [Cases] ([PackageId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_Cases_Status] ON [Cases] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_Cases_UserId] ON [Cases] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_Cases_VisaTypeId] ON [Cases] ([VisaTypeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Countries_Iso2] ON [Countries] ([Iso2]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Countries_Iso3] ON [Countries] ([Iso3]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CountryServiceMappings_Service_FromCountry] ON [CountryServiceMappings] ([Service], [FromCountry]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_CountryServiceMappings_ToCountry] ON [CountryServiceMappings] ([ToCountry]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_DailyDigestQueues_LastSentAt] ON [DailyDigestQueues] ([LastSentAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_DailyDigestQueues_UserId] ON [DailyDigestQueues] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_FieldBindings_FormFieldId] ON [FieldBindings] ([FormFieldId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE UNIQUE INDEX [IX_FieldBindings_TemplateId_FormFieldId_DataKey] ON [FieldBindings] ([TemplateId], [FormFieldId], [DataKey]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE UNIQUE INDEX [IX_FormFields_TemplateId_Name] ON [FormFields] ([TemplateId], [Name]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_FormInstances_CaseId_CreatedAt] ON [FormInstances] ([CaseId], [CreatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_FormInstances_TemplateId] ON [FormInstances] ([TemplateId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE UNIQUE INDEX [IX_FormTemplates_Code_Version] ON [FormTemplates] ([Code], [Version]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_GuardianLinks_ChildUserId] ON [GuardianLinks] ([ChildUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_GuardianLinks_GuardianUserId] ON [GuardianLinks] ([GuardianUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE UNIQUE INDEX [IX_InterviewQAs_SessionId_StepNumber] ON [InterviewQAs] ([SessionId], [StepNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_InterviewSessions_CaseId] ON [InterviewSessions] ([CaseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_InterviewSessions_UserId] ON [InterviewSessions] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_Invoices_CaseId] ON [Invoices] ([CaseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Invoices_InvoiceNumber] ON [Invoices] ([InvoiceNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_Invoices_Status] ON [Invoices] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Invoices_Year_SequentialNumber] ON [Invoices] ([Year], [SequentialNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Meetings_AppointmentId] ON [Meetings] ([AppointmentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_Meetings_Provider] ON [Meetings] ([Provider]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_Messages_SenderUserId] ON [Messages] ([SenderUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_Messages_ThreadId_SentAt] ON [Messages] ([ThreadId], [SentAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_MessageThreads_CaseId] ON [MessageThreads] ([CaseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Packages_Code] ON [Packages] ([Code]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_PasswordResetTokens_ExpiresAt] ON [PasswordResetTokens] ([ExpiresAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_PasswordResetTokens_TokenHash] ON [PasswordResetTokens] ([TokenHash]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_PasswordResetTokens_UserId] ON [PasswordResetTokens] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_Payments_InvoiceId] ON [Payments] ([InvoiceId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_Payments_Status] ON [Payments] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Payments_StripePaymentIntentId] ON [Payments] ([StripePaymentIntentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_PriceDeltaLedgers_ApprovedByUserId] ON [PriceDeltaLedgers] ([ApprovedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_PriceDeltaLedgers_CaseId] ON [PriceDeltaLedgers] ([CaseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_PriceDeltaLedgers_Status] ON [PriceDeltaLedgers] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_PriceDeltaLedgers_Type] ON [PriceDeltaLedgers] ([Type]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_PriceDeltaLedgers_VisaChangeRequestId] ON [PriceDeltaLedgers] ([VisaChangeRequestId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_PricingRules_PackageId] ON [PricingRules] ([PackageId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PricingRules_VisaTypeId_PackageId_CountryCode] ON [PricingRules] ([VisaTypeId], [PackageId], [CountryCode]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_Refunds_InvoiceId] ON [Refunds] ([InvoiceId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_Refunds_Status] ON [Refunds] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Refunds_StripeRefundId] ON [Refunds] ([StripeRefundId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_RememberMeTokens_ExpiresAt] ON [RememberMeTokens] ([ExpiresAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_RememberMeTokens_TokenHash] ON [RememberMeTokens] ([TokenHash]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_RememberMeTokens_UserId] ON [RememberMeTokens] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_RescheduleProposals_AppointmentId] ON [RescheduleProposals] ([AppointmentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_RescheduleProposals_ExpiresAt] ON [RescheduleProposals] ([ExpiresAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_RescheduleProposals_Status] ON [RescheduleProposals] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_RetentionQueues_Category_EnqueuedAt] ON [RetentionQueues] ([Category], [EnqueuedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_RetentionQueues_ProcessedAt] ON [RetentionQueues] ([ProcessedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_ScrapedDocuments_CountryCode_VisaTypeCode_Source] ON [ScrapedDocuments] ([CountryCode], [VisaTypeCode], [Source]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_ScrapedDocuments_FetchedAt] ON [ScrapedDocuments] ([FetchedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ScrapedDocuments_Sha256] ON [ScrapedDocuments] ([Sha256]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_Uploads_CaseId_CreatedAt] ON [Uploads] ([CaseId], [CreatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_Uploads_Status] ON [Uploads] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE UNIQUE INDEX [IX_USSubdivisions_Code] ON [USSubdivisions] ([Code]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_VisaChangeRequests_CaseId] ON [VisaChangeRequests] ([CaseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_VisaChangeRequests_ExpiresAt] ON [VisaChangeRequests] ([ExpiresAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_VisaChangeRequests_NewVisaTypeId] ON [VisaChangeRequests] ([NewVisaTypeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_VisaChangeRequests_OldVisaTypeId] ON [VisaChangeRequests] ([OldVisaTypeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_VisaChangeRequests_RequestedByStaffId] ON [VisaChangeRequests] ([RequestedByStaffId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_VisaChangeRequests_Status] ON [VisaChangeRequests] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE UNIQUE INDEX [IX_VisaClasses_Code] ON [VisaClasses] ([Code]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_VisaRecommendations_CaseId] ON [VisaRecommendations] ([CaseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_VisaRecommendations_UserId] ON [VisaRecommendations] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_VisaRecommendations_VisaTypeId] ON [VisaRecommendations] ([VisaTypeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE UNIQUE INDEX [IX_VisaTypes_Code] ON [VisaTypes] ([Code]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_WebhookEvents_CreatedAt] ON [WebhookEvents] ([CreatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_WebhookEvents_EventType] ON [WebhookEvents] ([EventType]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_WebhookEvents_Status] ON [WebhookEvents] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE UNIQUE INDEX [IX_WebhookEvents_StripeEventId] ON [WebhookEvents] ([StripeEventId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_WorkflowDoctors_CountryCode] ON [WorkflowDoctors] ([CountryCode]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_WorkflowDoctors_WorkflowVersionId] ON [WorkflowDoctors] ([WorkflowVersionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE UNIQUE INDEX [IX_WorkflowSteps_WorkflowVersionId_Key] ON [WorkflowSteps] ([WorkflowVersionId], [Key]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE UNIQUE INDEX [IX_WorkflowSteps_WorkflowVersionId_Ordinal] ON [WorkflowSteps] ([WorkflowVersionId], [Ordinal]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_WorkflowVersions_ApprovedBy] ON [WorkflowVersions] ([ApprovedBy]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_WorkflowVersions_CountryCode] ON [WorkflowVersions] ([CountryCode]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_WorkflowVersions_ScrapeHash] ON [WorkflowVersions] ([ScrapeHash]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE INDEX [IX_WorkflowVersions_Status] ON [WorkflowVersions] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    CREATE UNIQUE INDEX [IX_WorkflowVersions_VisaTypeId_CountryCode_Version] ON [WorkflowVersions] ([VisaTypeId], [CountryCode], [Version]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250903183811_InitialCreateNoSetNull'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250903183811_InitialCreateNoSetNull', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250904213636_AddIsStaffColumn'
)
BEGIN
    ALTER TABLE [Users] ADD [IsStaff] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250904213636_AddIsStaffColumn'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250904213636_AddIsStaffColumn', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250905024541_IncreaseDailyDigestQueueItemsJsonSize'
)
BEGIN
    DECLARE @var nvarchar(max);
    SELECT @var = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[DailyDigestQueues]') AND [c].[name] = N'ItemsJson');
    IF @var IS NOT NULL EXEC(N'ALTER TABLE [DailyDigestQueues] DROP CONSTRAINT ' + @var + ';');
    ALTER TABLE [DailyDigestQueues] ALTER COLUMN [ItemsJson] nvarchar(max) NOT NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250905024541_IncreaseDailyDigestQueueItemsJsonSize'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250905024541_IncreaseDailyDigestQueueItemsJsonSize', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250905024652_UpdateDailyDigestQueueModel'
)
BEGIN
    DECLARE @var1 nvarchar(max);
    SELECT @var1 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[DailyDigestQueues]') AND [c].[name] = N'ItemsJson');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [DailyDigestQueues] DROP CONSTRAINT ' + @var1 + ';');
    ALTER TABLE [DailyDigestQueues] ALTER COLUMN [ItemsJson] nvarchar(max) NOT NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250905024652_UpdateDailyDigestQueueModel'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250905024652_UpdateDailyDigestQueueModel', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907152117_SecurityHardeningInit'
)
BEGIN
    DROP INDEX [IX_Cases_Status] ON [Cases];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907152117_SecurityHardeningInit'
)
BEGIN
    CREATE TABLE [EmailVerificationTokens] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [TokenHash] nvarchar(500) NOT NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [UsedAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_EmailVerificationTokens] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_EmailVerificationTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907152117_SecurityHardeningInit'
)
BEGIN
    CREATE TABLE [UserSessions] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [RefreshIdHash] nvarchar(500) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [UserAgent] nvarchar(1000) NOT NULL,
        [IpHash] nvarchar(500) NOT NULL,
        [RevokedAt] datetime2 NULL,
        CONSTRAINT [PK_UserSessions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_UserSessions_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907152117_SecurityHardeningInit'
)
BEGIN
    CREATE INDEX [IX_EmailVerificationTokens_TokenHash] ON [EmailVerificationTokens] ([TokenHash]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907152117_SecurityHardeningInit'
)
BEGIN
    CREATE INDEX [IX_EmailVerificationTokens_UserId] ON [EmailVerificationTokens] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907152117_SecurityHardeningInit'
)
BEGIN
    CREATE INDEX [IX_UserSessions_RefreshIdHash] ON [UserSessions] ([RefreshIdHash]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907152117_SecurityHardeningInit'
)
BEGIN
    CREATE INDEX [IX_UserSessions_UserId] ON [UserSessions] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250907152117_SecurityHardeningInit'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250907152117_SecurityHardeningInit', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250909171120_AddUserFirstLastName'
)
BEGIN
    ALTER TABLE [Users] ADD [FirstName] nvarchar(max) NOT NULL DEFAULT N'';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250909171120_AddUserFirstLastName'
)
BEGIN
    ALTER TABLE [Users] ADD [LastName] nvarchar(max) NOT NULL DEFAULT N'';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250909171120_AddUserFirstLastName'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250909171120_AddUserFirstLastName', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250913043719_AddUserProfileFields'
)
BEGIN
    ALTER TABLE [Users] ADD [Citizenship] nvarchar(max) NOT NULL DEFAULT N'';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250913043719_AddUserProfileFields'
)
BEGIN
    ALTER TABLE [Users] ADD [City] nvarchar(max) NOT NULL DEFAULT N'';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250913043719_AddUserProfileFields'
)
BEGIN
    ALTER TABLE [Users] ADD [Country] nvarchar(max) NOT NULL DEFAULT N'';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250913043719_AddUserProfileFields'
)
BEGIN
    ALTER TABLE [Users] ADD [DateOfBirth] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250913043719_AddUserProfileFields'
)
BEGIN
    ALTER TABLE [Users] ADD [GuardianEmail] nvarchar(max) NOT NULL DEFAULT N'';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250913043719_AddUserProfileFields'
)
BEGIN
    ALTER TABLE [Users] ADD [MaritalStatus] nvarchar(max) NOT NULL DEFAULT N'';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250913043719_AddUserProfileFields'
)
BEGIN
    ALTER TABLE [Users] ADD [Nationality] nvarchar(max) NOT NULL DEFAULT N'';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250913043719_AddUserProfileFields'
)
BEGIN
    ALTER TABLE [Users] ADD [PhoneNumber] nvarchar(max) NOT NULL DEFAULT N'';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250913043719_AddUserProfileFields'
)
BEGIN
    ALTER TABLE [Users] ADD [PostalCode] nvarchar(max) NOT NULL DEFAULT N'';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250913043719_AddUserProfileFields'
)
BEGIN
    ALTER TABLE [Users] ADD [StateProvince] nvarchar(max) NOT NULL DEFAULT N'';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250913043719_AddUserProfileFields'
)
BEGIN
    ALTER TABLE [Users] ADD [StreetAddress] nvarchar(max) NOT NULL DEFAULT N'';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250913043719_AddUserProfileFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250913043719_AddUserProfileFields', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250918225438_AddUserIsActiveField'
)
BEGIN
    ALTER TABLE [Users] ADD [IsActive] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250918225438_AddUserIsActiveField'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250918225438_AddUserIsActiveField', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250920001746_AddApprovedDoctorEntity'
)
BEGIN
    CREATE TABLE [ApprovedDoctors] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Address] nvarchar(max) NOT NULL,
        [Phone] nvarchar(max) NULL,
        [Email] nvarchar(max) NULL,
        [City] nvarchar(max) NULL,
        [StateProvince] nvarchar(max) NULL,
        [PostalCode] nvarchar(max) NULL,
        [CountryCode] nvarchar(max) NOT NULL,
        [Website] nvarchar(max) NULL,
        [Specialties] nvarchar(max) NULL,
        [Languages] nvarchar(max) NULL,
        [AcceptedCountryCodes] nvarchar(max) NULL,
        [Notes] nvarchar(max) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_ApprovedDoctors] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250920001746_AddApprovedDoctorEntity'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250920001746_AddApprovedDoctorEntity', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250930035242_AddGenderToUser'
)
BEGIN
    ALTER TABLE [Users] ADD [Gender] nvarchar(max) NOT NULL DEFAULT N'';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20250930035242_AddGenderToUser'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20250930035242_AddGenderToUser', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251007181732_AddCountryVisaTypes'
)
BEGIN
    CREATE TABLE [CountryVisaTypes] (
        [Id] int NOT NULL IDENTITY,
        [CountryId] int NOT NULL,
        [VisaTypeId] int NOT NULL,
        [IsActive] bit NOT NULL,
        [Notes] nvarchar(500) NULL,
        CONSTRAINT [PK_CountryVisaTypes] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CountryVisaTypes_Countries_CountryId] FOREIGN KEY ([CountryId]) REFERENCES [Countries] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_CountryVisaTypes_VisaTypes_VisaTypeId] FOREIGN KEY ([VisaTypeId]) REFERENCES [VisaTypes] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251007181732_AddCountryVisaTypes'
)
BEGIN
    CREATE INDEX [IX_CountryVisaTypes_CountryId] ON [CountryVisaTypes] ([CountryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251007181732_AddCountryVisaTypes'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CountryVisaTypes_CountryId_VisaTypeId] ON [CountryVisaTypes] ([CountryId], [VisaTypeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251007181732_AddCountryVisaTypes'
)
BEGIN
    CREATE INDEX [IX_CountryVisaTypes_VisaTypeId] ON [CountryVisaTypes] ([VisaTypeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251007181732_AddCountryVisaTypes'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251007181732_AddCountryVisaTypes', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251008140455_AddCategoryClassTable'
)
BEGIN
    CREATE TABLE [CategoryClasses] (
        [Id] uniqueidentifier NOT NULL,
        [ClassCode] nvarchar(10) NOT NULL,
        [ClassName] nvarchar(100) NOT NULL,
        [GeneralCategory] nvarchar(200) NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_CategoryClasses] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251008140455_AddCategoryClassTable'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CategoryClasses_ClassCode] ON [CategoryClasses] ([ClassCode]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251008140455_AddCategoryClassTable'
)
BEGIN
    CREATE INDEX [IX_CategoryClasses_IsActive] ON [CategoryClasses] ([IsActive]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251008140455_AddCategoryClassTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251008140455_AddCategoryClassTable', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    ALTER TABLE [Users] ADD [AttorneyId] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    ALTER TABLE [Users] ADD [IsLegalProfessional] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE TABLE [AdoptionCases] (
        [Id] int NOT NULL IDENTITY,
        [CaseId] uniqueidentifier NOT NULL,
        [AdoptionType] int NOT NULL,
        [RecommendedVisaType] int NOT NULL,
        [ChildFirstName] nvarchar(100) NOT NULL,
        [ChildLastName] nvarchar(100) NOT NULL,
        [ChildMiddleName] nvarchar(100) NOT NULL,
        [ChildDateOfBirth] datetime2 NOT NULL,
        [ChildCountryOfBirth] nvarchar(100) NOT NULL,
        [ChildCityOfBirth] nvarchar(100) NOT NULL,
        [ChildGender] nvarchar(20) NOT NULL,
        [ChildHasSpecialNeeds] bit NOT NULL,
        [ChildSpecialNeedsDescription] nvarchar(2000) NOT NULL,
        [ChildMedicalConditions] nvarchar(2000) NOT NULL,
        [ChildCurrentLocation] nvarchar(200) NOT NULL,
        [ChildCaregiverInformation] nvarchar(1000) NOT NULL,
        [ChildLanguages] nvarchar(500) NOT NULL,
        [ChildCulturalBackground] nvarchar(1000) NOT NULL,
        [IsAdoptionCompleted] bit NOT NULL,
        [AdoptionCompletionDate] datetime2 NULL,
        [WillCompleteAdoptionInUS] bit NOT NULL,
        [HasLegalCustody] bit NOT NULL,
        [CustodyDate] datetime2 NULL,
        [AgencyName] nvarchar(200) NOT NULL,
        [AgencyCountry] nvarchar(100) NOT NULL,
        [AgencyLicenseNumber] nvarchar(100) NOT NULL,
        [AgencyContactPersonName] nvarchar(100) NOT NULL,
        [AgencyContactEmail] nvarchar(255) NOT NULL,
        [AgencyContactPhone] nvarchar(50) NOT NULL,
        [IsAgencyHagueAccredited] bit NOT NULL,
        [AgencyAccreditationNumber] nvarchar(100) NOT NULL,
        [AgencyAccreditationExpiry] datetime2 NULL,
        [USPartnerAgency] nvarchar(200) NOT NULL,
        [IsHomeStudyCompleted] bit NOT NULL,
        [HomeStudyCompletionDate] datetime2 NULL,
        [HomeStudyConductingAgency] nvarchar(200) NOT NULL,
        [HomeStudySocialWorkerName] nvarchar(100) NOT NULL,
        [HomeStudySocialWorkerLicense] nvarchar(100) NOT NULL,
        [HomeStudyExpirationDate] datetime2 NULL,
        [IsBackgroundCheckCompleted] bit NOT NULL,
        [IsFinancialAssessmentCompleted] bit NOT NULL,
        [IsHomeInspectionCompleted] bit NOT NULL,
        [AreReferencesVerified] bit NOT NULL,
        [HomeStudyRecommendationStatus] nvarchar(50) NOT NULL,
        [HomeStudyRequiredUpdates] nvarchar(2000) NOT NULL,
        [IsMarriedCouple] bit NOT NULL,
        [PrimaryParentName] nvarchar(100) NOT NULL,
        [SpouseName] nvarchar(100) NOT NULL,
        [MarriageDurationYears] int NOT NULL,
        [HasPreviousChildren] bit NOT NULL,
        [NumberOfChildren] int NOT NULL,
        [MotivationForAdoption] nvarchar(2000) NOT NULL,
        [HasAdoptionExperience] bit NOT NULL,
        [PreviousAdoptionDetails] nvarchar(2000) NOT NULL,
        [HasInfertilityIssues] bit NOT NULL,
        [PreferredChildAge] nvarchar(50) NOT NULL,
        [PreferredChildGender] nvarchar(20) NOT NULL,
        [WillingToAdoptSpecialNeeds] bit NOT NULL,
        [AcceptableSpecialNeeds] nvarchar(1000) NOT NULL,
        [HasChildBirthCertificate] bit NOT NULL,
        [HasChildPassport] bit NOT NULL,
        [HasAdoptionDecree] bit NOT NULL,
        [HasChildMedicalRecords] bit NOT NULL,
        [HasChildPhotographs] bit NOT NULL,
        [HasParentBirthCertificates] bit NOT NULL,
        [HasMarriageCertificate] bit NOT NULL,
        [HasDivorceCertificates] bit NOT NULL,
        [HasFinancialDocuments] bit NOT NULL,
        [HasEmploymentVerification] bit NOT NULL,
        [HasMedicalExaminations] bit NOT NULL,
        [HasCriminalBackgroundChecks] bit NOT NULL,
        [HasChildAbuseChecks] bit NOT NULL,
        [HasHomeStudyReport] bit NOT NULL,
        [HasAgencyRecommendation] bit NOT NULL,
        [HasI600APetition] bit NOT NULL,
        [HasI600Petition] bit NOT NULL,
        [IsEligible] bit NOT NULL,
        [EligibilityReason] nvarchar(1000) NOT NULL,
        [RecommendationRationale] nvarchar(2000) NOT NULL,
        [RequiredDocuments] nvarchar(2000) NOT NULL,
        [NextSteps] nvarchar(2000) NOT NULL,
        [PotentialIssues] nvarchar(2000) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [CreatedBy] nvarchar(100) NOT NULL,
        [UpdatedBy] nvarchar(100) NOT NULL,
        CONSTRAINT [PK_AdoptionCases] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AdoptionCases_Cases_CaseId] FOREIGN KEY ([CaseId]) REFERENCES [Cases] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE TABLE [Attorneys] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(255) NOT NULL,
        [Title] nvarchar(255) NOT NULL,
        [Bio] nvarchar(max) NOT NULL,
        [PhotoUrl] nvarchar(500) NOT NULL,
        [Email] nvarchar(255) NOT NULL,
        [Phone] nvarchar(50) NOT NULL,
        [Credentials] nvarchar(max) NOT NULL,
        [PracticeAreas] nvarchar(max) NOT NULL,
        [Languages] nvarchar(max) NOT NULL,
        [DirectPhone] nvarchar(50) NOT NULL,
        [DirectEmail] nvarchar(255) NOT NULL,
        [OfficeLocation] nvarchar(255) NOT NULL,
        [DefaultHourlyRate] decimal(10,2) NOT NULL,
        [IsActive] bit NOT NULL,
        [IsManagingAttorney] bit NOT NULL,
        [DisplayOrder] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Attorneys] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE TABLE [CitizenshipCases] (
        [Id] uniqueidentifier NOT NULL,
        [CaseId] uniqueidentifier NOT NULL,
        [ApplicationType] nvarchar(50) NOT NULL,
        [Status] nvarchar(50) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CurrentLegalName] nvarchar(200) NOT NULL,
        [NameAtBirth] nvarchar(200) NOT NULL,
        [HasNameChanged] bit NOT NULL,
        [DateOfBirth] datetime2 NOT NULL,
        [CountryOfBirth] nvarchar(100) NOT NULL,
        [CityOfBirth] nvarchar(100) NOT NULL,
        [CurrentNationality] nvarchar(100) NOT NULL,
        [MaritalStatus] nvarchar(50) NOT NULL,
        [PermanentResidencyDate] datetime2 NULL,
        [GreenCardNumber] nvarchar(50) NOT NULL,
        [YearsAsResident] int NOT NULL,
        [MonthsPhysicallyPresent] int NOT NULL,
        [ContinuousResidence] bit NOT NULL,
        [HasAbsencesOver6Months] bit NOT NULL,
        [MeetsResidencyRequirement] bit NOT NULL,
        [MeetsPhysicalPresenceRequirement] bit NOT NULL,
        [HasGoodMoralCharacter] bit NOT NULL,
        [AttachedToConstitution] bit NOT NULL,
        [WillingToTakeOath] bit NOT NULL,
        [HasMilitaryService] bit NOT NULL,
        [QualifiesForExceptions] bit NOT NULL,
        [SpeakingLevel] nvarchar(20) NOT NULL,
        [ReadingLevel] nvarchar(20) NOT NULL,
        [WritingLevel] nvarchar(20) NOT NULL,
        [NeedsInterpreter] bit NOT NULL,
        [PreferredLanguage] nvarchar(50) NOT NULL,
        [QualifiesForLanguageException] bit NOT NULL,
        [HasCriminalHistory] bit NOT NULL,
        [HasTaxIssues] bit NOT NULL,
        [HasImmigrationViolations] bit NOT NULL,
        [HasFailedToRegisterForDraft] bit NOT NULL,
        [HasClaimedUSCitizenshipFalsely] bit NOT NULL,
        [HasVotedIllegally] bit NOT NULL,
        [HasBeenDeported] bit NOT NULL,
        [HasTerroristConnections] bit NOT NULL,
        [NeedsEnglishTest] bit NOT NULL,
        [NeedsCivicsTest] bit NOT NULL,
        [QualifiesForTestExemption] bit NOT NULL,
        [ExemptionReason] nvarchar(500) NOT NULL,
        [ParentUSCitizen] bit NOT NULL,
        [ParentCitizenshipDate] datetime2 NULL,
        [BornAbroad] bit NOT NULL,
        [Under18WhenParentNaturalized] bit NOT NULL,
        [ResidedWithCitizenParent] bit NOT NULL,
        [HadLegalCustody] bit NOT NULL,
        [WasPermanentResidentWhenParentNaturalized] bit NOT NULL,
        [RecommendedApplication] nvarchar(50) NOT NULL,
        [Rationale] nvarchar(2000) NOT NULL,
        [IsEligible] bit NOT NULL,
        [EligibilityReason] nvarchar(1000) NOT NULL,
        [EarliestApplicationDate] datetime2 NULL,
        [ProcessingTimeEstimate] nvarchar(200) NOT NULL,
        CONSTRAINT [PK_CitizenshipCases] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CitizenshipCases_Cases_CaseId] FOREIGN KEY ([CaseId]) REFERENCES [Cases] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE TABLE [Notifications] (
        [Id] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [UserId1] uniqueidentifier NOT NULL,
        [Title] nvarchar(200) NOT NULL,
        [Message] nvarchar(1000) NOT NULL,
        [Type] int NOT NULL,
        [Priority] int NOT NULL,
        [IsRead] bit NOT NULL,
        [IsEmailSent] bit NOT NULL,
        [EmailSentAt] datetime2 NULL,
        [RelatedEntityType] nvarchar(max) NULL,
        [RelatedEntityId] int NULL,
        [ActionUrl] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [ReadAt] datetime2 NULL,
        [ExpiresAt] datetime2 NULL,
        CONSTRAINT [PK_Notifications] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Notifications_Users_UserId1] FOREIGN KEY ([UserId1]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE TABLE [NotificationTemplates] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(100) NOT NULL,
        [Type] int NOT NULL,
        [SubjectTemplate] nvarchar(200) NOT NULL,
        [BodyTemplate] nvarchar(2000) NOT NULL,
        [EmailBodyTemplate] nvarchar(1000) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_NotificationTemplates] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE TABLE [ServiceCategories] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(255) NOT NULL,
        [Description] nvarchar(max) NOT NULL,
        [IconUrl] nvarchar(500) NOT NULL,
        [IsActive] bit NOT NULL,
        [DisplayOrder] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_ServiceCategories] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE TABLE [SiteConfigurations] (
        [Id] int NOT NULL IDENTITY,
        [FirmName] nvarchar(255) NOT NULL,
        [ManagingAttorney] nvarchar(255) NOT NULL,
        [PrimaryPhone] nvarchar(50) NOT NULL,
        [Email] nvarchar(255) NOT NULL,
        [PrimaryFocusStatement] nvarchar(1000) NOT NULL,
        [Locations] nvarchar(max) NOT NULL,
        [SocialMediaPlatforms] nvarchar(max) NOT NULL,
        [UniqueSellingPoints] nvarchar(max) NOT NULL,
        [LogoUrl] nvarchar(500) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_SiteConfigurations] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE TABLE [UserNotificationPreferences] (
        [Id] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [UserId1] uniqueidentifier NOT NULL,
        [NotificationType] int NOT NULL,
        [InAppEnabled] bit NOT NULL,
        [EmailEnabled] bit NOT NULL,
        [MinimumPriority] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_UserNotificationPreferences] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_UserNotificationPreferences_Users_UserId1] FOREIGN KEY ([UserId1]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE TABLE [AdoptionDocuments] (
        [Id] int NOT NULL IDENTITY,
        [AdoptionCaseId] int NOT NULL,
        [DocumentType] int NOT NULL,
        [DocumentName] nvarchar(200) NOT NULL,
        [DocumentDescription] nvarchar(1000) NOT NULL,
        [Status] int NOT NULL,
        [UploadId] uniqueidentifier NULL,
        [FileName] nvarchar(255) NOT NULL,
        [FilePath] nvarchar(1000) NOT NULL,
        [FileSize] bigint NOT NULL,
        [ContentType] nvarchar(100) NOT NULL,
        [DocumentDate] datetime2 NULL,
        [ExpirationDate] datetime2 NULL,
        [IssuingAuthority] nvarchar(200) NOT NULL,
        [DocumentNumber] nvarchar(100) NOT NULL,
        [IsTranslationRequired] bit NOT NULL,
        [IsNotarized] bit NOT NULL,
        [IsApostilled] bit NOT NULL,
        [IsVerified] bit NOT NULL,
        [VerificationDate] datetime2 NULL,
        [VerifiedBy] nvarchar(100) NOT NULL,
        [VerificationNotes] nvarchar(1000) NOT NULL,
        [RequiresReview] bit NOT NULL,
        [ReviewDate] datetime2 NULL,
        [ReviewedBy] nvarchar(100) NOT NULL,
        [ReviewNotes] nvarchar(1000) NOT NULL,
        [ReviewStatus] nvarchar(50) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [CreatedBy] nvarchar(100) NOT NULL,
        [UpdatedBy] nvarchar(100) NOT NULL,
        CONSTRAINT [PK_AdoptionDocuments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AdoptionDocuments_AdoptionCases_AdoptionCaseId] FOREIGN KEY ([AdoptionCaseId]) REFERENCES [AdoptionCases] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_AdoptionDocuments_Uploads_UploadId] FOREIGN KEY ([UploadId]) REFERENCES [Uploads] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE TABLE [BillingRates] (
        [Id] int NOT NULL IDENTITY,
        [AttorneyId] int NOT NULL,
        [ServiceType] nvarchar(100) NOT NULL,
        [HourlyRate] decimal(10,2) NOT NULL,
        [EffectiveDate] datetime2 NOT NULL,
        [ExpiryDate] datetime2 NULL,
        [IsActive] bit NOT NULL,
        [Notes] nvarchar(500) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [CreatedBy] nvarchar(255) NOT NULL,
        [UpdatedBy] nvarchar(255) NOT NULL,
        CONSTRAINT [PK_BillingRates] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_BillingRates_Attorneys_AttorneyId] FOREIGN KEY ([AttorneyId]) REFERENCES [Attorneys] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE TABLE [Clients] (
        [Id] int NOT NULL IDENTITY,
        [FirstName] nvarchar(100) NOT NULL,
        [LastName] nvarchar(100) NOT NULL,
        [Email] nvarchar(255) NOT NULL,
        [Phone] nvarchar(50) NOT NULL,
        [Address] nvarchar(500) NOT NULL,
        [DateOfBirth] datetime2 NULL,
        [CountryOfOrigin] nvarchar(100) NOT NULL,
        [AssignedAttorneyId] int NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [CreatedBy] nvarchar(255) NOT NULL,
        [UpdatedBy] nvarchar(255) NOT NULL,
        CONSTRAINT [PK_Clients] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Clients_Attorneys_AssignedAttorneyId] FOREIGN KEY ([AssignedAttorneyId]) REFERENCES [Attorneys] ([Id]) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE TABLE [CitizenshipDocuments] (
        [Id] uniqueidentifier NOT NULL,
        [CitizenshipCaseId] uniqueidentifier NOT NULL,
        [DocumentType] nvarchar(100) NOT NULL,
        [FileName] nvarchar(255) NOT NULL,
        [FilePath] nvarchar(1000) NOT NULL,
        [UploadedAt] datetime2 NOT NULL,
        [IsRequired] bit NOT NULL,
        [IsVerified] bit NOT NULL,
        [Notes] nvarchar(1000) NOT NULL,
        CONSTRAINT [PK_CitizenshipDocuments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CitizenshipDocuments_CitizenshipCases_CitizenshipCaseId] FOREIGN KEY ([CitizenshipCaseId]) REFERENCES [CitizenshipCases] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE TABLE [CitizenshipTestResults] (
        [Id] uniqueidentifier NOT NULL,
        [CitizenshipCaseId] uniqueidentifier NOT NULL,
        [TestType] nvarchar(50) NOT NULL,
        [TestComponent] nvarchar(50) NOT NULL,
        [Passed] bit NOT NULL,
        [Score] int NULL,
        [TotalQuestions] int NULL,
        [TestDate] datetime2 NOT NULL,
        [TestLocation] nvarchar(200) NOT NULL,
        [Notes] nvarchar(1000) NOT NULL,
        CONSTRAINT [PK_CitizenshipTestResults] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CitizenshipTestResults_CitizenshipCases_CitizenshipCaseId] FOREIGN KEY ([CitizenshipCaseId]) REFERENCES [CitizenshipCases] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE TABLE [LegalServices] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(255) NOT NULL,
        [Description] nvarchar(max) NOT NULL,
        [ServiceCategoryId] int NOT NULL,
        [IsActive] bit NOT NULL,
        [DisplayOrder] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_LegalServices] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_LegalServices_ServiceCategories_ServiceCategoryId] FOREIGN KEY ([ServiceCategoryId]) REFERENCES [ServiceCategories] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE TABLE [CannlawCases] (
        [Id] int NOT NULL IDENTITY,
        [ClientId] int NOT NULL,
        [CaseType] nvarchar(100) NOT NULL,
        [Status] nvarchar(450) NOT NULL,
        [Description] nvarchar(1000) NOT NULL,
        [StartDate] datetime2 NOT NULL,
        [CompletionDate] datetime2 NULL,
        [Notes] nvarchar(2000) NOT NULL,
        [GovernmentCaseNumber] nvarchar(100) NOT NULL,
        [RejectionReason] nvarchar(500) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_CannlawCases] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CannlawCases_Clients_ClientId] FOREIGN KEY ([ClientId]) REFERENCES [Clients] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE TABLE [Documents] (
        [Id] int NOT NULL IDENTITY,
        [ClientId] int NOT NULL,
        [FileName] nvarchar(255) NOT NULL,
        [OriginalFileName] nvarchar(255) NOT NULL,
        [FileUrl] nvarchar(1000) NOT NULL,
        [ContentType] nvarchar(100) NOT NULL,
        [FileSize] bigint NOT NULL,
        [Category] nvarchar(450) NOT NULL,
        [Description] nvarchar(500) NOT NULL,
        [UploadDate] datetime2 NOT NULL,
        [UploadedBy] nvarchar(255) NOT NULL,
        [IsConfidential] bit NOT NULL,
        [AccessNotes] nvarchar(500) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [LastAccessedBy] nvarchar(255) NOT NULL,
        [LastAccessedAt] datetime2 NULL,
        CONSTRAINT [PK_Documents] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Documents_Clients_ClientId] FOREIGN KEY ([ClientId]) REFERENCES [Clients] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE TABLE [TimeEntries] (
        [Id] int NOT NULL IDENTITY,
        [ClientId] int NOT NULL,
        [AttorneyId] int NOT NULL,
        [StartTime] datetime2 NOT NULL,
        [EndTime] datetime2 NOT NULL,
        [Duration] decimal(5,2) NOT NULL,
        [Description] nvarchar(500) NOT NULL,
        [Notes] nvarchar(1000) NOT NULL,
        [HourlyRate] decimal(10,2) NOT NULL,
        [BillableAmount] decimal(10,2) NOT NULL,
        [IsBilled] bit NOT NULL,
        [BilledDate] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_TimeEntries] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TimeEntries_Attorneys_AttorneyId] FOREIGN KEY ([AttorneyId]) REFERENCES [Attorneys] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_TimeEntries_Clients_ClientId] FOREIGN KEY ([ClientId]) REFERENCES [Clients] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE TABLE [CaseStatusHistories] (
        [Id] int NOT NULL IDENTITY,
        [CaseId] int NOT NULL,
        [FromStatus] nvarchar(max) NOT NULL,
        [ToStatus] nvarchar(max) NOT NULL,
        [Notes] nvarchar(1000) NOT NULL,
        [ChangedBy] nvarchar(255) NOT NULL,
        [ChangedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_CaseStatusHistories] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CaseStatusHistories_CannlawCases_CaseId] FOREIGN KEY ([CaseId]) REFERENCES [CannlawCases] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_Users_AttorneyId] ON [Users] ([AttorneyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_AdoptionCases_AdoptionType] ON [AdoptionCases] ([AdoptionType]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE UNIQUE INDEX [IX_AdoptionCases_CaseId] ON [AdoptionCases] ([CaseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_AdoptionCases_ChildCountryOfBirth] ON [AdoptionCases] ([ChildCountryOfBirth]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_AdoptionCases_CreatedAt] ON [AdoptionCases] ([CreatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_AdoptionCases_RecommendedVisaType] ON [AdoptionCases] ([RecommendedVisaType]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_AdoptionDocuments_AdoptionCaseId] ON [AdoptionDocuments] ([AdoptionCaseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_AdoptionDocuments_CreatedAt] ON [AdoptionDocuments] ([CreatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_AdoptionDocuments_DocumentType] ON [AdoptionDocuments] ([DocumentType]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_AdoptionDocuments_ExpirationDate] ON [AdoptionDocuments] ([ExpirationDate]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_AdoptionDocuments_Status] ON [AdoptionDocuments] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_AdoptionDocuments_UploadId] ON [AdoptionDocuments] ([UploadId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_BillingRates_AttorneyId] ON [BillingRates] ([AttorneyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_BillingRates_EffectiveDate] ON [BillingRates] ([EffectiveDate]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_BillingRates_IsActive] ON [BillingRates] ([IsActive]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_CannlawCases_ClientId] ON [CannlawCases] ([ClientId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_CannlawCases_StartDate] ON [CannlawCases] ([StartDate]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_CannlawCases_Status] ON [CannlawCases] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_CaseStatusHistories_CaseId] ON [CaseStatusHistories] ([CaseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_CaseStatusHistories_ChangedAt] ON [CaseStatusHistories] ([ChangedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_CitizenshipCases_ApplicationType] ON [CitizenshipCases] ([ApplicationType]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CitizenshipCases_CaseId] ON [CitizenshipCases] ([CaseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_CitizenshipCases_CreatedAt] ON [CitizenshipCases] ([CreatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_CitizenshipCases_Status] ON [CitizenshipCases] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_CitizenshipDocuments_CitizenshipCaseId] ON [CitizenshipDocuments] ([CitizenshipCaseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_CitizenshipDocuments_DocumentType] ON [CitizenshipDocuments] ([DocumentType]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_CitizenshipDocuments_IsRequired] ON [CitizenshipDocuments] ([IsRequired]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_CitizenshipTestResults_CitizenshipCaseId] ON [CitizenshipTestResults] ([CitizenshipCaseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_CitizenshipTestResults_TestDate] ON [CitizenshipTestResults] ([TestDate]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_CitizenshipTestResults_TestType] ON [CitizenshipTestResults] ([TestType]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_Clients_AssignedAttorneyId] ON [Clients] ([AssignedAttorneyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_Clients_CreatedAt] ON [Clients] ([CreatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_Clients_Email] ON [Clients] ([Email]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_Documents_Category] ON [Documents] ([Category]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_Documents_ClientId] ON [Documents] ([ClientId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_Documents_IsConfidential] ON [Documents] ([IsConfidential]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_Documents_UploadDate] ON [Documents] ([UploadDate]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_LegalServices_ServiceCategoryId] ON [LegalServices] ([ServiceCategoryId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_Notifications_UserId1] ON [Notifications] ([UserId1]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_TimeEntries_AttorneyId] ON [TimeEntries] ([AttorneyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_TimeEntries_ClientId] ON [TimeEntries] ([ClientId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_TimeEntries_IsBilled] ON [TimeEntries] ([IsBilled]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_TimeEntries_StartTime] ON [TimeEntries] ([StartTime]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    CREATE INDEX [IX_UserNotificationPreferences_UserId1] ON [UserNotificationPreferences] ([UserId1]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    ALTER TABLE [Users] ADD CONSTRAINT [FK_Users_Attorneys_AttorneyId] FOREIGN KEY ([AttorneyId]) REFERENCES [Attorneys] ([Id]) ON DELETE SET NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251014153546_AddUserLegalProfessionalFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251014153546_AddUserLegalProfessionalFields', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251023165811_RemoveTranslationMonitoringEntities'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251023165811_RemoveTranslationMonitoringEntities', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251110164502_UpdateInterviewProcessChanges'
)
BEGIN
    ALTER TABLE [VisaRecommendations] ADD [EligibilityStatus] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251110164502_UpdateInterviewProcessChanges'
)
BEGIN
    ALTER TABLE [VisaRecommendations] ADD [MatchScore] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251110164502_UpdateInterviewProcessChanges'
)
BEGIN
    DECLARE @var2 nvarchar(max);
    SELECT @var2 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[InterviewSessions]') AND [c].[name] = N'UserId');
    IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [InterviewSessions] DROP CONSTRAINT ' + @var2 + ';');
    ALTER TABLE [InterviewSessions] ALTER COLUMN [UserId] uniqueidentifier NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251110164502_UpdateInterviewProcessChanges'
)
BEGIN
    DECLARE @var3 nvarchar(max);
    SELECT @var3 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[InterviewSessions]') AND [c].[name] = N'CaseId');
    IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [InterviewSessions] DROP CONSTRAINT ' + @var3 + ';');
    ALTER TABLE [InterviewSessions] ALTER COLUMN [CaseId] uniqueidentifier NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251110164502_UpdateInterviewProcessChanges'
)
BEGIN
    ALTER TABLE [Cases] ADD [AttorneySelectedVisaTypeId] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251110164502_UpdateInterviewProcessChanges'
)
BEGIN
    ALTER TABLE [Cases] ADD [IsVisaLockedByAttorney] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251110164502_UpdateInterviewProcessChanges'
)
BEGIN
    ALTER TABLE [Cases] ADD [VisaLockedAt] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251110164502_UpdateInterviewProcessChanges'
)
BEGIN
    ALTER TABLE [Cases] ADD [VisaLockedByStaffId] uniqueidentifier NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251110164502_UpdateInterviewProcessChanges'
)
BEGIN
    CREATE TABLE [VisaEligibilityResults] (
        [Id] uniqueidentifier NOT NULL,
        [InterviewSessionId] uniqueidentifier NOT NULL,
        [VisaTypeId] int NOT NULL,
        [EligibilityStatus] nvarchar(50) NOT NULL,
        [MatchScore] int NOT NULL,
        [Rationale] nvarchar(2000) NULL,
        [MetRequirements] nvarchar(4000) NULL,
        [UnmetRequirements] nvarchar(4000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_VisaEligibilityResults] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_VisaEligibilityResults_InterviewSessions_InterviewSessionId] FOREIGN KEY ([InterviewSessionId]) REFERENCES [InterviewSessions] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_VisaEligibilityResults_VisaTypes_VisaTypeId] FOREIGN KEY ([VisaTypeId]) REFERENCES [VisaTypes] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251110164502_UpdateInterviewProcessChanges'
)
BEGIN
    CREATE INDEX [IX_Cases_AttorneySelectedVisaTypeId] ON [Cases] ([AttorneySelectedVisaTypeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251110164502_UpdateInterviewProcessChanges'
)
BEGIN
    CREATE INDEX [IX_Cases_IsVisaLockedByAttorney] ON [Cases] ([IsVisaLockedByAttorney]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251110164502_UpdateInterviewProcessChanges'
)
BEGIN
    CREATE INDEX [IX_VisaEligibilityResults_InterviewSessionId] ON [VisaEligibilityResults] ([InterviewSessionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251110164502_UpdateInterviewProcessChanges'
)
BEGIN
    CREATE UNIQUE INDEX [IX_VisaEligibilityResults_InterviewSessionId_VisaTypeId] ON [VisaEligibilityResults] ([InterviewSessionId], [VisaTypeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251110164502_UpdateInterviewProcessChanges'
)
BEGIN
    CREATE INDEX [IX_VisaEligibilityResults_VisaTypeId] ON [VisaEligibilityResults] ([VisaTypeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251110164502_UpdateInterviewProcessChanges'
)
BEGIN
    ALTER TABLE [Cases] ADD CONSTRAINT [FK_Cases_VisaTypes_AttorneySelectedVisaTypeId] FOREIGN KEY ([AttorneySelectedVisaTypeId]) REFERENCES [VisaTypes] ([Id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251110164502_UpdateInterviewProcessChanges'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251110164502_UpdateInterviewProcessChanges', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251115013501_AddVisaEvaluationAndAnonymousToken'
)
BEGIN
    ALTER TABLE [InterviewSessions] ADD [AnonymousToken] uniqueidentifier NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251115013501_AddVisaEvaluationAndAnonymousToken'
)
BEGIN
    CREATE TABLE [VisaEvaluations] (
        [Id] uniqueidentifier NOT NULL,
        [SessionId] uniqueidentifier NOT NULL,
        [VisaTypeId] int NOT NULL,
        [Status] int NOT NULL,
        [MatchScore] decimal(18,2) NOT NULL,
        [Rank] int NOT NULL,
        [Explanation] nvarchar(2000) NOT NULL,
        [MissingInformation] nvarchar(max) NULL,
        [RequiredDocuments] nvarchar(max) NOT NULL,
        [IsUserSelected] bit NOT NULL,
        [UserSelectedAt] datetime2 NULL,
        [IsAttorneyLocked] bit NOT NULL,
        [LockedByUserId] uniqueidentifier NULL,
        [LockedAt] datetime2 NULL,
        [UnlockedAt] datetime2 NULL,
        [LockReason] nvarchar(500) NULL,
        [UnlockReason] nvarchar(500) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_VisaEvaluations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_VisaEvaluations_InterviewSessions_SessionId] FOREIGN KEY ([SessionId]) REFERENCES [InterviewSessions] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_VisaEvaluations_Users_LockedByUserId] FOREIGN KEY ([LockedByUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_VisaEvaluations_VisaTypes_VisaTypeId] FOREIGN KEY ([VisaTypeId]) REFERENCES [VisaTypes] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251115013501_AddVisaEvaluationAndAnonymousToken'
)
BEGIN
    CREATE INDEX [IX_InterviewSessions_AnonymousToken] ON [InterviewSessions] ([AnonymousToken]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251115013501_AddVisaEvaluationAndAnonymousToken'
)
BEGIN
    CREATE INDEX [IX_VisaEvaluations_SessionId] ON [VisaEvaluations] ([SessionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251115013501_AddVisaEvaluationAndAnonymousToken'
)
BEGIN
    CREATE INDEX [IX_VisaEvaluations_VisaTypeId] ON [VisaEvaluations] ([VisaTypeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251115013501_AddVisaEvaluationAndAnonymousToken'
)
BEGIN
    CREATE INDEX [IX_VisaEvaluations_SessionId_Rank] ON [VisaEvaluations] ([SessionId], [Rank]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251115013501_AddVisaEvaluationAndAnonymousToken'
)
BEGIN
    CREATE INDEX [IX_VisaEvaluations_IsUserSelected] ON [VisaEvaluations] ([IsUserSelected]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251115013501_AddVisaEvaluationAndAnonymousToken'
)
BEGIN
    CREATE INDEX [IX_VisaEvaluations_IsAttorneyLocked] ON [VisaEvaluations] ([IsAttorneyLocked]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251115013501_AddVisaEvaluationAndAnonymousToken'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251115013501_AddVisaEvaluationAndAnonymousToken', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251122212306_PhotoUrlToNullableAndCollectionFixes'
)
BEGIN
    DECLARE @var4 nvarchar(max);
    SELECT @var4 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Attorneys]') AND [c].[name] = N'PhotoUrl');
    IF @var4 IS NOT NULL EXEC(N'ALTER TABLE [Attorneys] DROP CONSTRAINT ' + @var4 + ';');
    ALTER TABLE [Attorneys] ALTER COLUMN [PhotoUrl] nvarchar(500) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251122212306_PhotoUrlToNullableAndCollectionFixes'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251122212306_PhotoUrlToNullableAndCollectionFixes', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125150209_AddRequiresLawyerToPackages'
)
BEGIN
    ALTER TABLE [Packages] ADD [RequiresLawyer] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125150209_AddRequiresLawyerToPackages'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251125150209_AddRequiresLawyerToPackages', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125150944_AddProfessionalTypeToAttorney'
)
BEGIN
    ALTER TABLE [Attorneys] ADD [ProfessionalType] int NOT NULL DEFAULT 0;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125150944_AddProfessionalTypeToAttorney'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251125150944_AddProfessionalTypeToAttorney', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125153433_SyncPendingModelChanges'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251125153433_SyncPendingModelChanges', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125160741_FixShadowPropertiesAndPrecision'
)
BEGIN
    ALTER TABLE [Notifications] DROP CONSTRAINT [FK_Notifications_Users_UserId1];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125160741_FixShadowPropertiesAndPrecision'
)
BEGIN
    ALTER TABLE [UserNotificationPreferences] DROP CONSTRAINT [FK_UserNotificationPreferences_Users_UserId1];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125160741_FixShadowPropertiesAndPrecision'
)
BEGIN
    DROP INDEX [IX_UserNotificationPreferences_UserId1] ON [UserNotificationPreferences];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125160741_FixShadowPropertiesAndPrecision'
)
BEGIN
    DROP INDEX [IX_Notifications_UserId1] ON [Notifications];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125160741_FixShadowPropertiesAndPrecision'
)
BEGIN
    DECLARE @var5 nvarchar(max);
    SELECT @var5 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[UserNotificationPreferences]') AND [c].[name] = N'UserId1');
    IF @var5 IS NOT NULL EXEC(N'ALTER TABLE [UserNotificationPreferences] DROP CONSTRAINT ' + @var5 + ';');
    ALTER TABLE [UserNotificationPreferences] DROP COLUMN [UserId1];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125160741_FixShadowPropertiesAndPrecision'
)
BEGIN
    DECLARE @var6 nvarchar(max);
    SELECT @var6 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Notifications]') AND [c].[name] = N'UserId1');
    IF @var6 IS NOT NULL EXEC(N'ALTER TABLE [Notifications] DROP CONSTRAINT ' + @var6 + ';');
    ALTER TABLE [Notifications] DROP COLUMN [UserId1];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125160741_FixShadowPropertiesAndPrecision'
)
BEGIN
    DECLARE @var7 nvarchar(max);
    SELECT @var7 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[VisaEvaluations]') AND [c].[name] = N'MatchScore');
    IF @var7 IS NOT NULL EXEC(N'ALTER TABLE [VisaEvaluations] DROP CONSTRAINT ' + @var7 + ';');
    ALTER TABLE [VisaEvaluations] ALTER COLUMN [MatchScore] decimal(5,2) NOT NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125160741_FixShadowPropertiesAndPrecision'
)
BEGIN
    DECLARE @var8 nvarchar(max);
    SELECT @var8 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[UserNotificationPreferences]') AND [c].[name] = N'UserId');
    IF @var8 IS NOT NULL EXEC(N'ALTER TABLE [UserNotificationPreferences] DROP CONSTRAINT ' + @var8 + ';');
    ALTER TABLE [UserNotificationPreferences] DROP COLUMN [UserId];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125160741_FixShadowPropertiesAndPrecision'
)
BEGIN
    ALTER TABLE [UserNotificationPreferences] ADD [UserId] uniqueidentifier NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125160741_FixShadowPropertiesAndPrecision'
)
BEGIN
    DECLARE @var9 nvarchar(max);
    SELECT @var9 = QUOTENAME([d].[name])
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Notifications]') AND [c].[name] = N'UserId');
    IF @var9 IS NOT NULL EXEC(N'ALTER TABLE [Notifications] DROP CONSTRAINT ' + @var9 + ';');
    ALTER TABLE [Notifications] DROP COLUMN [UserId];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125160741_FixShadowPropertiesAndPrecision'
)
BEGIN
    ALTER TABLE [Notifications] ADD [UserId] uniqueidentifier NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125160741_FixShadowPropertiesAndPrecision'
)
BEGIN
    CREATE UNIQUE INDEX [IX_UserNotificationPreferences_UserId_NotificationType] ON [UserNotificationPreferences] ([UserId], [NotificationType]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125160741_FixShadowPropertiesAndPrecision'
)
BEGIN
    CREATE INDEX [IX_Notifications_UserId] ON [Notifications] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125160741_FixShadowPropertiesAndPrecision'
)
BEGIN
    ALTER TABLE [Notifications] ADD CONSTRAINT [FK_Notifications_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125160741_FixShadowPropertiesAndPrecision'
)
BEGIN
    ALTER TABLE [UserNotificationPreferences] ADD CONSTRAINT [FK_UserNotificationPreferences_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125160741_FixShadowPropertiesAndPrecision'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251125160741_FixShadowPropertiesAndPrecision', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125173307_AddIsPersistentToRememberMeToken'
)
BEGIN
    ALTER TABLE [RememberMeTokens] ADD [IsPersistent] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251125173307_AddIsPersistentToRememberMeToken'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251125173307_AddIsPersistentToRememberMeToken', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251201032450_AddAdminPathsTable'
)
BEGIN
    CREATE TABLE [AdminPaths] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Path] nvarchar(500) NOT NULL,
        [Description] nvarchar(1000) NULL,
        [Icon] nvarchar(100) NULL,
        [DisplayOrder] int NOT NULL,
        [IsActive] bit NOT NULL,
        [ParentPathId] uniqueidentifier NULL,
        [RequiredRole] nvarchar(100) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [CreatedByUserId] uniqueidentifier NULL,
        [UpdatedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_AdminPaths] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AdminPaths_AdminPaths_ParentPathId] FOREIGN KEY ([ParentPathId]) REFERENCES [AdminPaths] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_AdminPaths_Users_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [Users] ([Id]),
        CONSTRAINT [FK_AdminPaths_Users_UpdatedByUserId] FOREIGN KEY ([UpdatedByUserId]) REFERENCES [Users] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251201032450_AddAdminPathsTable'
)
BEGIN
    CREATE INDEX [IX_AdminPaths_CreatedByUserId] ON [AdminPaths] ([CreatedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251201032450_AddAdminPathsTable'
)
BEGIN
    CREATE INDEX [IX_AdminPaths_DisplayOrder] ON [AdminPaths] ([DisplayOrder]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251201032450_AddAdminPathsTable'
)
BEGIN
    CREATE INDEX [IX_AdminPaths_IsActive] ON [AdminPaths] ([IsActive]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251201032450_AddAdminPathsTable'
)
BEGIN
    CREATE INDEX [IX_AdminPaths_ParentPathId] ON [AdminPaths] ([ParentPathId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251201032450_AddAdminPathsTable'
)
BEGIN
    CREATE INDEX [IX_AdminPaths_Path] ON [AdminPaths] ([Path]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251201032450_AddAdminPathsTable'
)
BEGIN
    CREATE INDEX [IX_AdminPaths_UpdatedByUserId] ON [AdminPaths] ([UpdatedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251201032450_AddAdminPathsTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251201032450_AddAdminPathsTable', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251203194410_AddInterviewQuestionTables'
)
BEGIN
    CREATE TABLE [InterviewQuestions] (
        [Id] uniqueidentifier NOT NULL,
        [Key] nvarchar(200) NOT NULL,
        [Text] nvarchar(2000) NOT NULL,
        [Category] nvarchar(100) NOT NULL,
        [InputType] nvarchar(50) NOT NULL,
        [DisplayOrder] int NOT NULL,
        [IsRequired] bit NOT NULL,
        [IsActive] bit NOT NULL,
        [Description] nvarchar(1000) NULL,
        [DiscriminatesVisaCodes] nvarchar(500) NULL,
        [SelectionWeight] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [CreatedByUserId] uniqueidentifier NULL,
        [UpdatedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_InterviewQuestions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_InterviewQuestions_Users_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [Users] ([Id]),
        CONSTRAINT [FK_InterviewQuestions_Users_UpdatedByUserId] FOREIGN KEY ([UpdatedByUserId]) REFERENCES [Users] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251203194410_AddInterviewQuestionTables'
)
BEGIN
    CREATE TABLE [QuestionOptions] (
        [Id] uniqueidentifier NOT NULL,
        [QuestionId] uniqueidentifier NOT NULL,
        [Value] nvarchar(200) NOT NULL,
        [Label] nvarchar(500) NOT NULL,
        [DisplayOrder] int NOT NULL,
        [IsActive] bit NOT NULL,
        [Icon] nvarchar(100) NULL,
        [Description] nvarchar(1000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_QuestionOptions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_QuestionOptions_InterviewQuestions_QuestionId] FOREIGN KEY ([QuestionId]) REFERENCES [InterviewQuestions] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251203194410_AddInterviewQuestionTables'
)
BEGIN
    CREATE INDEX [IX_InterviewQuestions_Category] ON [InterviewQuestions] ([Category]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251203194410_AddInterviewQuestionTables'
)
BEGIN
    CREATE INDEX [IX_InterviewQuestions_CreatedByUserId] ON [InterviewQuestions] ([CreatedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251203194410_AddInterviewQuestionTables'
)
BEGIN
    CREATE INDEX [IX_InterviewQuestions_DisplayOrder] ON [InterviewQuestions] ([DisplayOrder]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251203194410_AddInterviewQuestionTables'
)
BEGIN
    CREATE INDEX [IX_InterviewQuestions_IsActive] ON [InterviewQuestions] ([IsActive]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251203194410_AddInterviewQuestionTables'
)
BEGIN
    CREATE UNIQUE INDEX [IX_InterviewQuestions_Key] ON [InterviewQuestions] ([Key]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251203194410_AddInterviewQuestionTables'
)
BEGIN
    CREATE INDEX [IX_InterviewQuestions_UpdatedByUserId] ON [InterviewQuestions] ([UpdatedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251203194410_AddInterviewQuestionTables'
)
BEGIN
    CREATE INDEX [IX_QuestionOptions_DisplayOrder] ON [QuestionOptions] ([DisplayOrder]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251203194410_AddInterviewQuestionTables'
)
BEGIN
    CREATE INDEX [IX_QuestionOptions_IsActive] ON [QuestionOptions] ([IsActive]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251203194410_AddInterviewQuestionTables'
)
BEGIN
    CREATE INDEX [IX_QuestionOptions_QuestionId] ON [QuestionOptions] ([QuestionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251203194410_AddInterviewQuestionTables'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251203194410_AddInterviewQuestionTables', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251204153248_AddQuestionHierarchy'
)
BEGIN
    ALTER TABLE [InterviewQuestions] ADD [ParentId] uniqueidentifier NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251204153248_AddQuestionHierarchy'
)
BEGIN
    CREATE INDEX [IX_InterviewQuestions_ParentId] ON [InterviewQuestions] ([ParentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251204153248_AddQuestionHierarchy'
)
BEGIN
    ALTER TABLE [InterviewQuestions] ADD CONSTRAINT [FK_InterviewQuestions_InterviewQuestions_ParentId] FOREIGN KEY ([ParentId]) REFERENCES [InterviewQuestions] ([Id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251204153248_AddQuestionHierarchy'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251204153248_AddQuestionHierarchy', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251207182703_AddUSCISFormsManagement'
)
BEGIN
    CREATE TABLE [USCISForms] (
        [Id] uniqueidentifier NOT NULL,
        [FormNumber] nvarchar(50) NOT NULL,
        [FormName] nvarchar(500) NOT NULL,
        [Description] nvarchar(2000) NULL,
        [FormUrl] nvarchar(1000) NULL,
        [EstimatedTimeMinutes] int NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [CreatedByUserId] uniqueidentifier NULL,
        [UpdatedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_USCISForms] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_USCISForms_Users_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [Users] ([Id]),
        CONSTRAINT [FK_USCISForms_Users_UpdatedByUserId] FOREIGN KEY ([UpdatedByUserId]) REFERENCES [Users] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251207182703_AddUSCISFormsManagement'
)
BEGIN
    CREATE TABLE [FormDependencies] (
        [Id] uniqueidentifier NOT NULL,
        [ParentFormId] uniqueidentifier NOT NULL,
        [DependentFormId] uniqueidentifier NOT NULL,
        [VisaTypeId] int NOT NULL,
        [IsRequired] bit NOT NULL,
        [DependencyReason] nvarchar(1000) NULL,
        [DisplayOrder] int NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_FormDependencies] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_FormDependencies_USCISForms_DependentFormId] FOREIGN KEY ([DependentFormId]) REFERENCES [USCISForms] ([Id]),
        CONSTRAINT [FK_FormDependencies_USCISForms_ParentFormId] FOREIGN KEY ([ParentFormId]) REFERENCES [USCISForms] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_FormDependencies_VisaTypes_VisaTypeId] FOREIGN KEY ([VisaTypeId]) REFERENCES [VisaTypes] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251207182703_AddUSCISFormsManagement'
)
BEGIN
    CREATE TABLE [FormPricing] (
        [Id] uniqueidentifier NOT NULL,
        [FormId] uniqueidentifier NOT NULL,
        [SelfFilePriceUSD] decimal(10,2) NULL,
        [ParalegalPriceUSD] decimal(10,2) NULL,
        [LawyerPriceUSD] decimal(10,2) NULL,
        [LLCFeeUSD] decimal(10,2) NOT NULL,
        [LLCFeePercentage] decimal(5,2) NULL,
        [Description] nvarchar(1000) NULL,
        [IsActive] bit NOT NULL,
        [EffectiveDate] datetime2 NOT NULL,
        [ExpirationDate] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [CreatedByUserId] uniqueidentifier NULL,
        [UpdatedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_FormPricing] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_FormPricing_USCISForms_FormId] FOREIGN KEY ([FormId]) REFERENCES [USCISForms] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_FormPricing_Users_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [Users] ([Id]),
        CONSTRAINT [FK_FormPricing_Users_UpdatedByUserId] FOREIGN KEY ([UpdatedByUserId]) REFERENCES [Users] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251207182703_AddUSCISFormsManagement'
)
BEGIN
    CREATE TABLE [FormVisaTypeMappings] (
        [Id] uniqueidentifier NOT NULL,
        [FormId] uniqueidentifier NOT NULL,
        [VisaTypeId] int NOT NULL,
        [IsRequired] bit NOT NULL,
        [DisplayOrder] int NOT NULL,
        [Notes] nvarchar(1000) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NOT NULL,
        [CreatedByUserId] uniqueidentifier NULL,
        [UpdatedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_FormVisaTypeMappings] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_FormVisaTypeMappings_USCISForms_FormId] FOREIGN KEY ([FormId]) REFERENCES [USCISForms] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_FormVisaTypeMappings_Users_CreatedByUserId] FOREIGN KEY ([CreatedByUserId]) REFERENCES [Users] ([Id]),
        CONSTRAINT [FK_FormVisaTypeMappings_Users_UpdatedByUserId] FOREIGN KEY ([UpdatedByUserId]) REFERENCES [Users] ([Id]),
        CONSTRAINT [FK_FormVisaTypeMappings_VisaTypes_VisaTypeId] FOREIGN KEY ([VisaTypeId]) REFERENCES [VisaTypes] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251207182703_AddUSCISFormsManagement'
)
BEGIN
    CREATE INDEX [IX_FormDependencies_DependentFormId] ON [FormDependencies] ([DependentFormId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251207182703_AddUSCISFormsManagement'
)
BEGIN
    CREATE INDEX [IX_FormDependencies_ParentFormId] ON [FormDependencies] ([ParentFormId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251207182703_AddUSCISFormsManagement'
)
BEGIN
    CREATE INDEX [IX_FormDependencies_ParentFormId_VisaTypeId] ON [FormDependencies] ([ParentFormId], [VisaTypeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251207182703_AddUSCISFormsManagement'
)
BEGIN
    CREATE INDEX [IX_FormDependencies_VisaTypeId] ON [FormDependencies] ([VisaTypeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251207182703_AddUSCISFormsManagement'
)
BEGIN
    CREATE INDEX [IX_FormPricing_CreatedByUserId] ON [FormPricing] ([CreatedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251207182703_AddUSCISFormsManagement'
)
BEGIN
    CREATE INDEX [IX_FormPricing_EffectiveDate] ON [FormPricing] ([EffectiveDate]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251207182703_AddUSCISFormsManagement'
)
BEGIN
    CREATE INDEX [IX_FormPricing_FormId] ON [FormPricing] ([FormId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251207182703_AddUSCISFormsManagement'
)
BEGIN
    CREATE INDEX [IX_FormPricing_IsActive] ON [FormPricing] ([IsActive]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251207182703_AddUSCISFormsManagement'
)
BEGIN
    CREATE INDEX [IX_FormPricing_UpdatedByUserId] ON [FormPricing] ([UpdatedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251207182703_AddUSCISFormsManagement'
)
BEGIN
    CREATE INDEX [IX_FormVisaTypeMappings_CreatedByUserId] ON [FormVisaTypeMappings] ([CreatedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251207182703_AddUSCISFormsManagement'
)
BEGIN
    CREATE INDEX [IX_FormVisaTypeMappings_DisplayOrder] ON [FormVisaTypeMappings] ([DisplayOrder]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251207182703_AddUSCISFormsManagement'
)
BEGIN
    CREATE UNIQUE INDEX [IX_FormVisaTypeMappings_FormId_VisaTypeId] ON [FormVisaTypeMappings] ([FormId], [VisaTypeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251207182703_AddUSCISFormsManagement'
)
BEGIN
    CREATE INDEX [IX_FormVisaTypeMappings_UpdatedByUserId] ON [FormVisaTypeMappings] ([UpdatedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251207182703_AddUSCISFormsManagement'
)
BEGIN
    CREATE INDEX [IX_FormVisaTypeMappings_VisaTypeId] ON [FormVisaTypeMappings] ([VisaTypeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251207182703_AddUSCISFormsManagement'
)
BEGIN
    CREATE INDEX [IX_USCISForms_CreatedByUserId] ON [USCISForms] ([CreatedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251207182703_AddUSCISFormsManagement'
)
BEGIN
    CREATE UNIQUE INDEX [IX_USCISForms_FormNumber] ON [USCISForms] ([FormNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251207182703_AddUSCISFormsManagement'
)
BEGIN
    CREATE INDEX [IX_USCISForms_IsActive] ON [USCISForms] ([IsActive]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251207182703_AddUSCISFormsManagement'
)
BEGIN
    CREATE INDEX [IX_USCISForms_UpdatedByUserId] ON [USCISForms] ([UpdatedByUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251207182703_AddUSCISFormsManagement'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251207182703_AddUSCISFormsManagement', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251212042259_AddPageConfigAndInterviewDocuments'
)
BEGIN
    ALTER TABLE [InterviewQuestions] ADD [PageConfig] nvarchar(4000) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251212042259_AddPageConfigAndInterviewDocuments'
)
BEGIN
    CREATE TABLE [InterviewDocumentUploads] (
        [Id] uniqueidentifier NOT NULL,
        [InterviewSessionId] uniqueidentifier NOT NULL,
        [QuestionId] uniqueidentifier NOT NULL,
        [OriginalFileName] nvarchar(500) NOT NULL,
        [StoredFileName] nvarchar(500) NOT NULL,
        [ContentType] nvarchar(100) NOT NULL,
        [SizeBytes] bigint NOT NULL,
        [StoragePath] nvarchar(1000) NOT NULL,
        [Status] nvarchar(50) NOT NULL,
        [UploadedAt] datetime2 NOT NULL,
        [UserId] uniqueidentifier NULL,
        [AssociatedToUserAt] datetime2 NULL,
        CONSTRAINT [PK_InterviewDocumentUploads] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_InterviewDocumentUploads_InterviewQuestions_QuestionId] FOREIGN KEY ([QuestionId]) REFERENCES [InterviewQuestions] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_InterviewDocumentUploads_InterviewSessions_InterviewSessionId] FOREIGN KEY ([InterviewSessionId]) REFERENCES [InterviewSessions] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_InterviewDocumentUploads_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251212042259_AddPageConfigAndInterviewDocuments'
)
BEGIN
    CREATE INDEX [IX_InterviewDocumentUploads_InterviewSessionId] ON [InterviewDocumentUploads] ([InterviewSessionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251212042259_AddPageConfigAndInterviewDocuments'
)
BEGIN
    CREATE INDEX [IX_InterviewDocumentUploads_QuestionId] ON [InterviewDocumentUploads] ([QuestionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251212042259_AddPageConfigAndInterviewDocuments'
)
BEGIN
    CREATE INDEX [IX_InterviewDocumentUploads_Status] ON [InterviewDocumentUploads] ([Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251212042259_AddPageConfigAndInterviewDocuments'
)
BEGIN
    CREATE INDEX [IX_InterviewDocumentUploads_UserId] ON [InterviewDocumentUploads] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251212042259_AddPageConfigAndInterviewDocuments'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251212042259_AddPageConfigAndInterviewDocuments', N'10.0.0-rc.2.25502.107');
END;

COMMIT;
GO

