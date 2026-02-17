UPDATE Users
SET Email = 'dcann@cannlaw.com',
    FirstName = 'Diana',
    LastName = 'Cann',
    IsAdmin = 1,
    IsActive = 1
WHERE Email = 'admin@cannlaw.com';

SELECT Email, IsAdmin, FirstName, LastName FROM Users;
GO
