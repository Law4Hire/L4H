using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class AdminPath
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Display name for the path (e.g., "User Management", "Pricing")
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// URL path (e.g., "/admin/users", "/admin/pricing")
    /// </summary>
    public string Path { get; set; } = string.Empty;

    /// <summary>
    /// Optional description of the path's purpose
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Icon name or class (e.g., "users", "dollar-sign")
    /// </summary>
    public string? Icon { get; set; }

    /// <summary>
    /// Display order (lower numbers appear first)
    /// </summary>
    public int DisplayOrder { get; set; }

    /// <summary>
    /// Whether this path is active/visible
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Parent path ID for hierarchical navigation (null for top-level)
    /// </summary>
    public Guid? ParentPathId { get; set; }

    /// <summary>
    /// Required permission/role to access (e.g., "admin", "super_admin")
    /// </summary>
    public string? RequiredRole { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public UserId? CreatedByUserId { get; set; }
    public UserId? UpdatedByUserId { get; set; }

    // Navigation properties
    public User? CreatedByUser { get; set; }
    public User? UpdatedByUser { get; set; }
    public AdminPath? ParentPath { get; set; }
    public ICollection<AdminPath> ChildPaths { get; set; } = new List<AdminPath>();
}
