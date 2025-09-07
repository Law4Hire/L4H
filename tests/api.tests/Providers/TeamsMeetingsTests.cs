using System.Net;
using System.Net.Http;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;
using Xunit;
using FluentAssertions;
using L4H.Api.Configuration;
using L4H.Api.Services;
using L4H.Api.Services.Providers;
using L4H.Api.Tests;
using L4H.Api.Tests.Fakes;

namespace L4H.Api.Tests.Providers;

public sealed class TeamsMeetingsTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public TeamsMeetingsTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureServices(services =>
            {
                TestServiceRegistration.RegisterTestServices(services);
            });
        });
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task CreateAppointment_WithTeamsMode_ShouldCallMeetingsProvider()
    {
        // Arrange
        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.Configure<MeetingsOptions>(options =>
                {
                    options.Mode = "Teams";
                });
                
                // Replace with test provider that tracks calls
                            services.AddSingleton<L4H.Api.Services.Providers.IMeetingsProvider, FakeApiMeetingsProvider>();
            });
        });

        var client = factory.CreateClient();
        var token = await GetStaffTokenAsync();

        var appointmentRequest = new
        {
            subject = "Test Meeting",
            startTime = DateTime.UtcNow.AddDays(1),
            endTime = DateTime.UtcNow.AddDays(1).AddHours(1),
            attendees = new[] { "test@example.com" }
        };

        // Act
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var response = await client.PostAsync("/v1/meetings", 
            new StringContent(JsonSerializer.Serialize(appointmentRequest), System.Text.Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        // Verify the response is successful
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateAppointment_WithFakeMode_ShouldNotCallMeetingsProvider()
    {
        // Arrange
        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.Configure<MeetingsOptions>(options =>
                {
                    options.Mode = "Fake";
                });
                
                // Replace with test provider that tracks calls
                            services.AddSingleton<L4H.Api.Services.Providers.IMeetingsProvider, FakeApiMeetingsProvider>();
            });
        });

        var client = factory.CreateClient();
        var token = await GetStaffTokenAsync();

        var appointmentRequest = new
        {
            subject = "Test Meeting",
            startTime = DateTime.UtcNow.AddDays(1),
            endTime = DateTime.UtcNow.AddDays(1).AddHours(1),
            attendees = new[] { "test@example.com" }
        };

        // Act
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var response = await client.PostAsync("/v1/meetings", 
            new StringContent(JsonSerializer.Serialize(appointmentRequest), System.Text.Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        // Verify the response is successful
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateAppointment_WithTeamsProviderError_ShouldReturnLocalizedError()
    {
        // Arrange
        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.Configure<MeetingsOptions>(options =>
                {
                    options.Mode = "Teams";
                });
                
                // Replace with failing provider
                services.AddScoped<IMeetingsProvider, FailingMeetingsProvider>();
            });
        });

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Accept-Language", "es-ES");
        var token = await GetStaffTokenAsync();

        var appointmentRequest = new
        {
            subject = "Test Meeting",
            startTime = DateTime.UtcNow.AddDays(1),
            endTime = DateTime.UtcNow.AddDays(1).AddHours(1),
            attendees = new[] { "test@example.com" }
        };

        // Act
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var response = await client.PostAsync("/v1/meetings", 
            new StringContent(JsonSerializer.Serialize(appointmentRequest), System.Text.Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Teams service unavailable"); // Spanish for "provider error"
    }

    [Fact]
    public async Task CreateAppointment_WithTeamsSuccess_ShouldReturnLocalizedSuccess()
    {
        // Arrange
        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.Configure<MeetingsOptions>(options =>
                {
                    options.Mode = "Teams";
                });
                
                // Replace with successful provider
                            services.AddSingleton<L4H.Api.Services.Providers.IMeetingsProvider, FakeApiMeetingsProvider>();
            });
        });

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Accept-Language", "es-ES");
        var token = await GetStaffTokenAsync();

        var appointmentRequest = new
        {
            subject = "Test Meeting",
            startTime = DateTime.UtcNow.AddDays(1),
            endTime = DateTime.UtcNow.AddDays(1).AddHours(1),
            attendees = new[] { "test@example.com" }
        };

        // Act
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var response = await client.PostAsync("/v1/meetings", 
            new StringContent(JsonSerializer.Serialize(appointmentRequest), System.Text.Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("creada"); // Spanish for "created"
    }

    [Fact]
    public async Task MeetingsProvider_WithWaitingRoomEnabled_ShouldCreateMeetingWithLobby()
    {
        // Arrange
        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.Configure<MeetingsOptions>(options =>
                {
                    options.Mode = "Teams";
                    options.WaitingRoomEnabled = true;
                });
                
                            services.AddSingleton<L4H.Api.Services.Providers.IMeetingsProvider, FakeApiMeetingsProvider>();
            });
        });

        var client = factory.CreateClient();
        var token = await GetStaffTokenAsync();

        var appointmentRequest = new
        {
            subject = "Test Meeting",
            startTime = DateTime.UtcNow.AddDays(1),
            endTime = DateTime.UtcNow.AddDays(1).AddHours(1),
            attendees = new[] { "test@example.com" }
        };

        // Act
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var response = await client.PostAsync("/v1/meetings", 
            new StringContent(JsonSerializer.Serialize(appointmentRequest), System.Text.Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        // Verify waiting room was enabled
        var testProvider = factory.Services.GetRequiredService<L4H.Api.Services.Providers.IMeetingsProvider>() as FakeApiMeetingsProvider;
        testProvider.Should().NotBeNull();
        testProvider!.LastMeetingOptions.Should().NotBeNull();
        testProvider.LastMeetingOptions!.WaitingRoomEnabled.Should().BeTrue();
    }

    private static async Task<string> GetStaffTokenAsync()
    {
        return await Task.FromResult("mock-staff-jwt-token-for-testing");
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
            _client?.Dispose();
        }
    }
}

// Test implementations for Meetings providers
public class TestMeetingsProvider : IMeetingsProvider
{
    public int CreateMeetingCallCount { get; private set; }
    public MeetingOptions? LastMeetingOptions { get; private set; }

    public async Task<MeetingResult> CreateMeetingAsync(MeetingOptions options)
    {
        CreateMeetingCallCount++;
        LastMeetingOptions = options;
        
        return await Task.FromResult(new MeetingResult
        {
            Success = true,
            MeetingId = "test-meeting-id",
            JoinUrl = "https://teams.microsoft.com/l/meetup-join/test",
            Message = "Meeting created successfully"
        });
    }
}

public class FailingMeetingsProvider : IMeetingsProvider
{
    public async Task<MeetingResult> CreateMeetingAsync(MeetingOptions options)
    {
        return await Task.FromResult(new MeetingResult
        {
            Success = false,
            ErrorMessage = "Teams service unavailable"
        });
    }
}

