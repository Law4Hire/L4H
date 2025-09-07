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

public class AdminControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions;

    public AdminControllerTests(WebApplicationFactory<Program> factory)
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
    public async Task GetAdminVisaTypes_WithoutAuth_Returns401()
    {
        // Act
        var response = await _client.GetAsync("/v1/admin/pricing/visa-types");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetAdminVisaTypes_WithNonAdmin_Returns403()
    {
        // Arrange
        var token = await GetRegularUserJwtTokenAsync();
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/v1/admin/pricing/visa-types");

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetAdminVisaTypes_WithAdminAuth_ReturnsVisaTypes()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        await SeedAdminDataAsync(context);

        var token = await GetAdminJwtTokenAsync();
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/v1/admin/pricing/visa-types");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var visaTypes = await response.Content.ReadFromJsonAsync<AdminVisaTypesResponse[]>(_jsonOptions);
        Assert.NotNull(visaTypes);
        Assert.True(visaTypes.Length > 0);

        var h1bType = visaTypes.FirstOrDefault(vt => vt.Code == "H1B");
        Assert.NotNull(h1bType);
        Assert.Equal("H-1B Specialty Occupation", h1bType.Name);
        Assert.True(h1bType.IsActive);
        Assert.True(h1bType.PricingRules.Length > 0);

        var usRules = h1bType.PricingRules.FirstOrDefault(pr => pr.CountryCode == "US");
        Assert.NotNull(usRules);
        Assert.True(usRules.Rules.Length > 0);
    }

    [Fact]
    public async Task UpdateVisaTypePricing_WithValidData_UpdatesSuccessfully()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var (visaType, pricingRule) = await SeedAdminDataAsync(context);

        var token = await GetAdminJwtTokenAsync();
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var request = new UpdateVisaTypePricingRequest
        {
            IsActive = false,
            PricingRuleUpdates = new[]
            {
                new PricingRuleUpdateRequest
                {
                    Id = pricingRule.Id,
                    BasePrice = 1500.00m,
                    TaxRate = 0.10m,
                    IsActive = true
                }
            }
        };

        // Act
        var response = await _client.PatchAsync($"/v1/admin/pricing/visa-types/{visaType.Id}", 
            JsonContent.Create(request, options: _jsonOptions));

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // Verify updates were applied
        var updatedVisaType = await context.VisaTypes.FindAsync(visaType.Id);
        Assert.NotNull(updatedVisaType);
        Assert.False(updatedVisaType.IsActive);

        var updatedRule = await context.PricingRules.FindAsync(pricingRule.Id);
        Assert.NotNull(updatedRule);
        Assert.Equal(1500.00m, updatedRule.BasePrice);
        Assert.Equal(0.10m, updatedRule.TaxRate);
    }

    [Fact]
    public async Task UpdateVisaTypePricing_InvalidId_ReturnsNotFound()
    {
        // Arrange
        var token = await GetAdminJwtTokenAsync();
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var request = new UpdateVisaTypePricingRequest { IsActive = false };

        // Act
        var response = await _client.PatchAsync("/v1/admin/pricing/visa-types/999", 
            JsonContent.Create(request, options: _jsonOptions));

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetAdminPackages_WithAdminAuth_ReturnsPackages()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        await SeedAdminDataAsync(context);

        var token = await GetAdminJwtTokenAsync();
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/v1/admin/pricing/packages");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var packages = await response.Content.ReadFromJsonAsync<AdminPackageResponse[]>(_jsonOptions);
        Assert.NotNull(packages);
        Assert.True(packages.Length > 0);

        var basicPackage = packages.FirstOrDefault(p => p.Code == "BASIC");
        Assert.NotNull(basicPackage);
        Assert.Equal("Basic Service", basicPackage.DisplayName);
        Assert.True(basicPackage.IsActive);
    }

    [Fact]
    public async Task GetAdminPackages_WithNonAdmin_Returns403()
    {
        // Arrange
        var token = await GetRegularUserJwtTokenAsync();
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/v1/admin/pricing/packages");

        // Assert
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private async Task<string> GetAdminJwtTokenAsync()
    {
        // For testing purposes - in real tests you'd generate a proper JWT with admin claims
        return "mock-admin-jwt-token-for-testing";
    }

    private async Task<string> GetRegularUserJwtTokenAsync()
    {
        // For testing purposes - in real tests you'd generate a proper JWT without admin claims
        return "mock-user-jwt-token-for-testing";
    }

    private async Task<(VisaType visaType, PricingRule pricingRule)> SeedAdminDataAsync(L4HDbContext context)
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
            new Package 
            { 
                Code = "BASIC", 
                DisplayName = "Basic Service", 
                Description = "Basic service description", 
                SortOrder = 1, 
                IsActive = true 
            },
            new Package 
            { 
                Code = "STANDARD", 
                DisplayName = "Standard Service", 
                Description = "Standard service description", 
                SortOrder = 2, 
                IsActive = true 
            }
        };
        context.Packages.AddRange(packages);

        await context.SaveChangesAsync(); // Save to get IDs

        // Seed pricing rules
        var pricingRules = new List<PricingRule>();
        foreach (var package in packages)
        {
            var pricingRule = new PricingRule
            {
                VisaTypeId = visaType.Id,
                PackageId = package.Id,
                CountryCode = "US",
                BasePrice = package.Code == "BASIC" ? 1200.00m : 1800.00m,
                Currency = "USD",
                TaxRate = 0.08m,
                FxSurchargeMode = null,
                IsActive = true
            };
            context.PricingRules.Add(pricingRule);
            pricingRules.Add(pricingRule);
        }

        await context.SaveChangesAsync();

        return (visaType, pricingRules.First());
    }
}