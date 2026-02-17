USE L4H;
GO

-- Clear existing mappings and tiles
DELETE FROM VisaLibraryTileMappings;
DELETE FROM VisaLibraryTiles;
GO

-- Insert Tiles (Categories)
INSERT INTO VisaLibraryTiles (Id, Name, Description, DisplayOrder, IsActive, CreatedAt, UpdatedAt)
VALUES 
(NEWID(), 'Work & Business', 'Employment-based visas and investment opportunities in the USA.', 1, 1, GETDATE(), GETDATE()),
(NEWID(), 'Family & Marriage', 'Visas for spouses, children, and other family members.', 2, 1, GETDATE(), GETDATE()),
(NEWID(), 'Students & Visitors', 'Temporary visas for education and travel.', 3, 1, GETDATE(), GETDATE()),
(NEWID(), 'Special Categories', 'Extraordinary ability, diversity lottery, and other special programs.', 4, 1, GETDATE(), GETDATE());

-- Get IDs
DECLARE @WorkId UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM VisaLibraryTiles WHERE Name = 'Work & Business');
DECLARE @FamilyId UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM VisaLibraryTiles WHERE Name = 'Family & Marriage');
DECLARE @EduId UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM VisaLibraryTiles WHERE Name = 'Students & Visitors');
DECLARE @SpecialId UNIQUEIDENTIFIER = (SELECT TOP 1 Id FROM VisaLibraryTiles WHERE Name = 'Special Categories');

-- Get VisaType IDs from existing records
DECLARE @B1Id INT = (SELECT Id FROM VisaTypes WHERE Code = 'B-1');
DECLARE @B2Id INT = (SELECT Id FROM VisaTypes WHERE Code = 'B-2');
DECLARE @F1Id INT = (SELECT Id FROM VisaTypes WHERE Code = 'F-1');
DECLARE @H1BId INT = (SELECT Id FROM VisaTypes WHERE Code = 'H-1B');
DECLARE @L1Id INT = (SELECT Id FROM VisaTypes WHERE Code = 'L-1');
DECLARE @O1Id INT = (SELECT Id FROM VisaTypes WHERE Code = 'O-1');
DECLARE @E2Id INT = (SELECT Id FROM VisaTypes WHERE Code = 'E-2');
DECLARE @EB5Id INT = (SELECT Id FROM VisaTypes WHERE Code = 'EB-5');

-- Insert Mappings
-- Work & Business
IF @H1BId IS NOT NULL INSERT INTO VisaLibraryTileMappings (Id, TileId, VisaTypeId, DisplayOrder, CreatedAt) VALUES (NEWID(), @WorkId, @H1BId, 1, GETDATE());
IF @L1Id IS NOT NULL INSERT INTO VisaLibraryTileMappings (Id, TileId, VisaTypeId, DisplayOrder, CreatedAt) VALUES (NEWID(), @WorkId, @L1Id, 2, GETDATE());
IF @E2Id IS NOT NULL INSERT INTO VisaLibraryTileMappings (Id, TileId, VisaTypeId, DisplayOrder, CreatedAt) VALUES (NEWID(), @WorkId, @E2Id, 3, GETDATE());
IF @EB5Id IS NOT NULL INSERT INTO VisaLibraryTileMappings (Id, TileId, VisaTypeId, DisplayOrder, CreatedAt) VALUES (NEWID(), @WorkId, @EB5Id, 4, GETDATE());

-- Special
IF @O1Id IS NOT NULL INSERT INTO VisaLibraryTileMappings (Id, TileId, VisaTypeId, DisplayOrder, CreatedAt) VALUES (NEWID(), @SpecialId, @O1Id, 1, GETDATE());

-- Students & Visitors
IF @F1Id IS NOT NULL INSERT INTO VisaLibraryTileMappings (Id, TileId, VisaTypeId, DisplayOrder, CreatedAt) VALUES (NEWID(), @EduId, @F1Id, 1, GETDATE());
IF @B1Id IS NOT NULL INSERT INTO VisaLibraryTileMappings (Id, TileId, VisaTypeId, DisplayOrder, CreatedAt) VALUES (NEWID(), @EduId, @B1Id, 2, GETDATE());
IF @B2Id IS NOT NULL INSERT INTO VisaLibraryTileMappings (Id, TileId, VisaTypeId, DisplayOrder, CreatedAt) VALUES (NEWID(), @EduId, @B2Id, 3, GETDATE());

GO
