using Serilog;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
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
using L4H.Api.Json;
using L4H.Api.Configuration;
using FluentValidation;
using FluentValidation.AspNetCore;
using L4H.Api.Validators;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
builder.Host.UseSerilog((context, configuration) =>
    configuration.ReadFrom.Configuration(context.Configuration)
        .WriteTo.Console(formatProvider: CultureInfo.InvariantCulture));

// Add services - JSON source generation temporarily disabled for .NET 10 RC compatibility
// TODO: Re-enable source generation after registering all required types in ApiJsonContext
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new CaseIdConverter());
        options.JsonSerializerOptions.Converters.Add(new UserIdConverter());
        // Use camelCase for JSON property names (JavaScript convention)
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        // Explicitly use reflection-based serialization for .NET 10 compatibility
        options.JsonSerializerOptions.TypeInfoResolver = new System.Text.Json.Serialization.Metadata.DefaultJsonTypeInfoResolver();
        // Handle circular references
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.MaxDepth = 32; // Use reasonable depth for API responses
    });

// Validators temporarily disabled for deployment
builder.Services.AddScoped<IValidator<SignupRequest>, SignupRequestValidator>();
builder.Services.AddScoped<IValidator<LoginRequest>, LoginRequestValidator>();
builder.Services.AddScoped<IValidator<UpdateProfileRequest>, UpdateProfileRequestValidator>();
builder.Services.AddScoped<IValidator<ForgotPasswordRequest>, ForgotPasswordRequestValidator>();
builder.Services.AddScoped<IValidator<ResetPasswordRequest>, ResetPasswordRequestValidator>();
builder.Services.AddScoped<IValidator<CreateApprovedDoctorRequest>, CreateApprovedDoctorRequestValidator>();
builder.Services.AddScoped<IValidator<CreateWorkflowRequest>, CreateWorkflowRequestValidator>();
builder.Services.AddScoped<IValidator<CreateWorkflowStepRequest>, CreateWorkflowStepRequestValidator>();
builder.Services.AddScoped<IValidator<CreateWorkflowDoctorRequest>, CreateWorkflowDoctorRequestValidator>();

builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Swagger/OpenAPI re-enabled with Scalar
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Info.Title = "L4H API";
        document.Info.Version = "v1";
        document.Info.Description = "Law4Hire Immigration Services API";
        return Task.CompletedTask;
    });

    // Add schema transformer to handle circular references
    //     options.AddSchemaTransformer<L4H.Api.OpenApi.CircularReferenceSchemaTransformer>();
});

// Configure JSON options to handle circular references (consistent with MVC JSON options)
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.MaxDepth = 32;
    options.SerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});
// builder.Services.AddSwaggerGen(c =>
// {
//     c.SwaggerDoc("v1", new() { Title = "L4H API", Version = "v1" });
//
//     // Add JWT authentication to Swagger
//     c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
//     {
//         Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
//         Name = "Authorization",
//         In = Microsoft.OpenApi.Models.ParameterLocation.Header,
//         Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
//         Scheme = "Bearer"
//     });
//
//     c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
//     {
//         {
//             new Microsoft.OpenApi.Models.OpenApiSecurityScheme
//             {
//                 Reference = new Microsoft.OpenApi.Models.OpenApiReference
//                 {
//                     Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
//                     Id = "Bearer"
//                 }
//             },
//             Array.Empty<string>()
//         }
//     });
// });

// Add DbContext
builder.Services.AddDbContext<L4HDbContext>(opt =>
    opt.UseSqlServer(
        builder.Configuration.GetConnectionString("SqlServer")
        ?? builder.Configuration["SqlServer:ConnectionString"]
        ?? builder.Configuration["ConnectionStrings:SqlServer"])
    .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning))
);

// Configure JWT settings
var jwtConfig = new JwtConfig
{
    SigningKey = builder.Configuration["Auth:Jwt:SigningKey"] ?? builder.Configuration["Auth__Jwt__SigningKey"] ?? "CHANGE_ME_DEV_ONLY_256_BIT_KEY_REQUIRED_FOR_HS256_SECURITY_ALGORITHM",
    Issuer = builder.Configuration["Auth:Jwt:Issuer"] ?? builder.Configuration["Auth__Jwt__Issuer"] ?? "L4H",
    Audience = builder.Configuration["Auth:Jwt:Audience"] ?? builder.Configuration["Auth__Jwt__Audience"] ?? "L4H",
    AccessTokenLifetimeMinutes = builder.Configuration.GetValue<int?>("Auth:Jwt:LifetimeMinutes") ?? 60 // Changed from 5 to 60 minutes
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

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("IsAdmin", policy => policy.RequireClaim("is_admin", "true", "True"));
    options.AddPolicy("IsLegalProfessional", policy => policy.RequireClaim("is_legal_professional", "true", "True"));
    options.AddPolicy("IsAdminOrLegalProfessional", policy => 
        policy.RequireAssertion(context => 
            context.User.HasClaim("is_admin", "true") || 
            context.User.HasClaim("is_admin", "True") ||
            context.User.HasClaim("is_legal_professional", "true") ||
            context.User.HasClaim("is_legal_professional", "True")));
    options.AddPolicy("HasAttorneyAssignment", policy => 
        policy.RequireAssertion(context => 
            context.User.HasClaim("is_admin", "true") || 
            context.User.HasClaim("is_admin", "True") ||
            context.User.HasClaim(c => c.Type == "attorney_id")));
});

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
builder.Services.AddScoped<IMailService, MailService>();
builder.Services.AddScoped<IAdminSeedService, AdminSeedService>();
builder.Services.AddScoped<IPricingSeedService, PricingSeedService>();
builder.Services.AddScoped<CountriesSeeder>();

// Legacy interview services (deprecated)
// builder.Services.AddScoped<IInterviewRecommender, RuleBasedRecommender>();
// builder.Services.AddScoped<IAdaptiveInterviewService, AdaptiveInterviewService>();

// Interview services - using QuestionEngine for anonymous eligibility-only questions
builder.Services.AddScoped<L4H.Infrastructure.Services.Interview.IInterviewOrchestrator, L4H.Infrastructure.Services.Interview.InterviewOrchestrator>();
builder.Services.AddScoped<L4H.Infrastructure.Services.Interview.IQuestionEngine, L4H.Infrastructure.Services.Interview.QuestionEngine>();
builder.Services.AddScoped<L4H.Infrastructure.Services.Interview.ISessionManager, L4H.Infrastructure.Services.Interview.SessionManager>();
builder.Services.AddScoped<L4H.Infrastructure.Services.Interview.IVisaEvaluationEngine, L4H.Infrastructure.Services.Interview.VisaEvaluationEngine>();

// builder.Services.AddScoped<ICitizenshipCaseService, CitizenshipCaseService>();
builder.Services.AddScoped<IAdoptionCaseService, AdoptionCaseService>();
builder.Services.AddScoped<IFileUploadService, FileUploadService>();
builder.Services.AddScoped<L4H.Infrastructure.Services.IInterviewDocumentService, L4H.Infrastructure.Services.InterviewDocumentService>();
builder.Services.AddScoped<CannlawConfigurationService>();

// Cannlaw client billing services
builder.Services.AddScoped<IClientService, ClientService>();
builder.Services.AddScoped<ITimeTrackingService, TimeTrackingService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

// Translation monitoring services - Removed (incomplete implementation)
// builder.Services.AddScoped<ITranslationMonitoringService, TranslationMonitoringService>();

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
builder.Services.Configure<L4H.Infrastructure.Configuration.SupportOptions>(builder.Configuration.GetSection("Support"));
builder.Services.Configure<L4H.Api.Configuration.GraphOptions>(builder.Configuration.GetSection("Graph"));
builder.Services.Configure<L4H.Api.Configuration.MeetingsOptions>(builder.Configuration.GetSection("Meetings"));

// Register providers - use fake providers for now
builder.Services.AddScoped<IPaymentProvider, FakeStripeProvider>();
builder.Services.AddScoped<IMailProvider, FakeGraphMailProvider>();
builder.Services.AddScoped<ICalendarProvider, FakeGraphCalendarProvider>();
builder.Services.AddScoped<IMeetingsProvider, FakeMeetingsProvider>();

// Configure Upload settings
builder.Services.Configure<UploadOptions>(builder.Configuration.GetSection("Uploads"));

// Register upload token service
builder.Services.AddScoped<UploadTokenService>();

// Register Global Exception Handler
builder.Services.AddExceptionHandler<L4H.Api.Infrastructure.GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Seed services
builder.Services.AddScoped<ISeedTask, CountriesSeeder>();
builder.Services.AddScoped<ISeedTask, USSubdivisionsSeeder>();
builder.Services.AddScoped<ISeedTask, VisaClassesSeeder>();
builder.Services.AddScoped<ISeedTask, VisaTypesSeeder>();
builder.Services.AddScoped<ISeedTask, CategoryClassSeeder>();
builder.Services.AddScoped<ISeedTask, CountryVisaTypesSeeder>();
builder.Services.AddScoped<ISeedTask, AttorneysSeeder>();
builder.Services.AddScoped<ISeedTask, CannlawClientBillingSeeder>();
builder.Services.AddScoped<ISeedTask, CannlawConfigurationSeeder>();
builder.Services.AddScoped<ISeedTask, InterviewCategoriesSeeder>();
builder.Services.AddScoped<ISeedTask, InterviewQuestionsSeeder>();
builder.Services.AddScoped<ISeedTask, USCISFormsSeeder>();
builder.Services.AddScoped<SeedRunner>();

// Workflow and scraper services (for API endpoints)
builder.Services.AddScoped<CountryService>();

// Background services - temporarily disabled to isolate startup crash
// TODO: Re-enable after fixing startup issue
// builder.Services.AddHostedService<CaseAutoAgingService>();
// builder.Services.AddHostedService<AntivirusScanService>();
// builder.Services.AddHostedService<DailyDigestService>();
// builder.Services.AddHostedService<NotificationBackgroundService>();

Console.WriteLine(Program.StartupLogs.Building);
var app = builder.Build();
Console.WriteLine(Program.StartupLogs.Built);

// Configure the HTTP request pipeline
// Swagger temporarily disabled due to OpenAPI package compatibility issues in .NET 10 RC
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(); // Scalar UI at /scalar
}

app.UseExceptionHandler();

// Ensure database is created and migrated for Development, Testing, and Production
var runMigrations = app.Configuration.GetValue<bool>("RunMigrationsOnStartup", true);
if (runMigrations && (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Testing") || app.Environment.IsProduction()))
{
    Console.WriteLine(Program.StartupLogs.StartingMigration);
    using (var scope = app.Services.CreateScope())
    {
        try
        {
            var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
            Console.WriteLine(Program.StartupLogs.DbContextAcquired);
            await context.Database.MigrateAsync().ConfigureAwait(false);
            Console.WriteLine(Program.StartupLogs.MigrationCompleted);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[STARTUP] FATAL: Database migration failed - {ex.GetType().Name}: {ex.Message}");
            Console.WriteLine($"[STARTUP] Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"[STARTUP] Inner exception: {ex.InnerException.GetType().Name}: {ex.InnerException.Message}");
            }
            throw;
        }
    }
}

// Seed admin and pricing data for Development and Production (skip Testing)
Console.WriteLine($"[STARTUP] Environment: {app.Environment.EnvironmentName}, IsDevelopment: {app.Environment.IsDevelopment()}, IsProduction: {app.Environment.IsProduction()}");
Console.WriteLine(Program.StartupLogs.CheckingSeed);
if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
{
    Console.WriteLine(Program.StartupLogs.SeedConditionMet);
    using (var scope = app.Services.CreateScope())
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

        try
        {
            Console.WriteLine("=== DIAGNOSTIC: About to execute admin seed [TIMESTAMP: 2025-12-13-20:50] ===");

            // Admin and pricing seeds
            var adminSeedService = scope.ServiceProvider.GetRequiredService<IAdminSeedService>();
            await adminSeedService.SeedAdminAsync().ConfigureAwait(false);
            Console.WriteLine("=== DIAGNOSTIC: Admin seed COMPLETED [TIMESTAMP: 2025-12-13-20:50] ===");

            var pricingSeedService = scope.ServiceProvider.GetRequiredService<IPricingSeedService>();
            await pricingSeedService.SeedPricingDataAsync().ConfigureAwait(false);
            Console.WriteLine("=== DIAGNOSTIC: Pricing seed COMPLETED ===");

            Console.WriteLine(Program.StartupLogs.StartingCountriesSeed);
            logger.LogInformation("Starting countries seed...");
            var countriesSeeder = scope.ServiceProvider.GetRequiredService<CountriesSeeder>();
            await countriesSeeder.ExecuteAsync().ConfigureAwait(false);
            Console.WriteLine(Program.StartupLogs.CountriesSeedCompleted);
            logger.LogInformation("Countries seed completed");

            Console.WriteLine(Program.StartupLogs.StartingSeedRunner);
            logger.LogInformation("Starting seed runner...");
            var seedRunner = scope.ServiceProvider.GetRequiredService<SeedRunner>();
            Console.WriteLine(Program.StartupLogs.AwaitSeedRunner);
            await seedRunner.RunAllAsync().ConfigureAwait(false);
            Console.WriteLine(Program.StartupLogs.SeedRunnerAwaitCompleted);
            Console.WriteLine(Program.StartupLogs.SeedRunnerCompleted);
            logger.LogInformation("Seed runner completed");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "FATAL: Seeding failed - {Message}", ex.Message);
            throw; // Re-throw to fail startup if seeding fails
        }
    }
}

Console.WriteLine("[STARTUP] Configuring middleware pipeline...");
app.UseSerilogRequestLogging();
Console.WriteLine("[STARTUP] Serilog request logging configured");

// Configure static files for attorney photos and other uploads
var basePath = builder.Configuration.GetValue<string>("FileStorage:BasePath") ?? "/data/uploads";
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(basePath),
    RequestPath = "/uploads"
});
Console.WriteLine($"[STARTUP] Static files configured: {basePath} -> /uploads");

app.UseAuthentication();
Console.WriteLine("[STARTUP] Authentication configured");

app.UseAuthorization();
Console.WriteLine("[STARTUP] Authorization configured");

Console.WriteLine("[STARTUP] Mapping controllers...");
// Map controllers based on their [Route] attributes
app.MapControllers().RequireHost("*:*"); // Allow all hosts in development
Console.WriteLine("[STARTUP] Controllers mapped");

// Health endpoint is handled by HealthController

// Versioned API endpoints
var v1 = app.MapGroup("/api/v1")
    .WithTags("V1");

v1.MapGet("/ping", () => Results.Ok(new { message = "pong", timestamp = DateTime.UtcNow }))
    .WithName("Ping")
    .WithSummary("API ping endpoint");
Console.WriteLine("[STARTUP] API endpoints configured");

Console.WriteLine("[STARTUP] Starting web server...");
app.Run();
Console.WriteLine("[STARTUP] Web server started successfully");

// Make Program class accessible for testing
public partial class Program 
{ 
    internal static class StartupLogs
    {
        public const string Building = "[STARTUP] Building application...";
        public const string Built = "[STARTUP] Application built successfully";
        public const string StartingMigration = "[STARTUP] Starting database migration...";
        public const string DbContextAcquired = "[STARTUP] DbContext acquired, starting migration...";
        public const string MigrationCompleted = "[STARTUP] Database migration completed";
        public const string CheckingSeed = "[STARTUP] Checking if seeding should run...";
        public const string SeedConditionMet = "[STARTUP] Seeding condition met, starting seed process...";
        public const string StartingCountriesSeed = "[STARTUP] Starting countries seed...";
        public const string CountriesSeedCompleted = "[STARTUP] Countries seed completed";
        public const string StartingSeedRunner = "[STARTUP] Starting seed runner...";
        public const string AwaitSeedRunner = "[STARTUP] About to await seedRunner.RunAllAsync()...";
        public const string SeedRunnerAwaitCompleted = "[STARTUP] seedRunner.RunAllAsync() await completed";
        public const string SeedRunnerCompleted = "[STARTUP] Seed runner completed";
    }
}
