using L4H.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;

namespace L4H.Api.Controllers;

[ApiController]
[Route("")]
[Tags("Health")]
public class HealthController : ControllerBase
{
    private readonly IHealthCheckService _healthCheckService;

    public HealthController(IHealthCheckService healthCheckService)
    {
        _healthCheckService = healthCheckService;
    }

    /// <summary>
    /// Liveness probe - basic health check
    /// </summary>
    /// <returns>Health status</returns>
    [HttpGet("healthz")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Health()
    {
        var isHealthy = await _healthCheckService.IsHealthyAsync().ConfigureAwait(false);
        
        if (isHealthy)
        {
            return Ok(new { status = "ok", timestamp = DateTime.UtcNow });
        }
        
        return StatusCode(503, new { status = "unhealthy", timestamp = DateTime.UtcNow });
    }

    /// <summary>
    /// Readiness probe - checks dependencies
    /// </summary>
    /// <returns>Readiness status</returns>
    [HttpGet("ready")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Ready()
    {
        var isReady = await _healthCheckService.IsReadyAsync().ConfigureAwait(false);
        
        if (isReady)
        {
            return Ok(new { status = "ready", timestamp = DateTime.UtcNow });
        }
        
        return StatusCode(503, new { status = "not ready", timestamp = DateTime.UtcNow });
    }
}
