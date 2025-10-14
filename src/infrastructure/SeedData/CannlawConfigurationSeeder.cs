using L4H.Infrastructure.Services;
using Microsoft.Extensions.Logging;

namespace L4H.Infrastructure.SeedData;

public class CannlawConfigurationSeeder : ISeedTask
{
    private readonly CannlawConfigurationService _configService;
    private readonly ILogger<CannlawConfigurationSeeder> _logger;

    public string Name => "Cannlaw Configuration Settings";

    public CannlawConfigurationSeeder(
        CannlawConfigurationService configService, 
        ILogger<CannlawConfigurationSeeder> logger)
    {
        _configService = configService;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("Starting Cannlaw configuration settings initialization...");

        try
        {
            await _configService.InitializeDefaultSettingsAsync();
            _logger.LogInformation("Cannlaw configuration settings initialized successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize Cannlaw configuration settings");
            throw;
        }
    }
}