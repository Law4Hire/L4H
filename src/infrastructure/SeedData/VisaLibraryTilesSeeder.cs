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
        var existingTiles = await _context.VisaLibraryTiles.AnyAsync().ConfigureAwait(false);
        if (existingTiles)
        {
            _logger.LogInformation("[SEED] Visa library tiles already exist, skipping seed");
            return;
        }

        _logger.LogInformation("[SEED] Seeding visa library tiles...");

        var tiles = new List<VisaLibraryTile>
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

        await _context.VisaLibraryTiles.AddRangeAsync(tiles).ConfigureAwait(false);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        _logger.LogInformation("[SEED] Successfully seeded {Count} visa library tiles", tiles.Count);
    }
}
