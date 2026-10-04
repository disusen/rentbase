FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY RentBase.Api/RentBase.Api.csproj RentBase.Api/
RUN dotnet restore RentBase.Api/RentBase.Api.csproj
COPY RentBase.Api/ RentBase.Api/
RUN dotnet publish RentBase.Api/RentBase.Api.csproj -c Release -o /app /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "RentBase.Api.dll"]
