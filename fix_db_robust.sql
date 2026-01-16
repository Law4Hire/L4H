SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

USE law4hiredb;
GO

IF OBJECT_ID(N'[dbo].[Attorneys]', N'U') IS NULL
BEGIN
    PRINT 'Creating Attorneys table...'
    CREATE TABLE [dbo].[Attorneys](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [Name] [nvarchar](255) NOT NULL,
        [Title] [nvarchar](255) NOT NULL,
        [Bio] [nvarchar](max) NOT NULL,
        [PhotoUrl] [nvarchar](500) NULL,
        [Email] [nvarchar](255) NOT NULL,
        [Phone] [nvarchar](50) NOT NULL,
        [Credentials] [nvarchar](max) NOT NULL,
        [PracticeAreas] [nvarchar](max) NOT NULL,
        [Languages] [nvarchar](max) NOT NULL,
        [DirectPhone] [nvarchar](50) NOT NULL,
        [DirectEmail] [nvarchar](255) NOT NULL,
        [OfficeLocation] [nvarchar](255) NOT NULL,
        [DefaultHourlyRate] [decimal](10, 2) NOT NULL,
        [IsActive] [bit] NOT NULL,
        [IsManagingAttorney] [bit] NOT NULL,
        [DisplayOrder] [int] NOT NULL,
        [CreatedAt] [datetime2](7) NOT NULL,
        [UpdatedAt] [datetime2](7) NOT NULL,
        [ProfessionalType] [int] NOT NULL DEFAULT 0,
     CONSTRAINT [PK_Attorneys] PRIMARY KEY CLUSTERED 
    (
        [Id] ASC
    )
    )
    PRINT 'Attorneys table created.'
END
ELSE
BEGIN
    PRINT 'Attorneys table already exists.'
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AspNetUsers]') AND name = 'AttorneyId')
BEGIN
    PRINT 'Adding AttorneyId to AspNetUsers...'
    ALTER TABLE [dbo].[AspNetUsers] ADD [AttorneyId] [int] NULL;
    
    ALTER TABLE [dbo].[AspNetUsers]  WITH CHECK ADD  CONSTRAINT [FK_AspNetUsers_Attorneys_AttorneyId] FOREIGN KEY([AttorneyId])
    REFERENCES [dbo].[Attorneys] ([Id])
    ON DELETE SET NULL;
    
    ALTER TABLE [dbo].[AspNetUsers] CHECK CONSTRAINT [FK_AspNetUsers_Attorneys_AttorneyId];
    
    CREATE NONCLUSTERED INDEX [IX_AspNetUsers_AttorneyId] ON [dbo].[AspNetUsers]
    (
        [AttorneyId] ASC
    );
    PRINT 'AttorneyId added.'
END
GO

-- Seed Data
DECLARE @UserId uniqueidentifier;
DECLARE @UserEmail nvarchar(256) = 'dcann@cannlaw.com';
DECLARE @AttorneyId int;

SELECT @UserId = Id FROM AspNetUsers WHERE Email = @UserEmail;

IF @UserId IS NOT NULL
BEGIN
    -- Check if attorney record exists for this email
    SELECT @AttorneyId = Id FROM Attorneys WHERE Email = @UserEmail;

    IF @AttorneyId IS NULL
    BEGIN
        PRINT 'Creating Attorney record for ' + @UserEmail
        INSERT INTO Attorneys (
            Name, Title, Bio, Email, Phone, Credentials, PracticeAreas, Languages, 
            DirectPhone, DirectEmail, OfficeLocation, DefaultHourlyRate, 
            IsActive, IsManagingAttorney, DisplayOrder, CreatedAt, UpdatedAt, ProfessionalType
        )
        VALUES (
            'Denise Cann', 
            'Managing Attorney', 
            'Experienced immigration attorney.', 
            @UserEmail, 
            '555-0100', 
            '["JD"]', 
            '["Immigration"]', 
            '["English"]', 
            '555-0101', 
            @UserEmail, 
            'Main Office', 
            350.00, 
            1, 
            1, 
            1, 
            GETUTCDATE(), 
            GETUTCDATE(),
            0
        );
        SET @AttorneyId = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        PRINT 'Attorney record already exists for ' + @UserEmail + ' (ID: ' + CAST(@AttorneyId AS VARCHAR(10)) + ')'
    END

    -- Link User to Attorney
    UPDATE AspNetUsers SET AttorneyId = @AttorneyId WHERE Id = @UserId;
    PRINT 'Linked User to Attorney ID ' + CAST(@AttorneyId AS VARCHAR(10));
END
ELSE
BEGIN
    PRINT 'User ' + @UserEmail + ' not found!'
END
GO
