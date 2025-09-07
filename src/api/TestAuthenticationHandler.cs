using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace L4H.Api;

/// <summary>
/// Test authentication handler that always succeeds for testing purposes
/// </summary>
public class TestAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public TestAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger, UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // Check if Authorization header is present
        // If no header, fail authentication to allow testing of unauthorized scenarios
        if (!Request.Headers.ContainsKey("Authorization"))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var authHeader = Request.Headers["Authorization"].ToString();
        
        // If the header is present but empty or doesn't start with "Bearer", fail
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
        {
            return Task.FromResult(AuthenticateResult.Fail("Invalid authorization header"));
        }

        // Extract the token to determine if this is an admin request
        var token = authHeader.Substring("Bearer ".Length).Trim();
        
        // Create a test user identity for valid bearer tokens
        // Use the same test user ID that the tests expect
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, "TestUser"),
            new Claim(ClaimTypes.NameIdentifier, "C0000000-1234-1234-1234-123456789012"),
            new Claim("sub", "C0000000-1234-1234-1234-123456789012")
        };

        // Check if this is an admin token (tests can use "admin-token" for admin requests)
        if (token == "admin-token" || token.Contains("admin"))
        {
            // Use admin user ID for admin requests
            claims.Clear();
            claims.Add(new Claim(ClaimTypes.Name, "AdminUser"));
            claims.Add(new Claim(ClaimTypes.NameIdentifier, "E7654321-4321-4321-4321-210987654321"));
            claims.Add(new Claim("sub", "E7654321-4321-4321-4321-210987654321"));
            claims.Add(new Claim(ClaimTypes.Role, "Admin"));
            claims.Add(new Claim("IsAdmin", "true"));
        }
        
        // For staff availability tests, add staff claims
        if (token == "mock-jwt-token-for-testing")
        {
            claims.Add(new Claim(ClaimTypes.Role, "Staff"));
            claims.Add(new Claim("IsStaff", "true"));
        }

        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, "Test");

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}