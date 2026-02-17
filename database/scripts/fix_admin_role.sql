SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

USE law4hiredb;
GO

DECLARE @UserId uniqueidentifier;
DECLARE @UserEmail nvarchar(256) = 'dcann@cannlaw.com';
DECLARE @AdminRoleId uniqueidentifier;

-- Get User ID
SELECT @UserId = Id FROM AspNetUsers WHERE Email = @UserEmail;

-- Get Admin Role ID
SELECT @AdminRoleId = Id FROM AspNetRoles WHERE Name = 'Admin';

IF @UserId IS NOT NULL AND @AdminRoleId IS NOT NULL
BEGIN
    -- Check if user is already in Admin role
    IF NOT EXISTS (SELECT 1 FROM AspNetUserRoles WHERE UserId = @UserId AND RoleId = @AdminRoleId)
    BEGIN
        PRINT 'Assigning Admin role to ' + @UserEmail;
        INSERT INTO AspNetUserRoles (UserId, RoleId)
        VALUES (@UserId, @AdminRoleId);
    END
    ELSE
    BEGIN
        PRINT 'User ' + @UserEmail + ' is already an Admin.';
    END
END
ELSE
BEGIN
    PRINT 'User or Admin Role not found.';
    PRINT 'UserId: ' + COALESCE(CAST(@UserId AS VARCHAR(36)), 'NULL');
    PRINT 'AdminRoleId: ' + COALESCE(CAST(@AdminRoleId AS VARCHAR(36)), 'NULL');
END
GO
