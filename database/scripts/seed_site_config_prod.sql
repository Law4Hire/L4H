USE L4H;
GO

DELETE FROM SiteConfigurations;
GO

INSERT INTO SiteConfigurations (FirmName, ManagingAttorney, PrimaryPhone, Email, PrimaryFocusStatement, Locations, SocialMediaPlatforms, UniqueSellingPoints, LogoUrl, CreatedAt, UpdatedAt)
VALUES (
    'Cann Legal Group', 
    'Denise S. Cann', 
    '(410) 988-0123', 
    'information@cannlaw.com', 
    'Fast, efficient, and convenient. Comprehensive representation from state side through consular processing.', 
    '[{"city": "Baltimore, Maryland", "type": "Primary"}, {"city": "Martinsburg, West Virginia", "zip": "25403", "type": "USA Office"}, {"city": "Taichung, Taiwan", "address": "42 Datong Jie, 7th Floor", "type": "International Office"}]', 
    '["Facebook", "Twitter", "WhatsApp!", "LINE", "SKYPE"]', 
    '["24/7 Round-the-Clock Support", "Direct Online Client Access to case status, attorneys, and checklists"]',
    'https://cannlaw.com/images/logo.gif',
    GETDATE(),
    GETDATE()
);
GO
