namespace RentBase.Api.Models;

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = UserRoles.Member;
    public bool IsApproved { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<Reservation> Reservations { get; set; } = new();
    public List<UserSession> Sessions { get; set; } = new();
}

/// <summary>
/// Roles stored in the database and put into the JWT role claim. The third role, guest,
/// is a visitor without a token: it can only call endpoints marked [AllowAnonymous].
/// </summary>
public static class UserRoles
{
    public const string Admin = "Admin";
    public const string Member = "Member";
}
