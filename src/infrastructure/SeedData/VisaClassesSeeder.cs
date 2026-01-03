using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;

namespace L4H.Infrastructure.SeedData;

public class VisaClassesSeeder : ISeedTask
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

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
        // Try to load from external JSON file first (same as VisaTypesSeeder)
        try
        {
            var jsonFilePath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "SpecSQL", "VisaTypes.json");
            if (File.Exists(jsonFilePath))
            {
                var json = File.ReadAllText(jsonFilePath);
                var visaTypesWrapper = JsonSerializer.Deserialize<VisaTypesWrapper>(json, JsonOptions);

                if (visaTypesWrapper?.Visas != null && visaTypesWrapper.Visas.Count > 0)
                {
                    var visaClasses = visaTypesWrapper.Visas.Select(v => new VisaClassData
                    {
                        Code = v.VisaName.Length > 10 ? v.VisaName.Substring(0, 10) : v.VisaName,
                        Name = v.VisaName,
                        GeneralCategory = ExtractCategory(v.VisaName),
                        IsActive = v.Status.Equals("Active", StringComparison.OrdinalIgnoreCase)
                    }).ToList();

                    return visaClasses;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not load visa classes from external JSON, falling back to embedded/sample data");
        }

        // Try to load from embedded JSON file next
        try
        {
            var assembly = typeof(VisaClassesSeeder).Assembly;
            var resourceName = "L4H.Infrastructure.SeedData.visa_classes.json";
            
            using var stream = assembly.GetManifestResourceStream(resourceName);
            if (stream != null)
            {
                using var reader = new StreamReader(stream);
                var json = reader.ReadToEnd();
                var visaClasses = JsonSerializer.Deserialize<List<VisaClassData>>(json, JsonOptions);
                if (visaClasses != null && visaClasses.Count > 0)
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

    private string ExtractCategory(string visaName)
    {
        if (visaName.StartsWith("EB")) return "Employment-Based Immigrant";
        if (visaName.StartsWith("FB")) return "Family-Based Immigrant";
        if (visaName.StartsWith("F-") || visaName.StartsWith("M-")) return "Student";
        if (visaName.StartsWith("H-") || visaName.StartsWith("L-") || visaName.StartsWith("O-") || visaName.StartsWith("P-")) return "Temporary Worker";
        if (visaName.StartsWith("B-")) return "Visitor";
        return "Other";
    }

    private class VisaTypesWrapper
    {
        public List<VisaData> Visas { get; set; } = new List<VisaData>();
    }

    private class VisaData
    {
        public string VisaName { get; set; } = string.Empty;
        public string VisaDescription { get; set; } = string.Empty;
        public string VisaAppropriateFor { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    private class VisaClassData
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? GeneralCategory { get; set; }
        public bool IsActive { get; set; }
    }
}