using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;

namespace L4H.Infrastructure.SeedData;

public class USSubdivisionsSeeder : ISeedTask
{
    public string Name => "US Subdivisions";

    private readonly L4HDbContext _context;
    private readonly ILogger<USSubdivisionsSeeder> _logger;

    public USSubdivisionsSeeder(L4HDbContext context, ILogger<USSubdivisionsSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        var existingCount = await _context.USSubdivisions.CountAsync().ConfigureAwait(false);
        if (existingCount > 0)
        {
            _logger.LogDebug("US Subdivisions already seeded ({Count} records), skipping", existingCount);
            return;
        }

        var subdivisions = GetSubdivisionsData();
        
        foreach (var subdivisionData in subdivisions)
        {
            var existing = await _context.USSubdivisions.FirstOrDefaultAsync(s => s.Code == subdivisionData.Code).ConfigureAwait(false);
            if (existing == null)
            {
                _context.USSubdivisions.Add(new USSubdivision
                {
                    Code = subdivisionData.Code,
                    Name = subdivisionData.Name,
                    IsState = subdivisionData.IsState,
                    IsTerritory = subdivisionData.IsTerritory
                });
            }
        }

        await _context.SaveChangesAsync().ConfigureAwait(false);
        _logger.LogInformation("US Subdivisions seed data loaded successfully.");
    }

    private List<SubdivisionData> GetSubdivisionsData()
    {
        // Try to load from embedded JSON file first
        try
        {
            var assembly = typeof(USSubdivisionsSeeder).Assembly;
            var resourceName = "L4H.Infrastructure.SeedData.us_subdivisions.json";
            
            using var stream = assembly.GetManifestResourceStream(resourceName);
            if (stream != null)
            {
                using var reader = new StreamReader(stream);
                var json = reader.ReadToEnd();
                var subdivisions = JsonSerializer.Deserialize<List<SubdivisionData>>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                if (subdivisions != null && subdivisions.Any())
                {
                    return subdivisions;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not load US subdivisions from embedded JSON, falling back to sample data");
        }

        // Fallback to hardcoded sample data
        return new List<SubdivisionData>
        {
            new() { Code = "CA", Name = "California", IsState = true, IsTerritory = false },
            new() { Code = "NY", Name = "New York", IsState = true, IsTerritory = false },
            new() { Code = "TX", Name = "Texas", IsState = true, IsTerritory = false },
            new() { Code = "FL", Name = "Florida", IsState = true, IsTerritory = false },
            new() { Code = "PR", Name = "Puerto Rico", IsState = false, IsTerritory = true }
        };
    }

    private class SubdivisionData
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool IsState { get; set; }
        public bool IsTerritory { get; set; }
    }
}