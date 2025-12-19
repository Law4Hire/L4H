
USE L4H;
GO

-- Clear existing attorneys
DELETE FROM Attorneys;
GO

-- Insert real attorneys
INSERT INTO Attorneys (Name, Title, Bio, Email, Phone, DirectPhone, DirectEmail, OfficeLocation, DefaultHourlyRate, IsActive, IsManagingAttorney, DisplayOrder, Credentials, PracticeAreas, Languages, PhotoUrl, CreatedAt, UpdatedAt)
VALUES 
('Denise S. Cann', 'Founder and Managing Attorney', 'Denise S. Cann is the founder and managing attorney for Cann Legal Group. She has been practicing immigration law since 1998. Ms. Cann received her Juris Doctor degree from the University of Baltimore School of Law. She is a member of the American Immigration Lawyers Association (AILA).', 'dcann@cannlaw.com', '(410) 783-1888', '', 'dcann@cannlaw.com', 'Baltimore Office', 450.00, 1, 1, 1, '["J.D. University of Baltimore School of Law", "Member of AILA"]', '["Employment Immigration", "Family Immigration", "Deportation Defense"]', '["English"]', 'https://cannlaw.com/images/denise.jpg', GETDATE(), GETDATE()),

('Angela Taylor', 'Senior Attorney', 'Angela Taylor represents clients in all aspects of immigration law, including family-based petitions, naturalization, and removal defense. She is dedicated to providing compassionate and effective legal representation.', 'ataylor@cannlaw.com', '(410) 783-1888', '', '', 'Baltimore Office', 350.00, 1, 0, 2, '["J.D.", "Member of State Bar"]', '["Family Immigration", "Removal Defense"]', '["English"]', NULL, GETDATE(), GETDATE()),

('John Charles', 'Director of Marketing and Business Development', 'John Charles serves as the Director of Marketing and Business Development. He plays a key role in the firm''s outreach and client relations strategies.', 'jcharles@cannlaw.com', '(410) 783-1888', '', '', 'Baltimore Office', 0.00, 1, 0, 3, '[]', '["Business Development", "Marketing"]', '["English"]', NULL, GETDATE(), GETDATE()),

('Alex Shu', 'Attorney', 'Alex Shu is an experienced attorney handling various immigration matters. He is committed to helping clients achieve their immigration goals.', 'ashu@cannlaw.com', '(410) 783-1888', '', '', 'Baltimore Office', 300.00, 1, 0, 4, '["J.D.", "Member of State Bar"]', '["Immigration Law"]', '["English"]', NULL, GETDATE(), GETDATE()),

('Janice Lin', 'Attorney', 'Janice Lin focuses her practice on employment-based and family-based immigration. She works closely with clients to navigate the complex immigration system.', 'jlin@cannlaw.com', '(410) 783-1888', '', '', 'Baltimore Office', 300.00, 1, 0, 5, '["J.D.", "Member of State Bar"]', '["Employment Immigration", "Family Immigration"]', '["English", "Mandarin"]', NULL, GETDATE(), GETDATE()),

('Chika Okala', 'Attorney', 'Chika Okala provides legal counsel in immigration law, assisting clients with visa applications and compliance issues.', 'cokala@cannlaw.com', '(410) 783-1888', '', '', 'Baltimore Office', 300.00, 1, 0, 6, '["J.D.", "Member of State Bar"]', '["Immigration Law"]', '["English"]', NULL, GETDATE(), GETDATE()),

('Wen Lee', 'Attorney', 'Wen Lee specializes in business immigration, helping companies and individuals with work visas and green cards.', 'wlee@cannlaw.com', '(410) 783-1888', '', '', 'Baltimore Office', 300.00, 1, 0, 7, '["J.D.", "Member of State Bar"]', '["Business Immigration"]', '["English", "Mandarin"]', NULL, GETDATE(), GETDATE()),

('Katherine J. Wong', 'Attorney', 'Katherine J. Wong handles a wide range of immigration cases. She is dedicated to providing personalized legal services to her clients.', 'kwong@cannlaw.com', '(410) 783-1888', '', '', 'Baltimore Office', 300.00, 1, 0, 8, '["J.D.", "Member of State Bar"]', '["Immigration Law"]', '["English"]', NULL, GETDATE(), GETDATE());
GO
