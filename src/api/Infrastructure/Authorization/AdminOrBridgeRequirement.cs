using Microsoft.AspNetCore.Authorization;

namespace L4H.Api.Infrastructure.Authorization;

/// <summary>
/// Requirement that is satisfied either by being an Admin (via JWT claim)
/// or by providing a secret AI Bridge header key.
/// </summary>
public class AdminOrBridgeRequirement : IAuthorizationRequirement
{
    public const string HeaderName = "X-AI-Bridge-Key";
    public const string SecretValue = "AI#W)RPR0C3$$$3cUR#";
}

public class AdminOrBridgeHandler : AuthorizationHandler<AdminOrBridgeRequirement>
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AdminOrBridgeHandler(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, AdminOrBridgeRequirement requirement)
    {
        // Option 1: User has Admin claim in their JWT
        if (context.User.HasClaim(c => c.Type == "is_admin" && (c.Value.Equals("true", StringComparison.OrdinalIgnoreCase))))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // Option 2: Request has the secret AI Bridge header
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext != null && httpContext.Request.Headers.TryGetValue(AdminOrBridgeRequirement.HeaderName, out var headerValue))
        {
            if (headerValue == AdminOrBridgeRequirement.SecretValue)
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }
        }

        return Task.CompletedTask;
    }
}
