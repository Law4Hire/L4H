using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Api.Controllers;
using L4H.Shared.Models;

namespace L4H.Api.IntegrationTests.Controllers;

public class CasesControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly JsonSerializerOptions _jsonOptions;

    public CasesControllerTests(WebApplicationFactory<Program> factory)
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
    public async Task GetMyCases_WithoutAuth_Returns401()
    {
        // Act
        var response = await _client.GetAsync("/v1/cases/mine");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetMyCases_WithValidAuth_ReturnsUserCases()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        await SeedTestDataAsync(context);

        var token = await GetValidJwtTokenAsync();
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/v1/cases/mine");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var cases = await response.Content.ReadFromJsonAsync<CaseResponse[]>(_jsonOptions);
        Assert.NotNull(cases);
        Assert.True(cases.Length > 0);
    }

    [Fact]
    public async Task GetCase_ValidId_ReturnsCase()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var testCase = await SeedTestCaseAsync(context);

        var token = await GetValidJwtTokenAsync();
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync($"/v1/cases/{testCase.Id.Value}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var caseResponse = await response.Content.ReadFromJsonAsync<CaseResponse>(_jsonOptions);
        Assert.NotNull(caseResponse);
        Assert.Equal(testCase.Id.Value, caseResponse.Id);
        Assert.Equal(testCase.Status, caseResponse.Status);
    }

    [Fact]
    public async Task GetCase_InvalidId_Returns404()
    {
        // Arrange
        var token = await GetValidJwtTokenAsync();
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync($"/v1/cases/{Guid.NewGuid()}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateCaseStatus_ValidTransition_ReturnsSuccess()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var testCase = await SeedTestCaseAsync(context, "pending");

        var token = await GetValidJwtTokenAsync();
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var request = new UpdateCaseStatusRequest { Status = "paid" };

        // Act
        var response = await _client.PatchAsync($"/v1/cases/{testCase.Id.Value}/status", 
            JsonContent.Create(request, options: _jsonOptions));

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        // Verify status was updated
        var updatedCase = await context.Cases.FindAsync(testCase.Id);
        Assert.NotNull(updatedCase);
        Assert.Equal("paid", updatedCase.Status);
    }

    [Fact]
    public async Task UpdateCaseStatus_InvalidTransition_Returns409()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var testCase = await SeedTestCaseAsync(context, "closed");

        var token = await GetValidJwtTokenAsync();
        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var request = new UpdateCaseStatusRequest { Status = "active" };

        // Act
        var response = await _client.PatchAsync($"/v1/cases/{testCase.Id.Value}/status", 
            JsonContent.Create(request, options: _jsonOptions));

        // Assert
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    private async Task<string> GetValidJwtTokenAsync()
    {
        // Create a test user and get JWT token
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        
        var testUser = new User
        {
            Id = new UserId(Guid.NewGuid()),
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User",
            PasswordHash = "test-hash",
            IsEmailVerified = true,
            CreatedAt = DateTime.UtcNow
        };
        
        context.Users.Add(testUser);
        await context.SaveChangesAsync();

        // Generate JWT token for this user (you'll need to implement this)
        // For now, return a mock token - in real tests you'd generate a proper JWT
        return "mock-jwt-token-for-testing";
    }

    private async Task<Case> SeedTestCaseAsync(L4HDbContext context, string status = "pending")
    {
        var testCase = new Case
        {
            Id = new CaseId(Guid.NewGuid()),
            UserId = new UserId(Guid.NewGuid()),
            Status = status,
            LastActivityAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Cases.Add(testCase);
        await context.SaveChangesAsync();
        return testCase;
    }

    private async Task SeedTestDataAsync(L4HDbContext context)
    {
        var userId = new UserId(Guid.NewGuid());
        
        var cases = new[]
        {
            new Case
            {
                Id = new CaseId(Guid.NewGuid()),
                UserId = userId,
                Status = "pending",
                LastActivityAt = DateTimeOffset.UtcNow.AddDays(-1),
                CreatedAt = DateTime.UtcNow.AddDays(-5),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            },
            new Case
            {
                Id = new CaseId(Guid.NewGuid()),
                UserId = userId,
                Status = "active",
                LastActivityAt = DateTimeOffset.UtcNow.AddHours(-2),
                CreatedAt = DateTime.UtcNow.AddDays(-10),
                UpdatedAt = DateTime.UtcNow.AddHours(-2)
            }
        };

        context.Cases.AddRange(cases);
        await context.SaveChangesAsync();
    }
}