using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Services;
using System.Text.Json;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/attorneys")]
[Tags("Attorneys")]
public class AttorneysController : ControllerBase
{
    private readonly L4HDbContext _context;
    private readonly IFileUploadService _fileUploadService;

    public AttorneysController(L4HDbContext context, IFileUploadService fileUploadService)
    {
        _context = context;
        _fileUploadService = fileUploadService;
    }

    /// <summary>
    /// Get all active attorneys
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(Attorney[]), StatusCodes.Status200OK)]
    public async Task<ActionResult<Attorney[]>> GetAttorneys()
    {
        var attorneys = await _context.Attorneys
            .Where(a => a.IsActive)
            .OrderBy(a => a.DisplayOrder)
            .ThenBy(a => a.Name)
            .ToArrayAsync()
            .ConfigureAwait(false);

        if (!attorneys.Any())
        {
            // Initialize with default attorney if none exists
            await InitializeDefaultAttorney();
            attorneys = await _context.Attorneys
                .Where(a => a.IsActive)
                .OrderBy(a => a.DisplayOrder)
                .ThenBy(a => a.Name)
                .ToArrayAsync()
                .ConfigureAwait(false);
        }

        return Ok(attorneys);
    }

    /// <summary>
    /// Get a specific attorney by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(Attorney), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Attorney>> GetAttorney(int id)
    {
        var attorney = await _context.Attorneys
            .FirstOrDefaultAsync(a => a.Id == id && a.IsActive)
            .ConfigureAwait(false);

        if (attorney == null)
        {
            return NotFound();
        }

        return Ok(attorney);
    }

    /// <summary>
    /// Create a new attorney profile (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "IsAdmin")]
    [ProducesResponseType(typeof(Attorney), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<Attorney>> CreateAttorney([FromBody] Attorney attorney)
    {
        attorney.CreatedAt = DateTime.UtcNow;
        attorney.UpdatedAt = DateTime.UtcNow;

        _context.Attorneys.Add(attorney);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        return CreatedAtAction(nameof(GetAttorney), new { id = attorney.Id }, attorney);
    }

    /// <summary>
    /// Update an attorney profile (Admin only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Policy = "IsAdmin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> UpdateAttorney(int id, [FromBody] Attorney attorney)
    {
        var existingAttorney = await _context.Attorneys
            .FirstOrDefaultAsync(a => a.Id == id)
            .ConfigureAwait(false);

        if (existingAttorney == null)
        {
            return NotFound();
        }

        existingAttorney.Name = attorney.Name;
        existingAttorney.Title = attorney.Title;
        existingAttorney.Bio = attorney.Bio;
        existingAttorney.PhotoUrl = attorney.PhotoUrl;
        existingAttorney.Email = attorney.Email;
        existingAttorney.Phone = attorney.Phone;
        existingAttorney.DirectPhone = attorney.DirectPhone;
        existingAttorney.DirectEmail = attorney.DirectEmail;
        existingAttorney.OfficeLocation = attorney.OfficeLocation;
        existingAttorney.DefaultHourlyRate = attorney.DefaultHourlyRate;
        existingAttorney.Credentials = attorney.Credentials;
        existingAttorney.PracticeAreas = attorney.PracticeAreas;
        existingAttorney.Languages = attorney.Languages;
        existingAttorney.IsActive = attorney.IsActive;
        existingAttorney.IsManagingAttorney = attorney.IsManagingAttorney;
        existingAttorney.DisplayOrder = attorney.DisplayOrder;
        existingAttorney.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);
        return Ok();
    }

    /// <summary>
    /// Upload attorney photo (Admin only)
    /// </summary>
    [HttpPost("{id}/photo")]
    [Authorize(Policy = "IsAdmin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> UploadAttorneyPhoto(int id, IFormFile photo)
    {
        var attorney = await _context.Attorneys
            .FirstOrDefaultAsync(a => a.Id == id)
            .ConfigureAwait(false);

        if (attorney == null)
        {
            return NotFound();
        }

        if (photo == null || photo.Length == 0)
        {
            return BadRequest("No photo file provided");
        }

        if (!_fileUploadService.IsValidImageFile(photo))
        {
            return BadRequest("Invalid image file. Please upload JPG, PNG, or WebP files under 5MB");
        }

        try
        {
            // Delete old photo if exists
            if (!string.IsNullOrEmpty(attorney.PhotoUrl))
            {
                await _fileUploadService.DeleteFileAsync(attorney.PhotoUrl);
            }

            // Upload new photo
            var photoUrl = await _fileUploadService.UploadAttorneyPhotoAsync(photo, attorney.Name);
            
            // Update attorney record
            attorney.PhotoUrl = photoUrl;
            attorney.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync().ConfigureAwait(false);

            return Ok(new { photoUrl });
        }
        catch (Exception ex)
        {
            return BadRequest($"Failed to upload photo: {ex.Message}");
        }
    }

    /// <summary>
    /// Delete attorney photo (Admin only)
    /// </summary>
    [HttpDelete("{id}/photo")]
    [Authorize(Policy = "IsAdmin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> DeleteAttorneyPhoto(int id)
    {
        var attorney = await _context.Attorneys
            .FirstOrDefaultAsync(a => a.Id == id)
            .ConfigureAwait(false);

        if (attorney == null)
        {
            return NotFound();
        }

        if (!string.IsNullOrEmpty(attorney.PhotoUrl))
        {
            await _fileUploadService.DeleteFileAsync(attorney.PhotoUrl);
            attorney.PhotoUrl = string.Empty;
            attorney.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync().ConfigureAwait(false);
        }

        return Ok();
    }

    /// <summary>
    /// Delete an attorney profile (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Policy = "IsAdmin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> DeleteAttorney(int id)
    {
        var attorney = await _context.Attorneys
            .Include(a => a.AssignedClients)
            .FirstOrDefaultAsync(a => a.Id == id)
            .ConfigureAwait(false);

        if (attorney == null)
        {
            return NotFound();
        }

        // Check if attorney has assigned clients
        if (attorney.AssignedClients.Any())
        {
            return BadRequest("Cannot delete attorney with assigned clients. Please reassign clients first.");
        }

        // Delete attorney photo if exists
        if (!string.IsNullOrEmpty(attorney.PhotoUrl))
        {
            await _fileUploadService.DeleteFileAsync(attorney.PhotoUrl);
        }

        _context.Attorneys.Remove(attorney);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        return Ok();
    }

    private async Task InitializeDefaultAttorney()
    {
        var credentials = JsonSerializer.Serialize(new[]
        {
            "Licensed to practice law in Maryland",
            "Licensed to practice law in West Virginia",
            "Member of American Immigration Lawyers Association (AILA)"
        });

        var practiceAreas = JsonSerializer.Serialize(new[]
        {
            "Family-Based Immigration",
            "Employment & Investment Immigration",
            "Waivers & Criminal Issues"
        });

        var languages = JsonSerializer.Serialize(new[]
        {
            "English",
            "Mandarin Chinese"
        });

        var attorney = new Attorney
        {
            Name = "Denise S. Cann",
            Title = "Managing Attorney",
            Bio = "Denise S. Cann is the managing attorney at Cann Legal Group, specializing in comprehensive immigration law with offices in the United States and Taiwan. With extensive experience in family-based immigration, employment visas, and complex waiver cases, she provides fast, efficient, and convenient legal representation from stateside through consular processing.",
            Email = "dcann@cannlaw.com",
            Phone = "(410) 783-1888",
            Credentials = credentials,
            PracticeAreas = practiceAreas,
            Languages = languages,
            IsActive = true,
            IsManagingAttorney = true,
            DisplayOrder = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Attorneys.Add(attorney);
        await _context.SaveChangesAsync().ConfigureAwait(false);
    }
}