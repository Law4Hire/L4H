-- Clear existing CategoryClass data
DELETE FROM CategoryClasses;

-- Insert CategoryClass data from CategoryClass.json
INSERT INTO CategoryClasses (Id, ClassCode, ClassName, GeneralCategory, IsActive, CreatedAt, UpdatedAt)
VALUES 
(NEWID(), 'A', 'Diplomat', 'Other', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'B', 'Business/Tourism Visitor', 'Tourism & Visit, Business', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'C', 'Transit Visa', 'Tourism & Visit', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'CW', 'CNMI Transitional Worker', 'Other', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'D', 'Crewmember', 'Other', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'E', 'Treaty Trader/Investor', 'Business, Employment', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'EB', 'Employment-Based Immigrant', 'Employment, Immigrate', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'F', 'Academic Student', 'Study & Exchange', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'G', 'International Organization', 'Other', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'H', 'Temporary Worker', 'Business, Employment', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'I', 'Media Representative', 'Other', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'IR', 'Immediate Relative', 'Immigrate', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'CR', 'Conditional Resident', 'Immigrate', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'J', 'Exchange Visitor', 'Study & Exchange', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'K', 'Fiancé/Spouse', 'Immigrate', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'L', 'Intracompany Transferee', 'Business, Employment', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'M', 'Vocational Student', 'Study & Exchange', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'N', 'Special Immigrant', 'Other', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'NATO', 'NATO Official', 'Other', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'O', 'Extraordinary Ability', 'Business, Employment', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'P', 'Athlete/Entertainer', 'Business, Employment', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'Q', 'Cultural Exchange', 'Study & Exchange', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'R', 'Religious Worker', 'Other', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'S', 'Witness/Informant', 'Other', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'SIJS', 'Special Immigrant Juvenile', 'Immigrate', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'SIV', 'Special Immigrant Visa', 'Immigrate', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'T', 'Trafficking Victim', 'Other', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'TPS', 'Temporary Protected Status', 'Other', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'TN', 'NAFTA Professional', 'Business, Employment', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'U', 'Crime Victim', 'Other', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'V', 'Family of LPR', 'Immigrate', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'VAWA', 'Violence Against Women Act', 'Immigrate', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'VWP', 'Visa Waiver Program', 'Tourism & Visit, Business', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'WB', 'Waiver Business', 'Tourism & Visit, Business', 1, GETUTCDATE(), GETUTCDATE()),
(NEWID(), 'WT', 'Waiver Tourism', 'Tourism & Visit', 1, GETUTCDATE(), GETUTCDATE());

-- Verify the data was loaded
SELECT COUNT(*) AS TotalCategoryClasses FROM CategoryClasses;
SELECT ClassCode, ClassName, GeneralCategory FROM CategoryClasses ORDER BY ClassCode;