using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;

namespace L4H.Infrastructure.SeedData;

public class CountryVisaTypesSeeder : ISeedTask
{
    public string Name => "CountryVisaTypes";

    private readonly L4HDbContext _context;
    private readonly ILogger<CountryVisaTypesSeeder> _logger;

    public CountryVisaTypesSeeder(L4HDbContext context, ILogger<CountryVisaTypesSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        var existingCount = await _context.CountryVisaTypes.CountAsync().ConfigureAwait(false);

        if (existingCount > 0)
        {
            _logger.LogDebug("CountryVisaTypes already seeded ({Count} records), skipping", existingCount);
            return;
        }

        _logger.LogInformation("Seeding CountryVisaTypes - assigning all visa types to all countries...");

        // Get all countries and visa types
        var countries = await _context.Countries.Where(c => c.IsActive).ToListAsync().ConfigureAwait(false);
        var visaTypes = await _context.VisaTypes.Where(v => v.IsActive).ToListAsync().ConfigureAwait(false);

        if (countries.Count == 0)
        {
            _logger.LogWarning("No countries found - cannot seed CountryVisaTypes");
            return;
        }

        if (visaTypes.Count == 0)
        {
            _logger.LogWarning("No visa types found - cannot seed CountryVisaTypes");
            return;
        }

        _logger.LogInformation("Found {CountryCount} countries and {VisaTypeCount} visa types", countries.Count, visaTypes.Count);

        // For US immigration visas, most are available to all countries with very few exceptions
        // We'll assign all visa types to all countries by default
        var countryVisaTypes = new List<CountryVisaType>();

        foreach (var country in countries)
        {
            foreach (var visaType in visaTypes)
            {
                countryVisaTypes.Add(new CountryVisaType
                {
                    CountryId = country.Id,
                    VisaTypeId = visaType.Id,
                    IsActive = true,
                    Notes = null // Can be updated later for country-specific requirements
                });
            }
        }

        _logger.LogInformation("Creating {Count} CountryVisaType associations...", countryVisaTypes.Count);

        // Add in batches for performance
        const int batchSize = 1000;
        for (int i = 0; i < countryVisaTypes.Count; i += batchSize)
        {
            var batch = countryVisaTypes.Skip(i).Take(batchSize).ToList();
            await _context.CountryVisaTypes.AddRangeAsync(batch).ConfigureAwait(false);
            await _context.SaveChangesAsync().ConfigureAwait(false);
            _logger.LogDebug("Inserted batch {Current}/{Total}", Math.Min(i + batchSize, countryVisaTypes.Count), countryVisaTypes.Count);
        }

        _logger.LogInformation("CountryVisaTypes seed data loaded successfully - {Count} associations created", countryVisaTypes.Count);
    }
}
