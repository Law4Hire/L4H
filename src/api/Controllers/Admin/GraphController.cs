using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using L4H.Api.Services.Providers;
using L4H.Infrastructure.Services.Graph;

namespace L4H.Api.Controllers.Admin;

[ApiController]
[Route("v1/admin/graph")]
[Authorize(Roles = "Admin")]
[Tags("Admin")]
public class GraphController : ControllerBase
{
    private readonly IMailProvider _mailProvider;
    private readonly IStringLocalizer<Shared> _localizer;
    private readonly ILogger<GraphController> _logger;

    public GraphController(
        IMailProvider mailProvider,
        IStringLocalizer<Shared> localizer,
        ILogger<GraphController> logger)
    {
        _mailProvider = mailProvider;
        _localizer = localizer;
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
                Subject = _localizer["Graph.TestMailSubject"],
                TextBody = _localizer["Graph.TestMailBody"]
            };

            var result = await _mailProvider.SendMailAsync(testRequest).ConfigureAwait(false);
            
            if (result.Success)
            {
                return Ok(new { message = _localizer["Graph.TestMailSent"] });
            }
            else
            {
                return BadRequest(new { message = "Failed to send test email" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing Graph mail");
            return StatusCode(500, new { message = _localizer["Graph.TestMailError"] });
        }
    }
}

public class AdminTestMailRequest
{
    public string? To { get; set; }
}
