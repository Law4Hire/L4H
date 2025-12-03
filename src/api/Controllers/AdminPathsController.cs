using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using System.Security.Claims;
using System.Text.Json;

namespace L4H.Api.Controllers;

[ApiController]
[Route("v1/admin/paths")]
[Authorize(Policy = "IsAdmin")]
[Tags("Admin")]
public class AdminPathsController : ControllerBase
{
    private readonly L4HDbContext _context;

    public AdminPathsController(L4HDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get all admin paths
    /// </summary>
    /// <returns>List of all admin paths ordered by display order</returns>
    [HttpGet]
    [ProducesResponseType(typeof(AdminPathResponse[]), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AdminPathResponse[]>> GetAllPaths()
    {
        var paths = await _context.AdminPaths
            .Include(p => p.ParentPath)
            .Include(p => p.ChildPaths)
            .Include(p => p.CreatedByUser)
            .Include(p => p.UpdatedByUser)
            .OrderBy(p => p.DisplayOrder)
            .ToListAsync().ConfigureAwait(false);

        var response = paths.Select(p => new AdminPathResponse
        {
            Id = p.Id,
            Name = p.Name,
            Path = p.Path,
            Description = p.Description,
            Icon = p.Icon,
            DisplayOrder = p.DisplayOrder,
            IsActive = p.IsActive,
            ParentPathId = p.ParentPathId,
            ParentPathName = p.ParentPath?.Name,
            RequiredRole = p.RequiredRole,
            ChildPathCount = p.ChildPaths.Count,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt,
            CreatedByUserEmail = p.CreatedByUser?.Email,
            UpdatedByUserEmail = p.UpdatedByUser?.Email
        }).ToArray();

        await LogAuditAsync("admin", "paths_view", "AdminPath", "multiple",
            new { pathCount = paths.Count }).ConfigureAwait(false);

        return Ok(response);
    }

    /// <summary>
    /// Get a single admin path by ID
    /// </summary>
    /// <param name="id">Path ID</param>
    /// <returns>Admin path details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AdminPathResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AdminPathResponse>> GetPath(Guid id)
    {
        var path = await _context.AdminPaths
            .Include(p => p.ParentPath)
            .Include(p => p.ChildPaths)
            .Include(p => p.CreatedByUser)
            .Include(p => p.UpdatedByUser)
            .FirstOrDefaultAsync(p => p.Id == id).ConfigureAwait(false);

        if (path == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Path not found",
                Detail = $"Admin path with ID {id} was not found",
                Status = StatusCodes.Status404NotFound
            });
        }

        var response = new AdminPathResponse
        {
            Id = path.Id,
            Name = path.Name,
            Path = path.Path,
            Description = path.Description,
            Icon = path.Icon,
            DisplayOrder = path.DisplayOrder,
            IsActive = path.IsActive,
            ParentPathId = path.ParentPathId,
            ParentPathName = path.ParentPath?.Name,
            RequiredRole = path.RequiredRole,
            ChildPathCount = path.ChildPaths.Count,
            CreatedAt = path.CreatedAt,
            UpdatedAt = path.UpdatedAt,
            CreatedByUserEmail = path.CreatedByUser?.Email,
            UpdatedByUserEmail = path.UpdatedByUser?.Email
        };

        await LogAuditAsync("admin", "path_view", "AdminPath", id.ToString(),
            new { pathName = path.Name }).ConfigureAwait(false);

        return Ok(response);
    }

    /// <summary>
    /// Create a new admin path
    /// </summary>
    /// <param name="request">Create path request</param>
    /// <returns>Created path</returns>
    [HttpPost]
    [ProducesResponseType(typeof(AdminPathResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AdminPathResponse>> CreatePath([FromBody] CreateAdminPathRequest request)
    {
        var userId = GetCurrentUserId();

        // Validate parent path exists if specified
        if (request.ParentPathId.HasValue)
        {
            var parentExists = await _context.AdminPaths
                .AnyAsync(p => p.Id == request.ParentPathId.Value).ConfigureAwait(false);

            if (!parentExists)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Parent path not found",
                    Detail = $"Parent path with ID {request.ParentPathId} was not found",
                    Status = StatusCodes.Status400BadRequest
                });
            }
        }

        var path = new AdminPath
        {
            Name = request.Name,
            Path = request.Path,
            Description = request.Description,
            Icon = request.Icon,
            DisplayOrder = request.DisplayOrder,
            IsActive = request.IsActive,
            ParentPathId = request.ParentPathId,
            RequiredRole = request.RequiredRole,
            CreatedByUserId = userId,
            UpdatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.AdminPaths.Add(path);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Reload with relationships
        await _context.Entry(path)
            .Reference(p => p.ParentPath)
            .LoadAsync().ConfigureAwait(false);
        await _context.Entry(path)
            .Collection(p => p.ChildPaths)
            .LoadAsync().ConfigureAwait(false);
        await _context.Entry(path)
            .Reference(p => p.CreatedByUser)
            .LoadAsync().ConfigureAwait(false);

        var response = new AdminPathResponse
        {
            Id = path.Id,
            Name = path.Name,
            Path = path.Path,
            Description = path.Description,
            Icon = path.Icon,
            DisplayOrder = path.DisplayOrder,
            IsActive = path.IsActive,
            ParentPathId = path.ParentPathId,
            ParentPathName = path.ParentPath?.Name,
            RequiredRole = path.RequiredRole,
            ChildPathCount = path.ChildPaths.Count,
            CreatedAt = path.CreatedAt,
            UpdatedAt = path.UpdatedAt,
            CreatedByUserEmail = path.CreatedByUser?.Email,
            UpdatedByUserEmail = path.CreatedByUser?.Email
        };

        await LogAuditAsync("admin", "path_create", "AdminPath", path.Id.ToString(),
            new { pathName = path.Name, pathUrl = path.Path }).ConfigureAwait(false);

        return CreatedAtAction(nameof(GetPath), new { id = path.Id }, response);
    }

    /// <summary>
    /// Update an existing admin path
    /// </summary>
    /// <param name="id">Path ID</param>
    /// <param name="request">Update path request</param>
    /// <returns>Updated path</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(AdminPathResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AdminPathResponse>> UpdatePath(Guid id, [FromBody] UpdateAdminPathRequest request)
    {
        var userId = GetCurrentUserId();

        var path = await _context.AdminPaths
            .Include(p => p.ParentPath)
            .Include(p => p.ChildPaths)
            .FirstOrDefaultAsync(p => p.Id == id).ConfigureAwait(false);

        if (path == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Path not found",
                Detail = $"Admin path with ID {id} was not found",
                Status = StatusCodes.Status404NotFound
            });
        }

        // Validate parent path exists if specified and prevent circular reference
        if (request.ParentPathId.HasValue)
        {
            if (request.ParentPathId.Value == id)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Invalid parent path",
                    Detail = "A path cannot be its own parent",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            var parentExists = await _context.AdminPaths
                .AnyAsync(p => p.Id == request.ParentPathId.Value).ConfigureAwait(false);

            if (!parentExists)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Parent path not found",
                    Detail = $"Parent path with ID {request.ParentPathId} was not found",
                    Status = StatusCodes.Status400BadRequest
                });
            }
        }

        // Update properties
        path.Name = request.Name;
        path.Path = request.Path;
        path.Description = request.Description;
        path.Icon = request.Icon;
        path.DisplayOrder = request.DisplayOrder;
        path.IsActive = request.IsActive;
        path.ParentPathId = request.ParentPathId;
        path.RequiredRole = request.RequiredRole;
        path.UpdatedByUserId = userId;
        path.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Reload relationships
        await _context.Entry(path)
            .Reference(p => p.ParentPath)
            .LoadAsync().ConfigureAwait(false);
        await _context.Entry(path)
            .Reference(p => p.UpdatedByUser)
            .LoadAsync().ConfigureAwait(false);

        var response = new AdminPathResponse
        {
            Id = path.Id,
            Name = path.Name,
            Path = path.Path,
            Description = path.Description,
            Icon = path.Icon,
            DisplayOrder = path.DisplayOrder,
            IsActive = path.IsActive,
            ParentPathId = path.ParentPathId,
            ParentPathName = path.ParentPath?.Name,
            RequiredRole = path.RequiredRole,
            ChildPathCount = path.ChildPaths.Count,
            CreatedAt = path.CreatedAt,
            UpdatedAt = path.UpdatedAt,
            CreatedByUserEmail = path.CreatedByUser?.Email,
            UpdatedByUserEmail = path.UpdatedByUser?.Email
        };

        await LogAuditAsync("admin", "path_update", "AdminPath", id.ToString(),
            new { pathName = path.Name, changes = request }).ConfigureAwait(false);

        return Ok(response);
    }

    /// <summary>
    /// Update display order for multiple paths
    /// </summary>
    /// <param name="request">Reorder request with path IDs and new orders</param>
    /// <returns>Success message</returns>
    [HttpPatch("reorder")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<MessageResponse>> ReorderPaths([FromBody] ReorderPathsRequest request)
    {
        var userId = GetCurrentUserId();

        // Validate all path IDs exist
        var pathIds = request.Paths.Select(p => p.PathId).ToArray();
        var paths = await _context.AdminPaths
            .Where(p => pathIds.Contains(p.Id))
            .ToListAsync().ConfigureAwait(false);

        if (paths.Count != pathIds.Length)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid path IDs",
                Detail = "One or more path IDs were not found",
                Status = StatusCodes.Status400BadRequest
            });
        }

        // Update display orders
        foreach (var orderUpdate in request.Paths)
        {
            var path = paths.First(p => p.Id == orderUpdate.PathId);
            path.DisplayOrder = orderUpdate.DisplayOrder;
            path.UpdatedByUserId = userId;
            path.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync().ConfigureAwait(false);

        await LogAuditAsync("admin", "paths_reorder", "AdminPath", "multiple",
            new { pathCount = paths.Count, updates = request.Paths }).ConfigureAwait(false);

        return Ok(new MessageResponse
        {
            Message = $"Successfully reordered {paths.Count} paths"
        });
    }

    /// <summary>
    /// Delete an admin path
    /// </summary>
    /// <param name="id">Path ID</param>
    /// <returns>Success message</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<MessageResponse>> DeletePath(Guid id)
    {
        var path = await _context.AdminPaths
            .Include(p => p.ChildPaths)
            .FirstOrDefaultAsync(p => p.Id == id).ConfigureAwait(false);

        if (path == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Path not found",
                Detail = $"Admin path with ID {id} was not found",
                Status = StatusCodes.Status404NotFound
            });
        }

        // Check if path has children
        if (path.ChildPaths.Any())
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Cannot delete path with children",
                Detail = $"This path has {path.ChildPaths.Count} child path(s). Please delete or reassign them first.",
                Status = StatusCodes.Status400BadRequest
            });
        }

        var pathName = path.Name;
        _context.AdminPaths.Remove(path);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        await LogAuditAsync("admin", "path_delete", "AdminPath", id.ToString(),
            new { pathName }).ConfigureAwait(false);

        return Ok(new MessageResponse
        {
            Message = $"Admin path '{pathName}' deleted successfully"
        });
    }

    private UserId? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim != null && Guid.TryParse(userIdClaim, out var guid))
        {
            return new UserId(guid);
        }
        return null;
    }

    private async Task LogAuditAsync(string category, string action, string targetType, string targetId, object details)
    {
        var userId = GetCurrentUserId();
        var auditLog = new AuditLog
        {
            Category = category,
            ActorUserId = userId,
            Action = action,
            TargetType = targetType,
            TargetId = targetId,
            DetailsJson = JsonSerializer.Serialize(details),
            CreatedAt = DateTime.UtcNow
        };

        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync().ConfigureAwait(false);
    }
}

// DTOs
public record AdminPathResponse
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Path { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? Icon { get; init; }
    public int DisplayOrder { get; init; }
    public bool IsActive { get; init; }
    public Guid? ParentPathId { get; init; }
    public string? ParentPathName { get; init; }
    public string? RequiredRole { get; init; }
    public int ChildPathCount { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public string? CreatedByUserEmail { get; init; }
    public string? UpdatedByUserEmail { get; init; }
}

public record CreateAdminPathRequest
{
    public string Name { get; init; } = string.Empty;
    public string Path { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? Icon { get; init; }
    public int DisplayOrder { get; init; }
    public bool IsActive { get; init; } = true;
    public Guid? ParentPathId { get; init; }
    public string? RequiredRole { get; init; }
}

public record UpdateAdminPathRequest
{
    public string Name { get; init; } = string.Empty;
    public string Path { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? Icon { get; init; }
    public int DisplayOrder { get; init; }
    public bool IsActive { get; init; }
    public Guid? ParentPathId { get; init; }
    public string? RequiredRole { get; init; }
}

public record ReorderPathsRequest
{
    public PathOrderUpdate[] Paths { get; init; } = Array.Empty<PathOrderUpdate>();
}

public record PathOrderUpdate
{
    public Guid PathId { get; init; }
    public int DisplayOrder { get; init; }
}

public record MessageResponse
{
    public string Message { get; init; } = string.Empty;
}
