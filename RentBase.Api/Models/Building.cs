namespace RentBase.Api.Models;

public class Building
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int YearBuilt { get; set; }
    public List<Apartment> Apartments { get; set; } = new();
}
