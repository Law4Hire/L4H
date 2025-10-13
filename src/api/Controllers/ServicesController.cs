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

    private async Task InitializeDefaultServices()
    {
        var familyCategory = new ServiceCategory
        {
            Name = "Family-Based Immigration",
            Description = "Comprehensive family immigration services to reunite families",
            DisplayOrder = 1,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var employmentCategory = new ServiceCategory
        {
            Name = "Employment & Investment",
            Description = "Professional immigration services for workers and investors",
            DisplayOrder = 2,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var waiversCategory = new ServiceCategory
        {
            Name = "Waivers & Criminal Issues",
            Description = "Specialized services for complex immigration cases",
            DisplayOrder = 3,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.ServiceCategories.AddRange(familyCategory, employmentCategory, waiversCategory);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Add default services
        var familyServices = new[]
        {
            new LegalService { Name = "K-1 Fiancé/Fiancée Visa", ServiceCategoryId = familyCategory.Id, DisplayOrder = 1, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new LegalService { Name = "K-3 Spousal Visa", ServiceCategoryId = familyCategory.Id, DisplayOrder = 2, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new LegalService { Name = "Family Petitions", ServiceCategoryId = familyCategory.Id, DisplayOrder = 3, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };

        var employmentServices = new[]
        {
            new LegalService { Name = "H-1B Visa", ServiceCategoryId = employmentCategory.Id, DisplayOrder = 1, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new LegalService { Name = "E1/E2 Investment Visas", ServiceCategoryId = employmentCategory.Id, DisplayOrder = 2, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new LegalService { Name = "PERM Labor Certification", ServiceCategoryId = employmentCategory.Id, DisplayOrder = 3, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new LegalService { Name = "Multi-national Transfers", ServiceCategoryId = employmentCategory.Id, DisplayOrder = 4, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };

        var waiverServices = new[]
        {
            new LegalService { Name = "212 Waiver", ServiceCategoryId = waiversCategory.Id, DisplayOrder = 1, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new LegalService { Name = "Criminal Issues Affecting Naturalization", ServiceCategoryId = waiversCategory.Id, DisplayOrder = 2, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };

        _context.LegalServices.AddRange(familyServices);
        _context.LegalServices.AddRange(employmentServices);
        _context.LegalServices.AddRange(waiverServices);
        await _context.SaveChangesAsync().ConfigureAwait(false);
    }
}