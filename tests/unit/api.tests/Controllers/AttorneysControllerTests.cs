using FluentAssertions;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Xunit;

namespace L4H.Api.Tests.Controllers;

public class AttorneysControllerTests : BaseIntegrationTest
{
    public AttorneysControllerTests(WebApplicationFactory<Program> factory) : base(factory)
    {
    }

    [Fact]
    public async Task GetAttorneys_ShouldReturnSuccess()
    {
        // Act
        var response = await Client.GetAsync("/api/v1/attorneys");

        // Assert
        if (response.StatusCode == HttpStatusCode.InternalServerError)
        {
            var content = await response.Content.ReadAsStringAsync();
            throw new Exception($"500 Error Content: {content}");
        }

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var attorneys = await response.Content.ReadFromJsonAsync<List<Attorney>>();
        attorneys.Should().NotBeNull();
        // Since we seeded default attorneys in the controller if empty, it might return them.
        // Or if the test db is empty and the controller seed runs, it returns them.
    }

    [Fact]
    public async Task GetAttorney_ShouldReturnAttorney_WhenExists()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var attorney = new Attorney
        {
            Name = "Test Attorney",
            Title = "Tester",
            Bio = "Test Bio",
            Email = "test@attorney.com",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Attorneys.Add(attorney);
        await context.SaveChangesAsync();

        // Act
        var response = await Client.GetAsync($"/api/v1/attorneys/{attorney.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var returnedAttorney = await response.Content.ReadFromJsonAsync<Attorney>();
        returnedAttorney.Should().NotBeNull();
        returnedAttorney!.Id.Should().Be(attorney.Id);
        returnedAttorney.Name.Should().Be("Test Attorney");
    }

    [Fact]
    public async Task UpdateAttorney_ShouldUpdateAttorney_WhenAdmin()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var attorney = new Attorney
        {
            Name = "Original Name",
            Title = "Original Title",
            Bio = "Original Bio",
            Email = "update@attorney.com",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Attorneys.Add(attorney);
        await context.SaveChangesAsync();

        var token = await GetAuthTokenAsync(isAdmin: true);
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var updateRequest = new Attorney
        {
            Id = attorney.Id,
            Name = "Updated Name",
            Title = "Updated Title",
            Bio = "Updated Bio",
            Email = "update@attorney.com" // Required field usually
        };

        // Act
        var response = await Client.PutAsJsonAsync($"/api/v1/attorneys/{attorney.Id}", updateRequest);

        // Assert
        if (response.StatusCode != HttpStatusCode.OK)
        {
            var content = await response.Content.ReadAsStringAsync();
            throw new Exception($"Update failed with {response.StatusCode}: {content}");
        }
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        // Verify update in DB
        using var verifyScope = Factory.Services.CreateScope();
        var verifyContext = verifyScope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var updatedAttorney = await verifyContext.Attorneys.FindAsync(attorney.Id);
        updatedAttorney.Should().NotBeNull();
        updatedAttorney!.Name.Should().Be("Updated Name");
        updatedAttorney.Title.Should().Be("Updated Title");
        updatedAttorney.Bio.Should().Be("Updated Bio");
    }
}