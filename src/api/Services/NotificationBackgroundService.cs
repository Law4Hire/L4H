using L4H.Infrastructure.Services;

namespace L4H.Api.Services;

public class NotificationBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<NotificationBackgroundService> _logger;
    private readonly TimeSpan _processingInterval = TimeSpan.FromMinutes(5); // Process every 5 minutes

    public NotificationBackgroundService(IServiceProvider serviceProvider, ILogger<NotificationBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Notification background service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                // Process pending email notifications
                await notificationService.ProcessPendingEmailNotificationsAsync();

                // Cleanup expired notifications
                await notificationService.CleanupExpiredNotificationsAsync();

                _logger.LogDebug("Notification processing cycle completed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during notification processing");
            }

            await Task.Delay(_processingInterval, stoppingToken);
        }

        _logger.LogInformation("Notification background service stopped");
    }
}