using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RentBase.Api.Auth;
using RentBase.Api.Contracts;
using RentBase.Api.Data;
using RentBase.Api.Models;

namespace RentBase.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ApiControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _tokens;
    private readonly JwtSettings _settings;

    public AuthController(AppDbContext db, IPasswordHasher hasher, IJwtTokenService tokens, IOptions<JwtSettings> settings)
    {
        _db = db;
        _hasher = hasher;
        _tokens = tokens;
        _settings = settings.Value;
    }

    /// <summary>Register a member. The account stays inactive until an administrator approves it.</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<UserResponse>> Register(RegisterRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var email = request.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(u => u.Email == email))
        {
            return Unprocessable("A user with this email is already registered.");
        }

        // Role is always Member here. A client cannot register itself as Admin.
        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            PasswordHash = _hasher.Hash(request.Password),
            Role = UserRoles.Member,
            IsApproved = false
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var body = ToResponse(user);
        return Created($"/api/users/{user.Id}", body);
    }

    /// <summary>
    /// Log in an approved user. Returns a short-lived access token in the body and sets
    /// a long-lived refresh token as an HttpOnly cookie.
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null || !_hasher.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new ApiError("Unauthorized", StatusCodes.Status401Unauthorized, "Email or password is incorrect."));
        }

        if (!user.IsApproved)
        {
            return Forbidden("This registration has not been approved yet.");
        }

        var refreshToken = RefreshTokens.Generate();
        var session = new UserSession
        {
            UserId = user.Id,
            RefreshTokenHash = RefreshTokens.Hash(refreshToken),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(_settings.RefreshTokenDays)
        };
        _db.Sessions.Add(session);
        await _db.SaveChangesAsync();

        SetRefreshCookie(refreshToken, session.ExpiresAt);
        return Ok(BuildAuthResponse(user, session));
    }

    /// <summary>
    /// Exchange the refresh cookie for a new access token. The refresh token is rotated:
    /// the old one stops working and a new cookie is set. Presenting an already used
    /// refresh token revokes the whole session, because it means the token was copied.
    /// </summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Refresh()
    {
        var presented = Request.Cookies[RefreshTokens.CookieName];
        if (string.IsNullOrEmpty(presented))
        {
            return RefreshFailed("Refresh token cookie is missing. Log in again.");
        }

        var now = DateTime.UtcNow;
        var hash = RefreshTokens.Hash(presented);
        var session = await _db.Sessions.Include(s => s.User).FirstOrDefaultAsync(s => s.RefreshTokenHash == hash);

        if (session is null)
        {
            var reused = await _db.Sessions.FirstOrDefaultAsync(s => s.PreviousRefreshTokenHash == hash);
            if (reused is not null && reused.RevokedAt is null)
            {
                reused.RevokedAt = now;
                reused.RevokedReason = "refresh token reuse";
                await _db.SaveChangesAsync();
            }

            return RefreshFailed("Refresh token is not valid. Log in again.");
        }

        if (!session.IsActive(now))
        {
            return RefreshFailed("Session has ended. Log in again.");
        }

        if (session.User is null || !session.User.IsApproved)
        {
            session.RevokedAt = now;
            session.RevokedReason = "user no longer approved";
            await _db.SaveChangesAsync();
            return RefreshFailed("This account can no longer log in.");
        }

        var newToken = RefreshTokens.Generate();
        session.PreviousRefreshTokenHash = session.RefreshTokenHash;
        session.RefreshTokenHash = RefreshTokens.Hash(newToken);
        session.LastRefreshedAt = now;
        session.ExpiresAt = now.AddDays(_settings.RefreshTokenDays);
        await _db.SaveChangesAsync();

        SetRefreshCookie(newToken, session.ExpiresAt);
        return Ok(BuildAuthResponse(session.User, session));
    }

    /// <summary>
    /// Log out of the current session. The session is marked revoked in the database, so its
    /// refresh token and every access token issued for it stop working immediately.
    /// Works with a valid access token or with only the refresh cookie (for example after the
    /// access token has expired). Always 204: logging out twice is not an error.
    /// </summary>
    [HttpPost("logout")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout()
    {
        var now = DateTime.UtcNow;
        UserSession? session = null;

        var sessionId = AuthClaims.GetSessionId(User);
        if (sessionId is not null)
        {
            session = await _db.Sessions.FirstOrDefaultAsync(s => s.Id == sessionId);
        }

        var cookie = Request.Cookies[RefreshTokens.CookieName];
        if (session is null && !string.IsNullOrEmpty(cookie))
        {
            var hash = RefreshTokens.Hash(cookie);
            session = await _db.Sessions.FirstOrDefaultAsync(s => s.RefreshTokenHash == hash);
        }

        if (session is not null && session.RevokedAt is null)
        {
            session.RevokedAt = now;
            session.RevokedReason = "logout";
            await _db.SaveChangesAsync();
        }

        ClearRefreshCookie();
        return NoContent();
    }

    /// <summary>Log out of every device: revokes all of the current user's sessions.</summary>
    [HttpPost("logout-all")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> LogoutAll()
    {
        var now = DateTime.UtcNow;
        var sessions = await _db.Sessions
            .Where(s => s.UserId == CurrentUserId && s.RevokedAt == null)
            .ToListAsync();
        foreach (var session in sessions)
        {
            session.RevokedAt = now;
            session.RevokedReason = "logout all";
        }

        await _db.SaveChangesAsync();
        ClearRefreshCookie();
        return NoContent();
    }

    private AuthResponse BuildAuthResponse(User user, UserSession session)
    {
        var (accessToken, accessExpiresAt) = _tokens.CreateAccessToken(user, session.Id);
        return new AuthResponse
        {
            AccessToken = accessToken,
            AccessTokenExpiresAt = accessExpiresAt,
            RefreshTokenExpiresAt = session.ExpiresAt,
            User = ToResponse(user)
        };
    }

    private ActionResult RefreshFailed(string detail)
    {
        ClearRefreshCookie();
        return Unauthorized(new ApiError("Unauthorized", StatusCodes.Status401Unauthorized, detail));
    }

    // HttpOnly: JavaScript cannot read the cookie, so an XSS bug cannot steal the refresh token.
    // Secure: only sent over HTTPS (switched off for local http://localhost development).
    // Path: the browser sends it only to /api/auth/*, not with every API call.
    private CookieOptions RefreshCookieOptions(DateTime? expires) => new()
    {
        HttpOnly = true,
        Secure = _settings.RefreshCookieSecure,
        SameSite = _settings.RefreshCookieSecure ? SameSiteMode.None : SameSiteMode.Lax,
        Path = RefreshTokens.CookiePath,
        Expires = expires,
        IsEssential = true
    };

    private void SetRefreshCookie(string token, DateTime expiresAt) =>
        Response.Cookies.Append(RefreshTokens.CookieName, token, RefreshCookieOptions(expiresAt));

    private void ClearRefreshCookie() =>
        Response.Cookies.Delete(RefreshTokens.CookieName, RefreshCookieOptions(null));

    internal static UserResponse ToResponse(User user) => new()
    {
        Id = user.Id,
        FullName = user.FullName,
        Email = user.Email,
        Role = user.Role,
        IsApproved = user.IsApproved
    };
}
