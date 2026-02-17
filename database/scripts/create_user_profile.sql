SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

USE law4hiredb;
GO

DECLARE @UserId uniqueidentifier;
SELECT @UserId = Id FROM AspNetUsers WHERE Email = 'dcann@cannlaw.com';

IF @UserId IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM UserProfiles WHERE UserId = @UserId)
    BEGIN
        PRINT 'Creating UserProfile for dcann...';
        INSERT INTO UserProfiles (Id, UserId, CreatedAt, UpdatedAt)
        VALUES (NEWID(), @UserId, GETUTCDATE(), GETUTCDATE());
        PRINT 'Created UserProfile.';
    END
    ELSE
    BEGIN
        PRINT 'UserProfile for dcann already exists.';
    END
END
ELSE
BEGIN
    PRINT 'User dcann not found.';
END
GO
