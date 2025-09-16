using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;

namespace L4H.Infrastructure.SeedData;

public class VisaTypesSeeder : ISeedTask
{
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
        var existingCount = await _context.VisaTypes.CountAsync().ConfigureAwait(false);
        if (existingCount > 0)
        {
            _logger.LogDebug("Visa Types already seeded ({Count} records), skipping", existingCount);
            return;
        }

        var visaTypes = GetVisaTypesData();

        foreach (var visaTypeData in visaTypes)
        {
            var existing = await _context.VisaTypes.FirstOrDefaultAsync(v => v.Code == visaTypeData.Code).ConfigureAwait(false);
            if (existing == null)
            {
                _context.VisaTypes.Add(new VisaType
                {
                    Code = visaTypeData.Code,
                    Name = visaTypeData.Name,
                    IsActive = visaTypeData.IsActive
                });
            }
        }

        await _context.SaveChangesAsync().ConfigureAwait(false);
        _logger.LogInformation("Visa Types seed data loaded successfully with {Count} visa types.", visaTypes.Count);
    }

    private List<VisaTypeData> GetVisaTypesData()
    {
        // Try to load from external JSON file first
        try
        {
            var jsonFilePath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "SpecSQL", "VisaTypes.json");
            if (File.Exists(jsonFilePath))
            {
                var json = File.ReadAllText(jsonFilePath);
                var visaTypesWrapper = JsonSerializer.Deserialize<VisaTypesWrapper>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (visaTypesWrapper?.Visas != null && visaTypesWrapper.Visas.Any())
                {
                    var visaTypes = visaTypesWrapper.Visas.Select(v => new VisaTypeData
                    {
                        Code = v.VisaName.Length > 10 ? v.VisaName.Substring(0, 10) : v.VisaName,
                        Name = v.VisaName,
                        IsActive = v.Status.Equals("Active", StringComparison.OrdinalIgnoreCase)
                    }).ToList();

                    _logger.LogInformation("Loaded {Count} visa types from external JSON file", visaTypes.Count);
                    return visaTypes;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not load visa types from external JSON, falling back to sample data");
        }

        // Fallback to hardcoded sample data
        return new List<VisaTypeData>
        {
            new() { Code = "B-1", Name = "Business Visitor", IsActive = true },
            new() { Code = "B-2", Name = "Tourist Visitor", IsActive = true },
            new() { Code = "F-1", Name = "Academic Student", IsActive = true },
            new() { Code = "H-1B", Name = "Specialty Occupation Worker", IsActive = true },
            new() { Code = "L-1", Name = "Intracompany Transferee", IsActive = true },
            new() { Code = "O-1", Name = "Extraordinary Ability", IsActive = true },
            new() { Code = "EB-5", Name = "Immigrant Investor", IsActive = true }
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