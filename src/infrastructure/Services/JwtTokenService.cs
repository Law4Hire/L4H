using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.IdentityModel.Tokens;

namespace L4H.Infrastructure.Services;

public interface IJwtTokenService
{
    string GenerateAccessToken(User user);
    ClaimsPrincipal? ValidateToken(string token);
}

public class JwtTokenService : IJwtTokenService
{
    private readonly JwtConfig _config;
    private readonly SymmetricSecurityKey _key;

    public JwtTokenService(JwtConfig config)
    {
        _config = config;
        _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config.SigningKey));
    }

    public string GenerateAccessToken(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.Value.ToString()),
            new Claim("sub", user.Id.Value.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("email_verified", user.EmailVerified.ToString()),
            new Claim("is_admin", user.IsAdmin.ToString()),
            new Claim("is_legal_professional", user.IsLegalProfessional.ToString())
        };

        // Add attorney assignment information for legal professionals
        if (user.IsLegalProfessional && user.AttorneyId.HasValue)
        {
            claims.Add(new Claim("attorney_id", user.AttorneyId.Value.ToString()));
        }

        // Add name claims if available
        if (!string.IsNullOrEmpty(user.FirstName))
        {
            claims.Add(new Claim("given_name", user.FirstName));
            claims.Add(new Claim("firstName", user.FirstName));
        }
        
        if (!string.IsNullOrEmpty(user.LastName))
        {
            claims.Add(new Claim("family_name", user.LastName));
            claims.Add(new Claim("lastName", user.LastName));
        }
        
        // Add full name if both first and last name are available
        if (!string.IsNullOrEmpty(user.FirstName) && !string.IsNullOrEmpty(user.LastName))
        {
            claims.Add(new Claim("name", $"{user.FirstName} {user.LastName}"));
        }
        else if (!string.IsNullOrEmpty(user.FirstName))
        {
            claims.Add(new Claim("name", user.FirstName));
        }

        var credentials = new SigningCredentials(_key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config.Issuer,
            audience: _config.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15), // 15 minute lifetime
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _config.Issuer,
                ValidAudience = _config.Audience,
                IssuerSigningKey = _key,
                ClockSkew = TimeSpan.Zero // No clock skew tolerance
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out _);
            return principal;
        }
        catch
        {
            return null;
        }
    }
}

public class JwtConfig
{
    public string SigningKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
}