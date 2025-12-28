using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/services")]
[Tags("Legal Services")]
public class ServicesController : ControllerBase
{
    private readonly L4HDbContext _context;

    public ServicesController(L4HDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get all service categories with their services
    /// </summary>
    [HttpGet("categories")]
    [ProducesResponseType(typeof(ServiceCategory[]), StatusCodes.Status200OK)]
    public async Task<ActionResult<ServiceCategory[]>> GetServiceCategories()
    {
        var categories = await _context.ServiceCategories
            .Include(sc => sc.Services.Where(s => s.IsActive))
            .Where(sc => sc.IsActive)
            .OrderBy(sc => sc.DisplayOrder)
            .ToArrayAsync()
            .ConfigureAwait(false);

        if (!categories.Any())
        {
            // Initialize with default data if none exists
            await InitializeDefaultServices();
            categories = await _context.ServiceCategories
                .Include(sc => sc.Services.Where(s => s.IsActive))
                .Where(sc => sc.IsActive)
                .OrderBy(sc => sc.DisplayOrder)
                .ToArrayAsync()
                .ConfigureAwait(false);
        }

        return Ok(categories);
    }

    /// <summary>
    /// Get a specific service category by ID
    /// </summary>
    [HttpGet("categories/{id}")]
    [ProducesResponseType(typeof(ServiceCategory), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ServiceCategory>> GetServiceCategory(int id)
    {
        var category = await _context.ServiceCategories
            .Include(sc => sc.Services.Where(s => s.IsActive))
            .FirstOrDefaultAsync(sc => sc.Id == id && sc.IsActive)
            .ConfigureAwait(false);

        if (category == null)
        {
            return NotFound();
        }

        return Ok(category);
    }

    /// <summary>
    /// Create a new service category (Admin only)
    /// </summary>
    [HttpPost("categories")]
    [Authorize(Policy = "IsAdmin")]
    [ProducesResponseType(typeof(ServiceCategory), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ServiceCategory>> CreateServiceCategory([FromBody] ServiceCategory category)
    {
        category.CreatedAt = DateTime.UtcNow;
        category.UpdatedAt = DateTime.UtcNow;

        _context.ServiceCategories.Add(category);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        return CreatedAtAction(nameof(GetServiceCategory), new { id = category.Id }, category);
    }

    /// <summary>
    /// Update a service category (Admin only)
    /// </summary>
    [HttpPut("categories/{id}")]
    [Authorize(Policy = "IsAdmin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> UpdateServiceCategory(int id, [FromBody] ServiceCategory category)
    {
        var existingCategory = await _context.ServiceCategories
            .FirstOrDefaultAsync(sc => sc.Id == id)
            .ConfigureAwait(false);

        if (existingCategory == null)
        {
            return NotFound();
        }

        existingCategory.Name = category.Name;
        existingCategory.Description = category.Description;
        existingCategory.IconUrl = category.IconUrl;
        existingCategory.IsActive = category.IsActive;
        existingCategory.DisplayOrder = category.DisplayOrder;
        existingCategory.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);
        return Ok();
    }

    /// <summary>
    /// Create a new service within a category (Admin only)
    /// </summary>
    [HttpPost("categories/{categoryId}/services")]
    [Authorize(Policy = "IsAdmin")]
    [ProducesResponseType(typeof(LegalService), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<LegalService>> CreateService(int categoryId, [FromBody] LegalService service)
    {
        var category = await _context.ServiceCategories
            .FirstOrDefaultAsync(sc => sc.Id == categoryId)
            .ConfigureAwait(false);

        if (category == null)
        {
            return NotFound();
        }

        service.ServiceCategoryId = categoryId;
        service.CreatedAt = DateTime.UtcNow;
        service.UpdatedAt = DateTime.UtcNow;

        _context.LegalServices.Add(service);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        return CreatedAtAction(nameof(GetServiceCategory), new { id = categoryId }, service);
    }

    /// <summary>
    /// Update a service (Admin only)
    /// </summary>
    [HttpPut("services/{id}")]
    [Authorize(Policy = "IsAdmin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> UpdateService(int id, [FromBody] LegalService service)
    {
        var existingService = await _context.LegalServices
            .FirstOrDefaultAsync(s => s.Id == id)
            .ConfigureAwait(false);

        if (existingService == null)
        {
            return NotFound();
        }

        existingService.Name = service.Name;
        existingService.Description = service.Description;
        existingService.IsActive = service.IsActive;
        existingService.DisplayOrder = service.DisplayOrder;
        existingService.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);
        return Ok();
    }

    /// <summary>
    /// Delete a service (Admin only)
    /// </summary>
    [HttpDelete("services/{id}")]
    [Authorize(Policy = "IsAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> DeleteService(int id)
    {
        var service = await _context.LegalServices
            .FirstOrDefaultAsync(s => s.Id == id)
            .ConfigureAwait(false);

        if (service == null)
        {
            return NotFound();
        }

        _context.LegalServices.Remove(service);
        await _context.SaveChangesAsync().ConfigureAwait(false);
        return NoContent();
    }

    private async Task InitializeDefaultServices()
    {
        var familyCategory = new ServiceCategory
        {
            Name = "Family-Based Immigration",
            Description = "Comprehensive family immigration services to reunite families, including I-130 petitions, K visas, and Adjustment of Status.",
            DisplayOrder = 1,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var employmentCategory = new ServiceCategory
        {
            Name = "Employment & Investment",
            Description = "Professional immigration services for workers, executives, and investors (H-1B, L-1, E-2, EB-1, EB-2 NIW, PERM).",
            DisplayOrder = 2,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var humanitarianCategory = new ServiceCategory
        {
            Name = "Humanitarian & Asylum",
            Description = "Specialized legal support for Asylum, U-Visas, T-Visas, and VAWA applications.",
            DisplayOrder = 3,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var waiversCategory = new ServiceCategory
        {
            Name = "Waivers & Court Defense",
            Description = "Defense for removal proceedings, I-601/I-601A waivers, and criminal-immigration issues.",
            DisplayOrder = 4,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var citizenshipCategory = new ServiceCategory
        {
            Name = "Naturalization & Citizenship",
            Description = "Assistance with N-400 applications, citizenship claims, and complex naturalization cases.",
            DisplayOrder = 5,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.ServiceCategories.AddRange(familyCategory, employmentCategory, humanitarianCategory, waiversCategory, citizenshipCategory);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Add default services
        var familyServices = new[]
        {
            new LegalService { Name = "I-130 Family Petitions", ServiceCategoryId = familyCategory.Id, DisplayOrder = 1, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new LegalService { Name = "Adjustment of Status (Green Card)", ServiceCategoryId = familyCategory.Id, DisplayOrder = 2, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new LegalService { Name = "Consular Processing", ServiceCategoryId = familyCategory.Id, DisplayOrder = 3, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new LegalService { Name = "K-1 Fiancé / K-3 Spouse Visas", ServiceCategoryId = familyCategory.Id, DisplayOrder = 4, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new LegalService { Name = "Removal of Conditions (I-751)", ServiceCategoryId = familyCategory.Id, DisplayOrder = 5, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };

        var employmentServices = new[]
        {
            new LegalService { Name = "H-1B Specialty Occupation", ServiceCategoryId = employmentCategory.Id, DisplayOrder = 1, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new LegalService { Name = "L-1 Intracompany Transferee", ServiceCategoryId = employmentCategory.Id, DisplayOrder = 2, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new LegalService { Name = "E-1/E-2 Treaty Trader/Investor", ServiceCategoryId = employmentCategory.Id, DisplayOrder = 3, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new LegalService { Name = "EB-1 Extraordinary Ability", ServiceCategoryId = employmentCategory.Id, DisplayOrder = 4, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new LegalService { Name = "EB-2 National Interest Waiver (NIW)", ServiceCategoryId = employmentCategory.Id, DisplayOrder = 5, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new LegalService { Name = "PERM Labor Certification", ServiceCategoryId = employmentCategory.Id, DisplayOrder = 6, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };

        var humanitarianServices = new[]
        {
            new LegalService { Name = "Asylum & Withholding of Removal", ServiceCategoryId = humanitarianCategory.Id, DisplayOrder = 1, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new LegalService { Name = "U-Visa (Victims of Crime)", ServiceCategoryId = humanitarianCategory.Id, DisplayOrder = 2, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new LegalService { Name = "T-Visa (Trafficking Victims)", ServiceCategoryId = humanitarianCategory.Id, DisplayOrder = 3, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new LegalService { Name = "VAWA (Abused Spouses/Children)", ServiceCategoryId = humanitarianCategory.Id, DisplayOrder = 4, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new LegalService { Name = "TPS (Temporary Protected Status)", ServiceCategoryId = humanitarianCategory.Id, DisplayOrder = 5, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };

        var waiverServices = new[]
        {
            new LegalService { Name = "I-601A Provisional Waivers", ServiceCategoryId = waiversCategory.Id, DisplayOrder = 1, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new LegalService { Name = "Deportation / Removal Defense", ServiceCategoryId = waiversCategory.Id, DisplayOrder = 2, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new LegalService { Name = "Bond Hearings", ServiceCategoryId = waiversCategory.Id, DisplayOrder = 3, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new LegalService { Name = "BIA Appeals", ServiceCategoryId = waiversCategory.Id, DisplayOrder = 4, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };

        var citizenshipServices = new[]
        {
            new LegalService { Name = "N-400 Naturalization", ServiceCategoryId = citizenshipCategory.Id, DisplayOrder = 1, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new LegalService { Name = "N-600 Certificate of Citizenship", ServiceCategoryId = citizenshipCategory.Id, DisplayOrder = 2, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new LegalService { Name = "Disability Waivers (N-648)", ServiceCategoryId = citizenshipCategory.Id, DisplayOrder = 3, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };

        _context.LegalServices.AddRange(familyServices);
        _context.LegalServices.AddRange(employmentServices);
        _context.LegalServices.AddRange(humanitarianServices);
        _context.LegalServices.AddRange(waiverServices);
        _context.LegalServices.AddRange(citizenshipServices);
        await _context.SaveChangesAsync().ConfigureAwait(false);
    }
}
