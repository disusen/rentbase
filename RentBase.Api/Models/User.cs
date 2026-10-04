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
}

public static class UserRoles
{
    public const string Admin = "Admin";
    public const string Member = "Member";
}
