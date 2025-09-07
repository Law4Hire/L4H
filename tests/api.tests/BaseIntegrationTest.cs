using System;
using System.Linq;
using System.Net.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using L4H.Infrastructure.Data;
using L4H.Api.Tests.TestHelpers;
using Xunit;

namespace L4H.Api.Tests;

/// <summary>
/// Base class for integration tests that provides common setup and service registration
/// </summary>
public class BaseIntegrationTest : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    protected readonly WebApplicationFactory<Program> Factory;
    protected readonly HttpClient Client;
    protected readonly string DatabaseName;

    public BaseIntegrationTest(WebApplicationFactory<Program> factory)
    {
        // Generate unique database name for each test class to avoid conflicts
        DatabaseName = GetType().Name + "_" + Guid.NewGuid().ToString("N")[..8];
        
        Factory = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureServices(services =>
            {
                // Replace the database connection with our test database
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<L4HDbContext>));
                if (descriptor != null)
                {
                    services.Remove(descriptor);
                }

                var connectionString = $"Server=localhost,14333;Database={DatabaseName};User Id=sa;Password=SecureTest123!;TrustServerCertificate=True;";
                services.AddDbContext<L4HDbContext>(options =>
                {
                    options.UseSqlServer(connectionString);
                    options.EnableSensitiveDataLogging();
                });

                // Register test services (but keep SQL Server database)
                TestServiceRegistration.RegisterTestServices(services);
            });
        });

        Client = Factory.CreateClient();
        
        // Ensure database is created and seeded
        EnsureDatabaseCreated();
    }

    private void EnsureDatabaseCreated()
    {
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        
        // Create the database
        context.Database.EnsureCreated();
        
        // Seed essential reference data
        SeedEssentialData(context);
    }

    private static void SeedEssentialData(L4HDbContext context)
    {
        try
        {
            // Seed VisaTypes using raw SQL with IDENTITY_INSERT
            context.Database.ExecuteSqlRaw(@"
                SET IDENTITY_INSERT VisaTypes ON;
                
                IF NOT EXISTS (SELECT 1 FROM VisaTypes WHERE Id = 1)
                    INSERT INTO VisaTypes (Id, Code, Name, IsActive, CreatedAt, UpdatedAt) 
                    VALUES (1, 'H1B', 'H-1B Specialty Occupation', 1, GETUTCDATE(), GETUTCDATE());
                
                IF NOT EXISTS (SELECT 1 FROM VisaTypes WHERE Id = 2)
                    INSERT INTO VisaTypes (Id, Code, Name, IsActive, CreatedAt, UpdatedAt) 
                    VALUES (2, 'B2', 'B-2 Tourist Visa', 1, GETUTCDATE(), GETUTCDATE());
                
                IF NOT EXISTS (SELECT 1 FROM VisaTypes WHERE Id = 3)
                    INSERT INTO VisaTypes (Id, Code, Name, IsActive, CreatedAt, UpdatedAt) 
                    VALUES (3, 'F1', 'F-1 Student Visa', 1, GETUTCDATE(), GETUTCDATE());
                
                SET IDENTITY_INSERT VisaTypes OFF;
            ");

                    // Seed Countries using raw SQL with IDENTITY_INSERT
        context.Database.ExecuteSqlRaw(@"
            SET IDENTITY_INSERT Countries ON;

            IF NOT EXISTS (SELECT 1 FROM Countries WHERE Id = 1)
                INSERT INTO Countries (Id, Iso2, Iso3, Name, IsActive)
                VALUES (1, 'US', 'USA', 'United States', 1);

            IF NOT EXISTS (SELECT 1 FROM Countries WHERE Id = 2)
                INSERT INTO Countries (Id, Iso2, Iso3, Name, IsActive)
                VALUES (2, 'ES', 'ESP', 'Spain', 1);

            IF NOT EXISTS (SELECT 1 FROM Countries WHERE Id = 3)
                INSERT INTO Countries (Id, Iso2, Iso3, Name, IsActive)
                VALUES (3, 'AD', 'AND', 'Andorra', 1);

            SET IDENTITY_INSERT Countries OFF;
        ");

                    // Seed VisaClasses using raw SQL with IDENTITY_INSERT
        context.Database.ExecuteSqlRaw(@"
            SET IDENTITY_INSERT VisaClasses ON;

            IF NOT EXISTS (SELECT 1 FROM VisaClasses WHERE Id = 1)
                INSERT INTO VisaClasses (Id, Code, Name, GeneralCategory, IsActive)
                VALUES (1, 'H1B', 'H-1B', 'Employment', 1);

            IF NOT EXISTS (SELECT 1 FROM VisaClasses WHERE Id = 2)
                INSERT INTO VisaClasses (Id, Code, Name, GeneralCategory, IsActive)
                VALUES (2, 'B2', 'B-2', 'Tourist', 1);

            IF NOT EXISTS (SELECT 1 FROM VisaClasses WHERE Id = 3)
                INSERT INTO VisaClasses (Id, Code, Name, GeneralCategory, IsActive)
                VALUES (3, 'F1', 'F-1', 'Student', 1);

            SET IDENTITY_INSERT VisaClasses OFF;
        ");
        }
        catch (Exception ex)
        {
            // Log the error but don't fail the test setup
            Console.WriteLine($"ERROR: Failed to seed essential data: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            throw; // Re-throw to see what's happening
        }
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (disposing)
        {
            // Clean up the test database
            try
            {
                using var scope = Factory.Services.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
                context.Database.EnsureDeleted();
            }
            catch
            {
                // Ignore cleanup errors
            }

            Client?.Dispose();
            Factory?.Dispose();
        }
    }
}