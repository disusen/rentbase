using System.Reflection;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using RentBase.Api.Auth;
using RentBase.Api.Contracts;
using RentBase.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// Render (and most PaaS hosts) tell the app which port to listen on through PORT.
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(port))
{
    builder.WebHost.UseUrls($"http://+:{port}");
}

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "RentBase API",
        Version = "v1",
        Description = "REST API for buildings, apartments, members and reservations. Labs 1 and 2 of Saityno taikomųjų programų projektavimas."
    });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste the accessToken returned by POST /api/auth/login or POST /api/auth/refresh."
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });

    var xml = Path.Combine(AppContext.BaseDirectory, $"{Assembly.GetExecutingAssembly().GetName().Name}.xml");
    if (File.Exists(xml))
    {
        options.IncludeXmlComments(xml);
    }
});

var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? "Data Source=rentbase.db";

// Render gives the database as a URL (postgresql://user:pass@host:port/db).
// Npgsql wants key=value pairs, so convert it.
if (connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
    || connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
{
    var uri = new Uri(connectionString);
    var credentials = uri.UserInfo.Split(':', 2);
    connectionString = $"Host={uri.Host};Port={(uri.Port > 0 ? uri.Port : 5432)};Database={uri.AbsolutePath.TrimStart('/')};" +
        $"Username={Uri.UnescapeDataString(credentials[0])};Password={Uri.UnescapeDataString(credentials.ElementAtOrDefault(1) ?? "")};" +
        "SSL Mode=Prefer";
}
builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (connectionString.Contains("Host=", StringComparison.OrdinalIgnoreCase))
    {
        options.UseNpgsql(connectionString);
    }
    else
    {
        options.UseSqlite(connectionString);
    }
});
builder.Services.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
var jwtSection = builder.Configuration.GetSection("Jwt");
builder.Services.Configure<JwtSettings>(jwtSection);
var jwt = jwtSection.Get<JwtSettings>() ?? new JwtSettings();
if (Encoding.UTF8.GetByteCount(jwt.Key) < 32)
{
    throw new InvalidOperationException("Jwt:Key must be at least 32 bytes for HMAC-SHA256.");
}

builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
            ValidAlgorithms = new[] { SecurityAlgorithms.HmacSha256 },
            ClockSkew = TimeSpan.FromSeconds(30)
        };

        options.Events = new JwtBearerEvents
        {
            // Signature and expiry are already checked at this point. On top of that the
            // token's session must still be active (not logged out) and the user still approved.
            OnTokenValidated = async context =>
            {
                var sessionId = AuthClaims.GetSessionId(context.Principal);
                var userId = AuthClaims.GetUserId(context.Principal);
                if (sessionId is null || userId is null)
                {
                    context.Fail("Token has no session.");
                    return;
                }

                var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                var now = DateTime.UtcNow;
                var active = await db.Sessions.AsNoTracking().AnyAsync(s =>
                    s.Id == sessionId
                    && s.UserId == userId
                    && s.RevokedAt == null
                    && s.ExpiresAt > now
                    && s.User!.IsApproved);
                if (!active)
                {
                    context.Fail("Session was revoked.");
                }
            },

            // 401: no token, bad signature, expired, or logged out. Body is JSON like every other error.
            OnChallenge = async context =>
            {
                context.HandleResponse();
                var detail = context.AuthenticateFailure switch
                {
                    SecurityTokenExpiredException => "Access token has expired. Call POST /api/auth/refresh.",
                    null => "Authentication is required. Send \"Authorization: Bearer <accessToken>\".",
                    _ when context.AuthenticateFailure?.Message == "Session was revoked." => "This session has been logged out. Log in again.",
                    _ => "Access token is not valid."
                };
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.Headers.WWWAuthenticate = "Bearer";
                await context.Response.WriteAsJsonAsync(new ApiError("Unauthorized", StatusCodes.Status401Unauthorized, detail));
            },

            // 403: valid token, but the role is not allowed to call this endpoint.
            OnForbidden = async context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new ApiError("Forbidden", StatusCodes.Status403Forbidden, "Your role is not allowed to perform this action."));
            }
        };
    });
builder.Services.AddAuthorization();

// The refresh token travels in a cookie, so CORS must allow credentials,
// and that only works with an explicit list of origins (no wildcard).
var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
    ?? new[] { "http://localhost:5173", "http://localhost:3000" };
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
        policy.WithOrigins(corsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
    await db.Database.EnsureCreatedAsync();

    // EnsureCreated does not add new tables to an existing database. A database created
    // in lab 1 has no UserSessions table, so in development it is rebuilt and reseeded.
    try
    {
        await db.Sessions.AnyAsync();
    }
    catch (Exception ex) when (app.Environment.IsDevelopment())
    {
        app.Logger.LogWarning(ex, "Database schema is out of date. Recreating the development database.");
        await db.Database.EnsureDeletedAsync();
        await db.Database.EnsureCreatedAsync();
    }

    await DbSeeder.SeedAsync(db, hasher);
}

app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "RentBase API v1");
    options.RoutePrefix = "swagger";
});
app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/", () => Results.Redirect("/swagger"));
app.Run();
