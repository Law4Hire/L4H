using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using L4H.Shared.Models;

namespace L4H.Infrastructure.Middleware;

public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;
    private readonly SecurityConfig _config;

    public SecurityHeadersMiddleware(RequestDelegate next, IOptions<SecurityConfig> config)
    {
        _next = next;
        _config = config.Value;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Add security headers
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()";
        
        // Content Security Policy
        var csp = "default-src 'self'; " +
                  "script-src 'self'; " +
                  "style-src 'self' 'unsafe-inline'; " +
                  "img-src 'self' data:; " +
                  "font-src 'self'; " +
                  "connect-src 'self'; " +
                  "frame-ancestors 'none'; " +
                  "base-uri 'self'; " +
                  "form-action 'self'";
        
        context.Response.Headers["Content-Security-Policy"] = csp;

        await _next(context).ConfigureAwait(false);
    }
}
