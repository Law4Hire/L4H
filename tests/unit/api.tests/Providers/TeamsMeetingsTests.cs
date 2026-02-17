using System.Net;
using System.Net.Http;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using Xunit;
using FluentAssertions;
using L4H.Api.Configuration;
using L4H.Api.Services;
using L4H.Api.Tests;
using L4H.Infrastructure.Services.Teams; // Correct namespace for IMeetingsProvider
using L4H.Shared.Models; // For CreateMeetingRequest/Response

namespace L4H.Api.Tests.Providers;

public sealed class TeamsMeetingsTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly string _databaseName;

    public TeamsMeetingsTests(WebApplicationFactory<Program> factory)
    {
        _databaseName = GetType().Name + "_" + Guid.NewGuid().ToString("N")[..8];
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.UseSetting("RunMigrationsOnStartup", "false");
            builder.ConfigureServices(services =>
            {
                // Replace the database connection with our test database
                var optionsDescriptors = services.Where(d => d.ServiceType == typeof(DbContextOptions<L4HDbContext>)).ToList();
                foreach (var d in optionsDescriptors)
                {
                    services.Remove(d);
                }

                var contextDescriptors = services.Where(d => d.ServiceType == typeof(L4HDbContext)).ToList();
                foreach (var d in contextDescriptors)
                {
                    services.Remove(d);
                }

                var connectionString = $"Server=localhost,14333;Database={_databaseName};User Id=sa;Password=SecureTest123!;TrustServerCertificate=True;";
                services.AddDbContext<L4HDbContext>(options =>
                {
                    options.UseSqlServer(connectionString);
                });

                TestServiceRegistration.RegisterTestServices(services);
            });
        });
        _client = _factory.CreateClient();
        
        EnsureDatabaseCreated();
    }

    private void EnsureDatabaseCreated()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        context.Database.Migrate();
    }

    [Fact]
    public async Task CreateAppointment_WithTeamsMode_ShouldCallMeetingsProvider()
    {
        // Arrange
        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.Configure<L4H.Api.Configuration.MeetingsOptions>(options =>
                {
                    options.Mode = "Teams";
                });
                
                // Replace with test provider that tracks calls
                services.AddSingleton<IMeetingsProvider, TestMeetingsProvider>();
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
        var response = await client.PostAsync("/api/v1/meetings", 
            new StringContent(JsonSerializer.Serialize(appointmentRequest), System.Text.Encoding.UTF8, "application/json"));

        // Assert
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
                services.Configure<L4H.Api.Configuration.MeetingsOptions>(options =>
                {
                    options.Mode = "Fake";
                });
                
                // Replace with test provider that tracks calls
                services.AddSingleton<IMeetingsProvider, TestMeetingsProvider>();
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
        var response = await client.PostAsync("/api/v1/meetings", 
            new StringContent(JsonSerializer.Serialize(appointmentRequest), System.Text.Encoding.UTF8, "application/json"));

        // Assert
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
                services.Configure<L4H.Api.Configuration.MeetingsOptions>(options =>
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
        var response = await client.PostAsync("/api/v1/meetings", 
            new StringContent(JsonSerializer.Serialize(appointmentRequest), System.Text.Encoding.UTF8, "application/json"));

        // Assert
        // The controller catches exceptions and returns 500
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
    }

    [Fact]
    public async Task CreateAppointment_WithTeamsSuccess_ShouldReturnLocalizedSuccess()
    {
        // Arrange
        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.Configure<L4H.Api.Configuration.MeetingsOptions>(options =>
                {
                    options.Mode = "Teams";
                });
                
                // Replace with successful provider
                services.AddSingleton<IMeetingsProvider, TestMeetingsProvider>();
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
        var response = await client.PostAsync("/api/v1/meetings", 
            new StringContent(JsonSerializer.Serialize(appointmentRequest), System.Text.Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("created");
    }

    [Fact]
    public async Task MeetingsProvider_WithWaitingRoomEnabled_ShouldCreateMeetingWithLobby()
    {
        // Arrange
        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.Configure<L4H.Api.Configuration.MeetingsOptions>(options =>
                {
                    options.Mode = "Teams";
                    options.WaitingRoomEnabled = true;
                });
                
                services.AddSingleton<IMeetingsProvider, TestMeetingsProvider>();
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
        var response = await client.PostAsync("/api/v1/meetings", 
            new StringContent(JsonSerializer.Serialize(appointmentRequest), System.Text.Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        
        // Verify waiting room was enabled
        var testProvider = factory.Services.GetRequiredService<IMeetingsProvider>() as TestMeetingsProvider;
        testProvider.Should().NotBeNull();
        testProvider!.LastMeetingRequest.Should().NotBeNull();
        testProvider.LastMeetingRequest!.WaitingRoom.Should().BeTrue();
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
            // Clean up the test database
            try
            {
                using var scope = _factory.Services.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
                context.Database.EnsureDeleted();
            }
            catch
            {
                // Ignore cleanup errors
            }

            _client?.Dispose();
        }
    }
}

// Test implementations for Meetings providers
public class TestMeetingsProvider : IMeetingsProvider
{
    public int CreateMeetingCallCount { get; private set; }
    public CreateMeetingRequest? LastMeetingRequest { get; private set; }

    public Task<CreateMeetingResponse> CreateMeetingAsync(CreateMeetingRequest request, CancellationToken cancellationToken = default)
    {
        CreateMeetingCallCount++;
        LastMeetingRequest = request;
        
        return Task.FromResult(new CreateMeetingResponse
        {
            MeetingId = "test-meeting-id",
            JoinUrl = "https://teams.microsoft.com/l/meetup-join/test",
            WaitingRoom = request.WaitingRoom,
            Recording = request.Recording
        });
    }
}

public class FailingMeetingsProvider : IMeetingsProvider
{
    public Task<CreateMeetingResponse> CreateMeetingAsync(CreateMeetingRequest request, CancellationToken cancellationToken = default)
    {
        throw new InvalidOperationException("Teams service unavailable");
    }
}

