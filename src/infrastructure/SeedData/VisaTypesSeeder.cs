using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;

namespace L4H.Infrastructure.SeedData;

public class VisaTypesSeeder : ISeedTask
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public string Name => "Visa Types";

    private readonly L4HDbContext _context;
    private readonly ILogger<VisaTypesSeeder> _logger;

    public VisaTypesSeeder(L4HDbContext context, ILogger<VisaTypesSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        var visaTypesData = GetVisaTypesData();
        var addedCount = 0;
        var updatedCount = 0;

        foreach (var data in visaTypesData)
        {
            var existing = await _context.VisaTypes.FirstOrDefaultAsync(v => v.Code == data.Code).ConfigureAwait(false);
            if (existing == null)
            {
                _context.VisaTypes.Add(new VisaType
                {
                    Code = data.Code,
                    Name = data.Name,
                    IsActive = data.IsActive
                });
                addedCount++;
            }
            else
            {
                // Update existing if different (ensure they are active if the JSON says so)
                bool changed = false;
                if (existing.IsActive != data.IsActive) { existing.IsActive = data.IsActive; changed = true; }
                if (existing.Name != data.Name) { existing.Name = data.Name; changed = true; }
                
                if (changed) updatedCount++;
            }
        }

        if (addedCount > 0 || updatedCount > 0)
        {
            await _context.SaveChangesAsync().ConfigureAwait(false);
            var totalCount = await _context.VisaTypes.CountAsync().ConfigureAwait(false);
            _logger.LogInformation("[SEED] Added {AddedCount}, Updated {UpdatedCount}. Total visa types: {TotalCount}", 
                addedCount, updatedCount, totalCount);
        }
    }

    private List<VisaTypeData> GetVisaTypesData()
    {
        // Try to load from the bundled JSON file
        try
        {
            var assembly = typeof(VisaTypesSeeder).Assembly;
            var resourcePath = Path.Combine(AppContext.BaseDirectory, "SeedData", "Data", "visa_types.json");
            
            // Try direct file path first (works in most environments including Docker if copied correctly)
            if (!File.Exists(resourcePath))
            {
                // Fallback to relative path for development
                resourcePath = Path.Combine(Directory.GetCurrentDirectory(), "src", "infrastructure", "SeedData", "Data", "visa_types.json");
            }

            if (File.Exists(resourcePath))
            {
                var json = File.ReadAllText(resourcePath);
                var visaTypesWrapper = JsonSerializer.Deserialize<VisaTypesWrapper>(json, JsonOptions);

                if (visaTypesWrapper?.Visas != null && visaTypesWrapper.Visas.Count > 0)
                {
                    var visaTypes = visaTypesWrapper.Visas.Select(v => new VisaTypeData
                    {
                        Code = v.VisaName,
                        Name = v.VisaName + (string.IsNullOrEmpty(v.VisaDescription) ? "" : $" - {v.VisaDescription}"),
                        IsActive = v.Status.Equals("Active", StringComparison.OrdinalIgnoreCase)
                    }).ToList();

                    _logger.LogInformation("[SEED] Loaded {Count} visa types from JSON file", visaTypes.Count);
                    return visaTypes;
                }
            }
            else 
            {
                _logger.LogWarning("[SEED] Visa types JSON not found at {Path}", resourcePath);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[SEED] Could not load visa types from JSON, using minimal fallback");
        }

        // Fallback to hardcoded minimal data if JSON fails
        return new List<VisaTypeData>
        {
            new() { Code = "B-1", Name = "Business Visitor", IsActive = true },
            new() { Code = "B-2", Name = "Tourist Visitor", IsActive = true },
            new() { Code = "F-1", Name = "Academic Student", IsActive = true },
            new() { Code = "H-1B", Name = "Specialty Occupation Worker", IsActive = true },
            new() { Code = "NATZ", Name = "Naturalization / U.S. Citizenship", IsActive = true },
            new() { Code = "ADOP", Name = "International Adoption", IsActive = true }
        };
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

    private class VisaTypeData
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }
}