using Microsoft.AspNetCore.Mvc;
using System.Globalization;

namespace L4H.Api.Controllers;

[ApiController]
[Route("v1/i18n")]
[Tags("Internationalization")]
public class InternationalizationController : ControllerBase
{
    private static readonly Dictionary<string, string> SupportedCultures = new()
    {
        { "ar-SA", "Arabic (Saudi Arabia)" },
        { "bn-BD", "Bengali (Bangladesh)" },
        { "de-DE", "German (Germany)" },
        { "en-US", "English (United States)" },
        { "es-ES", "Spanish (Spain)" },
        { "fr-FR", "French (France)" },
        { "hi-IN", "Hindi (India)" },
        { "id-ID", "Indonesian (Indonesia)" },
        { "it-IT", "Italian (Italy)" },
        { "ja-JP", "Japanese (Japan)" },
        { "ko-KR", "Korean (Korea)" },
        { "mr-IN", "Marathi (India)" },
        { "pl-PL", "Polish (Poland)" },
        { "pt-PT", "Portuguese (Portugal)" },
        { "ru-RU", "Russian (Russia)" },
        { "ta-IN", "Tamil (India)" },
        { "te-IN", "Telugu (India)" },
        { "tr-TR", "Turkish (Türkiye)" },
        { "ur-PK", "Urdu (Pakistan)" },
        { "vi-VN", "Vietnamese (Vietnam)" },
        { "zh-CN", "Chinese (Simplified, China)" }
    };

    /// <summary>
    /// Get supported cultures for localization
    /// </summary>
    /// <returns>Array of supported cultures with display names</returns>
    [HttpGet("supported")]
    [ProducesResponseType(typeof(SupportedCultureResponse[]), StatusCodes.Status200OK)]
    public ActionResult<SupportedCultureResponse[]> GetSupportedCultures()
    {
        var cultures = SupportedCultures.Select(kvp => new SupportedCultureResponse
        {
            Code = kvp.Key,
            DisplayName = kvp.Value
        }).ToArray();

        return Ok(cultures);
    }

    /// <summary>
    /// Set culture preference via cookie
    /// </summary>
    /// <param name="request">Culture setting request</param>
    /// <returns>No content on success</returns>
    [HttpPost("culture")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public IActionResult SetCulture([FromBody] SetCultureRequest request)
    {
        if (string.IsNullOrEmpty(request.Culture))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid Culture",
                Detail = "Culture code cannot be null or empty."
            });
        }

        if (!SupportedCultures.ContainsKey(request.Culture))
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Unsupported Culture",
                Detail = $"Culture '{request.Culture}' is not supported. Use GET /v1/i18n/supported to see available cultures."
            });
        }

        // Set culture cookie for 90 days
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddDays(90)
        };

        Response.Cookies.Append("l4h_culture", $"c={request.Culture}|uic={request.Culture}", cookieOptions);

        return NoContent();
    }
}

public class SupportedCultureResponse
{
    public string Code { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
}

public class SetCultureRequest
{
    public string Culture { get; set; } = string.Empty;
}