-- Add citizenship and naturalization visa types to the VisaTypes table
-- This script should be run after the database is created

-- Insert N-400 (Application for Naturalization)
IF NOT EXISTS (SELECT 1 FROM VisaTypes WHERE Code = 'N-400')
BEGIN
    INSERT INTO VisaTypes (Id, Code, Name, Description, IsActive, CreatedAt, UpdatedAt)
    VALUES (
        NEWID(),
        'N-400',
        'Application for Naturalization',
        'Application for naturalization to become a U.S. citizen for permanent residents who meet eligibility requirements.',
        1,
        GETUTCDATE(),
        GETUTCDATE()
    );
END

-- Insert N-600 (Application for Certificate of Citizenship)
IF NOT EXISTS (SELECT 1 FROM VisaTypes WHERE Code = 'N-600')
BEGIN
    INSERT INTO VisaTypes (Id, Code, Name, Description, IsActive, CreatedAt, UpdatedAt)
    VALUES (
        NEWID(),
        'N-600',
        'Application for Certificate of Citizenship',
        'Application for certificate of citizenship for individuals who derived or acquired U.S. citizenship through their parents.',
        1,
        GETUTCDATE(),
        GETUTCDATE()
    );
END

-- Insert N-600K (Application for Citizenship and Issuance of Certificate for Adopted Child)
IF NOT EXISTS (SELECT 1 FROM VisaTypes WHERE Code = 'N-600K')
BEGIN
    INSERT INTO VisaTypes (Id, Code, Name, Description, IsActive, CreatedAt, UpdatedAt)
    VALUES (
        NEWID(),
        'N-600K',
        'Application for Citizenship for Adopted Child',
        'Application for citizenship and issuance of certificate for children adopted by U.S. citizens.',
        1,
        GETUTCDATE(),
        GETUTCDATE()
    );
END

PRINT 'Citizenship visa types added successfully.';