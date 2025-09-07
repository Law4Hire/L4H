using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;

namespace L4H.Infrastructure.SeedData;

public class CountriesSeeder : ISeedTask
{
    public string Name => "Countries";

    private readonly L4HDbContext _context;
    private readonly ILogger<CountriesSeeder> _logger;

    public CountriesSeeder(L4HDbContext context, ILogger<CountriesSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        var existingCount = await _context.Countries.CountAsync().ConfigureAwait(false);
        if (existingCount > 0)
        {
            _logger.LogDebug("Countries already seeded ({Count} records), skipping", existingCount);
            return;
        }

        var countries = GetCountriesData();
        
        foreach (var countryData in countries)
        {
            var existing = await _context.Countries.FirstOrDefaultAsync(c => c.Iso2 == countryData.Iso2).ConfigureAwait(false);
            if (existing == null)
            {
                _context.Countries.Add(new Country
                {
                    Iso2 = countryData.Iso2,
                    Iso3 = countryData.Iso3,
                    Name = countryData.Name,
                    IsActive = countryData.IsActive
                });
            }
        }

        await _context.SaveChangesAsync().ConfigureAwait(false);
        _logger.LogInformation("Countries seed data loaded successfully.");
    }

    private List<CountryData> GetCountriesData()
    {
        // Try to load from embedded JSON file first
        try
        {
            var assembly = typeof(CountriesSeeder).Assembly;
            var resourceName = "L4H.Infrastructure.SeedData.countries.json";
            
            using var stream = assembly.GetManifestResourceStream(resourceName);
            if (stream != null)
            {
                using var reader = new StreamReader(stream);
                var json = reader.ReadToEnd();
                var countries = JsonSerializer.Deserialize<List<CountryData>>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                if (countries != null && countries.Any())
                {
                    return countries;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not load countries from embedded JSON, falling back to sample data");
        }

        // Fallback to hardcoded sample data
        return new List<CountryData>
        {
            new() { Iso2 = "US", Iso3 = "USA", Name = "United States", IsActive = true },
            new() { Iso2 = "IN", Iso3 = "IND", Name = "India", IsActive = true },
            new() { Iso2 = "PH", Iso3 = "PHL", Name = "Philippines", IsActive = true },
            new() { Iso2 = "ES", Iso3 = "ESP", Name = "Spain", IsActive = true },
            new() { Iso2 = "AD", Iso3 = "AND", Name = "Andorra", IsActive = true }
        };
    }

    private class CountryData
    {
        public string Iso2 { get; set; } = string.Empty;
        public string Iso3 { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }
}