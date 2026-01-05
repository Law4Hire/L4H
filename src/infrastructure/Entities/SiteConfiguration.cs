using System.ComponentModel.DataAnnotations;

namespace L4H.Infrastructure.Entities;

public class SiteConfiguration
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string FirmName { get; set; } = string.Empty;
    
    [MaxLength(255)]
    public string ManagingAttorney { get; set; } = string.Empty;
    
    [MaxLength(50)]
    public string PrimaryPhone { get; set; } = string.Empty;

    [MaxLength(50)]
    public string CorporatePhone { get; set; } = string.Empty;
    
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string PrimaryFocusStatement { get; set; } = string.Empty;
    
    public string Locations { get; set; } = string.Empty; // JSON array
    public string SocialMediaPlatforms { get; set; } = string.Empty; // JSON array
    public string UniqueSellingPoints { get; set; } = string.Empty; // JSON array
    
    [MaxLength(500)]
    public string LogoUrl { get; set; } = string.Empty;

    // Exchange / Microsoft Graph settings
    [MaxLength(100)]
    public string? ExchangeTenantId { get; set; }
    [MaxLength(100)]
    public string? ExchangeClientId { get; set; }
    [MaxLength(500)]
    public string? ExchangeClientSecret { get; set; }
    [MaxLength(255)]
    public string? ExchangeSystemEmail { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}