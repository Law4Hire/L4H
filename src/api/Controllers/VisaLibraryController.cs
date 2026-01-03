using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/visa-library")]
[Tags("Visa Library")]
public class VisaLibraryController : ControllerBase
{
    private readonly L4HDbContext _context;
    private readonly ILogger<VisaLibraryController> _logger;

    public VisaLibraryController(L4HDbContext context, ILogger<VisaLibraryController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all visa library tiles with their assigned visa types (Public)
    /// </summary>
    [HttpGet("tiles")]
    [ProducesResponseType(typeof(VisaLibraryTileResponse[]), StatusCodes.Status200OK)]
    public async Task<ActionResult<VisaLibraryTileResponse[]>> GetTiles([FromQuery] bool includeInactive = false)
    {
        var query = _context.VisaLibraryTiles
            .Include(t => t.VisaTypeMappings)
                .ThenInclude(m => m.VisaType)
            .AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(t => t.IsActive);
        }

        var tiles = await query
            .OrderBy(t => t.DisplayOrder)
            .ToListAsync()
            .ConfigureAwait(false);

        var response = tiles.Select(t => new VisaLibraryTileResponse
        {
            Id = t.Id.ToString(),
            Name = t.Name,
            Description = t.Description,
            DisplayOrder = t.DisplayOrder,
            IsActive = t.IsActive,
            VisaTypes = t.VisaTypeMappings
                .Where(m => includeInactive || m.VisaType.IsActive)
                .OrderBy(m => m.DisplayOrder)
                .Select(m => new TileVisaTypeInfo
                {
                    Id = m.VisaType.Id,
                    Name = m.VisaType.Name,
                    Code = m.VisaType.Code,
                    Description = L4H.Api.Helpers.VisaDescriptionHelper.GetDescription(m.VisaType.Code),
                    IsActive = m.VisaType.IsActive
                })
                .ToArray()
        }).ToArray();

        return Ok(response);
    }

    /// <summary>
    /// Get all tiles for admin management (includes all data)
    /// </summary>
    [HttpGet("admin/tiles")]
    [Authorize(Policy = "IsAdmin")]
    [ProducesResponseType(typeof(AdminVisaLibraryTileResponse[]), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AdminVisaLibraryTileResponse[]>> GetAdminTiles()
    {
        var tiles = await _context.VisaLibraryTiles
            .Include(t => t.VisaTypeMappings)
                .ThenInclude(m => m.VisaType)
            .OrderBy(t => t.DisplayOrder)
            .ToListAsync()
            .ConfigureAwait(false);

        var response = tiles.Select(t => new AdminVisaLibraryTileResponse
        {
            Id = t.Id.ToString(),
            Name = t.Name,
            Description = t.Description,
            DisplayOrder = t.DisplayOrder,
            IsActive = t.IsActive,
            CreatedAt = t.CreatedAt,
            UpdatedAt = t.UpdatedAt,
            AssignedVisaTypeIds = t.VisaTypeMappings
                .OrderBy(m => m.DisplayOrder)
                .Select(m => m.VisaTypeId)
                .ToArray()
        }).ToArray();

        return Ok(response);
    }

    /// <summary>
    /// Create a new visa library tile (Admin only)
    /// </summary>
    [HttpPost("admin/tiles")]
    [Authorize(Policy = "IsAdmin")]
    [ProducesResponseType(typeof(AdminVisaLibraryTileResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AdminVisaLibraryTileResponse>> CreateTile([FromBody] CreateVisaLibraryTileRequest request)
    {
        var tile = new VisaLibraryTile
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            DisplayOrder = request.DisplayOrder,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.VisaLibraryTiles.Add(tile);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        _logger.LogInformation("Created visa library tile: {TileId} - {TileName}", tile.Id, tile.Name);

        var response = new AdminVisaLibraryTileResponse
        {
            Id = tile.Id.ToString(),
            Name = tile.Name,
            Description = tile.Description,
            DisplayOrder = tile.DisplayOrder,
            IsActive = tile.IsActive,
            CreatedAt = tile.CreatedAt,
            UpdatedAt = tile.UpdatedAt,
            AssignedVisaTypeIds = Array.Empty<int>()
        };

        return CreatedAtAction(nameof(GetAdminTiles), new { id = tile.Id }, response);
    }

    /// <summary>
    /// Update a visa library tile (Admin only)
    /// </summary>
    [HttpPut("admin/tiles/{id}")]
    [Authorize(Policy = "IsAdmin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> UpdateTile(Guid id, [FromBody] UpdateVisaLibraryTileRequest request)
    {
        var tile = await _context.VisaLibraryTiles
            .FirstOrDefaultAsync(t => t.Id == id)
            .ConfigureAwait(false);

        if (tile == null)
        {
            return NotFound();
        }

        tile.Name = request.Name;
        tile.Description = request.Description;
        tile.DisplayOrder = request.DisplayOrder;
        tile.IsActive = request.IsActive;
        tile.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);

        _logger.LogInformation("Updated visa library tile: {TileId} - {TileName}", tile.Id, tile.Name);

        return Ok();
    }

    /// <summary>
    /// Delete a visa library tile (Admin only)
    /// </summary>
    [HttpDelete("admin/tiles/{id}")]
    [Authorize(Policy = "IsAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> DeleteTile(Guid id)
    {
        var tile = await _context.VisaLibraryTiles
            .Include(t => t.VisaTypeMappings)
            .FirstOrDefaultAsync(t => t.Id == id)
            .ConfigureAwait(false);

        if (tile == null)
        {
            return NotFound();
        }

        // Remove all visa type mappings first
        _context.VisaLibraryTileMappings.RemoveRange(tile.VisaTypeMappings);
        _context.VisaLibraryTiles.Remove(tile);

        await _context.SaveChangesAsync().ConfigureAwait(false);

        _logger.LogInformation("Deleted visa library tile: {TileId} - {TileName}", tile.Id, tile.Name);

        return NoContent();
    }

    /// <summary>
    /// Assign visa types to a tile (Admin only)
    /// Replaces all existing visa type assignments
    /// </summary>
    [HttpPost("admin/tiles/{id}/visa-types")]
    [Authorize(Policy = "IsAdmin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> AssignVisaTypes(Guid id, [FromBody] AssignVisaTypesRequest request)
    {
        var tile = await _context.VisaLibraryTiles
            .Include(t => t.VisaTypeMappings)
            .FirstOrDefaultAsync(t => t.Id == id)
            .ConfigureAwait(false);

        if (tile == null)
        {
            return NotFound();
        }

        // Remove existing mappings
        _context.VisaLibraryTileMappings.RemoveRange(tile.VisaTypeMappings);

        // Add new mappings
        var displayOrder = 0;
        foreach (var visaTypeId in request.VisaTypeIds)
        {
            var mapping = new VisaLibraryTileMapping
            {
                Id = Guid.NewGuid(),
                TileId = id,
                VisaTypeId = visaTypeId,
                DisplayOrder = displayOrder++,
                CreatedAt = DateTime.UtcNow
            };
            _context.VisaLibraryTileMappings.Add(mapping);
        }

        tile.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync().ConfigureAwait(false);

        _logger.LogInformation("Assigned {Count} visa types to tile: {TileId}", request.VisaTypeIds.Length, id);

        return Ok();
    }

    /// <summary>
    /// Remove a specific visa type from a tile (Admin only)
    /// </summary>
    [HttpDelete("admin/tiles/{id}/visa-types/{visaTypeId}")]
    [Authorize(Policy = "IsAdmin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> RemoveVisaType(Guid id, int visaTypeId)
    {
        var mapping = await _context.VisaLibraryTileMappings
            .FirstOrDefaultAsync(m => m.TileId == id && m.VisaTypeId == visaTypeId)
            .ConfigureAwait(false);

        if (mapping == null)
        {
            return NotFound();
        }

        _context.VisaLibraryTileMappings.Remove(mapping);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        _logger.LogInformation("Removed visa type {VisaTypeId} from tile: {TileId}", visaTypeId, id);

        return NoContent();
    }
}

// DTOs
public class VisaLibraryTileResponse
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public TileVisaTypeInfo[] VisaTypes { get; set; } = Array.Empty<TileVisaTypeInfo>();
}

public class TileVisaTypeInfo
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class AdminVisaLibraryTileResponse
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int[] AssignedVisaTypeIds { get; set; } = Array.Empty<int>();
}

public class CreateVisaLibraryTileRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateVisaLibraryTileRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}

public class AssignVisaTypesRequest
{
    public int[] VisaTypeIds { get; set; } = Array.Empty<int>();
}
