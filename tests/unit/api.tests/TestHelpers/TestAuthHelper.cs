using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.IdentityModel.Tokens;

namespace L4H.Api.Tests.TestHelpers
{
    public static class TestAuthHelper
    {
        public static Task<string> GenerateToken(bool isAdmin)
        {
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, isAdmin ? "admin-test-user" : "test-user"),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, isAdmin ? "Admin" : "User"),
                new Claim("is_admin", isAdmin.ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("a-super-secret-key-that-is-long-enough"));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: "test-issuer",
                audience: "test-audience",
                claims: claims,
                expires: DateTime.Now.AddMinutes(30),
                signingCredentials: creds
            );

            return Task.FromResult(new JwtSecurityTokenHandler().WriteToken(token));
        }
    }
}
