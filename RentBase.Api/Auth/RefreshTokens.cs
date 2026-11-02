using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.WebUtilities;

namespace RentBase.Api.Auth;

/// <summary>Refresh tokens are random opaque strings, not JWTs. Only their SHA-256 hash is stored.</summary>
public static class RefreshTokens
{
    public const string CookieName = "rb_refresh";
    public const string CookiePath = "/api/auth";

    public static string Generate() =>
        WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(64));

    public static string Hash(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}

public static class AuthClaims
{
    /// <summary>Session id claim. "sid" is the standard OpenID Connect name for it.</summary>
    public const string SessionId = "sid";

    /// <summary>
    /// The JWT handler may map "sid" to ClaimTypes.Sid on the way in, so both names are checked.
    /// </summary>
    public static Guid? GetSessionId(ClaimsPrincipal? principal)
    {
        var value = principal?.FindFirst(SessionId)?.Value ?? principal?.FindFirst(ClaimTypes.Sid)?.Value;
        return Guid.TryParse(value, out var id) ? id : null;
    }

    public static int? GetUserId(ClaimsPrincipal? principal)
    {
        var value = principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? principal?.FindFirst("sub")?.Value;
        return int.TryParse(value, out var id) ? id : null;
    }
}
