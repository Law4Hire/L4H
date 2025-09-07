using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;

namespace L4H.Infrastructure.SeedData;

public class VisaClassesSeeder : ISeedTask
{
    public string Name => "Visa Classes";

    private readonly L4HDbContext _context;
    private readonly ILogger<VisaClassesSeeder> _logger;

    public VisaClassesSeeder(L4HDbContext context, ILogger<VisaClassesSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        var existingCount = await _context.VisaClasses.CountAsync().ConfigureAwait(false);
        if (existingCount > 0)
        {
            _logger.LogDebug("Visa Classes already seeded ({Count} records), skipping", existingCount);
            return;
        }

        var visaClasses = GetVisaClassesData();
        
        foreach (var visaClassData in visaClasses)
        {
            var existing = await _context.VisaClasses.FirstOrDefaultAsync(v => v.Code == visaClassData.Code).ConfigureAwait(false);
            if (existing == null)
            {
                _context.VisaClasses.Add(new VisaClass
                {
                    Code = visaClassData.Code,
                    Name = visaClassData.Name,
                    GeneralCategory = visaClassData.GeneralCategory,
                    IsActive = visaClassData.IsActive
                });
            }
        }

        await _context.SaveChangesAsync().ConfigureAwait(false);
        _logger.LogInformation("Visa Classes seed data loaded successfully.");
    }

    private List<VisaClassData> GetVisaClassesData()
    {
        // Try to load from embedded JSON file first
        try
        {
            var assembly = typeof(VisaClassesSeeder).Assembly;
            var resourceName = "L4H.Infrastructure.SeedData.visa_classes.json";
            
            using var stream = assembly.GetManifestResourceStream(resourceName);
            if (stream != null)
            {
                using var reader = new StreamReader(stream);
                var json = reader.ReadToEnd();
                var visaClasses = JsonSerializer.Deserialize<List<VisaClassData>>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                if (visaClasses != null && visaClasses.Any())
                {
                    return visaClasses;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not load visa classes from embedded JSON, falling back to sample data");
        }

        // Fallback to hardcoded sample data
        return new List<VisaClassData>
        {
            new() { Code = "B", Name = "Visitor", GeneralCategory = "Temporary Visitor", IsActive = true },
            new() { Code = "H", Name = "Temporary Worker", GeneralCategory = "Temporary Worker", IsActive = true },
            new() { Code = "L", Name = "Intracompany Transferee", GeneralCategory = "Temporary Worker", IsActive = true },
            new() { Code = "O", Name = "Extraordinary Ability", GeneralCategory = "Temporary Worker", IsActive = true },
            new() { Code = "EB", Name = "Employment-Based Immigrant", GeneralCategory = "Permanent Resident", IsActive = true },
            new() { Code = "F", Name = "Student", GeneralCategory = "Academic Student", IsActive = true },
            new() { Code = "TN", Name = "NAFTA Professional", GeneralCategory = "Temporary Worker", IsActive = true }
        };
    }

    private class VisaClassData
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? GeneralCategory { get; set; }
        public bool IsActive { get; set; }
    }
}