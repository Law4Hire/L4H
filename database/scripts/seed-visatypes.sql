USE L4H;

-- Insert basic visa types
INSERT INTO VisaTypes (Code, Name, IsActive) VALUES ('B-1', 'B-1 Business Visitor', 1);
INSERT INTO VisaTypes (Code, Name, IsActive) VALUES ('B-2', 'B-2 Tourist Visitor', 1);
INSERT INTO VisaTypes (Code, Name, IsActive) VALUES ('F-1', 'F-1 Student', 1);
INSERT INTO VisaTypes (Code, Name, IsActive) VALUES ('H-1B', 'H-1B Specialty Occupation', 1);
INSERT INTO VisaTypes (Code, Name, IsActive) VALUES ('L-1', 'L-1 Intracompany Transfer', 1);
INSERT INTO VisaTypes (Code, Name, IsActive) VALUES ('O-1', 'O-1 Extraordinary Ability', 1);
INSERT INTO VisaTypes (Code, Name, IsActive) VALUES ('E-2', 'E-2 Treaty Investor', 1);
INSERT INTO VisaTypes (Code, Name, IsActive) VALUES ('EB-5', 'EB-5 Immigrant Investor', 1);

SELECT COUNT(*) AS 'Total VisaTypes' FROM VisaTypes;
