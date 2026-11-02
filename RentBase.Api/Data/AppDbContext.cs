using Microsoft.EntityFrameworkCore;
using RentBase.Api.Models;

namespace RentBase.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Building> Buildings => Set<Building>();
    public DbSet<Apartment> Apartments => Set<Apartment>();
    public DbSet<Reservation> Reservations => Set<Reservation>();
    public DbSet<UserSession> Sessions => Set<UserSession>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.FullName).HasMaxLength(120);
            entity.Property(u => u.Email).HasMaxLength(180);
            entity.Property(u => u.Role).HasMaxLength(20);
        });

        modelBuilder.Entity<Building>(entity =>
        {
            entity.Property(b => b.Name).HasMaxLength(160);
            entity.Property(b => b.Address).HasMaxLength(200);
            entity.Property(b => b.City).HasMaxLength(80);
            entity.Property(b => b.Description).HasMaxLength(1000);
        });

        modelBuilder.Entity<Apartment>(entity =>
        {
            entity.Property(a => a.Number).HasMaxLength(20);
            entity.Property(a => a.AreaSqm).HasPrecision(8, 2);
            entity.Property(a => a.MonthlyRent).HasPrecision(10, 2);
            entity.HasOne(a => a.Building)
                .WithMany(b => b.Apartments)
                .HasForeignKey(a => a.BuildingId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Reservation>(entity =>
        {
            entity.Property(r => r.Notes).HasMaxLength(500);
            entity.HasOne(r => r.Apartment)
                .WithMany(a => a.Reservations)
                .HasForeignKey(r => r.ApartmentId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(r => r.User)
                .WithMany(u => u.Reservations)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<UserSession>(entity =>
        {
            entity.ToTable("UserSessions");
            entity.HasKey(s => s.Id);
            entity.Property(s => s.RefreshTokenHash).HasMaxLength(64);
            entity.Property(s => s.PreviousRefreshTokenHash).HasMaxLength(64);
            entity.Property(s => s.RevokedReason).HasMaxLength(80);
            entity.HasIndex(s => s.RefreshTokenHash).IsUnique();
            entity.HasIndex(s => s.PreviousRefreshTokenHash);
            entity.HasOne(s => s.User)
                .WithMany(u => u.Sessions)
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
