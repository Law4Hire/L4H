using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using System.Globalization;
using System.Text.Json;

namespace L4H.Api.Controllers;

[ApiController]
[Route("v1/approved-doctors")]
[Tags("Approved Doctors")]
public class ApprovedDoctorsController : ControllerBase
{
    private readonly L4HDbContext _context;
    private readonly IStringLocalizer<Shared> _localizer;
    private readonly ILogger<ApprovedDoctorsController> _logger;

    public ApprovedDoctorsController(
        L4HDbContext context,
        IStringLocalizer<Shared> localizer,
        ILogger<ApprovedDoctorsController> logger)
    {
        _context = context;
        _localizer = localizer;
        _logger = logger;
    }

    /// <summary>
    /// Get approved doctors for specific country codes
    /// </summary>
    /// <param name="countryCodes">Comma-separated country codes (e.g., "US,CA" or "ES")</param>
    /// <returns>List of approved doctors</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ApprovedDoctorResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IEnumerable<ApprovedDoctorResponse>>> GetApprovedDoctors(
        [FromQuery] string countryCodes)
    {
        if (string.IsNullOrWhiteSpace(countryCodes))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Missing Parameters",
                Detail = "Country codes parameter is required"
            });
        }

        // Parse country codes
        var codes = countryCodes.Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(c => c.Trim().ToUpper(CultureInfo.InvariantCulture))
            .Where(c => !string.IsNullOrEmpty(c))
            .ToArray();

        if (!codes.Any())
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid Parameters",
                Detail = "At least one valid country code is required"
            });
        }

        try
        {
            var doctors = await _context.ApprovedDoctors
                .Where(d => d.IsActive && (codes.Contains(d.CountryCode) || d.CountryCode == "NULL"))
                .OrderBy(d => d.CountryCode)
                .ThenBy(d => d.Name)
                .Select(d => new ApprovedDoctorResponse
                {
                    Id = d.Id,
                    Name = d.Name,
                    Address = d.Address,
                    Phone = d.Phone,
                    Email = d.Email,
                    City = d.City,
                    StateProvince = d.StateProvince,
                    PostalCode = d.PostalCode,
                    CountryCode = d.CountryCode,
                    Website = d.Website,
                    Specialties = d.Specialties,
                    Languages = d.Languages,
                    AcceptedCountryCodes = d.AcceptedCountryCodes,
                    Notes = d.Notes,
                    CreatedAt = d.CreatedAt,
                    UpdatedAt = d.UpdatedAt
                })
                .ToListAsync()
                .ConfigureAwait(false);

            return Ok(doctors);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving approved doctors for countries: {CountryCodes}", countryCodes);
            return StatusCode(500, new ProblemDetails
            {
                Title = "Internal Server Error",
                Detail = "An error occurred while retrieving approved doctors"
            });
        }
    }

    /// <summary>
    /// Create a new approved doctor
    /// </summary>
    /// <param name="request">Doctor information</param>
    /// <returns>Created doctor information</returns>
    [HttpPost]
    [Authorize] // Require authentication for creating doctors
    [ProducesResponseType(typeof(ApprovedDoctorResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApprovedDoctorResponse>> CreateApprovedDoctor(
        [FromBody] CreateApprovedDoctorRequest request)
    {
        // Validate required fields
        if (string.IsNullOrWhiteSpace(request.Name) ||
            string.IsNullOrWhiteSpace(request.Address) ||
            string.IsNullOrWhiteSpace(request.CountryCode))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Validation Error",
                Detail = "Name, address, and country code are required"
            });
        }

        try
        {
            // Create new doctor entity
            var doctor = new ApprovedDoctor
            {
                Name = request.Name.Trim(),
                Address = request.Address.Trim(),
                Phone = request.Phone?.Trim(),
                Email = request.Email?.Trim(),
                City = request.City?.Trim(),
                StateProvince = request.StateProvince?.Trim(),
                PostalCode = request.PostalCode?.Trim(),
                CountryCode = request.CountryCode.Trim().ToUpper(CultureInfo.InvariantCulture),
                Website = request.Website?.Trim(),
                Specialties = request.Specialties?.Trim(),
                Languages = request.Languages?.Trim(),
                AcceptedCountryCodes = request.AcceptedCountryCodes?.Trim().ToUpper(CultureInfo.InvariantCulture),
                Notes = request.Notes?.Trim(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ApprovedDoctors.Add(doctor);
            await _context.SaveChangesAsync().ConfigureAwait(false);

            // Create audit log
            await CreateDoctorAuditLogAsync(doctor.Id, "created").ConfigureAwait(false);

            var response = new ApprovedDoctorResponse
            {
                Id = doctor.Id,
                Name = doctor.Name,
                Address = doctor.Address,
                Phone = doctor.Phone,
                Email = doctor.Email,
                City = doctor.City,
                StateProvince = doctor.StateProvince,
                PostalCode = doctor.PostalCode,
                CountryCode = doctor.CountryCode,
                Website = doctor.Website,
                Specialties = doctor.Specialties,
                Languages = doctor.Languages,
                AcceptedCountryCodes = doctor.AcceptedCountryCodes,
                Notes = doctor.Notes,
                CreatedAt = doctor.CreatedAt,
                UpdatedAt = doctor.UpdatedAt
            };

            _logger.LogInformation("Created approved doctor {DoctorName} for country {CountryCode}",
                doctor.Name, doctor.CountryCode);

            return CreatedAtAction(nameof(GetApprovedDoctors),
                new { countryCodes = doctor.CountryCode },
                response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating approved doctor: {DoctorName}", request.Name);
            return StatusCode(500, new ProblemDetails
            {
                Title = "Internal Server Error",
                Detail = "An error occurred while creating the approved doctor"
            });
        }
    }

    private async Task CreateDoctorAuditLogAsync(Guid doctorId, string action)
    {
        try
        {
            var userId = GetCurrentUserId();
            var auditLog = new AuditLog
            {
                Category = "approved_doctors",
                Action = action,
                TargetType = "ApprovedDoctor",
                TargetId = doctorId.ToString(),
                ActorUserId = userId,
                DetailsJson = JsonSerializer.Serialize(new
                {
                    timestamp = DateTime.UtcNow,
                    userAgent = Request.Headers.UserAgent.FirstOrDefault()
                }),
                CreatedAt = DateTime.UtcNow
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync().ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to create audit log for doctor {DoctorId} action {Action}",
                doctorId, action);
            // Don't fail the main operation if audit logging fails
        }
    }

    private UserId? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (Guid.TryParse(userIdClaim, out var userId))
        {
            return new UserId(userId);
        }
        return null;
    }
}