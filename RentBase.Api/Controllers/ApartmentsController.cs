using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentBase.Api.Contracts;
using RentBase.Api.Data;
using RentBase.Api.Models;

namespace RentBase.Api.Controllers;

[ApiController]
[Route("api/apartments")]
public class ApartmentsController : ApiControllerBase
{
    private readonly AppDbContext _db;

    public ApartmentsController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// List apartments. Use buildingId for one building and available=true for free apartments.
    /// Guests can call this without a token.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<ApartmentResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ApartmentResponse>>> List(
        [FromQuery] int? buildingId,
        [FromQuery] bool? available)
    {
        var query = _db.Apartments.AsNoTracking().Include(a => a.Building).AsQueryable();
        if (buildingId is not null)
        {
            query = query.Where(a => a.BuildingId == buildingId);
        }

        if (available is not null)
        {
            query = query.Where(a => a.IsAvailable == available);
        }

        var apartments = await query
            .OrderBy(a => a.Building!.City)
            .ThenBy(a => a.Building!.Name)
            .ThenBy(a => a.Number)
            .ToListAsync();
        return Ok(apartments.Select(ToResponse).ToList());
    }

    /// <summary>Register an apartment in an existing building. Administrator only.</summary>
    [HttpPost]
    [Authorize(Roles = UserRoles.Admin)]
    [ProducesResponseType(typeof(ApartmentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApartmentResponse>> Create(ApartmentRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var building = await _db.Buildings.FirstOrDefaultAsync(b => b.Id == request.BuildingId);
        if (building is null)
        {
            return NotFoundError($"Building {request.BuildingId} was not found.");
        }

        var apartment = new Apartment
        {
            BuildingId = building.Id,
            Building = building,
            Number = request.Number.Trim(),
            Floor = request.Floor,
            AreaSqm = request.AreaSqm,
            Rooms = request.Rooms,
            MonthlyRent = request.MonthlyRent,
            IsAvailable = request.IsAvailable
        };
        _db.Apartments.Add(apartment);
        await _db.SaveChangesAsync();
        return Created($"/api/apartments/{apartment.Id}", ToResponse(apartment));
    }

    /// <summary>Edit an apartment. Administrator only.</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    [ProducesResponseType(typeof(ApartmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApartmentResponse>> Update(int id, ApartmentRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var apartment = await _db.Apartments.Include(a => a.Building).FirstOrDefaultAsync(a => a.Id == id);
        if (apartment is null)
        {
            return NotFoundError($"Apartment {id} was not found.");
        }

        var building = await _db.Buildings.FirstOrDefaultAsync(b => b.Id == request.BuildingId);
        if (building is null)
        {
            return NotFoundError($"Building {request.BuildingId} was not found.");
        }

        apartment.BuildingId = building.Id;
        apartment.Building = building;
        apartment.Number = request.Number.Trim();
        apartment.Floor = request.Floor;
        apartment.AreaSqm = request.AreaSqm;
        apartment.Rooms = request.Rooms;
        apartment.MonthlyRent = request.MonthlyRent;
        apartment.IsAvailable = request.IsAvailable;
        await _db.SaveChangesAsync();
        return Ok(ToResponse(apartment));
    }

    /// <summary>Delete an apartment. Fails with 422 while reservations still reference it.</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Delete(int id)
    {
        var apartment = await _db.Apartments.Include(a => a.Reservations).FirstOrDefaultAsync(a => a.Id == id);
        if (apartment is null)
        {
            return NotFoundError($"Apartment {id} was not found.");
        }

        if (apartment.Reservations.Count > 0)
        {
            return Unprocessable("Cancel the apartment's reservations before deleting it.");
        }

        _db.Apartments.Remove(apartment);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    internal static ApartmentResponse ToResponse(Apartment apartment) => new()
    {
        Id = apartment.Id,
        BuildingId = apartment.BuildingId,
        BuildingName = apartment.Building?.Name ?? string.Empty,
        City = apartment.Building?.City ?? string.Empty,
        Number = apartment.Number,
        Floor = apartment.Floor,
        AreaSqm = apartment.AreaSqm,
        Rooms = apartment.Rooms,
        MonthlyRent = apartment.MonthlyRent,
        IsAvailable = apartment.IsAvailable
    };
}
