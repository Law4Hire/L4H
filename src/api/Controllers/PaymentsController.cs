using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;
using L4H.Api.Services.Providers;
using L4H.Api.Configuration;

namespace L4H.Api.Controllers;

[ApiController]
[Route("v1/payments")]
[Authorize]
[Tags("Payments")]
public class PaymentsController : ControllerBase
{
    private readonly L4H.Api.Services.Providers.IPaymentProvider _paymentProvider;
    private readonly IStringLocalizer<Shared> _localizer;
    private readonly ILogger<PaymentsController> _logger;
    private readonly PaymentsOptions _paymentsOptions;

    public PaymentsController(
        L4H.Api.Services.Providers.IPaymentProvider paymentProvider,
        IStringLocalizer<Shared> localizer,
        ILogger<PaymentsController> logger,
        IOptions<PaymentsOptions> paymentsOptions)
    {
        _paymentProvider = paymentProvider;
        _localizer = localizer;
        _logger = logger;
        _paymentsOptions = paymentsOptions.Value;
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> CreateCheckout([FromBody] CheckoutRequest request)
    {
        _logger.LogInformation("Creating checkout session for amount {Amount}", request.Amount);

        try
        {
            // Use configured URLs as defaults if not provided in request
            if (string.IsNullOrEmpty(request.SuccessUrl))
                request.SuccessUrl = _paymentsOptions.SuccessUrl;
            if (string.IsNullOrEmpty(request.CancelUrl))
                request.CancelUrl = _paymentsOptions.CancelUrl;

            var result = await _paymentProvider.CreateCheckoutSessionAsync(request).ConfigureAwait(false);
            
            if (result.Success)
            {
                return Ok(new
                {
                    checkoutUrl = result.CheckoutUrl,
                    successUrl = request.SuccessUrl,
                    cancelUrl = request.CancelUrl,
                    sessionId = result.SessionId,
                    message = _localizer["Payments.CheckoutCreated"]
                });
            }
            else
            {
                return BadRequest(new { message = result.ErrorMessage ?? _localizer["Payments.CheckoutFailed"] });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating checkout session");
            return StatusCode(500, new { message = _localizer["Payments.CheckoutError"] });
        }
    }
}
