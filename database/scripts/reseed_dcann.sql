-- Reseed dcann@cannlaw.com
-- Password set to: Password123!
-- PBKDF2 hash for Password123! generated via PowerShell

DECLARE @UserEmail nvarchar(255) = 'dcann@cannlaw.com';
DECLARE @NewPasswordHash nvarchar(500) = '{"Hash":"HUgN02lLkmOlSc4LsPKiyZ0iHpO7xmfQSyF+vXd/130=","Salt":"X6mEqLtO76bkS2gjng3l2A==","Algorithm":"PBKDF2-SHA256","Iterations":310000}';

IF EXISTS (SELECT 1 FROM Users WHERE Email = @UserEmail)
BEGIN
    UPDATE Users
    SET PasswordHash = @NewPasswordHash,
        IsAdmin = 1,
        IsStaff = 1,
        IsLegalProfessional = 1,
        IsActive = 1,
        EmailVerified = 1,
        FailedLoginCount = 0,
        LockoutUntil = NULL
    WHERE Email = @UserEmail;
    PRINT 'Updated existing user ' + @UserEmail;
END
ELSE
BEGIN
    INSERT INTO Users (Id, Email, PasswordHash, EmailVerified, CreatedAt, PasswordUpdatedAt, FailedLoginCount, IsAdmin, IsStaff, IsLegalProfessional, IsActive, FirstName, LastName)
    VALUES (NEWID(), @UserEmail, @NewPasswordHash, 1, GETUTCDATE(), GETUTCDATE(), 0, 1, 1, 1, 1, 'Denise', 'Cann');
    PRINT 'Inserted new user ' + @UserEmail;
END

-- Ensure attorney profile is linked if it exists
DECLARE @UserId uniqueidentifier;
SELECT @UserId = Id FROM Users WHERE Email = @UserEmail;

DECLARE @AttorneyId int;
SELECT @AttorneyId = Id FROM Attorneys WHERE Email = @UserEmail;

IF @AttorneyId IS NOT NULL
BEGIN
    UPDATE Users SET AttorneyId = @AttorneyId WHERE Id = @UserId;
    PRINT 'Linked user to attorney profile';
END
GO
