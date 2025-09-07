using Microsoft.Extensions.Logging;

namespace L4H.Infrastructure.SeedData;

public class SeedRunner
{
    private readonly IEnumerable<ISeedTask> _seedTasks;
    private readonly ILogger<SeedRunner> _logger;

    public SeedRunner(IEnumerable<ISeedTask> seedTasks, ILogger<SeedRunner> logger)
    {
        _seedTasks = seedTasks;
        _logger = logger;
    }

    public async Task RunAllAsync()
    {
        _logger.LogInformation("Starting seed data execution...");

        foreach (var seedTask in _seedTasks)
        {
            try
            {
                _logger.LogInformation("Executing seed task: {TaskName}", seedTask.Name);
                await seedTask.ExecuteAsync().ConfigureAwait(false);
                _logger.LogInformation("Completed seed task: {TaskName}", seedTask.Name);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing seed task: {TaskName}", seedTask.Name);
                throw;
            }
        }

        _logger.LogInformation("Seed data execution completed.");
    }
}