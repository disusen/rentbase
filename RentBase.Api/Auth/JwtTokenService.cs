using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using RentBase.Api.Models;

namespace RentBase.Api.Auth;

public interface IJwtTokenService
{
    /// <summary>Creates a signed access token for one login session.</summary>
    (string Token, DateTime ExpiresAt) CreateAccessToken(User user, Guid sessionId);
}

public class JwtTokenService : IJwtTokenService
{
    private readonly JwtSettings _settings;

    public JwtTokenService(IOptions<JwtSettings> settings)
    {
        _settings = settings.Value;
    }

    public (string Token, DateTime ExpiresAt) CreateAccessToken(User user, Guid sessionId)
    {
        if (string.IsNullOrWhiteSpace(_settings.Key))
        {
            throw new InvalidOperationException("Jwt:Key is not configured.");
        }

        var expiresAt = DateTime.UtcNow.AddMinutes(_settings.AccessTokenMinutes);

        // Claims carried inside the token: who the user is (sub), their role,
        // and which login session the token belongs to (sid), so logout can revoke it.
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(AuthClaims.SessionId, sessionId.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Role, user.Role),
            new("name", user.FullName)
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAt,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
