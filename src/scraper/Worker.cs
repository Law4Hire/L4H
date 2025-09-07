using L4H.Infrastructure.Data;
using L4H.ScraperWorker.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

namespace L4H.ScraperWorker;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _configuration;
    private readonly IStringLocalizer _localizer;
    private readonly TimeSpan _interval;

    public Worker(
        ILogger<Worker> logger, 
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        IStringLocalizer localizer)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
        _configuration = configuration;
        _localizer = localizer;
        
        // Parse cron interval - default to 3 days
        var cronString = _configuration["Scraper:Cron"] ?? "P3D";
        _interval = ParseInterval(cronString);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Scraper Worker started at: {time}", DateTimeOffset.Now);
        
        // Run once at startup
        await RunScrapingCycleAsync(stoppingToken).ConfigureAwait(false);
        
        // Then run on interval
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(_interval, stoppingToken).ConfigureAwait(false);
                await RunScrapingCycleAsync(stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                // Expected when cancellation is requested
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in scraper worker main loop");
                // Continue running after error
            }
        }
        
        _logger.LogInformation("Scraper Worker stopped at: {time}", DateTimeOffset.Now);
    }

    private async Task RunScrapingCycleAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation(_localizer["Scraper.RunStarted"]);
        
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var scraperService = scope.ServiceProvider.GetRequiredService<WorkflowScraperService>();
        
        try
        {
            // Get all active visa types and countries to scrape
            var visaTypes = await context.VisaTypes.ToListAsync(cancellationToken).ConfigureAwait(false);
            var countries = await GetActiveCountriesAsync(context, cancellationToken).ConfigureAwait(false);
            
            var tasks = new List<Task>();
            var semaphore = new SemaphoreSlim(GetMaxConcurrency(), GetMaxConcurrency());
            
            foreach (var visaType in visaTypes)
            {
                foreach (var country in countries)
                {
                    tasks.Add(ScrapeWithSemaphoreAsync(
                        scraperService, 
                        semaphore, 
                        visaType.Code, 
                        country, 
                        cancellationToken));
                }
            }
            
            await Task.WhenAll(tasks).ConfigureAwait(false);
            
            _logger.LogInformation(_localizer["Scraper.RunCompleted"]);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during scraping cycle");
        }
    }

    private static async Task ScrapeWithSemaphoreAsync(
        WorkflowScraperService scraperService,
        SemaphoreSlim semaphore,
        string visaTypeCode,
        string countryCode,
        CancellationToken cancellationToken)
    {
        await semaphore.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            await scraperService.ScrapeAndProcessAsync(visaTypeCode, countryCode, cancellationToken).ConfigureAwait(false);
        }
        finally
        {
            semaphore.Release();
        }
    }

    private static async Task<List<string>> GetActiveCountriesAsync(L4HDbContext context, CancellationToken cancellationToken)
    {
        // For now, return a predefined list of countries
        // In production, this would come from configuration or database
        var countries = new List<string> { "ES", "FR", "DE", "IT", "AD" };
        
        // You could also query from existing cases or other sources
        // var activeCases = await context.Cases
        //     .Where(c => c.Status == "active")
        //     .Select(c => c.CountryCode)
        //     .Distinct()
        //     .ToListAsync(cancellationToken);
        
        return countries;
    }

    private int GetMaxConcurrency()
    {
        return _configuration.GetValue<int>("Scraper:MaxConcurrency", 3);
    }

    private TimeSpan ParseInterval(string cronString)
    {
        try
        {
            // Simple ISO 8601 duration parsing
            if (cronString.StartsWith("P"))
            {
                return TimeSpan.ParseExact(cronString, @"\P%d\D", null);
            }
            
            // Fallback to hours
            if (int.TryParse(cronString, out int hours))
            {
                return TimeSpan.FromHours(hours);
            }
        }
        catch
        {
            _logger.LogWarning("Could not parse interval '{Interval}', using default 3 days", cronString);
        }
        
        return TimeSpan.FromDays(3);
    }
}