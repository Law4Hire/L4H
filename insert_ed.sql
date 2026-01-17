SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

USE law4hiredb;
GO

-- Insert Ed Cann into Clients
IF NOT EXISTS (SELECT 1 FROM Clients WHERE Email = 'ed@cannsoft.com')
BEGIN
    PRINT 'Inserting Ed Cann into Clients...'
    INSERT INTO Clients (FirstName, LastName, Email, CreatedAt, UpdatedAt, CreatedBy)
    VALUES ('Ed', 'Cann', 'ed@cannsoft.com', GETUTCDATE(), GETUTCDATE(), 'System');
    PRINT 'Inserted Ed Cann.'
END
ELSE
BEGIN
    PRINT 'Ed Cann already in Clients.'
END

-- Assign Denise as Attorney for Ed (since User says it was assigned in UI)
-- Getting Denise's Attorney ID
DECLARE @DeniseAttorneyId int;
SELECT @DeniseAttorneyId = Id FROM Attorneys WHERE Email = 'dcann@cannlaw.com';

IF @DeniseAttorneyId IS NOT NULL
BEGIN
    UPDATE Clients 
    SET AssignedAttorneyId = @DeniseAttorneyId 
    WHERE Email = 'ed@cannsoft.com';
    PRINT 'Assigned Denise to Ed.';
END
GO
