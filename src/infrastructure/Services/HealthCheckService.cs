using L4H.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace L4H.Infrastructure.Services;

public interface IHealthCheckService
{
    Task<bool> IsHealthyAsync();
    Task<bool> IsReadyAsync();
}

public class HealthCheckService : IHealthCheckService
{
    private readonly L4HDbContext _context;
    private readonly ILogger<HealthCheckService> _logger;

    public HealthCheckService(L4HDbContext context, ILogger<HealthCheckService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public Task<bool> IsHealthyAsync()
    {
        // Basic liveness check - just return true if service is running
        return Task.FromResult(true);
    }

    public async Task<bool> IsReadyAsync()
    {
        try
        {
            // Check database connectivity
            await _context.Database.ExecuteSqlRawAsync("SELECT 1").ConfigureAwait(false);
            
            // Check uploads filesystem (basic check)
            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed");
            return false;
        }
    }
}
