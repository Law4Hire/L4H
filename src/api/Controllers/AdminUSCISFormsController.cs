using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/admin/uscis-forms")]
[Authorize(Policy = "IsAdmin")]
[Tags("Admin - USCIS Forms")]
public class AdminUSCISFormsController : ControllerBase
{
    private readonly L4HDbContext _context;

    public AdminUSCISFormsController(L4HDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get all USCIS forms with their pricing
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(USCISFormResponse[]), StatusCodes.Status200OK)]
    public async Task<ActionResult<USCISFormResponse[]>> GetAllForms()
    {
        var forms = await _context.USCISForms
            .Include(f => f.Pricing.Where(p => p.IsActive))
            .Include(f => f.VisaTypeMappings)
            .OrderBy(f => f.FormNumber)
            .ToListAsync().ConfigureAwait(false);

        var response = forms.Select(MapFormToResponse).ToArray();
        return Ok(response);
    }

    /// <summary>
    /// Get a single USCIS form by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(USCISFormResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<USCISFormResponse>> GetForm(Guid id)
    {
        var form = await _context.USCISForms
            .Include(f => f.Pricing.Where(p => p.IsActive))
            .Include(f => f.VisaTypeMappings)
            .FirstOrDefaultAsync(f => f.Id == id).ConfigureAwait(false);

        if (form == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Form not found",
                Detail = $"USCIS form with ID {id} was not found",
                Status = StatusCodes.Status404NotFound
            });
        }

        return Ok(MapFormToResponse(form));
    }

    /// <summary>
    /// Create a new USCIS form
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(USCISFormResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<USCISFormResponse>> CreateForm([FromBody] CreateUSCISFormRequest request)
    {
        // Check if form number already exists
        var exists = await _context.USCISForms
            .AnyAsync(f => f.FormNumber == request.FormNumber).ConfigureAwait(false);

        if (exists)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Duplicate form number",
                Detail = $"A form with number '{request.FormNumber}' already exists",
                Status = StatusCodes.Status400BadRequest
            });
        }

        var form = new USCISFormEntity
        {
            FormNumber = request.FormNumber,
            FormName = request.FormName,
            Description = request.Description,
            FormUrl = request.FormUrl,
            EstimatedTimeMinutes = request.EstimatedTimeMinutes,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.USCISForms.Add(form);

        // Add initial pricing if provided
        if (request.Pricing != null)
        {
            var pricing = new FormPricingEntity
            {
                FormId = form.Id,
                SelfFilePriceUSD = request.Pricing.SelfFilePriceUSD,
                ParalegalPriceUSD = request.Pricing.ParalegalPriceUSD,
                LawyerPriceUSD = request.Pricing.LawyerPriceUSD,
                LLCFeeUSD = request.Pricing.LLCFeeUSD,
                LLCFeePercentage = request.Pricing.LLCFeePercentage,
                Description = request.Pricing.Description,
                IsActive = true,
                EffectiveDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.FormPricing.Add(pricing);
        }

        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Reload with relationships
        await _context.Entry(form)
            .Collection(f => f.Pricing)
            .LoadAsync().ConfigureAwait(false);

        return CreatedAtAction(nameof(GetForm), new { id = form.Id }, MapFormToResponse(form));
    }

    /// <summary>
    /// Update an existing USCIS form
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(USCISFormResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<USCISFormResponse>> UpdateForm(Guid id, [FromBody] UpdateUSCISFormRequest request)
    {
        var form = await _context.USCISForms.FindAsync(id).ConfigureAwait(false);

        if (form == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Form not found",
                Detail = $"USCIS form with ID {id} was not found",
                Status = StatusCodes.Status404NotFound
            });
        }

        // Check if changing form number would create a duplicate
        if (request.FormNumber != form.FormNumber)
        {
            var exists = await _context.USCISForms
                .AnyAsync(f => f.FormNumber == request.FormNumber && f.Id != id).ConfigureAwait(false);

            if (exists)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Duplicate form number",
                    Detail = $"A form with number '{request.FormNumber}' already exists",
                    Status = StatusCodes.Status400BadRequest
                });
            }
        }

        form.FormNumber = request.FormNumber;
        form.FormName = request.FormName;
        form.Description = request.Description;
        form.FormUrl = request.FormUrl;
        form.EstimatedTimeMinutes = request.EstimatedTimeMinutes;
        form.IsActive = request.IsActive;
        form.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);

        await _context.Entry(form)
            .Collection(f => f.Pricing)
            .LoadAsync().ConfigureAwait(false);

        return Ok(MapFormToResponse(form));
    }

    /// <summary>
    /// Delete a USCIS form
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteForm(Guid id)
    {
        var form = await _context.USCISForms.FindAsync(id).ConfigureAwait(false);

        if (form == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Form not found",
                Detail = $"USCIS form with ID {id} was not found",
                Status = StatusCodes.Status404NotFound
            });
        }

        _context.USCISForms.Remove(form);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        return NoContent();
    }

    // ========== PRICING MANAGEMENT ENDPOINTS ==========

    /// <summary>
    /// Update pricing for a USCIS form
    /// </summary>
    [HttpPut("{formId}/pricing")]
    [ProducesResponseType(typeof(FormPricingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FormPricingResponse>> UpdateFormPricing(Guid formId, [FromBody] UpdateFormPricingRequest request)
    {
        var form = await _context.USCISForms
            .Include(f => f.Pricing)
            .FirstOrDefaultAsync(f => f.Id == formId).ConfigureAwait(false);

        if (form == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Form not found",
                Detail = $"USCIS form with ID {formId} was not found",
                Status = StatusCodes.Status404NotFound
            });
        }

        // Deactivate existing active pricing
        foreach (var existingPricing in form.Pricing.Where(p => p.IsActive))
        {
            existingPricing.IsActive = false;
            existingPricing.ExpirationDate = DateTime.UtcNow;
        }

        // Create new pricing
        var newPricing = new FormPricingEntity
        {
            FormId = formId,
            SelfFilePriceUSD = request.SelfFilePriceUSD,
            ParalegalPriceUSD = request.ParalegalPriceUSD,
            LawyerPriceUSD = request.LawyerPriceUSD,
            LLCFeeUSD = request.LLCFeeUSD,
            LLCFeePercentage = request.LLCFeePercentage,
            Description = request.Description,
            IsActive = true,
            EffectiveDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.FormPricing.Add(newPricing);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        return Ok(new FormPricingResponse
        {
            Id = newPricing.Id,
            SelfFilePriceUSD = newPricing.SelfFilePriceUSD,
            ParalegalPriceUSD = newPricing.ParalegalPriceUSD,
            LawyerPriceUSD = newPricing.LawyerPriceUSD,
            LLCFeeUSD = newPricing.LLCFeeUSD,
            LLCFeePercentage = newPricing.LLCFeePercentage,
            Description = newPricing.Description,
            EffectiveDate = newPricing.EffectiveDate
        });
    }

    /// <summary>
    /// Get pricing history for a form
    /// </summary>
    [HttpGet("{formId}/pricing/history")]
    [ProducesResponseType(typeof(FormPricingResponse[]), StatusCodes.Status200OK)]
    public async Task<ActionResult<FormPricingResponse[]>> GetPricingHistory(Guid formId)
    {
        var pricingHistory = await _context.FormPricing
            .Where(p => p.FormId == formId)
            .OrderByDescending(p => p.EffectiveDate)
            .ToListAsync().ConfigureAwait(false);

        var response = pricingHistory.Select(p => new FormPricingResponse
        {
            Id = p.Id,
            SelfFilePriceUSD = p.SelfFilePriceUSD,
            ParalegalPriceUSD = p.ParalegalPriceUSD,
            LawyerPriceUSD = p.LawyerPriceUSD,
            LLCFeeUSD = p.LLCFeeUSD,
            LLCFeePercentage = p.LLCFeePercentage,
            Description = p.Description,
            EffectiveDate = p.EffectiveDate
        }).ToArray();

        return Ok(response);
    }

    // ========== VISA TYPE MAPPING ENDPOINTS ==========

    /// <summary>
    /// Get all visa type mappings for a form
    /// </summary>
    [HttpGet("{formId}/visa-mappings")]
    [ProducesResponseType(typeof(FormVisaTypeMappingResponse[]), StatusCodes.Status200OK)]
    public async Task<ActionResult<FormVisaTypeMappingResponse[]>> GetFormVisaMappings(Guid formId)
    {
        var mappings = await _context.FormVisaTypeMappings
            .Include(m => m.VisaType)
            .Where(m => m.FormId == formId)
            .OrderBy(m => m.DisplayOrder)
            .ToListAsync().ConfigureAwait(false);

        var response = mappings.Select(m => new FormVisaTypeMappingResponse
        {
            Id = m.Id,
            FormId = m.FormId,
            VisaTypeId = m.VisaTypeId,
            VisaTypeCode = m.VisaType.Code,
            VisaTypeName = m.VisaType.Name,
            IsRequired = m.IsRequired,
            DisplayOrder = m.DisplayOrder,
            Notes = m.Notes
        }).ToArray();

        return Ok(response);
    }

    /// <summary>
    /// Create a new visa type mapping for a form
    /// </summary>
    [HttpPost("{formId}/visa-mappings")]
    [ProducesResponseType(typeof(FormVisaTypeMappingResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<FormVisaTypeMappingResponse>> CreateVisaMapping(Guid formId, [FromBody] CreateVisaMappingRequest request)
    {
        // Check if mapping already exists
        var exists = await _context.FormVisaTypeMappings
            .AnyAsync(m => m.FormId == formId && m.VisaTypeId == request.VisaTypeId).ConfigureAwait(false);

        if (exists)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Duplicate mapping",
                Detail = $"A mapping already exists for this form and visa type",
                Status = StatusCodes.Status400BadRequest
            });
        }

        var mapping = new FormVisaTypeMappingEntity
        {
            FormId = formId,
            VisaTypeId = request.VisaTypeId,
            IsRequired = request.IsRequired,
            DisplayOrder = request.DisplayOrder,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.FormVisaTypeMappings.Add(mapping);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Reload with visa type
        await _context.Entry(mapping)
            .Reference(m => m.VisaType)
            .LoadAsync().ConfigureAwait(false);

        var response = new FormVisaTypeMappingResponse
        {
            Id = mapping.Id,
            FormId = mapping.FormId,
            VisaTypeId = mapping.VisaTypeId,
            VisaTypeCode = mapping.VisaType.Code,
            VisaTypeName = mapping.VisaType.Name,
            IsRequired = mapping.IsRequired,
            DisplayOrder = mapping.DisplayOrder,
            Notes = mapping.Notes
        };

        return CreatedAtAction(nameof(GetFormVisaMappings), new { formId }, response);
    }

    /// <summary>
    /// Update a visa type mapping
    /// </summary>
    [HttpPut("{formId}/visa-mappings/{mappingId}")]
    [ProducesResponseType(typeof(FormVisaTypeMappingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FormVisaTypeMappingResponse>> UpdateVisaMapping(Guid formId, Guid mappingId, [FromBody] UpdateVisaMappingRequest request)
    {
        var mapping = await _context.FormVisaTypeMappings
            .Include(m => m.VisaType)
            .FirstOrDefaultAsync(m => m.Id == mappingId && m.FormId == formId).ConfigureAwait(false);

        if (mapping == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Mapping not found",
                Detail = $"Visa mapping with ID {mappingId} was not found",
                Status = StatusCodes.Status404NotFound
            });
        }

        mapping.IsRequired = request.IsRequired;
        mapping.DisplayOrder = request.DisplayOrder;
        mapping.Notes = request.Notes;
        mapping.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);

        return Ok(new FormVisaTypeMappingResponse
        {
            Id = mapping.Id,
            FormId = mapping.FormId,
            VisaTypeId = mapping.VisaTypeId,
            VisaTypeCode = mapping.VisaType.Code,
            VisaTypeName = mapping.VisaType.Name,
            IsRequired = mapping.IsRequired,
            DisplayOrder = mapping.DisplayOrder,
            Notes = mapping.Notes
        });
    }

    /// <summary>
    /// Delete a visa type mapping
    /// </summary>
    [HttpDelete("{formId}/visa-mappings/{mappingId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteVisaMapping(Guid formId, Guid mappingId)
    {
        var mapping = await _context.FormVisaTypeMappings
            .FirstOrDefaultAsync(m => m.Id == mappingId && m.FormId == formId).ConfigureAwait(false);

        if (mapping == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Mapping not found",
                Detail = $"Visa mapping with ID {mappingId} was not found",
                Status = StatusCodes.Status404NotFound
            });
        }

        _context.FormVisaTypeMappings.Remove(mapping);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        return NoContent();
    }

    // ========== FORM DEPENDENCY ENDPOINTS ==========

    /// <summary>
    /// Get all dependencies for a form (forms that this form requires)
    /// </summary>
    [HttpGet("{formId}/dependencies")]
    [ProducesResponseType(typeof(FormDependencyResponse[]), StatusCodes.Status200OK)]
    public async Task<ActionResult<FormDependencyResponse[]>> GetFormDependencies(Guid formId, [FromQuery] int? visaTypeId = null)
    {
        var query = _context.FormDependencies
            .Include(d => d.DependentForm)
            .Include(d => d.VisaType)
            .Where(d => d.ParentFormId == formId);

        if (visaTypeId.HasValue)
        {
            query = query.Where(d => d.VisaTypeId == visaTypeId.Value);
        }

        var dependencies = await query
            .OrderBy(d => d.DisplayOrder)
            .ToListAsync().ConfigureAwait(false);

        var response = dependencies.Select(d => new FormDependencyResponse
        {
            Id = d.Id,
            ParentFormId = d.ParentFormId,
            DependentFormId = d.DependentFormId,
            DependentFormNumber = d.DependentForm.FormNumber,
            DependentFormName = d.DependentForm.FormName,
            VisaTypeId = d.VisaTypeId,
            VisaTypeCode = d.VisaType.Code,
            VisaTypeName = d.VisaType.Name,
            IsRequired = d.IsRequired,
            DependencyReason = d.DependencyReason,
            DisplayOrder = d.DisplayOrder
        }).ToArray();

        return Ok(response);
    }

    /// <summary>
    /// Create a new form dependency
    /// </summary>
    [HttpPost("{formId}/dependencies")]
    [ProducesResponseType(typeof(FormDependencyResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<FormDependencyResponse>> CreateFormDependency(Guid formId, [FromBody] CreateFormDependencyRequest request)
    {
        // Prevent circular dependencies
        if (formId == request.DependentFormId)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Circular dependency",
                Detail = "A form cannot depend on itself",
                Status = StatusCodes.Status400BadRequest
            });
        }

        // Check if dependency already exists
        var exists = await _context.FormDependencies
            .AnyAsync(d => d.ParentFormId == formId
                && d.DependentFormId == request.DependentFormId
                && d.VisaTypeId == request.VisaTypeId).ConfigureAwait(false);

        if (exists)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Duplicate dependency",
                Detail = "This dependency already exists for this visa type",
                Status = StatusCodes.Status400BadRequest
            });
        }

        var dependency = new FormDependencyEntity
        {
            ParentFormId = formId,
            DependentFormId = request.DependentFormId,
            VisaTypeId = request.VisaTypeId,
            IsRequired = request.IsRequired,
            DependencyReason = request.DependencyReason,
            DisplayOrder = request.DisplayOrder,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.FormDependencies.Add(dependency);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Reload with relationships
        await _context.Entry(dependency)
            .Reference(d => d.DependentForm)
            .LoadAsync().ConfigureAwait(false);
        await _context.Entry(dependency)
            .Reference(d => d.VisaType)
            .LoadAsync().ConfigureAwait(false);

        var response = new FormDependencyResponse
        {
            Id = dependency.Id,
            ParentFormId = dependency.ParentFormId,
            DependentFormId = dependency.DependentFormId,
            DependentFormNumber = dependency.DependentForm.FormNumber,
            DependentFormName = dependency.DependentForm.FormName,
            VisaTypeId = dependency.VisaTypeId,
            VisaTypeCode = dependency.VisaType.Code,
            VisaTypeName = dependency.VisaType.Name,
            IsRequired = dependency.IsRequired,
            DependencyReason = dependency.DependencyReason,
            DisplayOrder = dependency.DisplayOrder
        };

        return CreatedAtAction(nameof(GetFormDependencies), new { formId }, response);
    }

    /// <summary>
    /// Update a form dependency
    /// </summary>
    [HttpPut("{formId}/dependencies/{dependencyId}")]
    [ProducesResponseType(typeof(FormDependencyResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FormDependencyResponse>> UpdateFormDependency(Guid formId, Guid dependencyId, [FromBody] UpdateFormDependencyRequest request)
    {
        var dependency = await _context.FormDependencies
            .Include(d => d.DependentForm)
            .Include(d => d.VisaType)
            .FirstOrDefaultAsync(d => d.Id == dependencyId && d.ParentFormId == formId).ConfigureAwait(false);

        if (dependency == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Dependency not found",
                Detail = $"Dependency with ID {dependencyId} was not found",
                Status = StatusCodes.Status404NotFound
            });
        }

        dependency.IsRequired = request.IsRequired;
        dependency.DependencyReason = request.DependencyReason;
        dependency.DisplayOrder = request.DisplayOrder;
        dependency.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);

        return Ok(new FormDependencyResponse
        {
            Id = dependency.Id,
            ParentFormId = dependency.ParentFormId,
            DependentFormId = dependency.DependentFormId,
            DependentFormNumber = dependency.DependentForm.FormNumber,
            DependentFormName = dependency.DependentForm.FormName,
            VisaTypeId = dependency.VisaTypeId,
            VisaTypeCode = dependency.VisaType.Code,
            VisaTypeName = dependency.VisaType.Name,
            IsRequired = dependency.IsRequired,
            DependencyReason = dependency.DependencyReason,
            DisplayOrder = dependency.DisplayOrder
        });
    }

    /// <summary>
    /// Delete a form dependency
    /// </summary>
    [HttpDelete("{formId}/dependencies/{dependencyId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteFormDependency(Guid formId, Guid dependencyId)
    {
        var dependency = await _context.FormDependencies
            .FirstOrDefaultAsync(d => d.Id == dependencyId && d.ParentFormId == formId).ConfigureAwait(false);

        if (dependency == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Dependency not found",
                Detail = $"Dependency with ID {dependencyId} was not found",
                Status = StatusCodes.Status404NotFound
            });
        }

        _context.FormDependencies.Remove(dependency);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        return NoContent();
    }

    private static USCISFormResponse MapFormToResponse(USCISFormEntity form)
    {
        var activePricing = form.Pricing?.FirstOrDefault(p => p.IsActive);

        return new USCISFormResponse
        {
            Id = form.Id,
            FormNumber = form.FormNumber,
            FormName = form.FormName,
            Description = form.Description,
            FormUrl = form.FormUrl,
            EstimatedTimeMinutes = form.EstimatedTimeMinutes,
            IsActive = form.IsActive,
            Pricing = activePricing != null ? new FormPricingResponse
            {
                Id = activePricing.Id,
                SelfFilePriceUSD = activePricing.SelfFilePriceUSD,
                ParalegalPriceUSD = activePricing.ParalegalPriceUSD,
                LawyerPriceUSD = activePricing.LawyerPriceUSD,
                LLCFeeUSD = activePricing.LLCFeeUSD,
                LLCFeePercentage = activePricing.LLCFeePercentage,
                Description = activePricing.Description,
                EffectiveDate = activePricing.EffectiveDate
            } : null,
            VisaTypeMappingCount = form.VisaTypeMappings?.Count ?? 0,
            CreatedAt = form.CreatedAt,
            UpdatedAt = form.UpdatedAt
        };
    }
}

// DTOs
public record USCISFormResponse
{
    public Guid Id { get; init; }
    public string FormNumber { get; init; } = string.Empty;
    public string FormName { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? FormUrl { get; init; }
    public int? EstimatedTimeMinutes { get; init; }
    public bool IsActive { get; init; }
    public FormPricingResponse? Pricing { get; init; }
    public int VisaTypeMappingCount { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public record FormPricingResponse
{
    public Guid Id { get; init; }
    public decimal? SelfFilePriceUSD { get; init; }
    public decimal? ParalegalPriceUSD { get; init; }
    public decimal? LawyerPriceUSD { get; init; }
    public decimal LLCFeeUSD { get; init; }
    public decimal? LLCFeePercentage { get; init; }
    public string? Description { get; init; }
    public DateTime EffectiveDate { get; init; }
}

public record CreateUSCISFormRequest
{
    public string FormNumber { get; init; } = string.Empty;
    public string FormName { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? FormUrl { get; init; }
    public int? EstimatedTimeMinutes { get; init; }
    public bool IsActive { get; init; } = true;
    public CreateFormPricingRequest? Pricing { get; init; }
}

public record CreateFormPricingRequest
{
    public decimal? SelfFilePriceUSD { get; init; }
    public decimal? ParalegalPriceUSD { get; init; }
    public decimal? LawyerPriceUSD { get; init; }
    public decimal LLCFeeUSD { get; init; }
    public decimal? LLCFeePercentage { get; init; }
    public string? Description { get; init; }
}

public record UpdateUSCISFormRequest
{
    public string FormNumber { get; init; } = string.Empty;
    public string FormName { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? FormUrl { get; init; }
    public int? EstimatedTimeMinutes { get; init; }
    public bool IsActive { get; init; }
}

// Pricing DTOs
public record UpdateFormPricingRequest
{
    public decimal? SelfFilePriceUSD { get; init; }
    public decimal? ParalegalPriceUSD { get; init; }
    public decimal? LawyerPriceUSD { get; init; }
    public decimal LLCFeeUSD { get; init; }
    public decimal? LLCFeePercentage { get; init; }
    public string? Description { get; init; }
}

// Visa Mapping DTOs
public record FormVisaTypeMappingResponse
{
    public Guid Id { get; init; }
    public Guid FormId { get; init; }
    public int VisaTypeId { get; init; }
    public string VisaTypeCode { get; init; } = string.Empty;
    public string VisaTypeName { get; init; } = string.Empty;
    public bool IsRequired { get; init; }
    public int DisplayOrder { get; init; }
    public string? Notes { get; init; }
}

public record CreateVisaMappingRequest
{
    public int VisaTypeId { get; init; }
    public bool IsRequired { get; init; } = true;
    public int DisplayOrder { get; init; }
    public string? Notes { get; init; }
}

public record UpdateVisaMappingRequest
{
    public bool IsRequired { get; init; }
    public int DisplayOrder { get; init; }
    public string? Notes { get; init; }
}

// Form Dependency DTOs
public record FormDependencyResponse
{
    public Guid Id { get; init; }
    public Guid ParentFormId { get; init; }
    public Guid DependentFormId { get; init; }
    public string DependentFormNumber { get; init; } = string.Empty;
    public string DependentFormName { get; init; } = string.Empty;
    public int VisaTypeId { get; init; }
    public string VisaTypeCode { get; init; } = string.Empty;
    public string VisaTypeName { get; init; } = string.Empty;
    public bool IsRequired { get; init; }
    public string? DependencyReason { get; init; }
    public int DisplayOrder { get; init; }
}

public record CreateFormDependencyRequest
{
    public Guid DependentFormId { get; init; }
    public int VisaTypeId { get; init; }
    public bool IsRequired { get; init; } = true;
    public string? DependencyReason { get; init; }
    public int DisplayOrder { get; init; }
}

public record UpdateFormDependencyRequest
{
    public bool IsRequired { get; init; }
    public string? DependencyReason { get; init; }
    public int DisplayOrder { get; init; }
}
