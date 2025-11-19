-- =====================================================
-- Create Pricing Rules for All Visa Types
-- =====================================================
-- This script creates default pricing rules for ALL visa types
-- Pricing: Basic=$250, Standard=$500, Premium=$1000, Enterprise=$2500
-- All pricing rules are set to IsActive=1 by default
-- =====================================================

USE Law4HireDb;
GO

-- Only insert pricing rules that don't already exist
INSERT INTO PricingRules (VisaTypeId, PackageId, CountryCode, BasePrice, Currency, FxSurchargeMode, TaxRate, IsActive, CreatedAt, UpdatedAt)
SELECT
    vt.Id as VisaTypeId,
    p.Id as PackageId,
    'US' as CountryCode,
    CASE
        WHEN p.Code = 'BASIC' THEN 250.00
        WHEN p.Code = 'STANDARD' THEN 500.00
        WHEN p.Code = 'PREMIUM' THEN 1000.00
        WHEN p.Code = 'ENTERPRISE' THEN 2500.00
    END as BasePrice,
    'USD' as Currency,
    'None' as FxSurchargeMode,
    0.00 as TaxRate,
    1 as IsActive,
    GETUTCDATE() as CreatedAt,
    GETUTCDATE() as UpdatedAt
FROM
    VisaTypes vt
CROSS JOIN
    Packages p
WHERE
    vt.IsActive = 1
    AND NOT EXISTS (
        SELECT 1
        FROM PricingRules pr
        WHERE pr.VisaTypeId = vt.Id
        AND pr.PackageId = p.Id
    )
ORDER BY
    vt.Code, p.SortOrder;

GO

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show summary counts
PRINT '==================== SUMMARY ====================';
SELECT
    'Total VisaTypes' as Metric,
    COUNT(*) as Count,
    COUNT(CASE WHEN IsActive = 1 THEN 1 END) as Active
FROM VisaTypes;

SELECT
    'Total Packages' as Metric,
    COUNT(*) as Count,
    COUNT(CASE WHEN IsActive = 1 THEN 1 END) as Active
FROM Packages;

SELECT
    'Total PricingRules' as Metric,
    COUNT(*) as Count,
    COUNT(CASE WHEN IsActive = 1 THEN 1 END) as Active
FROM PricingRules;

SELECT
    'Expected PricingRules' as Metric,
    COUNT(*) as Count
FROM (
    SELECT vt.Id, p.Id
    FROM VisaTypes vt
    CROSS JOIN Packages p
    WHERE vt.IsActive = 1
) as Expected;

GO

-- Show visa types WITHOUT pricing rules (should be empty)
PRINT '==================== VISA TYPES WITHOUT PRICING ====================';
SELECT
    vt.Code,
    vt.Name,
    COUNT(pr.Id) as PricingRuleCount
FROM
    VisaTypes vt
    LEFT JOIN PricingRules pr ON vt.Id = pr.VisaTypeId
WHERE
    vt.IsActive = 1
GROUP BY
    vt.Id, vt.Code, vt.Name
HAVING
    COUNT(pr.Id) < 4
ORDER BY
    vt.Code;

GO

-- Show pricing breakdown by package
PRINT '==================== PRICING BY PACKAGE ====================';
SELECT
    p.Code as Package,
    p.DisplayName,
    COUNT(pr.Id) as RuleCount,
    MIN(pr.BasePrice) as MinPrice,
    MAX(pr.BasePrice) as MaxPrice,
    AVG(pr.BasePrice) as AvgPrice
FROM
    Packages p
    LEFT JOIN PricingRules pr ON p.Id = pr.PackageId
GROUP BY
    p.Id, p.Code, p.DisplayName, p.SortOrder
ORDER BY
    p.SortOrder;

GO

-- Show sample pricing for first 20 visa types
PRINT '==================== SAMPLE PRICING (First 20 Visa Types) ====================';
SELECT TOP 20
    vt.Code as VisaType,
    vt.Name,
    p.Code as Package,
    pr.BasePrice,
    pr.Currency,
    pr.IsActive
FROM
    PricingRules pr
    JOIN VisaTypes vt ON pr.VisaTypeId = vt.Id
    JOIN Packages p ON pr.PackageId = p.Id
ORDER BY
    vt.Code, p.SortOrder;

GO

-- Show any duplicate pricing rules (should be empty)
PRINT '==================== DUPLICATE CHECK ====================';
SELECT
    vt.Code,
    p.Code as Package,
    COUNT(*) as DuplicateCount
FROM
    PricingRules pr
    JOIN VisaTypes vt ON pr.VisaTypeId = vt.Id
    JOIN Packages p ON pr.PackageId = p.Id
GROUP BY
    vt.Id, vt.Code, p.Id, p.Code
HAVING
    COUNT(*) > 1;

GO

PRINT '==================== COMPLETE ====================';
PRINT 'Pricing rules created successfully!';
PRINT 'All active visa types should now have 4 pricing rules each.';
GO
