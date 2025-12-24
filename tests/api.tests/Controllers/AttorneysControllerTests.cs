using FluentAssertions;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
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
        attorneys.Should().NotBeEmpty();
    }
}
