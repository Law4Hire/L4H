using L4H.Infrastructure.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace L4H.Infrastructure.HostedServices;

public class RetentionBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RetentionBackgroundService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromHours(24); // Run daily

    public RetentionBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<RetentionBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public override Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Retention Background Service started");
        return base.StartAsync(cancellationToken);
    }

    public override Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Retention Background Service stopped");
        return base.StopAsync(cancellationToken);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var retentionService = scope.ServiceProvider.GetRequiredService<RetentionService>();
                
                _logger.LogInformation("Starting retention processing cycle");
                
                // Process retention queue - identify items that need retention actions
                await retentionService.ProcessRetentionQueueAsync().ConfigureAwait(false);
                
                // Execute queued retention actions
                await retentionService.ExecuteQueuedRetentionActionsAsync().ConfigureAwait(false);
                
                _logger.LogInformation("Retention processing cycle completed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during retention processing");
            }

            // Wait for the next interval or until cancellation
            try
            {
                await Task.Delay(_interval, stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                // Expected when cancellation is requested
                break;
            }
        }
    }
}