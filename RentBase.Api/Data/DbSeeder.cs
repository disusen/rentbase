using RentBase.Api.Models;

namespace RentBase.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, Auth.IPasswordHasher hasher)
    {
        if (db.Users.Any())
        {
            return;
        }

        var admin = new User
        {
            FullName = "Greta Adminaitė",
            Email = "admin@rentbase.lt",
            PasswordHash = hasher.Hash("Admin123!"),
            Role = UserRoles.Admin,
            IsApproved = true
        };
        var member = new User
        {
            FullName = "Ieva Kazlauskaitė",
            Email = "ieva@rentbase.lt",
            PasswordHash = hasher.Hash("Member123!"),
            Role = UserRoles.Member,
            IsApproved = true
        };
        var pending = new User
        {
            FullName = "Tomas Noreika",
            Email = "tomas@rentbase.lt",
            PasswordHash = hasher.Hash("Member123!"),
            Role = UserRoles.Member,
            IsApproved = false
        };
        var member2 = new User
        {
            FullName = "Jonas Petrauskas",
            Email = "jonas@rentbase.lt",
            PasswordHash = hasher.Hash("Member123!"),
            Role = UserRoles.Member,
            IsApproved = true
        };

        var buildings = new[]
        {
            new Building
            {
                Name = "Žaliakalnio rezidencija",
                Address = "Savanorių pr. 271",
                City = "Kaunas",
                Description = "Keturių aukštų gyvenamasis namas šalia ąžuolyno, su kiemo aikštele.",
                YearBuilt = 2008
            },
            new Building
            {
                Name = "Senamiesčio namai",
                Address = "Pilies g. 12",
                City = "Vilnius",
                Description = "Restauruotas senamiesčio namas su nedideliais butais trumpesnei nuomai.",
                YearBuilt = 1912
            },
            new Building
            {
                Name = "Paupio loftai",
                Address = "Aukštaičių g. 6",
                City = "Vilnius",
                Description = "Naujas loftų korpusas Paupyje, arti Neries krantinės.",
                YearBuilt = 2021
            },
            new Building
            {
                Name = "Neries krantinė",
                Address = "Upės g. 21",
                City = "Vilnius",
                Description = "Modernus daugiabutis su vaizdu į Nerį ir požemine aikštele.",
                YearBuilt = 2016
            },
            new Building
            {
                Name = "Laisvės alėjos namai",
                Address = "Laisvės al. 88",
                City = "Kaunas",
                Description = "Centrinis namas su komercinėmis patalpomis pirmajame aukšte.",
                YearBuilt = 1935
            }
        };

        db.Users.AddRange(admin, member, pending, member2);
        db.Buildings.AddRange(buildings);
        await db.SaveChangesAsync();

        var apartments = new[]
        {
            new Apartment { BuildingId = buildings[0].Id, Number = "12", Floor = 2, AreaSqm = 54.5m, Rooms = 2, MonthlyRent = 620m, IsAvailable = true },
            new Apartment { BuildingId = buildings[0].Id, Number = "31", Floor = 3, AreaSqm = 72.0m, Rooms = 3, MonthlyRent = 780m, IsAvailable = true },
            new Apartment { BuildingId = buildings[0].Id, Number = "4", Floor = 1, AreaSqm = 38.0m, Rooms = 1, MonthlyRent = 450m, IsAvailable = false },
            new Apartment { BuildingId = buildings[1].Id, Number = "2A", Floor = 1, AreaSqm = 41.2m, Rooms = 2, MonthlyRent = 890m, IsAvailable = true },
            new Apartment { BuildingId = buildings[1].Id, Number = "5", Floor = 3, AreaSqm = 29.8m, Rooms = 1, MonthlyRent = 640m, IsAvailable = true },
            new Apartment { BuildingId = buildings[2].Id, Number = "18", Floor = 4, AreaSqm = 67.4m, Rooms = 2, MonthlyRent = 1150m, IsAvailable = true },
            new Apartment { BuildingId = buildings[2].Id, Number = "21", Floor = 5, AreaSqm = 81.0m, Rooms = 3, MonthlyRent = 1390m, IsAvailable = true },
            new Apartment { BuildingId = buildings[3].Id, Number = "7", Floor = 2, AreaSqm = 58.0m, Rooms = 2, MonthlyRent = 980m, IsAvailable = true },
            new Apartment { BuildingId = buildings[4].Id, Number = "3", Floor = 1, AreaSqm = 45.5m, Rooms = 2, MonthlyRent = 710m, IsAvailable = true }
        };

        db.Apartments.AddRange(apartments);
        await db.SaveChangesAsync();

        var reservations = new[]
        {
            new Reservation
            {
                ApartmentId = apartments[0].Id,
                UserId = member.Id,
                StartDate = new DateOnly(2026, 11, 1),
                EndDate = new DateOnly(2027, 4, 30),
                Notes = "Studijų semestras Kaune, pageidaujama automobilių stovėjimo vieta."
            },
            new Reservation
            {
                ApartmentId = apartments[3].Id,
                UserId = member.Id,
                StartDate = new DateOnly(2026, 12, 15),
                EndDate = new DateOnly(2027, 1, 15),
                Notes = "Trumpalaikė nuoma per šventes Vilniuje."
            },
            new Reservation
            {
                ApartmentId = apartments[5].Id,
                UserId = member2.Id,
                StartDate = new DateOnly(2027, 2, 1),
                EndDate = new DateOnly(2027, 7, 31),
                Notes = "Darbas Paupyje, reikalingas loftas su balkonu."
            },
            new Reservation
            {
                ApartmentId = apartments[7].Id,
                UserId = member2.Id,
                StartDate = new DateOnly(2026, 10, 1),
                EndDate = new DateOnly(2027, 3, 31),
                Notes = "Ilgalaikė nuoma prie Neries."
            },
            new Reservation
            {
                ApartmentId = apartments[1].Id,
                UserId = member.Id,
                StartDate = new DateOnly(2027, 5, 1),
                EndDate = new DateOnly(2027, 8, 31),
                Notes = "Vasaros nuoma didesniam butui."
            }
        };

        db.Reservations.AddRange(reservations);
        await db.SaveChangesAsync();
    }
}
