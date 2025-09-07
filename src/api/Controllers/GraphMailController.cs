using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using L4H.Infrastructure.Services.Graph;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using System.Security.Claims;
using System.Text.Json;

namespace L4H.Api.Controllers;

[ApiController]
[Route("v1/graph/mail")]
[Authorize]
[Tags("Graph Mail")]
public class GraphMailController : ControllerBase
{
    private readonly IMailProvider _mailProvider;
    private readonly IStringLocalizer<Shared> _localizer;
    private readonly ILogger<GraphMailController> _logger;
    private readonly L4HDbContext _context;

    public GraphMailController(
        IMailProvider mailProvider,
        IStringLocalizer<Shared> localizer,
        ILogger<GraphMailController> logger,
        L4HDbContext context)
    {
        _mailProvider = mailProvider;
        _localizer = localizer;
        _logger = logger;
        _context = context;
    }

    /// <summary>
    /// Send a test email (admin only)
    /// </summary>
    /// <param name="request">Test email request</param>
    /// <returns>Test email response</returns>
    [HttpPost("test")]
    [ProducesResponseType<L4H.Shared.Models.SendTestMailResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> SendTestMail([FromBody] TestMailRequest request)
    {
        // Verify admin permissions
        if (!IsAdmin())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = _localizer["GraphMail.AdminOnly"]
            });
        }

        if (string.IsNullOrWhiteSpace(request.To) || string.IsNullOrWhiteSpace(request.Subject))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Bad Request",
                Detail = _localizer["GraphMail.InvalidRequest"]
            });
        }

        try
        {
            var result = await _mailProvider.SendTestMailAsync(request.To, request.Subject, request.Body).ConfigureAwait(false);
            
            // TODO: Create audit log (stub for now to avoid foreign key issues)
            _logger.LogInformation("Test email sent to {To} with subject {Subject}", request.To, request.Subject);
            
            if (result.Success)
            {
                return Ok(new L4H.Shared.Models.SendTestMailResponse
                {
                    Success = result.Success,
                    Message = _localizer["GraphMail.TestEmailSent"],
                    Provider = "FakeGraphProvider"
                });
            }
            else
            {
                return StatusCode(500, new L4H.Shared.Models.SendTestMailResponse
                {
                    Success = result.Success,
                    Message = result.ErrorMessage ?? "Error desconocido",
                    Provider = "FakeGraphProvider"
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending test mail to {To}", request.To);
            return StatusCode(500, new ProblemDetails
            {
                Title = "Internal Server Error",
                Detail = _localizer["GraphMail.SendFailed"]
            });
        }
    }

    private bool IsAdmin()
    {
        return User.IsInRole("Admin") || User.HasClaim("IsAdmin", "true");
    }

    private UserId GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user ID in token");
        }
        return new UserId(userId);
    }
}

public class TestMailRequest
{
    public string To { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
}

public class TestMailResponse
{
    public bool Success { get; set; }
    public string? MessageId { get; set; }
    public string Message { get; set; } = string.Empty;
}
