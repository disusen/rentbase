using Microsoft.AspNetCore.Mvc;
using RentBase.Api.Auth;
using RentBase.Api.Contracts;
using RentBase.Api.Models;

namespace RentBase.Api.Controllers;

public abstract class ApiControllerBase : ControllerBase
{
    /// <summary>User id read from the validated JWT, never from the request body or URL.</summary>
    protected int CurrentUserId =>
        AuthClaims.GetUserId(User) ?? throw new InvalidOperationException("Missing user id claim.");

    protected bool IsAdmin => User.IsInRole(UserRoles.Admin);

    protected ActionResult BadPayload(string detail) =>
        BadRequest(new ApiError("Invalid payload", StatusCodes.Status400BadRequest, detail));

    protected ActionResult NotFoundError(string detail) =>
        NotFound(new ApiError("Not found", StatusCodes.Status404NotFound, detail));

    protected ActionResult Unprocessable(string detail) =>
        UnprocessableEntity(new ApiError("Unprocessable entity", StatusCodes.Status422UnprocessableEntity, detail));

    protected ActionResult Forbidden(string detail) =>
        StatusCode(StatusCodes.Status403Forbidden, new ApiError("Forbidden", StatusCodes.Status403Forbidden, detail));
}
