namespace RentBase.Api.Models;

public class Reservation
{
    public int Id { get; set; }
    public int ApartmentId { get; set; }
    public Apartment? Apartment { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
