using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentBase.Api.Contracts;
using RentBase.Api.Data;
using RentBase.Api.Models;

namespace RentBase.Api.Controllers;

[ApiController]
[Route("api/buildings")]
public class BuildingsController : ApiControllerBase
{
    private readonly AppDbContext _db;

    public BuildingsController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>List buildings. Guests can call this without a token.</summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<BuildingResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<BuildingResponse>>> List([FromQuery] string? city)
    {
        var query = _db.Buildings.AsNoTracking().Include(b => b.Apartments).AsQueryable();
        if (!string.IsNullOrWhiteSpace(city))
        {
            var normalized = city.Trim().ToLowerInvariant();
            query = query.Where(b => b.City.ToLower() == normalized);
        }

        var buildings = await query.OrderBy(b => b.City).ThenBy(b => b.Name).ToListAsync();
        return Ok(buildings.Select(ToResponse).ToList());
    }

    /// <summary>Register a building. Administrator only.</summary>
    [HttpPost]
    [Authorize(Roles = UserRoles.Admin)]
    [ProducesResponseType(typeof(BuildingResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BuildingResponse>> Create(BuildingRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var building = new Building
        {
            Name = request.Name.Trim(),
            Address = request.Address.Trim(),
            City = request.City.Trim(),
            Description = request.Description.Trim(),
            YearBuilt = request.YearBuilt
        };
        _db.Buildings.Add(building);
        await _db.SaveChangesAsync();
        return Created($"/api/buildings/{building.Id}", ToResponse(building));
    }

    /// <summary>Edit a building. Administrator only.</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    [ProducesResponseType(typeof(BuildingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BuildingResponse>> Update(int id, BuildingRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var building = await _db.Buildings.Include(b => b.Apartments).FirstOrDefaultAsync(b => b.Id == id);
        if (building is null)
        {
            return NotFoundError($"Building {id} was not found.");
        }

        building.Name = request.Name.Trim();
        building.Address = request.Address.Trim();
        building.City = request.City.Trim();
        building.Description = request.Description.Trim();
        building.YearBuilt = request.YearBuilt;
        await _db.SaveChangesAsync();
        return Ok(ToResponse(building));
    }

    /// <summary>Delete a building. Fails with 422 while apartments still belong to it.</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = UserRoles.Admin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Delete(int id)
    {
        var building = await _db.Buildings.Include(b => b.Apartments).FirstOrDefaultAsync(b => b.Id == id);
        if (building is null)
        {
            return NotFoundError($"Building {id} was not found.");
        }

        if (building.Apartments.Count > 0)
        {
            return Unprocessable("Delete the building's apartments before deleting the building.");
        }

        _db.Buildings.Remove(building);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static BuildingResponse ToResponse(Building building) => new()
    {
        Id = building.Id,
        Name = building.Name,
        Address = building.Address,
        City = building.City,
        Description = building.Description,
        YearBuilt = building.YearBuilt,
        ApartmentCount = building.Apartments.Count
    };
}
