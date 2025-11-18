using Microsoft.AspNetCore.Mvc;
using L4H.Infrastructure.SeedData;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminSeedController : ControllerBase
{
    private readonly SeedRunner _seedRunner;
    private readonly ILogger<AdminSeedController> _logger;

    public AdminSeedController(SeedRunner seedRunner, ILogger<AdminSeedController> logger)
    {
        _seedRunner = seedRunner;
        _logger = logger;
    }

    [HttpPost("run-seed")]
    public async Task<IActionResult> RunSeed()
    {
        try
        {
            _logger.LogInformation("Manual seed triggered via API endpoint");
            await _seedRunner.RunAllAsync();
            _logger.LogInformation("Manual seed completed successfully");
            return Ok(new { Message = "Seed completed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Manual seed failed");
            return StatusCode(500, new { Error = ex.Message, StackTrace = ex.StackTrace });
        }
    }
}
