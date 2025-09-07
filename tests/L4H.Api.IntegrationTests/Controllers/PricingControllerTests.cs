using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Api.Controllers;
using L4H.Shared.Models;

namespace L4H.Api.IntegrationTests.Controllers;

public class PricingControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions;

    public PricingControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Remove existing DbContext
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<L4HDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                // Use SQL Server database for testing
                services.AddDbContext<L4HDbContext>(options =>
                {
                    options.UseSqlServer("Server=localhost,14333;Database=L4H_Test;User Id=sa;Password=SecureTest123!;TrustServerCertificate=True;");
                });
            });
        });

        _client = _factory.CreateClient();
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }

    [Fact]
    public async Task GetPricing_ValidParameters_ReturnsPackages()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        await SeedPricingDataAsync(context);

        // Act
        var response = await _client.GetAsync("/v1/pricing?visaType=H1B&country=US");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var pricing = await response.Content.ReadFromJsonAsync<PricingResponse>(_jsonOptions);
        Assert.NotNull(pricing);
        Assert.Equal("H1B", pricing.VisaType);
        Assert.Equal("US", pricing.Country);
        Assert.True(pricing.Packages.Length > 0);
        
        // Verify package data
        var basicPackage = pricing.Packages.FirstOrDefault(p => p.PackageCode == "BASIC");
        Assert.NotNull(basicPackage);
        Assert.Equal("Basic Service", basicPackage.DisplayName);
        Assert.True(basicPackage.BasePrice > 0);
        Assert.True(basicPackage.Total > basicPackage.BasePrice); // Should include tax
    }

    [Fact]
    public async Task GetPricing_MissingCountry_ReturnsBadRequest()
    {
        // Act
        var response = await _client.GetAsync("/v1/pricing?visaType=H1B");

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetPricing_InvalidVisaType_ReturnsNotFound()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        await SeedPricingDataAsync(context);

        // Act
        var response = await _client.GetAsync("/v1/pricing?visaType=INVALID&country=US");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetPricing_NoPricingRules_ReturnsNotFound()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        await SeedPricingDataAsync(context);

        // Act - Use a country that doesn't have pricing rules
        var response = await _client.GetAsync("/v1/pricing?visaType=H1B&country=ZZ");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task SelectPackage_ValidRequest_CreatesSnapshot()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var testCase = await SeedPricingDataWithCaseAsync(context);

        var token = await GetValidJwtTokenAsync();
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var request = new SelectPackageRequest
        {
            VisaType = "H1B",
            PackageCode = "BASIC",
            Country = "US"
        };

        // Act
        var response = await _client.PostAsync($"/v1/cases/{testCase.Id.Value}/package", 
            JsonContent.Create(request, options: _jsonOptions));

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var snapshot = await response.Content.ReadFromJsonAsync<PriceSnapshotResponse>(_jsonOptions);
        Assert.NotNull(snapshot);
        Assert.Equal("H1B", snapshot.VisaTypeCode);
        Assert.Equal("BASIC", snapshot.PackageCode);
        Assert.Equal("US", snapshot.CountryCode);
        Assert.True(snapshot.Total > 0);

        // Verify snapshot was saved
        var savedSnapshot = await context.CasePriceSnapshots
            .FirstOrDefaultAsync(s => s.Id == snapshot.Id);
        Assert.NotNull(savedSnapshot);
    }

    [Fact]
    public async Task SelectPackage_WithoutAuth_Returns401()
    {
        // Arrange
        var request = new SelectPackageRequest
        {
            VisaType = "H1B",
            PackageCode = "BASIC",
            Country = "US"
        };

        // Act
        var response = await _client.PostAsync($"/v1/cases/{Guid.NewGuid()}/package", 
            JsonContent.Create(request, options: _jsonOptions));

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task SelectPackage_InvalidCase_ReturnsNotFound()
    {
        // Arrange
        var token = await GetValidJwtTokenAsync();
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var request = new SelectPackageRequest
        {
            VisaType = "H1B",
            PackageCode = "BASIC",
            Country = "US"
        };

        // Act
        var response = await _client.PostAsync($"/v1/cases/{Guid.NewGuid()}/package", 
            JsonContent.Create(request, options: _jsonOptions));

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Theory]
    [InlineData(1000.00, 0.08, null, 1080.00)] // Base + 8% tax, no FX
    [InlineData(1000.00, 0.08, "medium", 1134.00)] // Base + tax + 5% FX
    [InlineData(1000.00, 0.08, "high", 1188.00)] // Base + tax + 10% FX
    public void CalculateTotal_VariousScenarios_ReturnsCorrectAmount(
        decimal basePrice, decimal taxRate, string? fxMode, decimal expected)
    {
        // This tests the private CalculateTotal method via reflection
        // In practice, you'd make this method internal and use InternalsVisibleTo
        var controller = new PricingController(null!, null!);
        var method = typeof(PricingController)
            .GetMethod("CalculateTotal", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
        
        Assert.NotNull(method);
        var result = (decimal)method.Invoke(null, new object?[] { basePrice, taxRate, fxMode })!;
        
        Assert.Equal(expected, result);
    }

    private async Task<string> GetValidJwtTokenAsync()
    {
        // For testing purposes - in real tests you'd generate a proper JWT
        return "mock-jwt-token-for-testing";
    }

    private async Task<Case> SeedPricingDataWithCaseAsync(L4HDbContext context)
    {
        await SeedPricingDataAsync(context);

        var testCase = new Case
        {
            Id = new CaseId(Guid.NewGuid()),
            UserId = new UserId(Guid.NewGuid()),
            Status = "pending",
            LastActivityAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Cases.Add(testCase);
        await context.SaveChangesAsync();
        return testCase;
    }

    private async Task SeedPricingDataAsync(L4HDbContext context)
    {
        // Seed visa type
        var visaType = new VisaType
        {
            Code = "H1B",
            Name = "H-1B Specialty Occupation",
            IsActive = true
        };
        context.VisaTypes.Add(visaType);

        // Seed packages
        var packages = new[]
        {
            new Package { Code = "BASIC", DisplayName = "Basic Service", Description = "Basic service", SortOrder = 1, IsActive = true },
            new Package { Code = "STANDARD", DisplayName = "Standard Service", Description = "Standard service", SortOrder = 2, IsActive = true },
            new Package { Code = "PREMIUM", DisplayName = "Premium Service", Description = "Premium service", SortOrder = 3, IsActive = true }
        };
        context.Packages.AddRange(packages);

        await context.SaveChangesAsync(); // Save to get IDs

        // Seed pricing rules
        foreach (var package in packages)
        {
            var pricingRule = new PricingRule
            {
                VisaTypeId = visaType.Id,
                PackageId = package.Id,
                CountryCode = "US",
                BasePrice = package.Code switch
                {
                    "BASIC" => 1200.00m,
                    "STANDARD" => 1800.00m,
                    "PREMIUM" => 2640.00m,
                    _ => 1000.00m
                },
                Currency = "USD",
                TaxRate = 0.08m,
                FxSurchargeMode = null,
                IsActive = true
            };
            context.PricingRules.Add(pricingRule);
        }

        await context.SaveChangesAsync();
    }
}