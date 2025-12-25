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
        var attorneys = new[]
        {
            new Attorney
            {
                Name = "Denise S. Cann",
                Title = "Founder and Managing Attorney",
                Bio = "Denise S. Cann is the founder and managing attorney for Cann Legal Group. Ms. Cann earned her baccalaureate of arts degree in political science from the University of North Carolina at Chapel Hill in 1994. After earning her degree, she traveled to Taiwan where she became a teacher of English as a second language from 1994 through 1996. Returning to the United States in 1996, Ms. Cann attended law school at the University of Maryland. She earned her Juris Doctor in 1999 and is admitted the bars of Maryland and the District of Columbia. Ms. Cann has held a variety of positions in the legal field, including, but not limited to being a legal editor for two of the largest legal publishing companies in the United States: Lexis-Nexis and the Bureau of National Affairs (Media Law Reporter and U.S. Patents Quarterly). A member of the American Immigration Lawyers Association (AILA), Ms. Cann keeps abreast of the latest immigration news. As corporate counsel for a leading provider and innovator of IT solutions and Management Services Company in the nation's capital for a number of years, Ms. Cann was responsible for multi-national transfers of international staff and has lead negotiations in telecommunications. She has extensive experience providing multi-billion dollar international conglomerates guidance for investment opportunities in real estate, existing businesses and analyzing viable companies for future investments. She directed international corporate affairs strategies and counsels senior executives on international corporate affairs issues to increase executive knowledge and effectiveness of in-country strategy development and interactions with media, government officials, and non-government organizations (NGO). She headed a deal in negotiating with a foreign company desiring to place a several hundred seat call center in the United States for which the company was the primary provider of telecommunications and IT professionals. A new S.E. Asian Division has been established for individuals and companies interested in investing in the United States. Over the past decade, Ms. Cann has fine-tuned a stream-line path to investment immigration that doesn't involve the million dollar price tag. She has created a Business Consulting Team of professionals including our immigration attorneys, CPAs, market analysts and financial experts. Ms. Cann has also headed several companies in medical staffing, short-sale negotiations and EB5 Regional Center Investment option for immigration. In 2012, Ms. Cann established a satellite office in the Philippines and is currently in the process of opening another location in Taipei, Taiwan.",
                Email = "dcann@cannlaw.com",
                Phone = "",
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
                Name = "Wen Lee",
                Title = "Of Counsel",
                Bio = "Ms. Lee is an attorney licensed to practice in Maryland and District of Columbia. She represents clients in matters of Civil and Criminal litigation both International and domestically. Ms. Lee graduated from the University of Maryland with an Economics degree and a Master of Business Administration degree and later, received her Juris Doctor degree from University of Maryland School of Law. Prior to her legal career, she worked in international import and export and security trading industry. Ms. Lee clerked for Baltimore City Circuit Court right after law school and she is fluent in Mandarin Chinese and Taiwanese.",
                Email = "wlee@cannlaw.com",
                Phone = "",
                DirectPhone = "",
                DirectEmail = "",
                OfficeLocation = "Baltimore Office",
                DefaultHourlyRate = 350.00m,
                IsActive = true,
                IsManagingAttorney = false,
                DisplayOrder = 2,
                Credentials = "[\"J.D. University of Maryland School of Law\", \"MBA\"]",
                PracticeAreas = "[\"Civil Litigation\", \"Criminal Litigation\", \"International Law\"]",
                Languages = "[\"English\", \"Mandarin\", \"Taiwanese\"]",
                PhotoUrl = new Uri("/images/attorneys/wen.jpg", UriKind.Relative)
            },
            new Attorney
            {
                Name = "Angela Taylor",
                Title = "S.E. Asian Division",
                Bio = "Ms. Taylor was raised in the Philippines and has lived more than 20 years of her life in various regions of the islands. This has given her a great opportunity to immerse herself in the cultural lifestyle of the Filipinos. She has earned her certificate in Teaching English as a Foreign Language through TEFL International in Ban Phe, Thailand in 2004. She then returned to the Philippines as an English Language Instructor for two years. Afterward, she attended Elim Bible Institute in Lima, NY in 2006 where she received her certificate in Missions and Cultural Studies. Shortly after, she accepted a position in Maryland as a Therapeutic Staff Support working with Autistic children. In 2009, she received her Bachelors of Theology degree through Shalom Bible College out of West De Moines, Iowa. She continued working as a TSS for two years before leaving to work in the Philippines with a non-profit group whose objective was to rescue children who had been abused, abandoned, sold into slavery as well as prostitution rings. For three years, Ms. Taylor participated actively in fundraising, and public speaking to raise awareness for the cause, training of staff and hands on care for dozens of hurting children and one little autistic girl who she is now adopting. To this day, she still remains an advocate of children.",
                Email = "ataylor@cannlaw.com",
                Phone = "",
                DirectPhone = "",
                DirectEmail = "",
                OfficeLocation = "Philippines Satellite Office",
                DefaultHourlyRate = 0.00m,
                IsActive = true,
                IsManagingAttorney = false,
                DisplayOrder = 3,
                Credentials = "[\"B.Th. Shalom Bible College\"]",
                PracticeAreas = "[\"S.E. Asian Relations\", \"Advocacy\"]",
                Languages = "[\"English\", \"Tagalog\"]",
                PhotoUrl = new Uri("/images/attorneys/angela.jpg", UriKind.Relative)
            },
            new Attorney
            {
                Name = "John Charles",
                Title = "Director of Marketing and Business Development",
                Bio = "Mr. Charles has been in the manufacturing business since 1976. With a humble startup of $150, the company is now a multi-million dollar business. As CEO, Mr. Charles represented many manufacturers in nationwide distribution. His customer base comprises of U.S. military bases and government facilities worldwide, as well as many Fortune 500 companies, including the food service industry, manufacturers and retailers like Burger King, McDonalds, Hardees, General Motors, Honda, Merck, Harley Davidson, Nordstrom, Schuck's, Disney World, Six Flags, Boeing, and Wal-Mart, among many others. Over the years, Mr. Charles' manufacturing company acquired four companies, which allowed him to expand his product line to new and existing customers. As President/CEO, Mr. Charles negotiated contracts with multiple Fortune 500 companies in the private sector and GSA government contracts in the public sector. He founded distribution lines for companies, established international clients through active involvement through U.S. and foreign embassies, and traveled extensively throughout Asia and Europe to establish and open a line of international trade for sourcing his own products and those of other companies. As a member of Cann Legal Group's team, Mr. Charles is the Director of Marketing and Business Development. He confers with the Business Consulting Team in assessing business viability and reviews small businesses for possible additions to our recommended investment portfolio. He is the lead liaison for the Commercial Services and/or Economic Sections of U.S. Embassies worldwide.",
                Email = "jcharles@cannlaw.com",
                Phone = "",
                DirectPhone = "",
                DirectEmail = "",
                OfficeLocation = "Baltimore Office",
                DefaultHourlyRate = 0.00m,
                IsActive = true,
                IsManagingAttorney = false,
                DisplayOrder = 4,
                Credentials = "[]",
                PracticeAreas = "[\"Business Development\", \"Marketing\", \"International Trade\"]",
                Languages = "[\"English\"]",
                PhotoUrl = new Uri("/images/attorneys/john.jpg", UriKind.Relative)
            },
            new Attorney
            {
                Name = "Chika Okala",
                Title = "African Division",
                Bio = "Ms. Okala is a public health professional with more than twelve years' experience working in international health care delivery services, involving HIV & AIDS, TB care, Orphans and Vulnerable Children (OVC), reproductive health, family planning and community-based projects in Sub Saharan Africa. She has worked with PACT Nigeria as the OVC program specialist managing a five year $18 million USAID funded OVC Project; Family Health International as a Senior Program Officer and a portfolio manager for the $418.3 million, five-year Global HIV/AIDS Initiative Nigeria project; and a Program Assistant, Reproductive Health Unit with the Centre for Development and Population Activities, Nigeria. While in the U.S she has worked with Urban Health Initiative, and the Humphrey Fellowship program, Emory University. In addition to working with hospitals and community-level health organizations to strengthen health messaging and services, she has worked in collaboration with health activists, advocacy groups, and committed government officials to identify ways to address issues at the policy, systems, and management levels. Specialties include program evaluation and management, health systems management, qualitative and quantitative research in healthcare, strategic planning, and continuous quality improvement. Ms. Okala has a Bachelor of Science in Applied Biochemistry (BSc) from Nnamdi Azikiwe University, Nigeria; a Master of Science (MSc) in Psychology from the University of Lagos, Nigeria; and recently a Master of Public Health (MPH) from Emory University.",
                Email = "cokala@cannlaw.com",
                Phone = "",
                DirectPhone = "",
                DirectEmail = "",
                OfficeLocation = "African Division",
                DefaultHourlyRate = 0.00m,
                IsActive = true,
                IsManagingAttorney = false,
                DisplayOrder = 5,
                Credentials = "[\"MPH Emory University\", \"M.Sc. Psychology\", \"B.Sc. Applied Biochemistry\"]",
                PracticeAreas = "[\"Public Health\", \"African Relations\"]",
                Languages = "[\"English\"]",
                PhotoUrl = new Uri("/images/attorneys/chika.jpg", UriKind.Relative)
            },
            new Attorney
            {
                Name = "Alex Shu",
                Title = "Business Consulting Team - CPA",
                Bio = "As a member of the Business Consulting Team, Mr. Shu works with corporate clients in reviewing prospective investments in the United States. He is a Certified Public Accountant in the United States. As the 2017 Champion of the National Tax Debate held by the Taiwan Ministry of Finance, Mr. Shu understands that accounting isn't merely paper and numbers. His hard line analysis of books go beyond just the paper and numbers. He tracks the financial markets and general economic conditions and provides guidance based on his research. Mr. Shu possesses a Bachelor's Degree in Public Finance and a Master's of Science Degree in Accounting from the National Chengchi University (NCCU) in Taiwan.",
                Email = "ashu@cannlaw.com",
                Phone = "",
                DirectPhone = "",
                DirectEmail = "",
                OfficeLocation = "Taiwan Office",
                DefaultHourlyRate = 300.00m,
                IsActive = true,
                IsManagingAttorney = false,
                DisplayOrder = 6,
                Credentials = "[\"CPA (USA)\", \"M.S. Accounting NCCU\"]",
                PracticeAreas = "[\"Business Consulting\", \"Tax Analysis\", \"Financial Markets\"]",
                Languages = "[\"English\", \"Mandarin\"]",
                PhotoUrl = new Uri("/images/attorneys/alex.jpg", UriKind.Relative)
            },
            new Attorney
            {
                Name = "Janice Lin",
                Title = "Business Consulting Team - CPA",
                Bio = "Ms. Lin is a member of the Business Consulting Team. She provides technology direction and reviews financial data of businesses submitted to the investment portfolio. She handles the Taiwanese and Chinese markets. She is a Certified Public Accountant in Taiwan. She is a graduate of National Chengchi University (NCCU) in Taipei, Taiwan with a Bachelor and Master of Accounting Degree with a concentration in cost management and financial accounting, auditing, financial statement analysis, accounting information systems and commercial law. Ms. Lin's background is unique in that she lends to team her experience in integrating global business technology to finance and accounting analysis and management.",
                Email = "jlin@cannlaw.com",
                Phone = "",
                DirectPhone = "",
                DirectEmail = "",
                OfficeLocation = "Taiwan Office",
                DefaultHourlyRate = 300.00m,
                IsActive = true,
                IsManagingAttorney = false,
                DisplayOrder = 7,
                Credentials = "[\"CPA (Taiwan)\", \"Master of Accounting NCCU\"]",
                PracticeAreas = "[\"Technology Direction\", \"Financial Analysis\", \"Asian Markets\"]",
                Languages = "[\"English\", \"Mandarin\"]",
                PhotoUrl = new Uri("/images/attorneys/janice.jpg", UriKind.Relative)
            },
            new Attorney
            {
                Name = "Katherine J. Wong",
                Title = "Business Consulting Team - CPA",
                Bio = "Ms. Wong's background is diverse. While also a Certified Public Accountant in Taiwan, she brings to the Business Consulting Team her background in graphic design and art. In addition to her background in art, she also possesses a Bachelor's Degree in Public Finance and a Master's Degree in Accounting & Taxation from National Chengchi University (NCCU). Ms. Wong's educational background lends a distinct addition to the Team making her eye on the investment portfolio broad and brings to the team innovative approaches to financial investment considerations. As a student in the economic and business program at the University of Groningen in the Netherlands, Ms. Wong was able to broaden her global view of international investments.",
                Email = "kwong@cannlaw.com",
                Phone = "",
                DirectPhone = "",
                DirectEmail = "",
                OfficeLocation = "Taiwan Office",
                DefaultHourlyRate = 300.00m,
                IsActive = true,
                IsManagingAttorney = false,
                DisplayOrder = 8,
                Credentials = "[\"CPA (Taiwan)\", \"Master of Accounting & Taxation NCCU\"]",
                PracticeAreas = "[\"Financial Investment\", \"Graphic Design\", \"International Investment\"]",
                Languages = "[\"English\", \"Mandarin\"]",
                PhotoUrl = new Uri("/images/attorneys/katherine.jpg", UriKind.Relative)
            }
        };

        foreach (var attorney in attorneys)
        {
            var existing = await _context.Attorneys.FirstOrDefaultAsync(a => a.Email == attorney.Email);
            if (existing == null)
            {
                _context.Attorneys.Add(attorney);
            }
            else
            {
                // UPSERT: Update existing fields to match our accurate source of truth
                existing.Name = attorney.Name;
                existing.Title = attorney.Title;
                existing.Bio = attorney.Bio;
                existing.Phone = attorney.Phone;
                existing.DirectPhone = attorney.DirectPhone;
                existing.DirectEmail = attorney.DirectEmail;
                existing.OfficeLocation = attorney.OfficeLocation;
                existing.Credentials = attorney.Credentials;
                existing.PracticeAreas = attorney.PracticeAreas;
                existing.Languages = attorney.Languages;
                // Only update photo if the existing one is null or if we want to enforce the seed path
                // We'll enforce it to ensure the local assets are used as requested.
                existing.PhotoUrl = attorney.PhotoUrl; 
                existing.UpdatedAt = DateTime.UtcNow;
            }
        }

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