USE L4H;
GO

-- 1. Remove duplicate Packages (same DisplayName)
-- We keep the one with the latest creation date (Max Id)
DELETE P
FROM Packages P
JOIN (
    SELECT DisplayName, MAX(Id) as MaxId
    FROM Packages
    GROUP BY DisplayName
    HAVING COUNT(*) > 1
) Duplicates ON P.DisplayName = Duplicates.DisplayName
WHERE P.Id < Duplicates.MaxId;

-- 2. Remove duplicate PricingRules (same Package, VisaType, Country)
-- We keep the latest one
WITH CTE AS (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY PackageId, VisaTypeId, CountryCode ORDER BY UpdatedAt DESC) AS rn
    FROM PricingRules
)
DELETE FROM CTE WHERE rn > 1;

GO
