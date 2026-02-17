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
        if (user.HasClaim(c => c.Type == "is_admin" && (c.Value.Equals("true", StringComparison.OrdinalIgnoreCase))))
        {
            return;
        }

        // Check if user is a legal professional with attorney assignment
        if (!user.HasClaim(c => c.Type == "is_legal_professional" && (c.Value.Equals("true", StringComparison.OrdinalIgnoreCase))))
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

        // Get user ID from route parameters
        var userIdParam = context.RouteData.Values["id"]?.ToString() ?? 
                           context.RouteData.Values["userId"]?.ToString();
        
        if (string.IsNullOrEmpty(userIdParam) || !Guid.TryParse(userIdParam, out var targetUserId))
        {
            // If no user ID in route, allow (will be handled by controller logic)
            return;
        }

        // Check if the target user is assigned to this attorney
        var dbContext = context.HttpContext.RequestServices.GetRequiredService<L4HDbContext>();
        var targetUser = await dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == new L4H.Shared.Models.UserId(targetUserId));

        if (targetUser == null || targetUser.AssignedAttorneyId != attorneyId)
        {
            context.Result = new ForbidResult();
            return;
        }
    }
}