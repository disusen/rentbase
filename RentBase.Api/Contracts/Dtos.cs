using System.ComponentModel.DataAnnotations;

namespace RentBase.Api.Contracts;

public class RegisterRequest
{
    [Required, MaxLength(120)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(180)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8), MaxLength(100)]
    public string Password { get; set; } = string.Empty;
}

public class LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserResponse User { get; set; } = new();
}

public class UserResponse
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsApproved { get; set; }
}

public class ApprovalRequest
{
    [Required]
    public bool? IsApproved { get; set; }
}

public class BuildingRequest
{
    [Required, MaxLength(160)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Address { get; set; } = string.Empty;

    [Required, MaxLength(80)]
    public string City { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;

    [Range(1800, 2100)]
    public int YearBuilt { get; set; }
}

public class BuildingResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int YearBuilt { get; set; }
    public int ApartmentCount { get; set; }
}

public class ApartmentRequest
{
    [Required]
    public int? BuildingId { get; set; }

    [Required, MaxLength(20)]
    public string Number { get; set; } = string.Empty;

    [Range(0, 80)]
    public int Floor { get; set; }

    [Range(8, 500)]
    public decimal AreaSqm { get; set; }

    [Range(1, 12)]
    public int Rooms { get; set; }

    [Range(1, 20000)]
    public decimal MonthlyRent { get; set; }

    public bool IsAvailable { get; set; } = true;
}

public class ApartmentResponse
{
    public int Id { get; set; }
    public int BuildingId { get; set; }
    public string BuildingName { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Number { get; set; } = string.Empty;
    public int Floor { get; set; }
    public decimal AreaSqm { get; set; }
    public int Rooms { get; set; }
    public decimal MonthlyRent { get; set; }
    public bool IsAvailable { get; set; }
}

public class ReservationRequest
{
    [Required]
    public int? ApartmentId { get; set; }

    [Required]
    public DateOnly? StartDate { get; set; }

    [Required]
    public DateOnly? EndDate { get; set; }

    [MaxLength(500)]
    public string Notes { get; set; } = string.Empty;
}

public class ReservationResponse
{
    public int Id { get; set; }
    public int ApartmentId { get; set; }
    public string ApartmentNumber { get; set; } = string.Empty;
    public string BuildingName { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
