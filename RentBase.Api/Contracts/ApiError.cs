namespace RentBase.Api.Contracts;

public record ApiError(string Title, int Status, string Detail);
