using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using System.Text.Json;

namespace L4H.Api.Controllers;

[ApiController]
[Route("v1/site-config")]
[Tags("Site Configuration")]
public class SiteConfigurationController : ControllerBase
{
    private readonly L4HDbContext _context;

    public SiteConfigurationController(L4HDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get the current site configuration
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(SiteConfiguration), StatusCodes.Status200OK)]
    public async Task<ActionResult<SiteConfiguration>> GetSiteConfiguration()
    {
        var config = await _context.SiteConfigurations
            .FirstOrDefaultAsync()
            .ConfigureAwait(false);

        if (config == null)
        {
            // Return default configuration if none exists
            config = GetDefaultConfiguration();
        }

        return Ok(config);
    }

    /// <summary>
    /// Update site configuration (Admin only)
    /// </summary>
    [HttpPut]
    [Authorize(Policy = "IsAdmin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> UpdateSiteConfiguration([FromBody] SiteConfiguration config)
    {
        var existingConfig = await _context.SiteConfigurations
            .FirstOrDefaultAsync()
            .ConfigureAwait(false);

        if (existingConfig == null)
        {
            config.CreatedAt = DateTime.UtcNow;
            config.UpdatedAt = DateTime.UtcNow;
            _context.SiteConfigurations.Add(config);
        }
        else
        {
            existingConfig.FirmName = config.FirmName;
            existingConfig.ManagingAttorney = config.ManagingAttorney;
            existingConfig.PrimaryPhone = config.PrimaryPhone;
            existingConfig.Email = config.Email;
            existingConfig.PrimaryFocusStatement = config.PrimaryFocusStatement;
            existingConfig.Locations = config.Locations;
            existingConfig.SocialMediaPlatforms = config.SocialMediaPlatforms;
            existingConfig.UniqueSellingPoints = config.UniqueSellingPoints;
            existingConfig.LogoUrl = config.LogoUrl;
            existingConfig.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync().ConfigureAwait(false);
        return Ok();
    }

    private static SiteConfiguration GetDefaultConfiguration()
    {
        var locations = JsonSerializer.Serialize(new object[]
        {
            new { city = "Baltimore, Maryland", type = "Primary" },
            new { city = "Martinsburg, West Virginia", zip = "25403", type = "USA Office" },
            new { city = "Taichung, Taiwan", address = "42 Datong Jie, 7th Floor", type = "International Office" }
        });

        var socialMedia = JsonSerializer.Serialize(new[]
        {
            "Facebook",
            "WhatsApp!",
            "LINE",
            "SKYPE: cannlegalgroup"
        });

        var sellingPoints = JsonSerializer.Serialize(new[]
        {
            "24/7 Round-the-Clock Support",
            "Direct Online Client Access to case status, attorneys, and checklists"
        });

        return new SiteConfiguration
        {
            FirmName = "Cann Legal Group",
            ManagingAttorney = "Denise S. Cann",
            PrimaryPhone = "(410) 783-1888",
            Email = "information@cannlaw.com",
            PrimaryFocusStatement = "Fast, efficient, and convenient. Comprehensive representation from state side through consular processing.",
            Locations = locations,
            SocialMediaPlatforms = socialMedia,
            UniqueSellingPoints = sellingPoints,
            LogoUrl = "",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }
}