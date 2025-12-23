using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using Microsoft.Extensions.Options;
using L4H.Api.Services.Providers;
using L4H.Api.Configuration;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/payments")]
[Authorize]
[Tags("Payments")]
public class PaymentsController : ControllerBase
{
    private readonly L4H.Api.Services.Providers.IPaymentProvider _paymentProvider;
    private readonly ILogger<PaymentsController> _logger;
    private readonly PaymentsOptions _paymentsOptions;

    public PaymentsController(
        L4H.Api.Services.Providers.IPaymentProvider paymentProvider,
        ILogger<PaymentsController> logger,
        IOptions<PaymentsOptions> paymentsOptions)
    {
        _paymentProvider = paymentProvider;
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
                    message = "Checkout session created successfully."
                });
            }
            else
            {
                return BadRequest(new { message = result.ErrorMessage ?? "Failed to create checkout session." });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating checkout session");
            return StatusCode(500, new { message = "Error creating checkout session." });
        }
    }
}