using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Services;
using System.Text.Json;
using System.Security.Claims;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/attorneys")]
[Tags("Attorneys")]
public class AttorneysController : ControllerBase
{
    private readonly L4HDbContext _context;
    private readonly IFileUploadService _fileUploadService;
    private readonly ILogger<AttorneysController> _logger;

    public AttorneysController(L4HDbContext context, IFileUploadService fileUploadService, ILogger<AttorneysController> logger)
    {
        _context = context;
        _fileUploadService = fileUploadService;
        _logger = logger;
    }

    /// <summary>
    /// Force re-seed of attorney data (Maintenance)
    /// </summary>
    [HttpPost("force-seed")]
    [AllowAnonymous] // Temporary for fixing the environment
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> ForceSeedAttorneys()
    {
        try
        {
            // 1. Clear existing attorneys if they don't have dependencies
            var attorneys = await _context.Attorneys
                .Include(a => a.AssignedClients)
                .Include(a => a.TimeEntries)
                .ToListAsync();

            foreach (var attorney in attorneys)
            {
                if (!attorney.AssignedClients.Any() && !attorney.TimeEntries.Any())
                {
                    _context.Attorneys.Remove(attorney);
                }
                else
                {
                    attorney.IsActive = false;
                }
            }
            await _context.SaveChangesAsync();

            // 2. Add Real Attorneys
            await InitializeDefaultAttorney();

            return Ok(new { message = "Attorneys successfully re-seeded" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error force seeding attorneys");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get all active attorneys
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(Attorney[]), StatusCodes.Status200OK)]
    public async Task<ActionResult<Attorney[]>> GetAttorneys()
    {
        try
        {
            var attorneys = await _context.Attorneys
                .Where(a => a.IsActive)
                .Where(a => a.Name != "Sarah Johnson" && a.Name != "Michael Chen" && a.Name != "Maria Rodriguez")
                .OrderBy(a => a.DisplayOrder)
                .ThenBy(a => a.Name)
                .ToArrayAsync()
                .ConfigureAwait(false);

            if (!attorneys.Any())
            {
                // Initialize with default attorneys if none exists
                await InitializeDefaultAttorney();
                attorneys = await _context.Attorneys
                    .Where(a => a.IsActive)
                    .Where(a => a.Name != "Sarah Johnson" && a.Name != "Michael Chen" && a.Name != "Maria Rodriguez")
                    .OrderBy(a => a.DisplayOrder)
                    .ThenBy(a => a.Name)
                    .ToArrayAsync()
                    .ConfigureAwait(false);
            }

            return Ok(attorneys);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting attorneys: {Message}", ex.Message);
            // Return detailed error in development/debugging
            return StatusCode(500, new { 
                message = "Database error retrieving attorneys", 
                error = ex.Message,
                stackTrace = ex.StackTrace 
            });
        }
    }

    /// <summary>
    /// Get the current legal professional's attorney profile
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<Attorney>> GetMyProfile()
    {
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        if (string.IsNullOrEmpty(email)) return Unauthorized();

        var attorney = await _context.Attorneys
            .FirstOrDefaultAsync(a => a.Email.Equals(email, StringComparison.OrdinalIgnoreCase))
            .ConfigureAwait(false);

        if (attorney == null) return NotFound("Attorney profile not found for this user.");

        return Ok(attorney);
    }

    /// <summary>
    /// Update the current legal professional's attorney profile
    /// </summary>
    [HttpPut("me")]
    [Authorize]
    public async Task<ActionResult> UpdateMyProfile([FromBody] AttorneyUpdateDto request)
    {
        var email = User.FindFirst(ClaimTypes.Email)?.Value;
        if (string.IsNullOrEmpty(email)) return Unauthorized();

        var attorney = await _context.Attorneys
            .FirstOrDefaultAsync(a => a.Email.Equals(email, StringComparison.OrdinalIgnoreCase))
            .ConfigureAwait(false);

        if (attorney == null) return NotFound("Attorney profile not found.");

        // Allow updating specific fields
        attorney.Bio = request.Bio ?? attorney.Bio;
        attorney.Title = request.Title ?? attorney.Title;
        attorney.Phone = request.Phone ?? attorney.Phone;
        attorney.DirectPhone = request.DirectPhone ?? attorney.DirectPhone;
        attorney.DirectEmail = request.DirectEmail ?? attorney.DirectEmail;
        attorney.OfficeLocation = request.OfficeLocation ?? attorney.OfficeLocation;
        
        if (!string.IsNullOrWhiteSpace(request.PhotoUrl))
        {
            if (Uri.TryCreate(request.PhotoUrl, UriKind.RelativeOrAbsolute, out var uri))
            {
                attorney.PhotoUrl = uri;
            }
        }

        attorney.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync().ConfigureAwait(false);

        return Ok(attorney);
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
    [Authorize]
    public async Task<ActionResult> UploadAttorneyPhoto(int id, IFormFile photo)
    {
        var attorney = await _context.Attorneys
            .FirstOrDefaultAsync(a => a.Id == id)
            .ConfigureAwait(false);

        if (attorney == null)
        {
            return NotFound();
        }

        // Access check: Admin or the attorney themselves (by email)
        var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
        var isAdmin = User.HasClaim("is_admin", "True") || User.IsInRole("Admin");
        
        if (!isAdmin && !attorney.Email.Equals(userEmail, StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
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
            if (attorney.PhotoUrl != null)
            {
                await _fileUploadService.DeleteFileAsync(attorney.PhotoUrl.ToString());
            }

            // Upload new photo
            var photoUrl = await _fileUploadService.UploadAttorneyPhotoAsync(photo, attorney.Name);
            
            // Update attorney record
            attorney.PhotoUrl = new Uri(photoUrl, UriKind.RelativeOrAbsolute);
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
    public async Task<ActionResult> DeleteAttorneyPhoto(int id)
    {
        var attorney = await _context.Attorneys
            .FirstOrDefaultAsync(a => a.Id == id)
            .ConfigureAwait(false);

        if (attorney == null)
        {
            return NotFound();
        }

        if (attorney.PhotoUrl != null)
        {
            await _fileUploadService.DeleteFileAsync(attorney.PhotoUrl.ToString());
            attorney.PhotoUrl = null;
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
        if (attorney.PhotoUrl != null)
        {
            await _fileUploadService.DeleteFileAsync(attorney.PhotoUrl.ToString());
        }

        _context.Attorneys.Remove(attorney);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        return Ok();
    }

    /// <summary>
    /// Deactivate an attorney profile (Admin only)
    /// </summary>
    [HttpPost("{id}/deactivate")]
    [Authorize(Policy = "IsAdmin")]
    public async Task<ActionResult> DeactivateAttorney(int id)
    {
        var attorney = await _context.Attorneys.FindAsync(id);
        if (attorney == null)
        {
            return NotFound();
        }

        attorney.IsActive = false;
        attorney.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync().ConfigureAwait(false);

        return Ok();
    }

    private async Task InitializeDefaultAttorney()
    {
        // Check for Denise first to avoid duplicates
        var exists = await _context.Attorneys.AnyAsync(a => a.Email == "dcann@cannlaw.com");
        if (exists) return;

        var attorneys = new[]
        {
            new Attorney
            {
                Name = "Denise S. Cann",
                Title = "Founder and Managing Attorney",
                Bio = "Denise S. Cann is the founder and managing attorney for Cann Legal Group. She has been practicing immigration law since 1998. Ms. Cann received her Juris Doctor degree from the University of Baltimore School of Law. She is a member of the American Immigration Lawyers Association (AILA).",
                Email = "dcann@cannlaw.com",
                Phone = "(410) 783-1888",
                DirectPhone = "",
                DirectEmail = "dcann@cannlaw.com",
                OfficeLocation = "Baltimore Office",
                DefaultHourlyRate = 450.00m,
                IsActive = true,
                IsManagingAttorney = true,
                DisplayOrder = 1,
                Credentials = "[\"J.D. University of Baltimore School of Law\", \"Member of AILA\"]",
                PracticeAreas = "[\"Employment Immigration\", \"Family Immigration\", \"Deportation Defense\"]",
                Languages = "[\"English\"]",
                PhotoUrl = new Uri("/images/attorneys/denise.jpg", UriKind.Relative)
            },
            new Attorney
            {
                Name = "Angela Taylor",
                Title = "Senior Attorney",
                Bio = "Angela Taylor represents clients in all aspects of immigration law, including family-based petitions, naturalization, and removal defense. She is dedicated to providing compassionate and effective legal representation.",
                Email = "ataylor@cannlaw.com",
                Phone = "(410) 783-1888",
                DirectPhone = "",
                DirectEmail = "",
                OfficeLocation = "Baltimore Office",
                DefaultHourlyRate = 350.00m,
                IsActive = true,
                IsManagingAttorney = false,
                DisplayOrder = 2,
                Credentials = "[\"J.D.\", \"Member of State Bar\"]",
                PracticeAreas = "[\"Family Immigration\", \"Removal Defense\"]",
                Languages = "[\"English\"]",
                PhotoUrl = new Uri("/images/attorneys/angela.jpg", UriKind.Relative)
            },
            new Attorney
            {
                Name = "John Charles",
                Title = "Director of Marketing and Business Development",
                Bio = "John Charles serves as the Director of Marketing and Business Development. He plays a key role in the firm's outreach and client relations strategies.",
                Email = "jcharles@cannlaw.com",
                Phone = "(410) 783-1888",
                DirectPhone = "",
                DirectEmail = "",
                OfficeLocation = "Baltimore Office",
                DefaultHourlyRate = 0.00m,
                IsActive = true,
                IsManagingAttorney = false,
                DisplayOrder = 3,
                Credentials = "[]",
                PracticeAreas = "[\"Business Development\", \"Marketing\"]",
                Languages = "[\"English\"]",
                PhotoUrl = null
            },
            new Attorney
            {
                Name = "Alex Shu",
                Title = "Attorney",
                Bio = "Alex Shu is an experienced attorney handling various immigration matters. He is committed to helping clients achieve their immigration goals.",
                Email = "ashu@cannlaw.com",
                Phone = "(410) 783-1888",
                DirectPhone = "",
                DirectEmail = "",
                OfficeLocation = "Baltimore Office",
                DefaultHourlyRate = 300.00m,
                IsActive = true,
                IsManagingAttorney = false,
                DisplayOrder = 4,
                Credentials = "[\"J.D.\", \"Member of State Bar\"]",
                PracticeAreas = "[\"Immigration Law\"]",
                Languages = "[\"English\"]",
                PhotoUrl = new Uri("/images/attorneys/alex.jpg", UriKind.Relative)
            },
            new Attorney
            {
                Name = "Janice Lin",
                Title = "Attorney",
                Bio = "Janice Lin focuses her practice on employment-based and family-based immigration. She works closely with clients to navigate the complex immigration system.",
                Email = "jlin@cannlaw.com",
                Phone = "(410) 783-1888",
                DirectPhone = "",
                DirectEmail = "",
                OfficeLocation = "Baltimore Office",
                DefaultHourlyRate = 300.00m,
                IsActive = true,
                IsManagingAttorney = false,
                DisplayOrder = 5,
                Credentials = "[\"J.D.\", \"Member of State Bar\"]",
                PracticeAreas = "[\"Employment Immigration\", \"Family Immigration\"]",
                Languages = "[\"English\", \"Mandarin\"]",
                PhotoUrl = new Uri("/images/attorneys/janice.jpg", UriKind.Relative)
            },
            new Attorney
            {
                Name = "Chika Okala",
                Title = "Attorney",
                Bio = "Chika Okala provides legal counsel in immigration law, assisting clients with visa applications and compliance issues.",
                Email = "cokala@cannlaw.com",
                Phone = "(410) 783-1888",
                DirectPhone = "",
                DirectEmail = "",
                OfficeLocation = "Baltimore Office",
                DefaultHourlyRate = 300.00m,
                IsActive = true,
                IsManagingAttorney = false,
                DisplayOrder = 6,
                Credentials = "[\"J.D.\", \"Member of State Bar\"]",
                PracticeAreas = "[\"Immigration Law\"]",
                Languages = "[\"English\"]",
                PhotoUrl = new Uri("/images/attorneys/chika.jpg", UriKind.Relative)
            },
            new Attorney
            {
                Name = "Wen Lee",
                Title = "Attorney",
                Bio = "Wen Lee specializes in business immigration, helping companies and individuals with work visas and green cards.",
                Email = "wlee@cannlaw.com",
                Phone = "(410) 783-1888",
                DirectPhone = "",
                DirectEmail = "",
                OfficeLocation = "Baltimore Office",
                DefaultHourlyRate = 300.00m,
                IsActive = true,
                IsManagingAttorney = false,
                DisplayOrder = 7,
                Credentials = "[\"J.D.\", \"Member of State Bar\"]",
                PracticeAreas = "[\"Business Immigration\"]",
                Languages = "[\"English\", \"Mandarin\"]",
                PhotoUrl = null
            },
            new Attorney
            {
                Name = "Katherine J. Wong",
                Title = "Attorney",
                Bio = "Katherine J. Wong handles a wide range of immigration cases. She is dedicated to providing personalized legal services to her clients.",
                Email = "kwong@cannlaw.com",
                Phone = "(410) 783-1888",
                DirectPhone = "",
                DirectEmail = "",
                OfficeLocation = "Baltimore Office",
                DefaultHourlyRate = 300.00m,
                IsActive = true,
                IsManagingAttorney = false,
                DisplayOrder = 8,
                Credentials = "[\"J.D.\", \"Member of State Bar\"]",
                PracticeAreas = "[\"Immigration Law\"]",
                Languages = "[\"English\"]",
                PhotoUrl = null
            }
        };

        _context.Attorneys.AddRange(attorneys);
        await _context.SaveChangesAsync().ConfigureAwait(false);
    }
}

public class AttorneyUpdateDto
{
    public string? Title { get; set; }
    public string? Bio { get; set; }
    public string? PhotoUrl { get; set; }
    public string? Phone { get; set; }
    public string? DirectPhone { get; set; }
    public string? DirectEmail { get; set; }
    public string? OfficeLocation { get; set; }
}