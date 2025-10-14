using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using L4H.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace L4H.Api.Authorization;

/// <summary>
/// Authorization attribute that ensures users can only access clients they are authorized to view
/// Admins can access all clients, Legal Professionals can only access their assigned clients
/// </summary>
public class ClientAccessAuthorizationAttribute : Attribute, IAsyncAuthorizationFilter
{
    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;
        
        // Allow if user is admin
        if (user.HasClaim("is_admin", "true") || user.HasClaim("is_admin", "True"))
        {
            return;
        }

        // Check if user is a legal professional with attorney assignment
        if (!user.HasClaim("is_legal_professional", "true") && !user.HasClaim("is_legal_professional", "True"))
        {
            context.Result = new ForbidResult();
            return;
        }

        var attorneyIdClaim = user.FindFirst("attorney_id")?.Value;
        if (string.IsNullOrEmpty(attorneyIdClaim) || !int.TryParse(attorneyIdClaim, out var attorneyId))
        {
            context.Result = new ForbidResult();
            return;
        }

        // Get client ID from route parameters
        var clientIdParam = context.RouteData.Values["id"]?.ToString() ?? 
                           context.RouteData.Values["clientId"]?.ToString();
        
        if (string.IsNullOrEmpty(clientIdParam) || !int.TryParse(clientIdParam, out var clientId))
        {
            // If no client ID in route, allow (will be handled by controller logic)
            return;
        }

        // Check if the client is assigned to this attorney
        var dbContext = context.HttpContext.RequestServices.GetRequiredService<L4HDbContext>();
        var client = await dbContext.Clients
            .FirstOrDefaultAsync(c => c.Id == clientId);

        if (client == null || client.AssignedAttorneyId != attorneyId)
        {
            context.Result = new ForbidResult();
            return;
        }
    }
}