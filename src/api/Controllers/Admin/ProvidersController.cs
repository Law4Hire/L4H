using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Localization;
using L4H.Api.Configuration;
using L4H.Api.Services.Providers;

namespace L4H.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/providers")]
[Authorize(Policy = "IsAdmin")]
[Tags("Admin")]
public class ProvidersController : ControllerBase
{
    private readonly PaymentsOptions _paymentsOptions;
    private readonly GraphOptions _graphOptions;
    private readonly MeetingsOptions _meetingsOptions;
    private readonly IStringLocalizer<Shared> _localizer;
    private readonly ILogger<ProvidersController> _logger;

    public ProvidersController(
        IOptions<PaymentsOptions> paymentsOptions,
        IOptions<GraphOptions> graphOptions,
        IOptions<MeetingsOptions> meetingsOptions,
        IStringLocalizer<Shared> localizer,
        ILogger<ProvidersController> logger)
    {
        _paymentsOptions = paymentsOptions.Value;
        _graphOptions = graphOptions.Value;
        _meetingsOptions = meetingsOptions.Value;
        _localizer = localizer;
        _logger = logger;
    }

    [HttpGet]
    public IActionResult GetProviders()
    {
        _logger.LogInformation("Admin requested provider status");

        var response = new ProviderStatusResponse
        {
            Payments = GetLocalizedProviderName(_paymentsOptions.Stripe.Mode),
            Graph = GetLocalizedProviderName(_graphOptions.Mode),
            Meetings = GetLocalizedProviderName(_meetingsOptions.Mode)
        };

        return Ok(response);
    }

    [HttpPatch]
    public IActionResult UpdateProviders([FromBody] UpdateProvidersRequest request)
    {
        _logger.LogInformation("Admin requested provider mode update");

        // In a real implementation, this would update the configuration
        // For now, we'll just return the current status
        var response = new ProviderStatusResponse
        {
            Payments = GetLocalizedProviderName(_paymentsOptions.Stripe.Mode),
            Graph = GetLocalizedProviderName(_graphOptions.Mode),
            Meetings = GetLocalizedProviderName(_meetingsOptions.Mode)
        };

        return Ok(response);
    }

    private string GetLocalizedProviderName(string mode)
    {
        return mode.ToLowerInvariant() switch
        {
            "live" => _localizer["Providers.Live"],
            "teams" => _localizer["Providers.Teams"],
            "fake" => _localizer["Providers.Fake"],
            _ => mode
        };
    }
}

public class ProviderStatusResponse
{
    public string Payments { get; set; } = string.Empty;
    public string Graph { get; set; } = string.Empty;
    public string Meetings { get; set; } = string.Empty;
}

public class UpdateProvidersRequest
{
    public string? PaymentsMode { get; set; }
    public string? GraphMode { get; set; }
    public string? MeetingsMode { get; set; }
}
