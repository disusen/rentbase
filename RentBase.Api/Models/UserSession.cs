namespace RentBase.Api.Models;

/// <summary>
/// One login on one device. Holds the hash of the current refresh token.
/// Every access token carries this session's id in its "sid" claim, so revoking the
/// session (logout) also makes the access tokens issued for it stop working.
/// </summary>
public class UserSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int UserId { get; set; }
    public User? User { get; set; }

    /// <summary>SHA-256 of the refresh token that is valid right now.</summary>
    public string RefreshTokenHash { get; set; } = string.Empty;

    /// <summary>SHA-256 of the token it replaced. If that one is presented again, the token was stolen.</summary>
    public string? PreviousRefreshTokenHash { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastRefreshedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? RevokedReason { get; set; }

    public bool IsActive(DateTime now) => RevokedAt is null && ExpiresAt > now;
}
