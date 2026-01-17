SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

USE law4hiredb;
GO

-- Create a dummy CannlawCase for Ed Cann (Client ID 2)
IF NOT EXISTS (SELECT 1 FROM CannlawCases WHERE ClientId = 2)
BEGIN
    PRINT 'Creating CannlawCase for Client ID 2 (Ed)...';
    INSERT INTO CannlawCases (ClientId, CaseType, Status, StartDate, CreatedAt, UpdatedAt)
    VALUES (2, 'Immigration', 1, GETUTCDATE(), GETUTCDATE(), GETUTCDATE());
    PRINT 'Created CannlawCase.';
END
ELSE
BEGIN
    PRINT 'CannlawCase for Client ID 2 already exists.';
END
GO
