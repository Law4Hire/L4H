-- Fix ALL cases with NULL VisaTypeId assignments using direct SQL
-- This will randomly assign visa types from the available range (131-218)

-- Create a temporary table with all cases that need visa type assignments
DECLARE @CasesToFix TABLE (
    CaseId UNIQUEIDENTIFIER,
    RandomVisaTypeId INT
);

-- Insert all cases with NULL VisaTypeId and assign random visa types
INSERT INTO @CasesToFix (CaseId, RandomVisaTypeId)
SELECT
    Id,
    -- Random visa type ID between 131 and 218 (88 total visa types)
    131 + (ABS(CHECKSUM(NEWID())) % 88) as RandomVisaTypeId
FROM Cases
WHERE VisaTypeId IS NULL;

-- Show what we're about to update
PRINT 'Cases to be updated with visa type assignments:';
SELECT COUNT(*) as TotalCasesToFix FROM @CasesToFix;

-- Update all cases with their assigned visa types
UPDATE Cases
SET VisaTypeId = ctf.RandomVisaTypeId
FROM Cases c
INNER JOIN @CasesToFix ctf ON c.Id = ctf.CaseId;

-- Show results
PRINT 'Update complete! Verification:';
SELECT
    'Total Cases' as Metric,
    COUNT(*) as Count
FROM Cases
UNION ALL
SELECT
    'Cases with Visa Types',
    COUNT(*)
FROM Cases
WHERE VisaTypeId IS NOT NULL
UNION ALL
SELECT
    'Cases with NULL Visa Types',
    COUNT(*)
FROM Cases
WHERE VisaTypeId IS NULL
UNION ALL
SELECT
    'Unique Visa Types Assigned',
    COUNT(DISTINCT VisaTypeId)
FROM Cases
WHERE VisaTypeId IS NOT NULL;

-- Show visa type distribution
PRINT 'Visa type assignment distribution:';
SELECT
    vt.Code,
    vt.Name,
    COUNT(c.Id) as CaseCount
FROM VisaTypes vt
LEFT JOIN Cases c ON vt.Id = c.VisaTypeId
WHERE c.VisaTypeId IS NOT NULL
GROUP BY vt.Id, vt.Code, vt.Name
ORDER BY CaseCount DESC;