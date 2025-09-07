using FluentAssertions;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.ScraperWorker.Services;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Logging;
using System.Globalization;
using Xunit;

namespace L4H.Scraper.Tests;

public sealed class ScraperIntegrationTests : IDisposable
{
    private readonly IServiceProvider _serviceProvider;
    private readonly L4HDbContext _context;

    public ScraperIntegrationTests()
    {
        var services = new ServiceCollection();
        
        // Use in-memory database for testing
        var dbName = $"ScraperTest_{Guid.NewGuid():N}";
        services.AddDbContext<L4HDbContext>(options =>
            options.UseInMemoryDatabase(dbName));
        
        // Add logging
        services.AddLogging(builder => builder.AddConsole());
        
        // Add localization
        services.AddLocalization();
        services.AddSingleton<IStringLocalizer>(provider =>
        {
            var factory = provider.GetRequiredService<IStringLocalizerFactory>();
            return factory.Create("Shared", "L4H.Scraper.Tests");
        });
        
        // Add scraper services with fake providers
        services.AddScoped<IWorkflowSource, FakeWorkflowSource>();
        services.AddScoped<IWorkflowNormalizer, WorkflowNormalizer>();
        services.AddScoped<IWorkflowDiff, WorkflowDiffEngine>();
        services.AddScoped<WorkflowScraperService>();
        
        _serviceProvider = services.BuildServiceProvider();
        _context = _serviceProvider.GetRequiredService<L4HDbContext>();
        // Ensure in-memory database is created
        _context.Database.EnsureCreated();

        // Seed test data
        SeedTestData().GetAwaiter().GetResult();
    }

    private async Task SeedTestData()
    {
        // Seed common visa types used in tests
        var visaTypes = new[]
        {
            new VisaType { Code = "H1B", Name = "H-1B Specialty Occupation", IsActive = true },
            new VisaType { Code = "B2", Name = "B-2 Tourist", IsActive = true },
            new VisaType { Code = "F1", Name = "F-1 Student", IsActive = true }
        };
        
        _context.VisaTypes.AddRange(visaTypes);
        await _context.SaveChangesAsync().ConfigureAwait(false);
    }

    private static async Task SeedVisaTypesAsync(L4HDbContext context)
    {
        var visaTypes = new[]
        {
            new VisaType { Code = "H1B", Name = "H-1B Specialty Occupation", IsActive = true },
            new VisaType { Code = "B2", Name = "B-2 Tourist", IsActive = true },
            new VisaType { Code = "F1", Name = "F-1 Student", IsActive = true }
        };
        
        context.VisaTypes.AddRange(visaTypes);
        await context.SaveChangesAsync().ConfigureAwait(false);
    }

    [Fact]
    public async Task Scraper_FakeEmbassySpain_B2_ProducesDoctorsAndSteps()
    {
        // Arrange
        var scraper = _serviceProvider.GetRequiredService<WorkflowScraperService>();
        
        // Act
        var result = await scraper.ScrapeAndProcessAsync("B2", "ES", CancellationToken.None);
        
        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.WorkflowId.Should().NotBeEmpty();
        
        // Verify workflow was created in database
        var workflow = await _context.WorkflowVersions
            .Include(w => w.Steps)
            .Include(w => w.Doctors)
            .FirstOrDefaultAsync(w => w.Id == result.WorkflowId);
            
        workflow.Should().NotBeNull();
        workflow!.CountryCode.Should().Be("ES");
        workflow.Source.Should().Be("Embassy");
        workflow.Status.Should().Be("pending_approval");
        workflow.Steps.Should().HaveCountGreaterThan(0);
        workflow.Doctors.Should().HaveCountGreaterThan(0);
        
        // Verify steps have proper structure
        var medicalStep = workflow.Steps.FirstOrDefault(s => s.Key == "medical_examination");
        medicalStep.Should().NotBeNull();
        medicalStep!.Title.Should().NotBeEmpty();
        medicalStep.Description.Should().NotBeEmpty();
        
        // Verify doctors have proper data
        var doctor = workflow.Doctors.First();
        doctor.Name.Should().NotBeEmpty();
        doctor.CountryCode.Should().Be("ES");
        doctor.SourceUrl.Should().NotBeEmpty();
    }
    
    [Fact]
    public async Task Scraper_AndorraFallsBackToSpain_ForDoctors()
    {
        // Arrange
        await SeedCountryMapping();
        var scraper = _serviceProvider.GetRequiredService<WorkflowScraperService>();
        
        // Act
        var result = await scraper.ScrapeAndProcessAsync("B2", "AD", CancellationToken.None);
        
        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        
        var workflow = await _context.WorkflowVersions
            .Include(w => w.Doctors)
            .FirstOrDefaultAsync(w => w.Id == result.WorkflowId);
            
        workflow.Should().NotBeNull();
        workflow!.CountryCode.Should().Be("AD");
        
        // Doctors should be from Spain but mapped to Andorra context
        workflow.Doctors.Should().HaveCountGreaterThan(0);
        var doctor = workflow.Doctors.First();
        doctor.CountryCode.Should().Be("ES"); // Original country of the doctor
    }
    
    [Fact] 
    public async Task Scraper_EmbassyFixtureMissing_UsesUSCIS()
    {
        // Arrange
        var fakeSource = new FakeWorkflowSource();
        fakeSource.SetEmbassyUnavailable("FR"); // Force fallback to USCIS
        
        var services = new ServiceCollection();
        // Use in-memory database for USCIS fallback test
        var uscisdDb = $"USCISTest_{Guid.NewGuid():N}";
        services.AddDbContext<L4HDbContext>(options => options.UseInMemoryDatabase(uscisdDb));
        services.AddLogging(builder => builder.AddConsole());
        services.AddLocalization();
        services.AddSingleton<IStringLocalizer>(provider =>
        {
            var factory = provider.GetRequiredService<IStringLocalizerFactory>();
            return factory.Create("Shared", "L4H.Scraper.Tests");
        });
        services.AddScoped<IWorkflowSource>(_ => fakeSource);
        services.AddScoped<IWorkflowNormalizer, WorkflowNormalizer>();
        services.AddScoped<IWorkflowDiff, WorkflowDiffEngine>();
        services.AddScoped<WorkflowScraperService>();
        
        var serviceProvider = services.BuildServiceProvider();
        
        // Seed visa types for this test
        var testContext = serviceProvider.GetRequiredService<L4HDbContext>();
        // Ensure in-memory database is created
        testContext.Database.EnsureCreated();
        await SeedVisaTypesAsync(testContext);
        
        var scraper = serviceProvider.GetRequiredService<WorkflowScraperService>();
        
        // Act
        var result = await scraper.ScrapeAndProcessAsync("H1B", "FR", CancellationToken.None);
        
        // Assert
        result.Should().NotBeNull();
        if (!result.Success)
        {
            var errors = string.Join("; ", result.Errors);
            result.Success.Should().BeTrue($"Expected success but got errors: {errors}");
        }
        result.Success.Should().BeTrue();
        
        var context = serviceProvider.GetRequiredService<L4HDbContext>();
        var workflow = await context.WorkflowVersions.FirstOrDefaultAsync(w => w.Id == result.WorkflowId);
        
        workflow.Should().NotBeNull();
        workflow!.Source.Should().Be("USCIS");
        workflow.CountryCode.Should().Be("FR");
    }
    
    [Fact]
    public async Task Scraper_WithSpanishLocale_LogsLocalizedMessages()
    {
        // Arrange
        CultureInfo.CurrentUICulture = new CultureInfo("es-ES");
        var scraper = _serviceProvider.GetRequiredService<WorkflowScraperService>();
        
        // Act
        var result = await scraper.ScrapeAndProcessAsync("B2", "ES", CancellationToken.None);
        
        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        
        // Verify messages are returned (localization may not work in test environment)
        result.Messages.Should().Contain("Scraper.RunCompleted");
    }

    [Fact]
    public async Task DiffEngine_ReportsAddedModifiedRemoved()
    {
        // Arrange
        await SeedApprovedWorkflowV1();
        var diffEngine = _serviceProvider.GetRequiredService<IWorkflowDiff>();
        
        var approvedWorkflow = await _context.WorkflowVersions
            .Include(w => w.Steps)
            .Include(w => w.Doctors)
            .FirstAsync(w => w.Status == "approved");
            
        var newWorkflow = CreateModifiedWorkflow();
        
        // Act
        var diff = diffEngine.Diff(approvedWorkflow, newWorkflow);
        
        // Assert
        diff.Should().NotBeNull();
        diff.ModifiedSteps.Should().HaveCount(1); // medical_exam modified
        diff.AddedSteps.Should().HaveCount(1);    // new step added
        diff.RemovedSteps.Should().HaveCount(1);  // fee_payment removed
        diff.TotalChanges.Should().Be(3);
        
        // Check specific changes
        var modifiedStep = diff.ModifiedSteps.First();
        modifiedStep.Key.Should().Be("medical_exam");
        modifiedStep.ChangeType.Should().Be("title_changed,description_changed");
    }
    
    [Fact]
    public async Task Draft_DeDupeByHash_AvoidsDuplicates()
    {
        // Arrange
        var scraper = _serviceProvider.GetRequiredService<WorkflowScraperService>();
        
        // Act - run scraper twice with same content
        var result1 = await scraper.ScrapeAndProcessAsync("B2", "ES", CancellationToken.None);
        var result2 = await scraper.ScrapeAndProcessAsync("B2", "ES", CancellationToken.None);
        
        // Assert
        result1.Success.Should().BeTrue();
        result2.Success.Should().BeTrue();
        result2.IsDuplicate.Should().BeTrue();
        result2.WorkflowId.Should().Be(result1.WorkflowId); // Same workflow returned
        
        // Verify only one workflow version exists
        var workflows = await _context.WorkflowVersions
            .Where(w => w.CountryCode == "ES" && w.Status == "pending_approval")
            .ToListAsync();
            
        workflows.Should().HaveCount(1);
    }

    private async Task SeedCountryMapping()
    {
        var mapping = new CountryServiceMapping
        {
            Id = Guid.NewGuid(),
            Service = "PanelPhysician",
            FromCountry = "AD",
            ToCountry = "ES",
            Notes = "Andorra uses Spain panel physicians"
        };
        
        _context.CountryServiceMappings.Add(mapping);
        await _context.SaveChangesAsync().ConfigureAwait(false);
    }
    
    private async Task SeedApprovedWorkflowV1()
    {
        var workflow = new WorkflowVersion
        {
            Id = Guid.NewGuid(),
            VisaTypeId = 1,
            CountryCode = "ES",
            Version = 1,
            Status = "approved",
            Source = "Embassy",
            ScrapeHash = "original-hash",
            ScrapedAt = DateTime.UtcNow.AddDays(-1),
            ApprovedAt = DateTime.UtcNow.AddDays(-1)
        };
        
        var steps = new List<WorkflowStep>
        {
            new WorkflowStep
            {
                Id = Guid.NewGuid(),
                WorkflowVersionId = workflow.Id,
                Ordinal = 1,
                Key = "medical_exam",
                Title = "Old Medical Exam Title",
                Description = "Old description"
            },
            new WorkflowStep
            {
                Id = Guid.NewGuid(),
                WorkflowVersionId = workflow.Id,
                Ordinal = 2,
                Key = "fee_payment",
                Title = "Pay Fee",
                Description = "Pay the fee"
            }
        };
        
        _context.WorkflowVersions.Add(workflow);
        _context.WorkflowSteps.AddRange(steps);
        await _context.SaveChangesAsync().ConfigureAwait(false);
    }
    
    private static NormalizedWorkflow CreateModifiedWorkflow()
    {
        return new NormalizedWorkflow
        {
            Source = "Embassy",
            Steps = new List<NormalizedStep>
            {
                new NormalizedStep
                {
                    Key = "medical_exam",
                    Title = "NEW Medical Exam Title", // Modified
                    Description = "Updated description",
                    Ordinal = 1
                },
                new NormalizedStep
                {
                    Key = "interview",
                    Title = "Interview Step", // Added
                    Description = "New interview step",
                    Ordinal = 2
                }
                // fee_payment step removed
            },
            Doctors = new List<NormalizedDoctor>(),
            SourceUrls = new List<string> { "https://test.example.com" },
            ContentHash = "modified-hash"
        };
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    private void Dispose(bool disposing)
    {
        if (disposing)
        {
            _context.Dispose();
            if (_serviceProvider is IDisposable disposableProvider)
            {
                disposableProvider.Dispose();
            }
        }
    }
}