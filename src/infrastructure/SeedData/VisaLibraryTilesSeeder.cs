using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;

namespace L4H.Infrastructure.SeedData;

public class VisaLibraryTilesSeeder : ISeedTask
{
    private readonly L4HDbContext _context;
    private readonly ILogger<VisaLibraryTilesSeeder> _logger;

    public string Name => "Visa Library Tiles";

    public VisaLibraryTilesSeeder(L4HDbContext context, ILogger<VisaLibraryTilesSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        // Check if we already have visa library tiles
        var tiles = await _context.VisaLibraryTiles.ToListAsync().ConfigureAwait(false);
        if (!tiles.Any())
        {
            _logger.LogInformation("[SEED] Seeding visa library tiles...");

            var newTiles = new List<VisaLibraryTile>
            {
                new VisaLibraryTile
                {
                    Id = Guid.NewGuid(),
                    Name = "Nonimmigrant Visas",
                    Description = "Temporary visas for tourism, business, work, study, and other temporary purposes in the United States.",
                    DisplayOrder = 1,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new VisaLibraryTile
                {
                    Id = Guid.NewGuid(),
                    Name = "Immigrant Visas",
                    Description = "Permanent residence visas (Green Cards) for those seeking to live permanently in the United States.",
                    DisplayOrder = 2,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new VisaLibraryTile
                {
                    Id = Guid.NewGuid(),
                    Name = "Naturalization, Citizenship and Adoption",
                    Description = "Pathways to U.S. citizenship through naturalization, derivative citizenship, and international adoption.",
                    DisplayOrder = 3,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new VisaLibraryTile
                {
                    Id = Guid.NewGuid(),
                    Name = "Asylum, TPS, Humanitarian",
                    Description = "Protection and relief for individuals fleeing persecution, violence, or disaster situations.",
                    DisplayOrder = 4,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new VisaLibraryTile
                {
                    Id = Guid.NewGuid(),
                    Name = "Inadmissible, Overstay, No Qualifying Relationship",
                    Description = "Options and waivers for individuals facing inadmissibility, visa overstays, or lack of qualifying relationships.",
                    DisplayOrder = 5,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            await _context.VisaLibraryTiles.AddRangeAsync(newTiles).ConfigureAwait(false);
            await _context.SaveChangesAsync().ConfigureAwait(false);
            tiles = newTiles;
        }

        // Always check if mappings exist, add them if missing
        var existingMappings = await _context.VisaLibraryTileMappings.AnyAsync().ConfigureAwait(false);
        if (!existingMappings)
        {
            _logger.LogInformation("[SEED] Adding default mappings for visa library tiles...");
            
            var nonimmigrantTile = tiles.FirstOrDefault(t => t.Name == "Nonimmigrant Visas");
            var immigrantTile = tiles.FirstOrDefault(t => t.Name == "Immigrant Visas");

            if (nonimmigrantTile == null || immigrantTile == null) return;

            var visaTypes = await _context.VisaTypes.ToListAsync().ConfigureAwait(false);
            
            if (visaTypes.Any())
            {
                var mappings = new List<VisaLibraryTileMapping>();
                var order = 0;

                // Map common non-immigrant visas
                var niCodes = new[] { "B-1", "B-2", "F-1", "H-1B", "L-1A", "O-1", "TN", "E-2" };
                foreach (var code in niCodes)
                {
                    var vt = visaTypes.FirstOrDefault(v => v.Code == code);
                    if (vt != null)
                    {
                        mappings.Add(new VisaLibraryTileMapping
                        {
                            Id = Guid.NewGuid(),
                            TileId = nonimmigrantTile.Id,
                            VisaTypeId = vt.Id,
                            DisplayOrder = order++,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }

                // Map common immigrant visas
                var iCodes = new[] { "EB-1A", "EB-1B", "EB-1C", "EB-2A", "EB-2B", "EB2-NIW", "EB-3", "EB-5" };
                order = 0;
                foreach (var code in iCodes)
                {
                    var vt = visaTypes.FirstOrDefault(v => v.Code == code);
                    if (vt != null)
                    {
                        mappings.Add(new VisaLibraryTileMapping
                        {
                            Id = Guid.NewGuid(),
                            TileId = immigrantTile.Id,
                            VisaTypeId = vt.Id,
                            DisplayOrder = order++,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }

                if (mappings.Any())
                {
                    await _context.VisaLibraryTileMappings.AddRangeAsync(mappings).ConfigureAwait(false);
                    await _context.SaveChangesAsync().ConfigureAwait(false);
                    _logger.LogInformation("[SEED] Successfully seeded {Count} mappings", mappings.Count);
                }
            }
            else
            {
                _logger.LogWarning("[SEED] No visa types found to create mappings");
            }
        }

        _logger.LogInformation("[SEED] Visa library seeding check complete");
    }
}
