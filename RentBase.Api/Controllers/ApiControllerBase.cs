using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using RentBase.Api.Contracts;

namespace RentBase.Api.Controllers;

public abstract class ApiControllerBase : ControllerBase
{
    protected int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("Missing user id claim."));

    protected bool IsAdmin => User.IsInRole("Admin");

    protected ActionResult BadPayload(string detail) =>
        BadRequest(new ApiError("Invalid payload", StatusCodes.Status400BadRequest, detail));

    protected ActionResult NotFoundError(string detail) =>
        NotFound(new ApiError("Not found", StatusCodes.Status404NotFound, detail));

    protected ActionResult Unprocessable(string detail) =>
        UnprocessableEntity(new ApiError("Unprocessable entity", StatusCodes.Status422UnprocessableEntity, detail));

    protected ActionResult Forbidden(string detail) =>
        StatusCode(StatusCodes.Status403Forbidden, new ApiError("Forbidden", StatusCodes.Status403Forbidden, detail));
}
