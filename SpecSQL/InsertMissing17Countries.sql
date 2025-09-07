-- Insert the missing 17 countries/territories to reach 214 total
-- These are commonly included in State Department visa processing lists

BEGIN TRANSACTION;

INSERT INTO Countries (Id, Name, CountryCode2, CountryCode, IsActive, SortOrder, CreatedAt, IsUNRecognized) VALUES
-- Special Administrative Regions
(NEWID(), 'Hong Kong', 'HK', 'HKG', 1, 198, GETDATE(), 0),
(NEWID(), 'Macau', 'MO', 'MAC', 1, 199, GETDATE(), 0),

-- Non-UN Member States with Partial Recognition
(NEWID(), 'Cook Islands', 'CK', 'COK', 1, 200, GETDATE(), 0),
(NEWID(), 'Niue', 'NU', 'NIU', 1, 201, GETDATE(), 0),

-- British Overseas Territories commonly processed separately
(NEWID(), 'Bermuda', 'BM', 'BMU', 1, 202, GETDATE(), 0),
(NEWID(), 'British Virgin Islands', 'VG', 'VGB', 1, 203, GETDATE(), 0),
(NEWID(), 'Cayman Islands', 'KY', 'CYM', 1, 204, GETDATE(), 0),
(NEWID(), 'Gibraltar', 'GI', 'GIB', 1, 205, GETDATE(), 0),
(NEWID(), 'Montserrat', 'MS', 'MSR', 1, 206, GETDATE(), 0),
(NEWID(), 'Turks and Caicos Islands', 'TC', 'TCA', 1, 207, GETDATE(), 0),

-- French Overseas Territories
(NEWID(), 'French Guiana', 'GF', 'GUF', 1, 208, GETDATE(), 0),
(NEWID(), 'Guadeloupe', 'GP', 'GLP', 1, 209, GETDATE(), 0),
(NEWID(), 'Martinique', 'MQ', 'MTQ', 1, 210, GETDATE(), 0),
(NEWID(), 'Mayotte', 'YT', 'MYT', 1, 211, GETDATE(), 0),
(NEWID(), 'Réunion', 'RE', 'REU', 1, 212, GETDATE(), 0),

-- Other commonly processed territories
(NEWID(), 'Aruba', 'AW', 'ABW', 1, 213, GETDATE(), 0),
(NEWID(), 'Netherlands Antilles', 'AN', 'ANT', 1, 214, GETDATE(), 0);

COMMIT TRANSACTION;

-- Verify we now have 214 countries total
SELECT COUNT(*) as 'Total Countries After Adding Missing 17' FROM Countries;