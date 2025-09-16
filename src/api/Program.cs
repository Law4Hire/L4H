using Serilog;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Localization;
using System.Globalization;
using L4H.Shared.Models;
using L4H.Shared.Json;
using Microsoft.EntityFrameworkCore.Diagnostics;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Services;
using L4H.Infrastructure.SeedData;
using L4H.Infrastructure.Services.Graph;
using L4H.Infrastructure.Services.Teams;
using L4H.Infrastructure.Services.Payments;
using L4H.Api.Services;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Localization;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
builder.Host.UseSerilog((context, configuration) =>
    configuration.ReadFrom.Configuration(context.Configuration)
        .WriteTo.Console(formatProvider: CultureInfo.InvariantCulture));

// Add services
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new CaseIdConverter());
        options.JsonSerializerOptions.Converters.Add(new UserIdConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "L4H API", Version = "v1" });
    
    // Add JWT authentication to Swagger
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Add DbContext
builder.Services.AddDbContext<L4HDbContext>(opt =>
    opt.UseSqlServer(
        builder.Configuration.GetConnectionString("SqlServer")
        ?? builder.Configuration["SqlServer:ConnectionString"]
        ?? builder.Configuration["ConnectionStrings:SqlServer"]
    )
    .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning))
);

// Configure JWT settings
var jwtConfig = new JwtConfig
{
    SigningKey = builder.Configuration["Auth:Jwt:SigningKey"] ?? builder.Configuration["Auth__Jwt__SigningKey"] ?? "CHANGE_ME_DEV_ONLY_256_BIT_KEY_REQUIRED_FOR_HS256_SECURITY_ALGORITHM",
    Issuer = builder.Configuration["Auth:Jwt:Issuer"] ?? builder.Configuration["Auth__Jwt__Issuer"] ?? "L4H",
    Audience = builder.Configuration["Auth:Jwt:Audience"] ?? builder.Configuration["Auth__Jwt__Audience"] ?? "L4H"
};

// Add JWT Authentication - bypass in Testing environment
if (!builder.Environment.IsEnvironment("Testing"))
{
    // Clear default claim mappings to preserve JWT standard claim names
    Microsoft.IdentityModel.JsonWebTokens.JsonWebTokenHandler.DefaultInboundClaimTypeMap.Clear();

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.MapInboundClaims = false; // Preserve original claim names
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtConfig.Issuer,
                ValidAudience = jwtConfig.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtConfig.SigningKey)),
                ClockSkew = TimeSpan.Zero,
                NameClaimType = "sub" // Map the subject claim to the name claim type
            };
        });
}
else
{
    // For testing - use a simpler auth scheme that accepts any token
    builder.Services.AddAuthentication("Test")
        .AddScheme<Microsoft.AspNetCore.Authentication.AuthenticationSchemeOptions, L4H.Api.TestAuthenticationHandler>("Test", options => { });
}

builder.Services.AddAuthorization();

            // Add HttpContextAccessor for CSRF service
            builder.Services.AddHttpContextAccessor();

            // Add memory cache for rate limiting
            builder.Services.AddMemoryCache();

// Add antiforgery services for CSRF protection
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
    options.SuppressXFrameOptionsHeader = false;
});

// Add localization
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");
var supported = new[] {
    "ar-SA","bn-BD","de-DE","en-US","es-ES","fr-FR","hi-IN","id-ID","it-IT",
    "ja-JP","ko-KR","mr-IN","pl-PL","pt-PT","ru-RU","ta-IN","te-IN","tr-TR","ur-PK","vi-VN","zh-CN"
}.Select(c => new CultureInfo(c)).ToList();

var locOpts = new RequestLocalizationOptions()
    .SetDefaultCulture("en-US")
    .AddSupportedCultures(supported.Select(c => c.Name).ToArray())
    .AddSupportedUICultures(supported.Select(c => c.Name).ToArray());

// Cookie provider (highest), then header, then query (?ui-culture=xx-YY)
locOpts.RequestCultureProviders.Insert(0, new CookieRequestCultureProvider {
    CookieName = "l4h_culture"
});
// Header provider already included; add query provider with low precedence:
locOpts.RequestCultureProviders.Add(new QueryStringRequestCultureProvider {
    QueryStringKey = "ui-culture", UIQueryStringKey = "ui-culture"
});

// Register application services
builder.Services.AddSingleton(jwtConfig);
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IPasswordPolicy>(provider =>
{
    var fallbackOnly = builder.Configuration.GetValue<bool>("Auth:FallbackRequireSpecialOnly") ||
                       builder.Configuration.GetValue<bool>("Auth__FallbackRequireSpecialOnly");
    return new PasswordPolicy(fallbackOnly);
});
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IRememberMeTokenService, RememberMeTokenService>();
builder.Services.AddScoped<IPasswordResetTokenService, PasswordResetTokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAdminSeedService, AdminSeedService>();
builder.Services.AddScoped<IPricingSeedService, PricingSeedService>();
builder.Services.AddScoped<IInterviewRecommender, RuleBasedRecommender>();
builder.Services.AddScoped<IAdaptiveInterviewService, AdaptiveInterviewService>();

            // Security hardening services
            builder.Services.AddScoped<IEmailVerificationService, EmailVerificationService>();
            builder.Services.AddScoped<ISessionManagementService, SessionManagementService>();
            builder.Services.AddScoped<IEnhancedPasswordPolicy, EnhancedPasswordPolicy>();
            builder.Services.AddScoped<ICsrfService, CsrfService>();
            builder.Services.AddScoped<IHealthCheckService, HealthCheckService>();
            builder.Services.AddScoped<ISecretsValidationService, SecretsValidationService>();
            builder.Services.AddScoped<IPiiMaskingService, PiiMaskingService>();
            builder.Services.AddScoped<IRateLimitingService, RateLimitingService>();
            builder.Services.AddScoped<IAccountLockoutService, AccountLockoutService>();

// Register Infrastructure services for testing and production

// Configure provider options
builder.Services.Configure<L4H.Api.Configuration.PaymentsOptions>(builder.Configuration.GetSection("Payments"));

// Configure security options
builder.Services.Configure<AuthConfig>(builder.Configuration.GetSection("Auth"));
builder.Services.Configure<L4H.Api.Configuration.GraphOptions>(builder.Configuration.GetSection("Graph"));
builder.Services.Configure<L4H.Api.Configuration.MeetingsOptions>(builder.Configuration.GetSection("Meetings"));

// Register providers - use fake providers for now
builder.Services.AddScoped<IPaymentProvider, FakeStripeProvider>();
builder.Services.AddScoped<IMailProvider, FakeGraphMailProvider>();
builder.Services.AddScoped<ICalendarProvider, FakeGraphCalendarProvider>();
builder.Services.AddScoped<IMeetingsProvider, FakeMeetingsProvider>();

// Configure Upload settings
builder.Services.Configure<L4H.Api.Models.UploadOptions>(builder.Configuration.GetSection("Uploads"));

// Register upload token service
builder.Services.AddScoped<UploadTokenService>();

// Seed services
builder.Services.AddScoped<ISeedTask, CountriesSeeder>();
builder.Services.AddScoped<ISeedTask, USSubdivisionsSeeder>();
builder.Services.AddScoped<ISeedTask, VisaClassesSeeder>();
builder.Services.AddScoped<ISeedTask, VisaTypesSeeder>();
builder.Services.AddScoped<SeedRunner>();

// Workflow and scraper services (for API endpoints)
builder.Services.AddScoped<CountryService>();

// Background services
builder.Services.AddHostedService<CaseAutoAgingService>();
// Only register AntivirusScanService if not disabled via configuration
builder.Services.AddHostedService<AntivirusScanService>();
builder.Services.AddHostedService<DailyDigestService>();

var app = builder.Build();

// Configure the HTTP request pipeline
// Enable Swagger in Development only
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Ensure database is created and migrated for Development and Testing
if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Testing"))
{
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        await context.Database.MigrateAsync().ConfigureAwait(false);
    }
}

// Seed admin and pricing data only in Development (skip Testing)
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var adminSeedService = scope.ServiceProvider.GetRequiredService<IAdminSeedService>();
        await adminSeedService.SeedAdminAsync().ConfigureAwait(false);

        var pricingSeedService = scope.ServiceProvider.GetRequiredService<IPricingSeedService>();
        await pricingSeedService.SeedPricingDataAsync().ConfigureAwait(false);

        // Run seed data framework if enabled
        var runSeedOnStart = app.Configuration.GetValue<bool>("RUN_SEED_ON_START", true);
        if (runSeedOnStart)
        {
            var seedRunner = scope.ServiceProvider.GetRequiredService<SeedRunner>();
            await seedRunner.RunAllAsync().ConfigureAwait(false);
        }
    }
}

app.UseSerilogRequestLogging();
app.UseRequestLocalization(locOpts);
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health endpoint is handled by HealthController

// Versioned API endpoints
var v1 = app.MapGroup("/v1")
    .WithTags("V1");

v1.MapGet("/ping", () => Results.Ok(new { message = "pong", timestamp = DateTime.UtcNow }))
    .WithName("Ping")
    .WithSummary("API ping endpoint");

app.Run();

// Make Program class accessible for testing
public partial class Program { }