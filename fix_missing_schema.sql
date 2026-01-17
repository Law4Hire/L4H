SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

USE law4hiredb;
GO

-- 1. Create Cases Table
IF OBJECT_ID(N'[dbo].[Cases]', N'U') IS NULL
BEGIN
    PRINT 'Creating Cases table...'
    CREATE TABLE [dbo].[Cases](
        [Id] [uniqueidentifier] NOT NULL,
        [UserId] [uniqueidentifier] NOT NULL,
        [Status] [nvarchar](50) NOT NULL,
        [LastActivityAt] [datetimeoffset](7) NOT NULL,
        [VisaTypeId] [int] NULL,
        [PackageId] [int] NULL,
        [AssignedStaffId] [int] NULL,
        [IsInterviewLocked] [bit] NOT NULL DEFAULT 0,
        [AttorneySelectedVisaTypeId] [int] NULL,
        [IsVisaLockedByAttorney] [bit] NOT NULL DEFAULT 0,
        [VisaLockedAt] [datetime2](7) NULL,
        [VisaLockedByStaffId] [uniqueidentifier] NULL,
        [CreatedAt] [datetime2](7) NOT NULL,
        [UpdatedAt] [datetime2](7) NOT NULL,
     CONSTRAINT [PK_Cases] PRIMARY KEY CLUSTERED 
    (
        [Id] ASC
    )
    )
    
    ALTER TABLE [dbo].[Cases]  WITH CHECK ADD  CONSTRAINT [FK_Cases_AspNetUsers_UserId] FOREIGN KEY([UserId])
    REFERENCES [dbo].[AspNetUsers] ([Id])
    ON DELETE CASCADE;
    
    ALTER TABLE [dbo].[Cases] CHECK CONSTRAINT [FK_Cases_AspNetUsers_UserId];

    -- Foreign keys for VisaType and Package if tables exist
    IF OBJECT_ID(N'[dbo].[VisaTypes]', N'U') IS NOT NULL
    BEGIN
        ALTER TABLE [dbo].[Cases]  WITH CHECK ADD  CONSTRAINT [FK_Cases_VisaTypes_VisaTypeId] FOREIGN KEY([VisaTypeId])
        REFERENCES [dbo].[VisaTypes] ([Id]);
    END

    PRINT 'Cases table created.'
END
GO

-- 2. Create Clients Table
IF OBJECT_ID(N'[dbo].[Clients]', N'U') IS NULL
BEGIN
    PRINT 'Creating Clients table...'
    CREATE TABLE [dbo].[Clients](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [FirstName] [nvarchar](100) NOT NULL,
        [LastName] [nvarchar](100) NOT NULL,
        [Email] [nvarchar](255) NOT NULL,
        [Phone] [nvarchar](50) NULL,
        [Address] [nvarchar](500) NULL,
        [DateOfBirth] [datetime2](7) NULL,
        [CountryOfOrigin] [nvarchar](100) NULL,
        [AssignedAttorneyId] [int] NULL,
        [CreatedAt] [datetime2](7) NOT NULL,
        [UpdatedAt] [datetime2](7) NOT NULL,
        [CreatedBy] [nvarchar](255) NULL,
        [UpdatedBy] [nvarchar](255) NULL,
     CONSTRAINT [PK_Clients] PRIMARY KEY CLUSTERED 
    (
        [Id] ASC
    )
    )
    
    IF OBJECT_ID(N'[dbo].[Attorneys]', N'U') IS NOT NULL
    BEGIN
        ALTER TABLE [dbo].[Clients]  WITH CHECK ADD  CONSTRAINT [FK_Clients_Attorneys_AssignedAttorneyId] FOREIGN KEY([AssignedAttorneyId])
        REFERENCES [dbo].[Attorneys] ([Id])
        ON DELETE SET NULL;
    END

    CREATE NONCLUSTERED INDEX [IX_Clients_Email] ON [dbo].[Clients] ([Email] ASC);

    PRINT 'Clients table created.'
END
GO

-- 3. Create CannlawCases Table
IF OBJECT_ID(N'[dbo].[CannlawCases]', N'U') IS NULL
BEGIN
    PRINT 'Creating CannlawCases table...'
    CREATE TABLE [dbo].[CannlawCases](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [ClientId] [int] NOT NULL,
        [CaseType] [nvarchar](100) NOT NULL,
        [Status] [int] NOT NULL,
        [Description] [nvarchar](1000) NULL,
        [StartDate] [datetime2](7) NOT NULL,
        [CompletionDate] [datetime2](7) NULL,
        [Notes] [nvarchar](2000) NULL,
        [GovernmentCaseNumber] [nvarchar](100) NULL,
        [RejectionReason] [nvarchar](500) NULL,
        [CreatedAt] [datetime2](7) NOT NULL,
        [UpdatedAt] [datetime2](7) NOT NULL,
     CONSTRAINT [PK_CannlawCases] PRIMARY KEY CLUSTERED 
    (
        [Id] ASC
    )
    )
    
    ALTER TABLE [dbo].[CannlawCases]  WITH CHECK ADD  CONSTRAINT [FK_CannlawCases_Clients_ClientId] FOREIGN KEY([ClientId])
    REFERENCES [dbo].[Clients] ([Id])
    ON DELETE CASCADE;

    PRINT 'CannlawCases table created.'
END
GO

-- 4. Create TimeEntries Table
IF OBJECT_ID(N'[dbo].[TimeEntries]', N'U') IS NULL
BEGIN
    PRINT 'Creating TimeEntries table...'
    CREATE TABLE [dbo].[TimeEntries](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [CaseId] [uniqueidentifier] NOT NULL,
        [ClientId] [int] NOT NULL,
        [AttorneyId] [int] NOT NULL,
        [StartTime] [datetime2](7) NOT NULL,
        [EndTime] [datetime2](7) NOT NULL,
        [Duration] [decimal](5, 2) NOT NULL,
        [Description] [nvarchar](500) NOT NULL,
        [Notes] [nvarchar](1000) NULL,
        [HourlyRate] [decimal](10, 2) NOT NULL,
        [BillableAmount] [decimal](10, 2) NOT NULL,
        [IsBilled] [bit] NOT NULL,
        [BilledDate] [datetime2](7) NULL,
        [CreatedAt] [datetime2](7) NOT NULL,
     CONSTRAINT [PK_TimeEntries] PRIMARY KEY CLUSTERED 
    (
        [Id] ASC
    )
    )
    
    -- Relationships
    ALTER TABLE [dbo].[TimeEntries]  WITH CHECK ADD  CONSTRAINT [FK_TimeEntries_Cases_CaseId] FOREIGN KEY([CaseId])
    REFERENCES [dbo].[Cases] ([Id])
    ON DELETE CASCADE;

    ALTER TABLE [dbo].[TimeEntries]  WITH CHECK ADD  CONSTRAINT [FK_TimeEntries_Clients_ClientId] FOREIGN KEY([ClientId])
    REFERENCES [dbo].[Clients] ([Id]); -- No cascade to avoid cycles

    IF OBJECT_ID(N'[dbo].[Attorneys]', N'U') IS NOT NULL
    BEGIN
        ALTER TABLE [dbo].[TimeEntries]  WITH CHECK ADD  CONSTRAINT [FK_TimeEntries_Attorneys_AttorneyId] FOREIGN KEY([AttorneyId])
        REFERENCES [dbo].[Attorneys] ([Id]);
    END

    PRINT 'TimeEntries table created.'
END
GO

-- 5. Create Documents Table
IF OBJECT_ID(N'[dbo].[Documents]', N'U') IS NULL
BEGIN
    PRINT 'Creating Documents table...'
    CREATE TABLE [dbo].[Documents](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [ClientId] [int] NOT NULL,
        [FileName] [nvarchar](255) NOT NULL,
        [OriginalFileName] [nvarchar](255) NOT NULL,
        [FileUrl] [nvarchar](1000) NOT NULL,
        [ContentType] [nvarchar](100) NOT NULL,
        [FileSize] [bigint] NOT NULL,
        [Category] [nvarchar](50) NOT NULL,
        [Description] [nvarchar](500) NULL,
        [UploadedBy] [nvarchar](255) NOT NULL,
        [UploadDate] [datetime2](7) NOT NULL,
        [IsConfidential] [bit] NOT NULL,
        [AccessNotes] [nvarchar](500) NULL,
        [LastAccessedAt] [datetime2](7) NULL,
        [LastAccessedBy] [nvarchar](255) NULL,
     CONSTRAINT [PK_Documents] PRIMARY KEY CLUSTERED 
    (
        [Id] ASC
    )
    )
    
    ALTER TABLE [dbo].[Documents]  WITH CHECK ADD  CONSTRAINT [FK_Documents_Clients_ClientId] FOREIGN KEY([ClientId])
    REFERENCES [dbo].[Clients] ([Id])
    ON DELETE CASCADE;

    PRINT 'Documents table created.'
END
GO

-- 6. Seed Client/Case for existing users if missing
-- Create Client for dcann if not exists
IF NOT EXISTS (SELECT * FROM Clients WHERE Email = 'dcann@cannlaw.com')
BEGIN
    INSERT INTO Clients (FirstName, LastName, Email, Phone, CreatedAt, UpdatedAt, CreatedBy)
    VALUES ('Denise', 'Cann', 'dcann@cannlaw.com', '555-0100', GETUTCDATE(), GETUTCDATE(), 'System');
    PRINT 'Seeded Client for dcann';
END

-- Ensure Attorney is assigned to this client
UPDATE Clients 
SET AssignedAttorneyId = (SELECT TOP 1 Id FROM Attorneys WHERE Email = 'dcann@cannlaw.com')
WHERE Email = 'dcann@cannlaw.com' AND AssignedAttorneyId IS NULL;

-- Create Case for dcann if not exists (linked to User)
DECLARE @UserId uniqueidentifier;
SELECT @UserId = Id FROM AspNetUsers WHERE Email = 'dcann@cannlaw.com';

IF @UserId IS NOT NULL AND NOT EXISTS (SELECT * FROM Cases WHERE UserId = @UserId)
BEGIN
    INSERT INTO Cases (Id, UserId, Status, LastActivityAt, CreatedAt, UpdatedAt)
    VALUES (NEWID(), @UserId, 'In Progress', SYSDATETIMEOFFSET(), GETUTCDATE(), GETUTCDATE());
    PRINT 'Seeded Case for dcann';
END
GO
