using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentBase.Api.Contracts;
using RentBase.Api.Data;
using RentBase.Api.Models;

namespace RentBase.Api.Controllers;

[ApiController]
[Route("api/reservations")]
[Authorize]
public class ReservationsController : ApiControllerBase
{
    private readonly AppDbContext _db;

    public ReservationsController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>Member sees their own history. Administrator sees every reservation and may filter by userId.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<ReservationResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ReservationResponse>>> List([FromQuery] int? userId)
    {
        var query = _db.Reservations.AsNoTracking()
            .Include(r => r.Apartment)!.ThenInclude(a => a!.Building)
            .Include(r => r.User)
            .AsQueryable();

        if (!IsAdmin)
        {
            query = query.Where(r => r.UserId == CurrentUserId);
        }
        else if (userId is not null)
        {
            query = query.Where(r => r.UserId == userId);
        }

        var reservations = await query.OrderByDescending(r => r.StartDate).ToListAsync();
        return Ok(reservations.Select(ToResponse).ToList());
    }

    /// <summary>Create a reservation for an available apartment and a valid date range.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ReservationResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<ReservationResponse>> Create(ReservationRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var apartment = await _db.Apartments.Include(a => a.Building).FirstOrDefaultAsync(a => a.Id == request.ApartmentId);
        if (apartment is null)
        {
            return NotFoundError($"Apartment {request.ApartmentId} was not found.");
        }

        var ruleError = await ValidateDates(request.StartDate!.Value, request.EndDate!.Value, apartment, excludeReservationId: null);
        if (ruleError is not null)
        {
            return ruleError;
        }

        var reservation = new Reservation
        {
            ApartmentId = apartment.Id,
            Apartment = apartment,
            UserId = CurrentUserId,
            User = await _db.Users.FirstAsync(u => u.Id == CurrentUserId),
            StartDate = request.StartDate.Value,
            EndDate = request.EndDate.Value,
            Notes = request.Notes.Trim()
        };
        _db.Reservations.Add(reservation);
        await _db.SaveChangesAsync();
        return Created($"/api/reservations/{reservation.Id}", ToResponse(reservation));
    }

    /// <summary>Edit reservation dates or notes. A member can edit only their own reservation.</summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ReservationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<ReservationResponse>> Update(int id, ReservationRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var reservation = await _db.Reservations
            .Include(r => r.Apartment)!.ThenInclude(a => a!.Building)
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id);
        if (reservation is null)
        {
            return NotFoundError($"Reservation {id} was not found.");
        }

        if (!IsAdmin && reservation.UserId != CurrentUserId)
        {
            return Forbidden("You can edit only your own reservations.");
        }

        var apartment = await _db.Apartments.Include(a => a.Building).FirstOrDefaultAsync(a => a.Id == request.ApartmentId);
        if (apartment is null)
        {
            return NotFoundError($"Apartment {request.ApartmentId} was not found.");
        }

        var ruleError = await ValidateDates(request.StartDate!.Value, request.EndDate!.Value, apartment, reservation.Id);
        if (ruleError is not null)
        {
            return ruleError;
        }

        reservation.ApartmentId = apartment.Id;
        reservation.Apartment = apartment;
        reservation.StartDate = request.StartDate.Value;
        reservation.EndDate = request.EndDate.Value;
        reservation.Notes = request.Notes.Trim();
        await _db.SaveChangesAsync();
        return Ok(ToResponse(reservation));
    }

    /// <summary>Cancel a reservation. Returns 204 because the response has no body.</summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        var reservation = await _db.Reservations.FirstOrDefaultAsync(r => r.Id == id);
        if (reservation is null)
        {
            return NotFoundError($"Reservation {id} was not found.");
        }

        if (!IsAdmin && reservation.UserId != CurrentUserId)
        {
            return Forbidden("You can cancel only your own reservations.");
        }

        _db.Reservations.Remove(reservation);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<ActionResult?> ValidateDates(DateOnly start, DateOnly end, Apartment apartment, int? excludeReservationId)
    {
        if (end <= start)
        {
            return Unprocessable("End date must be later than start date.");
        }

        if (!apartment.IsAvailable)
        {
            return Unprocessable($"Apartment {apartment.Number} is not available for reservation.");
        }

        var overlaps = await _db.Reservations.AnyAsync(r =>
            r.ApartmentId == apartment.Id
            && r.Id != excludeReservationId
            && r.StartDate < end
            && start < r.EndDate);
        if (overlaps)
        {
            return Unprocessable("The apartment is already reserved for part of this date range.");
        }

        return null;
    }

    private static ReservationResponse ToResponse(Reservation reservation) => new()
    {
        Id = reservation.Id,
        ApartmentId = reservation.ApartmentId,
        ApartmentNumber = reservation.Apartment?.Number ?? string.Empty,
        BuildingName = reservation.Apartment?.Building?.Name ?? string.Empty,
        UserId = reservation.UserId,
        UserName = reservation.User?.FullName ?? string.Empty,
        StartDate = reservation.StartDate,
        EndDate = reservation.EndDate,
        Notes = reservation.Notes,
        CreatedAt = reservation.CreatedAt
    };
}
