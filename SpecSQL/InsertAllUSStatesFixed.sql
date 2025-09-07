-- Insert ALL US States and territories (corrected)
-- This script contains all 50 states, DC, and all US territories

BEGIN TRANSACTION;

-- All 50 US States plus Washington DC (IsState = 1)
INSERT INTO USStates (Id, Name, StateCode, IsState, IsActive, SortOrder, CreatedAt) VALUES
(NEWID(), 'Alabama', 'AL', 1, 1, 1, GETDATE()),
(NEWID(), 'Alaska', 'AK', 1, 1, 2, GETDATE()),
(NEWID(), 'Arizona', 'AZ', 1, 1, 3, GETDATE()),
(NEWID(), 'Arkansas', 'AR', 1, 1, 4, GETDATE()),
(NEWID(), 'California', 'CA', 1, 1, 5, GETDATE()),
(NEWID(), 'Colorado', 'CO', 1, 1, 6, GETDATE()),
(NEWID(), 'Connecticut', 'CT', 1, 1, 7, GETDATE()),
(NEWID(), 'Delaware', 'DE', 1, 1, 8, GETDATE()),
(NEWID(), 'Florida', 'FL', 1, 1, 9, GETDATE()),
(NEWID(), 'Georgia', 'GA', 1, 1, 10, GETDATE()),
(NEWID(), 'Hawaii', 'HI', 1, 1, 11, GETDATE()),
(NEWID(), 'Idaho', 'ID', 1, 1, 12, GETDATE()),
(NEWID(), 'Illinois', 'IL', 1, 1, 13, GETDATE()),
(NEWID(), 'Indiana', 'IN', 1, 1, 14, GETDATE()),
(NEWID(), 'Iowa', 'IA', 1, 1, 15, GETDATE()),
(NEWID(), 'Kansas', 'KS', 1, 1, 16, GETDATE()),
(NEWID(), 'Kentucky', 'KY', 1, 1, 17, GETDATE()),
(NEWID(), 'Louisiana', 'LA', 1, 1, 18, GETDATE()),
(NEWID(), 'Maine', 'ME', 1, 1, 19, GETDATE()),
(NEWID(), 'Maryland', 'MD', 1, 1, 20, GETDATE()),
(NEWID(), 'Massachusetts', 'MA', 1, 1, 21, GETDATE()),
(NEWID(), 'Michigan', 'MI', 1, 1, 22, GETDATE()),
(NEWID(), 'Minnesota', 'MN', 1, 1, 23, GETDATE()),
(NEWID(), 'Mississippi', 'MS', 1, 1, 24, GETDATE()),
(NEWID(), 'Missouri', 'MO', 1, 1, 25, GETDATE()),
(NEWID(), 'Montana', 'MT', 1, 1, 26, GETDATE()),
(NEWID(), 'Nebraska', 'NE', 1, 1, 27, GETDATE()),
(NEWID(), 'Nevada', 'NV', 1, 1, 28, GETDATE()),
(NEWID(), 'New Hampshire', 'NH', 1, 1, 29, GETDATE()),
(NEWID(), 'New Jersey', 'NJ', 1, 1, 30, GETDATE()),
(NEWID(), 'New Mexico', 'NM', 1, 1, 31, GETDATE()),
(NEWID(), 'New York', 'NY', 1, 1, 32, GETDATE()),
(NEWID(), 'North Carolina', 'NC', 1, 1, 33, GETDATE()),
(NEWID(), 'North Dakota', 'ND', 1, 1, 34, GETDATE()),
(NEWID(), 'Ohio', 'OH', 1, 1, 35, GETDATE()),
(NEWID(), 'Oklahoma', 'OK', 1, 1, 36, GETDATE()),
(NEWID(), 'Oregon', 'OR', 1, 1, 37, GETDATE()),
(NEWID(), 'Pennsylvania', 'PA', 1, 1, 38, GETDATE()),
(NEWID(), 'Rhode Island', 'RI', 1, 1, 39, GETDATE()),
(NEWID(), 'South Carolina', 'SC', 1, 1, 40, GETDATE()),
(NEWID(), 'South Dakota', 'SD', 1, 1, 41, GETDATE()),
(NEWID(), 'Tennessee', 'TN', 1, 1, 42, GETDATE()),
(NEWID(), 'Texas', 'TX', 1, 1, 43, GETDATE()),
(NEWID(), 'Utah', 'UT', 1, 1, 44, GETDATE()),
(NEWID(), 'Vermont', 'VT', 1, 1, 45, GETDATE()),
(NEWID(), 'Virginia', 'VA', 1, 1, 46, GETDATE()),
(NEWID(), 'Washington', 'WA', 1, 1, 47, GETDATE()),
(NEWID(), 'West Virginia', 'WV', 1, 1, 48, GETDATE()),
(NEWID(), 'Wisconsin', 'WI', 1, 1, 49, GETDATE()),
(NEWID(), 'Wyoming', 'WY', 1, 1, 50, GETDATE()),
(NEWID(), 'District of Columbia', 'DC', 1, 1, 51, GETDATE()),
-- US Territories (IsState = 0)
(NEWID(), 'Puerto Rico', 'PR', 0, 1, 52, GETDATE()),
(NEWID(), 'US Virgin Islands', 'VI', 0, 1, 53, GETDATE()),
(NEWID(), 'American Samoa', 'AS', 0, 1, 54, GETDATE()),
(NEWID(), 'Guam', 'GU', 0, 1, 55, GETDATE()),
(NEWID(), 'Northern Mariana Islands', 'MP', 0, 1, 56, GETDATE());

COMMIT TRANSACTION;

-- Verify the count
SELECT COUNT(*) as 'Total US States and Territories Inserted' FROM USStates;