using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using System.Text.Json;
using L4H.Shared.Models;

namespace L4H.Infrastructure.Middleware;

public class MaintenanceModeMiddleware
{
    private readonly RequestDelegate _next;
    private readonly SecurityConfig _config;

    public MaintenanceModeMiddleware(RequestDelegate next, IOptions<SecurityConfig> config)
    {
        _next = next;
        _config = config.Value;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (_config.MaintenanceMode)
        {
            // Check if user is admin
            var isAdmin = context.User?.IsInRole("Admin") ?? false;
            
            if (!isAdmin)
            {
                context.Response.StatusCode = 503;
                context.Response.ContentType = "application/json";
                
                var problemDetails = new
                {
                    Title = "Service Unavailable",
                    Status = 503,
                    Detail = "The service is currently undergoing maintenance. Please try again later."
                };
                
                var json = JsonSerializer.Serialize(problemDetails);
                await context.Response.WriteAsync(json).ConfigureAwait(false);
                return;
            }
        }

        await _next(context).ConfigureAwait(false);
    }
}
