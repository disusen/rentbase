namespace RentBase.Api.Models;

public class Apartment
{
    public int Id { get; set; }
    public int BuildingId { get; set; }
    public Building? Building { get; set; }
    public string Number { get; set; } = string.Empty;
    public int Floor { get; set; }
    public decimal AreaSqm { get; set; }
    public int Rooms { get; set; }
    public decimal MonthlyRent { get; set; }
    public bool IsAvailable { get; set; } = true;
    public List<Reservation> Reservations { get; set; } = new();
}
