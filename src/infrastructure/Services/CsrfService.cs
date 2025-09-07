using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Http;

namespace L4H.Infrastructure.Services;

public interface ICsrfService
{
    string GetToken();
    bool ValidateToken(string token);
}

public class CsrfService : ICsrfService
{
    private readonly IAntiforgery _antiforgery;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CsrfService(IAntiforgery antiforgery, IHttpContextAccessor httpContextAccessor)
    {
        _antiforgery = antiforgery;
        _httpContextAccessor = httpContextAccessor;
    }

    public string GetToken()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null)
        {
            throw new InvalidOperationException("HttpContext is not available");
        }

        var tokenSet = _antiforgery.GetAndStoreTokens(httpContext);
        return tokenSet.RequestToken ?? string.Empty;
    }

    public bool ValidateToken(string token)
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null)
        {
            return false;
        }

        try
        {
            _antiforgery.ValidateRequestAsync(httpContext).GetAwaiter().GetResult();
            return true;
        }
        catch
        {
            return false;
        }
    }
}
