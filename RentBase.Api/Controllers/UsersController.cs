using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentBase.Api.Contracts;
using RentBase.Api.Data;
using RentBase.Api.Models;

namespace RentBase.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = UserRoles.Admin)]
public class UsersController : ApiControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>Approve or reject a member registration.</summary>
    [HttpPatch("{id:int}/approval")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserResponse>> SetApproval(int id, ApprovalRequest request)
    {
        if (!ModelState.IsValid || request.IsApproved is null)
        {
            return BadPayload("isApproved is required and must be true or false.");
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
        {
            return NotFoundError($"User {id} was not found.");
        }

        if (user.Role == UserRoles.Admin)
        {
            return Unprocessable("The administrator account cannot be approved or rejected through this method.");
        }

        user.IsApproved = request.IsApproved.Value;
        await _db.SaveChangesAsync();
        return Ok(AuthController.ToResponse(user));
    }

    /// <summary>Delete a member. Reservations belonging to that member are removed first.</summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
        {
            return NotFoundError($"User {id} was not found.");
        }

        if (user.Role == UserRoles.Admin)
        {
            return Unprocessable("The administrator account cannot be deleted.");
        }

        var reservations = await _db.Reservations.Where(r => r.UserId == id).ToListAsync();
        _db.Reservations.RemoveRange(reservations);
        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
