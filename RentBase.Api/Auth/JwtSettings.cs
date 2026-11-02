namespace RentBase.Api.Auth;

/// <summary>Bound from the "Jwt" section of appsettings.json.</summary>
public class JwtSettings
{
    public string Issuer { get; set; } = "RentBase";
    public string Audience { get; set; } = "RentBaseClient";

    /// <summary>HMAC-SHA256 signing key. At least 32 bytes. Override with the Jwt__Key environment variable outside development.</summary>
    public string Key { get; set; } = string.Empty;

    /// <summary>Access tokens are short-lived so a stolen one is only useful for a few minutes.</summary>
    public int AccessTokenMinutes { get; set; } = 15;

    /// <summary>Refresh tokens live longer so the user does not have to log in again every 15 minutes.</summary>
    public int RefreshTokenDays { get; set; } = 7;

    /// <summary>Secure flag on the refresh cookie. True everywhere except local HTTP development.</summary>
    public bool RefreshCookieSecure { get; set; } = true;
}
