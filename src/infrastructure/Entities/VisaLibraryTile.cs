using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace L4H.Infrastructure.Entities;

/// <summary>
/// Tiles/categories for organizing the Visa Library (e.g., Non-Immigrant, Employment-Based, Family-Based)
/// </summary>
[Table("VisaLibraryTiles")]
public class VisaLibraryTile
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public int DisplayOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    // Navigation property
    public virtual ICollection<VisaLibraryTileMapping> VisaTypeMappings { get; set; } = new List<VisaLibraryTileMapping>();
}

/// <summary>
/// Maps visa types to library tiles (many-to-many relationship)
/// </summary>
[Table("VisaLibraryTileMappings")]
public class VisaLibraryTileMapping
{
    [Key]
    public Guid Id { get; set; }

    public Guid TileId { get; set; }

    [ForeignKey(nameof(TileId))]
    public virtual VisaLibraryTile Tile { get; set; } = null!;

    public int VisaTypeId { get; set; }

    [ForeignKey(nameof(VisaTypeId))]
    public virtual VisaType VisaType { get; set; } = null!;

    public int DisplayOrder { get; set; }

    public DateTime CreatedAt { get; set; }
}
