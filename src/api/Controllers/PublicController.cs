using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Services;
using L4H.Shared.Models;
using FluentValidation;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/public")]
[Tags("Public")]
public class PublicController : ControllerBase
{
    private readonly L4HDbContext _context;
    private readonly IValidator<ContactFormRequest> _contactFormValidator;
    private readonly ILogger<PublicController> _logger;
    private readonly IMailService _mailService;

    public PublicController(
        L4HDbContext context,
        IValidator<ContactFormRequest> contactFormValidator,
        ILogger<PublicController> logger,
        IMailService mailService)
    {
        _context = context;
        _contactFormValidator = contactFormValidator;
        _logger = logger;
        _mailService = mailService;
    }

    /// <summary>
    /// Get all available visa types for public viewing
    /// </summary>
    [HttpGet("visa-types")]
    [ProducesResponseType<IEnumerable<VisaTypeInfo>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVisaTypes()
    {
        var visaTypes = await _context.VisaTypes
            .Where(v => v.IsActive)
            .Select(v => new VisaTypeInfo
            {
                Id = v.Id,
                Code = v.Code ?? string.Empty,
                Name = v.Name ?? string.Empty,
                GeneralCategory = string.Empty,
                Description = L4H.Api.Helpers.VisaDescriptionHelper.GetDescription(v.Code ?? string.Empty)
            })
            .OrderBy(v => v.Code)
            .ToListAsync()
            .ConfigureAwait(false);

        return Ok(visaTypes);
    }

    /// <summary>
    /// Get all available visa types (alias for compatibility)
    /// </summary>
    [HttpGet("~/api/v1/visa-types")]
    [ProducesResponseType<IEnumerable<VisaTypeInfo>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVisaTypesAlias()
    {
        return await GetVisaTypes().ConfigureAwait(false);
    }

    /// <summary>
    /// Get simple list of all visa type codes and names
    /// </summary>
    [HttpGet("visa-list")]
    [ProducesResponseType<IEnumerable<VisaListItem>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVisaList()
    {
        var visaList = await _context.VisaTypes
            .Where(v => v.IsActive)
            .Select(v => new VisaListItem
            {
                Code = v.Code,
                Name = v.Name
            })
            .OrderBy(v => v.Code)
            .ToListAsync()
            .ConfigureAwait(false);

        return Ok(visaList);
    }

    /// <summary>
    /// Submit a contact form inquiry
    /// </summary>
    [HttpPost("contact")]
    [HttpPost("~/v1/public/contact")]
    [AllowAnonymous]
    [ProducesResponseType<ContactFormResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitContactForm([FromBody] ContactFormRequest request)
    {
        // Validate request
        var validationResult = await _contactFormValidator.ValidateAsync(request).ConfigureAwait(false);
        if (!validationResult.IsValid)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Validation Failed",
                Detail = string.Join(", ", validationResult.Errors.Select(e => e.ErrorMessage)),
                Status = StatusCodes.Status400BadRequest
            });
        }

        try
        {
            // Generate reference ID for tracking
            var referenceId = $"INQ-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid():N}".Substring(0, 24);

            // Log the contact form submission
            _logger.LogInformation(
                "Contact form submitted: {ReferenceId}, Name: {Name}, Email: {Email}, Type: {Type}",
                referenceId, request.Name, request.Email, request.ConsultationType);

            // 1. Save to database
            var message = new ContactMessage
            {
                Name = request.Name,
                Email = request.Email,
                Phone = request.Phone,
                Subject = request.Subject,
                Message = request.Message,
                ConsultationType = request.ConsultationType,
                ReferenceId = referenceId,
                CreatedAt = DateTime.UtcNow,
                IsProcessed = false
            };

            _context.ContactMessages.Add(message);
            await _context.SaveChangesAsync().ConfigureAwait(false);

            // 2. Get recipient emails (All Admins + Site Config Email)
            var adminEmails = await _context.Users
                .Where(u => u.IsAdmin && !string.IsNullOrEmpty(u.Email))
                .Select(u => u.Email)
                .ToListAsync()
                .ConfigureAwait(false);

            var siteConfig = await _context.SiteConfigurations.FirstOrDefaultAsync().ConfigureAwait(false);
            if (!string.IsNullOrEmpty(siteConfig?.Email) && !adminEmails.Contains(siteConfig.Email))
            {
                adminEmails.Add(siteConfig.Email);
            }

            // Fallback
            if (!adminEmails.Any())
            {
                adminEmails.Add("information@cannlaw.com");
            }

            // 3. Send email notification to staff
            var staffSubject = $"New Contact Inquiry: {request.Subject ?? "No Subject"} ({referenceId})";
            var staffBody = $@"
                <h2>New Contact Inquiry</h2>
                <p><strong>Reference ID:</strong> {referenceId}</p>
                <p><strong>Name:</strong> {request.Name}</p>
                <p><strong>Email:</strong> {request.Email}</p>
                <p><strong>Phone:</strong> {request.Phone}</p>
                <p><strong>Type:</strong> {request.ConsultationType}</p>
                <hr />
                <p><strong>Message:</strong></p>
                <p>{request.Message}</p>
            ";

            foreach (var email in adminEmails)
            {
                try 
                {
                    await _mailService.SendEmailAsync(email, staffSubject, staffBody).ConfigureAwait(false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send admin notification email to {Email} for inquiry {ReferenceId}", email, referenceId);
                }
            }

            // 4. Send confirmation email to submitter
            var userSubject = $"We received your inquiry ({referenceId})";
            var userBody = $@"
                <h2>Thank you for contacting Cannlaw</h2>
                <p>Dear {request.Name},</p>
                <p>We have received your inquiry and will get back to you within 24 hours.</p>
                <p><strong>Reference ID:</strong> {referenceId}</p>
                <br />
                <p>Best regards,</p>
                <p>The Cannlaw Team</p>
            ";

            try
            {
                await _mailService.SendEmailAsync(request.Email, userSubject, userBody).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                 _logger.LogError(ex, "Failed to send user confirmation email for inquiry {ReferenceId}", referenceId);
            }

            return Ok(new ContactFormResponse
            {
                Success = true,
                Message = "Thank you for contacting us! We'll get back to you within 24 hours.",
                ReferenceId = referenceId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing contact form submission");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Server Error",
                Detail = "An error occurred while processing your request. Please try again later.",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Get published site content (news, resources, blog posts)
    /// </summary>
    [HttpGet("site-content")]
    [ProducesResponseType<IEnumerable<SiteContentInfo>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPublishedContent([FromQuery] string? type)
    {
        var query = _context.SiteContents
            .Where(c => c.IsPublished && c.PublishedAt.HasValue)
            .AsQueryable();

        if (!string.IsNullOrEmpty(type))
        {
            query = query.Where(c => c.ContentType == type);
        }

        var content = await query
            .OrderByDescending(c => c.PublishedAt)
            .Select(c => new SiteContentInfo
            {
                Id = c.Id,
                Title = c.Title,
                Summary = c.Summary,
                Content = c.Content,
                ContentType = c.ContentType,
                Author = c.Author,
                ImageUrl = c.ImageUrl,
                PublishedAt = c.PublishedAt!.Value,
                Tags = c.Tags
            })
            .ToListAsync();

        return Ok(content);
    }
}

public class VisaTypeInfo
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string GeneralCategory { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class VisaListItem
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class SiteContentInfo
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string Content { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public string? Author { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime PublishedAt { get; set; }
    public string? Tags { get; set; }
}
