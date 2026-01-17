SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

USE law4hiredb;
GO

PRINT 'Starting Client Synchronization...';

-- 1. Insert missing Clients from AspNetUsers who have Cases
INSERT INTO Clients (FirstName, LastName, Email, Phone, CreatedAt, UpdatedAt, CreatedBy)
SELECT 
    u.FirstName, 
    u.LastName, 
    u.Email, 
    u.PhoneNumber, 
    GETUTCDATE(), 
    GETUTCDATE(), 
    'System Sync'
FROM AspNetUsers u
WHERE EXISTS (SELECT 1 FROM Cases c WHERE c.UserId = u.Id) -- Only users with cases
AND NOT EXISTS (SELECT 1 FROM Clients cl WHERE cl.Email = u.Email); -- Not already in Clients

PRINT 'Inserted ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' missing clients.';

-- 2. Update AssignedAttorneyId on Clients based on their most recent Case assignment
UPDATE cl
SET AssignedAttorneyId = c.AssignedStaffId
FROM Clients cl
INNER JOIN AspNetUsers u ON cl.Email = u.Email
INNER JOIN (
    -- Get the most recently modified case for each user that has an assignment
    SELECT UserId, AssignedStaffId,
           ROW_NUMBER() OVER (PARTITION BY UserId ORDER BY LastActivityAt DESC) as rn
    FROM Cases
    WHERE AssignedStaffId IS NOT NULL
) c ON u.Id = c.UserId AND c.rn = 1
WHERE cl.AssignedAttorneyId IS NULL OR cl.AssignedAttorneyId != c.AssignedStaffId;

PRINT 'Updated assignments for ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' clients.';

-- 3. Verify specifically for Ed Cann
SELECT Id, FirstName, LastName, Email, AssignedAttorneyId FROM Clients WHERE Email LIKE '%ed@cannsoft.com%';
GO
