# RentBase API

Lab 1 backend for the RentBase project: buildings, apartments, member registrations and reservations.

Stack, matching the L0 report: ASP.NET Core 8 Web API, Entity Framework Core, PostgreSQL. The React client is not part of this lab.

## What is implemented

16 REST methods. The course demo asks for 15; the extra method is user deletion, which the functional requirements also ask for. Both are in the Postman collection.

| # | Method | Path | Who | Status |
|---|--------|------|-----|--------|
| 1 | POST | `/api/auth/register` | guest | 201 |
| 2 | POST | `/api/auth/login` | guest | 200 |
| 3 | GET | `/api/buildings` | guest | 200 |
| 4 | POST | `/api/buildings` | admin | 201 |
| 5 | PUT | `/api/buildings/{id}` | admin | 200 |
| 6 | DELETE | `/api/buildings/{id}` | admin | 204 |
| 7 | GET | `/api/apartments` | guest | 200 |
| 8 | POST | `/api/apartments` | admin | 201 |
| 9 | PUT | `/api/apartments/{id}` | admin | 200 |
| 10 | DELETE | `/api/apartments/{id}` | admin | 204 |
| 11 | GET | `/api/reservations` | member or admin | 200 |
| 12 | POST | `/api/reservations` | member or admin | 201 |
| 13 | PUT | `/api/reservations/{id}` | owner or admin | 200 |
| 14 | DELETE | `/api/reservations/{id}` | owner or admin | 204 |
| 15 | PATCH | `/api/users/{id}/approval` | admin | 200 |
| 16 | DELETE | `/api/users/{id}` | admin | 204 |

Logout is client-side: discard the JWT. There is no server session to invalidate.

Guest apartment browsing is `GET /api/apartments?available=true`. Apartments of one building are `GET /api/apartments?buildingId=1`.

## Status codes the defense asks for

- Missing resource: `404`, for example `DELETE /api/buildings/99999`.
- Bad payload: `400`, for example `POST /api/buildings` with `{}`.
- Well-formed payload that breaks a rule: `422`, for example a reservation whose end date is not after the start date, or a date range that overlaps an existing reservation.
- Create: `201` and a `Location` header.
- Delete: `204` with no body.

Responses are `application/json`, except validation failures, which use `application/problem+json`.

## Seed data

Created on startup when the database is empty.

| Email | Password | Role | Approved |
|-------|----------|------|----------|
| admin@rentbase.lt | Admin123! | Admin | yes |
| ieva@rentbase.lt | Member123! | Member | yes |
| tomas@rentbase.lt | Member123! | Member | no |

Buildings: Žaliakalnio rezidencija (Kaunas), Senamiesčio namai (Vilnius), Paupio loftai (Vilnius), with apartments and one reservation for Ieva.

## Run without Docker

Docker is not required by the lab. It was only a convenience. Development mode uses a local SQLite file, `rentbase.db`, creates the schema, and seeds the same buildings, apartments, users and reservation.

Install the .NET 8 SDK, open this folder in VS Code, then:

```powershell
dotnet run --project RentBase.Api
```

Swagger is http://localhost:8080/swagger. The same command works on the M1 Mac.

The L0 report names PostgreSQL. For the defense, either run `docker compose up --build` on a machine where Docker works, or install PostgreSQL normally and set the connection string to `Host=localhost;Port=5432;Database=rentbase;Username=rentbase;Password=rentbase`. A native PostgreSQL install does not need virtualization. SQLite is the fallback when Docker cannot start.

## Postman demo

Import both files from `postman/`. Run the folder **Lab demo** with the collection runner. It logs in, calls the methods, and asserts status codes. The folder **Edge cases** shows 404, 400 and 422.

```bash
newman run postman/RentBase.postman_collection.json -e postman/RentBase.postman_environment.json --folder "Lab demo"
newman run postman/RentBase.postman_collection.json -e postman/RentBase.postman_environment.json --folder "Edge cases"
```

## Kaip pademonstruoti (~15 s)

1. `dotnet run --project RentBase.Api`, atidaryti http://localhost:8080/swagger. Docker nebūtinas.
2. Postman Collection Runner ant aplanko **Lab demo**.
3. Jei klausia apie klaidas: aplankas **Edge cases** (404, 400, 422, 201, 204).
