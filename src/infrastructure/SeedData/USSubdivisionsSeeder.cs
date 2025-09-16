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

        // Use raw SQL to insert all US states and territories
        await SeedUSSubdivisionsFromSQL().ConfigureAwait(false);
        _logger.LogInformation("US Subdivisions seed data loaded successfully from SQL.");
    }

    private async Task SeedUSSubdivisionsFromSQL()
    {
        // All US States, DC, and territories
        var sql = @"
            INSERT INTO USSubdivisions (Code, Name, IsState, IsTerritory) VALUES
            -- All 50 US States plus Washington DC (IsState = 1, IsTerritory = 0)
            ('AL', 'Alabama', 1, 0),
            ('AK', 'Alaska', 1, 0),
            ('AZ', 'Arizona', 1, 0),
            ('AR', 'Arkansas', 1, 0),
            ('CA', 'California', 1, 0),
            ('CO', 'Colorado', 1, 0),
            ('CT', 'Connecticut', 1, 0),
            ('DE', 'Delaware', 1, 0),
            ('FL', 'Florida', 1, 0),
            ('GA', 'Georgia', 1, 0),
            ('HI', 'Hawaii', 1, 0),
            ('ID', 'Idaho', 1, 0),
            ('IL', 'Illinois', 1, 0),
            ('IN', 'Indiana', 1, 0),
            ('IA', 'Iowa', 1, 0),
            ('KS', 'Kansas', 1, 0),
            ('KY', 'Kentucky', 1, 0),
            ('LA', 'Louisiana', 1, 0),
            ('ME', 'Maine', 1, 0),
            ('MD', 'Maryland', 1, 0),
            ('MA', 'Massachusetts', 1, 0),
            ('MI', 'Michigan', 1, 0),
            ('MN', 'Minnesota', 1, 0),
            ('MS', 'Mississippi', 1, 0),
            ('MO', 'Missouri', 1, 0),
            ('MT', 'Montana', 1, 0),
            ('NE', 'Nebraska', 1, 0),
            ('NV', 'Nevada', 1, 0),
            ('NH', 'New Hampshire', 1, 0),
            ('NJ', 'New Jersey', 1, 0),
            ('NM', 'New Mexico', 1, 0),
            ('NY', 'New York', 1, 0),
            ('NC', 'North Carolina', 1, 0),
            ('ND', 'North Dakota', 1, 0),
            ('OH', 'Ohio', 1, 0),
            ('OK', 'Oklahoma', 1, 0),
            ('OR', 'Oregon', 1, 0),
            ('PA', 'Pennsylvania', 1, 0),
            ('RI', 'Rhode Island', 1, 0),
            ('SC', 'South Carolina', 1, 0),
            ('SD', 'South Dakota', 1, 0),
            ('TN', 'Tennessee', 1, 0),
            ('TX', 'Texas', 1, 0),
            ('UT', 'Utah', 1, 0),
            ('VT', 'Vermont', 1, 0),
            ('VA', 'Virginia', 1, 0),
            ('WA', 'Washington', 1, 0),
            ('WV', 'West Virginia', 1, 0),
            ('WI', 'Wisconsin', 1, 0),
            ('WY', 'Wyoming', 1, 0),
            ('DC', 'Washington DC', 1, 0),

            -- US Territories (IsState = 0, IsTerritory = 1)
            ('AS', 'American Samoa', 0, 1),
            ('GU', 'Guam', 0, 1),
            ('MP', 'Northern Mariana Islands', 0, 1),
            ('PR', 'Puerto Rico', 0, 1),
            ('VI', 'US Virgin Islands', 0, 1),
            ('UM', 'US Minor Outlying Islands', 0, 1);
        ";

        await _context.Database.ExecuteSqlRawAsync(sql).ConfigureAwait(false);
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