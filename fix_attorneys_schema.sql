SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Create Attorneys table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Attorneys]') AND type in (N'U'))
BEGIN
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
END
GO

-- Add AttorneyId to AspNetUsers if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[AspNetUsers]') AND name = 'AttorneyId')
BEGIN
    ALTER TABLE [dbo].[AspNetUsers] ADD [AttorneyId] [int] NULL;
    
    ALTER TABLE [dbo].[AspNetUsers]  WITH CHECK ADD  CONSTRAINT [FK_AspNetUsers_Attorneys_AttorneyId] FOREIGN KEY([AttorneyId])
    REFERENCES [dbo].[Attorneys] ([Id])
    ON DELETE SET NULL;
    
    ALTER TABLE [dbo].[AspNetUsers] CHECK CONSTRAINT [FK_AspNetUsers_Attorneys_AttorneyId];
    
    CREATE NONCLUSTERED INDEX [IX_AspNetUsers_AttorneyId] ON [dbo].[AspNetUsers]
    (
        [AttorneyId] ASC
    );
END
GO

-- Seed dcann as an attorney if not already linked
DECLARE @UserId uniqueidentifier;
DECLARE @UserEmail nvarchar(256) = 'dcann@cannlaw.com';
DECLARE @AttorneyId int;

SELECT @UserId = Id FROM AspNetUsers WHERE Email = @UserEmail;

IF @UserId IS NOT NULL
BEGIN
    -- Check if user already has an attorney ID
    -- Use dynamic SQL to avoid compilation error if column doesn't exist yet (though we just added it)
    -- Actually, in the same batch, it might be fine, but splitting batches with GO helps.
    
    -- We can just run the select now that we know the column exists (or will exist)
    SELECT @AttorneyId = AttorneyId FROM AspNetUsers WHERE Id = @UserId;

    IF @AttorneyId IS NULL
    BEGIN
        -- Create Attorney record
        INSERT INTO Attorneys (
            Name, Title, Bio, Email, Phone, Credentials, PracticeAreas, Languages, 
            DirectPhone, DirectEmail, OfficeLocation, DefaultHourlyRate, 
            IsActive, IsManagingAttorney, DisplayOrder, CreatedAt, UpdatedAt, ProfessionalType
        )
        VALUES (
            'Denise Cann', 
            'Managing Attorney', 
            'Experienced immigration attorney with over 20 years of practice.', 
            'dcann@cannlaw.com', 
            '555-0100', 
            '["JD", "Bar Admission"]', 
            '["Immigration", "Family Law"]', 
            '["English", "Spanish"]', 
            '555-0101', 
            'dcann@cannlaw.com', 
            'Main Office', 
            350.00, 
            1, 
            1, 
            1, 
            GETUTCDATE(), 
            GETUTCDATE(),
            0 -- Attorney
        );

        SET @AttorneyId = SCOPE_IDENTITY();

        -- Link user to attorney
        UPDATE AspNetUsers SET AttorneyId = @AttorneyId WHERE Id = @UserId;
        
        PRINT 'Created Attorney record and linked to user ' + @UserEmail;
    END
    ELSE
    BEGIN
        PRINT 'User ' + @UserEmail + ' is already linked to Attorney ID ' + CAST(@AttorneyId AS nvarchar(20));
    END
END
ELSE
BEGIN
    PRINT 'User ' + @UserEmail + ' not found.';
END
GO