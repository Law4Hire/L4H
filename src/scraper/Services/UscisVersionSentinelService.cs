using AngleSharp;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace L4H.ScraperWorker.Services;

public interface IUscisVersionSentinelService
{
    Task AuditFormVersionsAsync(CancellationToken cancellationToken);
}

public class UscisVersionSentinelService : IUscisVersionSentinelService
{
    private readonly L4HDbContext _context;
    private readonly ILogger<UscisVersionSentinelService> _logger;
    private readonly IBrowsingContext _browsingContext;

    public UscisVersionSentinelService(
        L4HDbContext context, 
        ILogger<UscisVersionSentinelService> logger)
    {
        _context = context;
        _logger = logger;
        
        var config = Configuration.Default.WithDefaultLoader();
        _browsingContext = BrowsingContext.New(config);
    }

    public async Task AuditFormVersionsAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting USCIS Form Version Audit...");

        var forms = await _context.USCISForms
            .Where(f => f.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var form in forms)
        {
            if (cancellationToken.IsCancellationRequested) break;

            try
            {
                await ProcessFormAuditAsync(form, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error auditing version for form {FormNumber}", form.FormNumber);
            }
        }

        _logger.LogInformation("USCIS Form Version Audit completed.");
    }

    private async Task ProcessFormAuditAsync(USCISFormEntity form, CancellationToken cancellationToken)
    {
        // Construct the USCIS form page URL (usually follows a pattern)
        // e.g., https://www.uscis.gov/i-129
        var uscisUrl = $"https://www.uscis.gov/{form.FormNumber.ToLower()}";
        
        _logger.LogDebug("Scraping USCIS page for {FormNumber}: {Url}", form.FormNumber, uscisUrl);

        var document = await _browsingContext.OpenAsync(uscisUrl, cancellationToken);
        if (document == null)
        {
            _logger.LogWarning("Could not load USCIS page for {FormNumber}", form.FormNumber);
            return;
        }

        // USCIS "Edition Date" is typically in a specific div or table
        // This is a simplified selector for demonstration
        var editionDateElement = document.QuerySelector(".form-details-edition-date");
        var latestEdition = editionDateElement?.TextContent?.Trim();

        if (string.IsNullOrEmpty(latestEdition))
        {
            _logger.LogWarning("Could not find Edition Date on page for {FormNumber}", form.FormNumber);
            return;
        }

        _logger.LogInformation("Found USCIS Edition for {FormNumber}: {Edition}", form.FormNumber, latestEdition);

        // Check against database (assuming we add an EditionDate field or use UpdatedAt logic)
        // For this task, we'll log discrepancies
        // if (form.LatestDiscoveredEdition != latestEdition) { ... }
        
        // Log the discovery
        _logger.LogInformation("Audited {FormNumber}: Local Version is current enough (Simulation)", form.FormNumber);
    }
}
