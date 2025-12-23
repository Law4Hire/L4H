using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using L4H.Api.Services.Providers;
using L4H.Infrastructure.Services.Graph;

namespace L4H.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/graph")]
[Authorize(Policy = "IsAdmin")]
[Tags("Admin")]
public class GraphController : ControllerBase
{
    private readonly IMailProvider _mailProvider;
    private readonly ILogger<GraphController> _logger;

    public GraphController(
        IMailProvider mailProvider,
        ILogger<GraphController> logger)
    {
        _mailProvider = mailProvider;
        _logger = logger;
    }

    [HttpPost("test-mail")]
    public async Task<IActionResult> TestMail([FromBody] AdminTestMailRequest request)
    {
        _logger.LogInformation("Admin requested Graph mail test");

        try
        {
            var testRequest = new SendMailRequest
            {
                To = request.To ?? "test@example.com",
                Subject = "L4H Graph API Test",
                TextBody = "This is a test email from Law4Hire Graph API."
            };

            var result = await _mailProvider.SendMailAsync(testRequest).ConfigureAwait(false);
            
            if (result.Success)
            {
                return Ok(new { message = "Test email sent successfully." });
            }
            else
            {
                return BadRequest(new { message = "Failed to send test email" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing Graph mail");
            return StatusCode(500, new { message = "Failed to send test email." });
        }
    }
}

public class AdminTestMailRequest
{
    public string? To { get; set; }
}