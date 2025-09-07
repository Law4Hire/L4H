using L4H.Infrastructure.Data;
using L4H.Infrastructure.Services;
using L4H.ScraperWorker;
using L4H.ScraperWorker.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;

var builder = Host.CreateApplicationBuilder(args);

// Add services
builder.Services.AddDbContext<L4HDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add localization
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");

// Add a simple string localizer for the scraper
builder.Services.AddSingleton<IStringLocalizer>(provider =>
{
    var factory = provider.GetRequiredService<IStringLocalizerFactory>();
    return factory.Create("Shared", typeof(Program).Assembly.FullName ?? "L4H.ScraperWorker");
});

// Register core infrastructure services
builder.Services.AddScoped<CountryService>();

// Register scraper services with proper lifecycle
builder.Services.AddScoped<IWorkflowSource, FakeWorkflowSource>();
builder.Services.AddScoped<IWorkflowNormalizer, WorkflowNormalizer>();
builder.Services.AddScoped<IWorkflowDiff, WorkflowDiffEngine>();
builder.Services.AddScoped<WorkflowScraperService>();

// Add HTTP client for live sources (when implemented)
builder.Services.AddHttpClient();

// Add logging configuration
builder.Services.AddLogging(logging =>
{
    logging.ClearProviders();
    logging.AddConsole();
    logging.SetMinimumLevel(LogLevel.Information);
});

// Add the background service
builder.Services.AddHostedService<Worker>();

var host = builder.Build();

// Ensure database is created and seeded
using (var scope = host.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
    await context.Database.MigrateAsync().ConfigureAwait(false);
}

host.Run();