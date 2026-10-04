using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

    public AuthController(AppDbContext db, IPasswordHasher hasher, IJwtTokenService tokens)
    {
        _db = db;
        _hasher = hasher;
        _tokens = tokens;
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

    /// <summary>Log in an approved user and receive a JWT bearer token.</summary>
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

        var (token, expiresAt) = _tokens.CreateToken(user);
        return Ok(new AuthResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = ToResponse(user)
        });
    }

    internal static UserResponse ToResponse(User user) => new()
    {
        Id = user.Id,
        FullName = user.FullName,
        Email = user.Email,
        Role = user.Role,
        IsApproved = user.IsApproved
    };
}
