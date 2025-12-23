USE L4H;
GO

-- Clear existing services
DELETE FROM LegalServices;
DELETE FROM ServiceCategories;
GO

-- Insert Categories
INSERT INTO ServiceCategories (Name, Description, IconUrl, DisplayOrder, IsActive, CreatedAt, UpdatedAt)
VALUES 
('NONIMMIGRANT VISA', 'Temporary visas for tourism, business, work, and study.', 'Plane', 1, 1, GETDATE(), GETDATE()),
('FAMILY-BASED PERMANENT RESIDENT/GREEN CARD', 'Pathways to permanent residency through family relationships.', 'Users', 2, 1, GETDATE(), GETDATE()),
('EMPLOYMENT-BASED PERM. RESIDENT/GREEN CARD', 'Permanent residency through employment and investment.', 'Briefcase', 3, 1, GETDATE(), GETDATE()),
('NATURALIZATION/CITIZENSHIP, & INT''L. ADOPTION', 'The journey to becoming a U.S. citizen and international adoption services.', 'Home', 4, 1, GETDATE(), GETDATE()),
('IMMIGRATION COURT, DEPORTATION, REMOVAL', 'Legal representation for deportation and removal proceedings.', 'Gavel', 5, 1, GETDATE(), GETDATE()),
('COUNTRY-SPECIFIC & OTHER IMMIGRANT VISAS', 'Specialized programs and other immigrant visa categories.', 'Globe', 6, 1, GETDATE(), GETDATE());

-- Get IDs
DECLARE @NonImmigrantId INT = (SELECT Id FROM ServiceCategories WHERE Name = 'NONIMMIGRANT VISA');
DECLARE @FamilyId INT = (SELECT Id FROM ServiceCategories WHERE Name = 'FAMILY-BASED PERMANENT RESIDENT/GREEN CARD');
DECLARE @EmploymentId INT = (SELECT Id FROM ServiceCategories WHERE Name = 'EMPLOYMENT-BASED PERM. RESIDENT/GREEN CARD');
DECLARE @CitizenshipId INT = (SELECT Id FROM ServiceCategories WHERE Name = 'NATURALIZATION/CITIZENSHIP, & INT''L. ADOPTION');
DECLARE @CourtId INT = (SELECT Id FROM ServiceCategories WHERE Name = 'IMMIGRATION COURT, DEPORTATION, REMOVAL');
DECLARE @OtherId INT = (SELECT Id FROM ServiceCategories WHERE Name = 'COUNTRY-SPECIFIC & OTHER IMMIGRANT VISAS');

-- Insert LegalServices
-- Non-Immigrant
INSERT INTO LegalServices (ServiceCategoryId, Name, Description, IsActive, DisplayOrder, CreatedAt, UpdatedAt)
VALUES 
(@NonImmigrantId, 'A (Diplomats & Government Officials)', '', 1, 1, GETDATE(), GETDATE()),
(@NonImmigrantId, 'B (Business & Tourist)', '', 1, 2, GETDATE(), GETDATE()),
(@NonImmigrantId, 'E (Treaty Trader & Investor)', '', 1, 3, GETDATE(), GETDATE()),
(@NonImmigrantId, 'F (Academic Student Visas)', '', 1, 4, GETDATE(), GETDATE()),
(@NonImmigrantId, 'H (Temporary Workers)', '', 1, 5, GETDATE(), GETDATE()),
(@NonImmigrantId, 'K (Fiance(e) & Spousal Visas)', '', 1, 6, GETDATE(), GETDATE()),
(@NonImmigrantId, 'L (Intracompany Transfer Employees)', '', 1, 7, GETDATE(), GETDATE()),
(@NonImmigrantId, 'O (Extraordinary Ability Workers)', '', 1, 8, GETDATE(), GETDATE()),
(@NonImmigrantId, 'TN/TD (NAFTA)', '', 1, 9, GETDATE(), GETDATE());

-- Family
INSERT INTO LegalServices (ServiceCategoryId, Name, Description, IsActive, DisplayOrder, CreatedAt, UpdatedAt)
VALUES 
(@FamilyId, '1st (F1) Unmarried Children of United States Citizen', '', 1, 1, GETDATE(), GETDATE()),
(@FamilyId, '2nd (F2) Spouses & Unmarried Children of LPR', '', 1, 2, GETDATE(), GETDATE()),
(@FamilyId, '3rd (F3) Married Children of United States Citizen', '', 1, 3, GETDATE(), GETDATE()),
(@FamilyId, '4th (F4) Siblings of United States Citizens', '', 1, 4, GETDATE(), GETDATE());

-- Employment
INSERT INTO LegalServices (ServiceCategoryId, Name, Description, IsActive, DisplayOrder, CreatedAt, UpdatedAt)
VALUES 
(@EmploymentId, '1st (EB1) Priority Workers/Extraordinary Ability', '', 1, 1, GETDATE(), GETDATE()),
(@EmploymentId, '2nd (EB2) Exceptionally Ability & Advanced Degree', '', 1, 2, GETDATE(), GETDATE()),
(@EmploymentId, '3rd (EB3) Skilled Workers, Professionals & Other Workers', '', 1, 3, GETDATE(), GETDATE()),
(@EmploymentId, '5th (EB5) Investment or Regional Center', '', 1, 4, GETDATE(), GETDATE());

-- Citizenship
INSERT INTO LegalServices (ServiceCategoryId, Name, Description, IsActive, DisplayOrder, CreatedAt, UpdatedAt)
VALUES 
(@CitizenshipId, 'U.S. Citizenship Naturalization', '', 1, 1, GETDATE(), GETDATE()),
(@CitizenshipId, 'Intercountry Adoption - Hague Convention', '', 1, 2, GETDATE(), GETDATE());

-- Court
INSERT INTO LegalServices (ServiceCategoryId, Name, Description, IsActive, DisplayOrder, CreatedAt, UpdatedAt)
VALUES 
(@CourtId, 'Deportation/Removal Defense', '', 1, 1, GETDATE(), GETDATE()),
(@CourtId, 'Cancellation of Removal', '', 1, 2, GETDATE(), GETDATE()),
(@CourtId, 'Waivers of Inadmissibility', '', 1, 3, GETDATE(), GETDATE()),
(@CourtId, 'Board of Immigration Appeals (BIA)', '', 1, 4, GETDATE(), GETDATE());

-- Other
INSERT INTO LegalServices (ServiceCategoryId, Name, Description, IsActive, DisplayOrder, CreatedAt, UpdatedAt)
VALUES 
(@OtherId, 'Diversity Lottery', '', 1, 1, GETDATE(), GETDATE()),
(@OtherId, 'General National Interest Waiver (NIW)', '', 1, 2, GETDATE(), GETDATE()),
(@OtherId, 'VAWA (Battered Immigrants)', '', 1, 3, GETDATE(), GETDATE());
GO