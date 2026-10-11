using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentBase.Api.Contracts;
using RentBase.Api.Data;

namespace RentBase.Api.Controllers;

[ApiController]
[Route("api/me")]
[Authorize]
public class MeController : ApiControllerBase
{
    private readonly AppDbContext _db;

    public MeController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Profile / dashboard for the current user.
    /// Resource is constructed from User and Reservation entities.
    /// </summary>
    [HttpGet("profile")]
    [ProducesResponseType(typeof(ProfileResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ProfileResponse>> Profile()
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == CurrentUserId);
        if (user is null)
        {
            return NotFoundError("Current user was not found.");
        }

        var reservations = await _db.Reservations.AsNoTracking()
            .Include(r => r.Apartment)!.ThenInclude(a => a!.Building)
            .Include(r => r.User)
            .Where(r => r.UserId == CurrentUserId)
            .OrderByDescending(r => r.StartDate)
            .Take(10)
            .ToListAsync();

        var count = await _db.Reservations.CountAsync(r => r.UserId == CurrentUserId);

        return Ok(new ProfileResponse
        {
            User = AuthController.ToResponse(user),
            ReservationCount = count,
            RecentReservations = reservations.Select(r => new ReservationResponse
            {
                Id = r.Id,
                ApartmentId = r.ApartmentId,
                ApartmentNumber = r.Apartment?.Number ?? string.Empty,
                BuildingName = r.Apartment?.Building?.Name ?? string.Empty,
                UserId = r.UserId,
                UserName = r.User?.FullName ?? string.Empty,
                StartDate = r.StartDate,
                EndDate = r.EndDate,
                Notes = r.Notes,
                CreatedAt = r.CreatedAt,
                Links = new ResourceLinks
                {
                    Self = $"/api/reservations/{r.Id}"
                }
            }).ToList(),
            Links = new ResourceLinks
            {
                Self = "/api/me/profile",
                Reservations = "/api/reservations"
            }
        });
    }
}
