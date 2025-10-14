using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text.Encodings.Web;
using FluentAssertions;
using Xunit;

namespace L4H.Api.IntegrationTests.Controllers;

public class CannlawTimeTrackingBillingIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly JsonSerializerOptions _jsonOptions;

    public CannlawTimeTrackingBillingIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Remove existing DbContext
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<L4HDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                // Use in-memory database for testing
                services.AddDbContext<L4HDbContext>(options =>
                {
                    options.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString());
                });

                // Add test authentication
                services.AddAuthentication("Test")
                    .AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>("Test", options => { });
            });
        });

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }

    private HttpClient CreateAuthenticatedClient(string role = "LegalProfessional", int? attorneyId = null)
    {
        var client = _factory.CreateClient();
        var userId = Guid.NewGuid().ToString();
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Role, role)
        };
        
        if (attorneyId.HasValue)
        {
            claims.Add(new("AttorneyId", attorneyId.Value.ToString()));
        }

        var claimsString = string.Join(",", claims.Select(c => $"{c.Type}:{c.Value}"));
        client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Test", claimsString);
        return client;
    }

    private async Task<(Attorney attorney1, Attorney attorney2, Client client1, Client client2, BillingRate rate1, BillingRate rate2)> SeedTestDataAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();

        // Create test attorneys
        var attorney1 = new Attorney
        {
            Id = 1,
            FirstName = "John",
            LastName = "Smith",
            Email = "john.smith@cannlaw.com",
            Phone = "555-0101",
            Bio = "Senior immigration attorney",
            PracticeAreas = "Immigration, Visa Applications",
            Credentials = "JD, Bar Certified",
            DefaultHourlyRate = 350.00m,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var attorney2 = new Attorney
        {
            Id = 2,
            FirstName = "Sarah",
            LastName = "Johnson",
            Email = "sarah.johnson@cannlaw.com",
            Phone = "555-0201",
            Bio = "Junior immigration attorney",
            PracticeAreas = "Family Immigration, Citizenship",
            Credentials = "JD, Immigration Law Certified",
            DefaultHourlyRate = 275.00m,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Attorneys.AddRange(attorney1, attorney2);

        // Create billing rates
        var rate1 = new BillingRate
        {
            Id = 1,
            AttorneyId = attorney1.Id,
            HourlyRate = 350.00m,
            EffectiveDate = DateTime.UtcNow.AddDays(-30),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var rate2 = new BillingRate
        {
            Id = 2,
            AttorneyId = attorney2.Id,
            HourlyRate = 275.00m,
            EffectiveDate = DateTime.UtcNow.AddDays(-30),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        context.BillingRates.AddRange(rate1, rate2);

        // Create test clients
        var client1 = new Client
        {
            Id = 1,
            FirstName = "Maria",
            LastName = "Garcia",
            Email = "maria.garcia@email.com",
            Phone = "555-1001",
            Address = "123 Main St, City, State 12345",
            DateOfBirth = new DateTime(1985, 5, 15),
            CountryOfOrigin = "Mexico",
            AssignedAttorneyId = attorney1.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = "System",
            UpdatedBy = "System"
        };

        var client2 = new Client
        {
            Id = 2,
            FirstName = "Ahmed",
            LastName = "Hassan",
            Email = "ahmed.hassan@email.com",
            Phone = "555-1002",
            Address = "456 Oak Ave, City, State 12345",
            DateOfBirth = new DateTime(1990, 8, 22),
            CountryOfOrigin = "Egypt",
            AssignedAttorneyId = attorney2.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = "System",
            UpdatedBy = "System"
        };

        context.Clients.AddRange(client1, client2);

        await context.SaveChangesAsync();
        return (attorney1, attorney2, client1, client2, rate1, rate2);
    }

    #region Timer Functionality Tests

    [Fact]
    public async Task StartTimer_WithValidClient_ReturnsSuccess()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, rate1, rate2) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);
        
        var startTimerRequest = new StartTimerRequest
        {
            ClientId = client1.Id,
            Description = "Initial consultation"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/time-tracking/start", startTimerRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<TimerResponse>(_jsonOptions);
        result.Should().NotBeNull();
        result!.IsActive.Should().BeTrue();
        result.ClientId.Should().Be(client1.Id);
        result.Description.Should().Be("Initial consultation");
        result.StartTime.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(1));
    }

    [Fact]
    public async Task StartTimer_WithActiveTimer_ReturnsConflict()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, rate1, rate2) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);
        
        // Start first timer
        var startTimerRequest1 = new StartTimerRequest
        {
            ClientId = client1.Id,
            Description = "First timer"
        };
        await client.PostAsJsonAsync("/api/v1/time-tracking/start", startTimerRequest1, _jsonOptions);

        // Try to start second timer
        var startTimerRequest2 = new StartTimerRequest
        {
            ClientId = client2.Id,
            Description = "Second timer"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/time-tracking/start", startTimerRequest2, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task StartTimer_ForUnassignedClient_ReturnsForbidden()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, rate1, rate2) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);
        
        var startTimerRequest = new StartTimerRequest
        {
            ClientId = client2.Id, // client2 is assigned to attorney2, not attorney1
            Description = "Unauthorized timer"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/time-tracking/start", startTimerRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task StopTimer_WithActiveTimer_ReturnsTimeEntryWith6MinuteIncrement()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, rate1, rate2) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);
        
        // Start timer
        var startTimerRequest = new StartTimerRequest
        {
            ClientId = client1.Id,
            Description = "Document review"
        };
        var startResponse = await client.PostAsJsonAsync("/api/v1/time-tracking/start", startTimerRequest, _jsonOptions);
        var startResult = await startResponse.Content.ReadFromJsonAsync<TimerResponse>(_jsonOptions);

        // Simulate 8 minutes of work (should round to 12 minutes = 0.2 hours)
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
            var activeTimer = await context.ActiveTimers.FirstAsync(t => t.AttorneyId == attorney1.Id);
            activeTimer.StartTime = DateTime.UtcNow.AddMinutes(-8);
            await context.SaveChangesAsync();
        }

        var stopTimerRequest = new StopTimerRequest
        {
            Notes = "Completed document review"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/time-tracking/stop", stopTimerRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<TimeEntryResponse>(_jsonOptions);
        result.Should().NotBeNull();
        result!.Duration.Should().Be(0.2m); // 12 minutes = 0.2 hours (6-minute increment rounding)
        result.BillableAmount.Should().Be(70.00m); // 0.2 hours * $350/hour
        result.Description.Should().Be("Document review");
        result.Notes.Should().Be("Completed document review");
    }

    [Fact]
    public async Task StopTimer_WithNoActiveTimer_ReturnsNotFound()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, rate1, rate2) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);
        
        var stopTimerRequest = new StopTimerRequest
        {
            Notes = "No active timer"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/time-tracking/stop", stopTimerRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Theory]
    [InlineData(3, 0.1)] // 3 minutes -> 6 minutes (0.1 hours)
    [InlineData(6, 0.1)] // 6 minutes -> 6 minutes (0.1 hours)
    [InlineData(8, 0.2)] // 8 minutes -> 12 minutes (0.2 hours)
    [InlineData(12, 0.2)] // 12 minutes -> 12 minutes (0.2 hours)
    [InlineData(15, 0.3)] // 15 minutes -> 18 minutes (0.3 hours)
    [InlineData(30, 0.5)] // 30 minutes -> 30 minutes (0.5 hours)
    [InlineData(37, 0.7)] // 37 minutes -> 42 minutes (0.7 hours)
    public async Task StopTimer_With6MinuteIncrementRounding_CalculatesCorrectDuration(int actualMinutes, decimal expectedHours)
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, rate1, rate2) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);
        
        // Start timer
        var startTimerRequest = new StartTimerRequest
        {
            ClientId = client1.Id,
            Description = "Time increment test"
        };
        await client.PostAsJsonAsync("/api/v1/time-tracking/start", startTimerRequest, _jsonOptions);

        // Set specific duration
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
            var activeTimer = await context.ActiveTimers.FirstAsync(t => t.AttorneyId == attorney1.Id);
            activeTimer.StartTime = DateTime.UtcNow.AddMinutes(-actualMinutes);
            await context.SaveChangesAsync();
        }

        var stopTimerRequest = new StopTimerRequest
        {
            Notes = $"Test for {actualMinutes} minutes"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/time-tracking/stop", stopTimerRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<TimeEntryResponse>(_jsonOptions);
        result.Should().NotBeNull();
        result!.Duration.Should().Be(expectedHours);
        result.BillableAmount.Should().Be(expectedHours * 350.00m); // attorney1's rate
    }

    #endregion

    #region Time Entry Management Tests

    [Fact]
    public async Task CreateTimeEntry_WithValidData_ReturnsSuccess()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, rate1, rate2) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);
        
        var createTimeEntryRequest = new CreateTimeEntryRequest
        {
            ClientId = client1.Id,
            Duration = 0.5m, // 30 minutes
            Description = "Phone consultation",
            Notes = "Discussed case status",
            Date = DateTime.UtcNow.Date
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/time-tracking/entries", createTimeEntryRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var result = await response.Content.ReadFromJsonAsync<TimeEntryResponse>(_jsonOptions);
        result.Should().NotBeNull();
        result!.Duration.Should().Be(0.5m);
        result.BillableAmount.Should().Be(175.00m); // 0.5 * $350
        result.Description.Should().Be("Phone consultation");
    }

    [Fact]
    public async Task CreateTimeEntry_WithInvalid6MinuteIncrement_ReturnsBadRequest()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, rate1, rate2) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);
        
        var createTimeEntryRequest = new CreateTimeEntryRequest
        {
            ClientId = client1.Id,
            Duration = 0.15m, // 9 minutes - not a valid 6-minute increment
            Description = "Invalid duration test",
            Date = DateTime.UtcNow.Date
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/time-tracking/entries", createTimeEntryRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetTimeEntries_ForAttorney_ReturnsOnlyAssignedClientEntries()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, rate1, rate2) = await SeedTestDataAsync();
        
        // Create time entries for both attorneys
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
            
            var entry1 = new TimeEntry
            {
                Id = 1,
                ClientId = client1.Id,
                AttorneyId = attorney1.Id,
                StartTime = DateTime.UtcNow.AddHours(-2),
                EndTime = DateTime.UtcNow.AddHours(-1),
                Duration = 1.0m,
                Description = "Attorney 1 work",
                HourlyRate = 350.00m,
                BillableAmount = 350.00m,
                CreatedAt = DateTime.UtcNow
            };

            var entry2 = new TimeEntry
            {
                Id = 2,
                ClientId = client2.Id,
                AttorneyId = attorney2.Id,
                StartTime = DateTime.UtcNow.AddHours(-3),
                EndTime = DateTime.UtcNow.AddHours(-2),
                Duration = 0.5m,
                Description = "Attorney 2 work",
                HourlyRate = 275.00m,
                BillableAmount = 137.50m,
                CreatedAt = DateTime.UtcNow
            };

            context.TimeEntries.AddRange(entry1, entry2);
            await context.SaveChangesAsync();
        }

        var client = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);

        // Act
        var response = await client.GetAsync("/api/v1/time-tracking/entries");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<List<TimeEntryResponse>>(_jsonOptions);
        result.Should().NotBeNull();
        result!.Count.Should().Be(1);
        result[0].Description.Should().Be("Attorney 1 work");
        result[0].AttorneyId.Should().Be(attorney1.Id);
    }

    [Fact]
    public async Task GetTimeEntries_WithDateFilter_ReturnsFilteredResults()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, rate1, rate2) = await SeedTestDataAsync();
        
        // Create time entries with different dates
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
            
            var entry1 = new TimeEntry
            {
                Id = 1,
                ClientId = client1.Id,
                AttorneyId = attorney1.Id,
                StartTime = DateTime.UtcNow.Date.AddDays(-1).AddHours(9),
                EndTime = DateTime.UtcNow.Date.AddDays(-1).AddHours(10),
                Duration = 1.0m,
                Description = "Yesterday work",
                HourlyRate = 350.00m,
                BillableAmount = 350.00m,
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            };

            var entry2 = new TimeEntry
            {
                Id = 2,
                ClientId = client1.Id,
                AttorneyId = attorney1.Id,
                StartTime = DateTime.UtcNow.Date.AddHours(9),
                EndTime = DateTime.UtcNow.Date.AddHours(10),
                Duration = 1.0m,
                Description = "Today work",
                HourlyRate = 350.00m,
                BillableAmount = 350.00m,
                CreatedAt = DateTime.UtcNow
            };

            context.TimeEntries.AddRange(entry1, entry2);
            await context.SaveChangesAsync();
        }

        var client = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);
        var today = DateTime.UtcNow.Date.ToString("yyyy-MM-dd");

        // Act
        var response = await client.GetAsync($"/api/v1/time-tracking/entries?startDate={today}&endDate={today}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<List<TimeEntryResponse>>(_jsonOptions);
        result.Should().NotBeNull();
        result!.Count.Should().Be(1);
        result[0].Description.Should().Be("Today work");
    }

    [Fact]
    public async Task UpdateTimeEntry_WithValidData_ReturnsSuccess()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, rate1, rate2) = await SeedTestDataAsync();
        
        // Create initial time entry
        int timeEntryId;
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
            
            var entry = new TimeEntry
            {
                ClientId = client1.Id,
                AttorneyId = attorney1.Id,
                StartTime = DateTime.UtcNow.AddHours(-2),
                EndTime = DateTime.UtcNow.AddHours(-1),
                Duration = 1.0m,
                Description = "Original description",
                Notes = "Original notes",
                HourlyRate = 350.00m,
                BillableAmount = 350.00m,
                CreatedAt = DateTime.UtcNow
            };

            context.TimeEntries.Add(entry);
            await context.SaveChangesAsync();
            timeEntryId = entry.Id;
        }

        var client = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);
        
        var updateRequest = new UpdateTimeEntryRequest
        {
            Duration = 0.5m, // Change to 30 minutes
            Description = "Updated description",
            Notes = "Updated notes"
        };

        // Act
        var response = await client.PutAsJsonAsync($"/api/v1/time-tracking/entries/{timeEntryId}", updateRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<TimeEntryResponse>(_jsonOptions);
        result.Should().NotBeNull();
        result!.Duration.Should().Be(0.5m);
        result.BillableAmount.Should().Be(175.00m); // Recalculated: 0.5 * $350
        result.Description.Should().Be("Updated description");
        result.Notes.Should().Be("Updated notes");
    }

    [Fact]
    public async Task DeleteTimeEntry_WithValidId_ReturnsSuccess()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, rate1, rate2) = await SeedTestDataAsync();
        
        // Create time entry
        int timeEntryId;
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
            
            var entry = new TimeEntry
            {
                ClientId = client1.Id,
                AttorneyId = attorney1.Id,
                StartTime = DateTime.UtcNow.AddHours(-2),
                EndTime = DateTime.UtcNow.AddHours(-1),
                Duration = 1.0m,
                Description = "To be deleted",
                HourlyRate = 350.00m,
                BillableAmount = 350.00m,
                CreatedAt = DateTime.UtcNow
            };

            context.TimeEntries.Add(entry);
            await context.SaveChangesAsync();
            timeEntryId = entry.Id;
        }

        var client = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);

        // Act
        var response = await client.DeleteAsync($"/api/v1/time-tracking/entries/{timeEntryId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        
        // Verify deletion
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var deletedEntry = await context.TimeEntries.FindAsync(timeEntryId);
        deletedEntry.Should().BeNull();
    }

    #endregion

    #region Billing Calculations Tests

    [Fact]
    public async Task GetBillingSummary_AsAdmin_ReturnsAllAttorneysSummary()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, rate1, rate2) = await SeedTestDataAsync();
        
        // Create time entries for both attorneys
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
            
            var entries = new[]
            {
                new TimeEntry
                {
                    ClientId = client1.Id,
                    AttorneyId = attorney1.Id,
                    StartTime = DateTime.UtcNow.AddHours(-3),
                    EndTime = DateTime.UtcNow.AddHours(-1),
                    Duration = 2.0m,
                    Description = "Attorney 1 work",
                    HourlyRate = 350.00m,
                    BillableAmount = 700.00m,
                    CreatedAt = DateTime.UtcNow
                },
                new TimeEntry
                {
                    ClientId = client2.Id,
                    AttorneyId = attorney2.Id,
                    StartTime = DateTime.UtcNow.AddHours(-2),
                    EndTime = DateTime.UtcNow.AddHours(-1),
                    Duration = 1.0m,
                    Description = "Attorney 2 work",
                    HourlyRate = 275.00m,
                    BillableAmount = 275.00m,
                    CreatedAt = DateTime.UtcNow
                }
            };

            context.TimeEntries.AddRange(entries);
            await context.SaveChangesAsync();
        }

        var client = CreateAuthenticatedClient("Admin");

        // Act
        var response = await client.GetAsync("/api/v1/billing/summary");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<List<AttorneyBillingSummaryResponse>>(_jsonOptions);
        result.Should().NotBeNull();
        result!.Count.Should().Be(2);
        
        var attorney1Summary = result.First(s => s.AttorneyId == attorney1.Id);
        attorney1Summary.TotalHours.Should().Be(2.0m);
        attorney1Summary.TotalBillableAmount.Should().Be(700.00m);
        
        var attorney2Summary = result.First(s => s.AttorneyId == attorney2.Id);
        attorney2Summary.TotalHours.Should().Be(1.0m);
        attorney2Summary.TotalBillableAmount.Should().Be(275.00m);
    }

    [Fact]
    public async Task GetBillingSummary_AsLegalProfessional_ReturnsOwnSummaryOnly()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, rate1, rate2) = await SeedTestDataAsync();
        
        // Create time entries for both attorneys
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
            
            var entries = new[]
            {
                new TimeEntry
                {
                    ClientId = client1.Id,
                    AttorneyId = attorney1.Id,
                    StartTime = DateTime.UtcNow.AddHours(-2),
                    EndTime = DateTime.UtcNow.AddHours(-1),
                    Duration = 1.0m,
                    Description = "Attorney 1 work",
                    HourlyRate = 350.00m,
                    BillableAmount = 350.00m,
                    CreatedAt = DateTime.UtcNow
                },
                new TimeEntry
                {
                    ClientId = client2.Id,
                    AttorneyId = attorney2.Id,
                    StartTime = DateTime.UtcNow.AddHours(-2),
                    EndTime = DateTime.UtcNow.AddHours(-1),
                    Duration = 1.0m,
                    Description = "Attorney 2 work",
                    HourlyRate = 275.00m,
                    BillableAmount = 275.00m,
                    CreatedAt = DateTime.UtcNow
                }
            };

            context.TimeEntries.AddRange(entries);
            await context.SaveChangesAsync();
        }

        var client = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);

        // Act
        var response = await client.GetAsync("/api/v1/billing/summary");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<List<AttorneyBillingSummaryResponse>>(_jsonOptions);
        result.Should().NotBeNull();
        result!.Count.Should().Be(1);
        result[0].AttorneyId.Should().Be(attorney1.Id);
        result[0].TotalHours.Should().Be(1.0m);
        result[0].TotalBillableAmount.Should().Be(350.00m);
    }

    [Fact]
    public async Task GetDetailedBilling_WithDateRange_ReturnsFilteredResults()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, rate1, rate2) = await SeedTestDataAsync();
        
        // Create time entries with different dates
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
            
            var entries = new[]
            {
                new TimeEntry
                {
                    ClientId = client1.Id,
                    AttorneyId = attorney1.Id,
                    StartTime = DateTime.UtcNow.Date.AddDays(-2).AddHours(9),
                    EndTime = DateTime.UtcNow.Date.AddDays(-2).AddHours(10),
                    Duration = 1.0m,
                    Description = "Old work",
                    HourlyRate = 350.00m,
                    BillableAmount = 350.00m,
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                },
                new TimeEntry
                {
                    ClientId = client1.Id,
                    AttorneyId = attorney1.Id,
                    StartTime = DateTime.UtcNow.Date.AddHours(9),
                    EndTime = DateTime.UtcNow.Date.AddHours(10),
                    Duration = 1.0m,
                    Description = "Recent work",
                    HourlyRate = 350.00m,
                    BillableAmount = 350.00m,
                    CreatedAt = DateTime.UtcNow
                }
            };

            context.TimeEntries.AddRange(entries);
            await context.SaveChangesAsync();
        }

        var client = CreateAuthenticatedClient("Admin");
        var today = DateTime.UtcNow.Date.ToString("yyyy-MM-dd");

        // Act
        var response = await client.GetAsync($"/api/v1/billing/detailed?attorneyId={attorney1.Id}&startDate={today}&endDate={today}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<DetailedBillingResponse>(_jsonOptions);
        result.Should().NotBeNull();
        result!.TimeEntries.Count.Should().Be(1);
        result.TimeEntries[0].Description.Should().Be("Recent work");
        result.TotalHours.Should().Be(1.0m);
        result.TotalBillableAmount.Should().Be(350.00m);
    }

    [Fact]
    public async Task ExportBillingReport_AsAdmin_ReturnsExcelFile()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, rate1, rate2) = await SeedTestDataAsync();
        
        // Create time entries
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
            
            var entry = new TimeEntry
            {
                ClientId = client1.Id,
                AttorneyId = attorney1.Id,
                StartTime = DateTime.UtcNow.AddHours(-2),
                EndTime = DateTime.UtcNow.AddHours(-1),
                Duration = 1.0m,
                Description = "Export test work",
                HourlyRate = 350.00m,
                BillableAmount = 350.00m,
                CreatedAt = DateTime.UtcNow
            };

            context.TimeEntries.Add(entry);
            await context.SaveChangesAsync();
        }

        var client = CreateAuthenticatedClient("Admin");

        // Act
        var response = await client.GetAsync($"/api/v1/billing/export?attorneyId={attorney1.Id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        
        var content = await response.Content.ReadAsByteArrayAsync();
        content.Length.Should().BeGreaterThan(0);
    }

    #endregion

    #region Billing Rate Management Tests

    [Fact]
    public async Task UpdateBillingRate_AsAdmin_ReturnsSuccess()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, rate1, rate2) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("Admin");
        
        var updateRateRequest = new UpdateBillingRateRequest
        {
            AttorneyId = attorney1.Id,
            NewHourlyRate = 375.00m,
            EffectiveDate = DateTime.UtcNow.Date.AddDays(1)
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/billing/rates", updateRateRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        // Verify new rate is created and old rate is deactivated
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        
        var oldRate = await context.BillingRates.FindAsync(rate1.Id);
        oldRate!.IsActive.Should().BeFalse();
        
        var newRate = await context.BillingRates
            .Where(r => r.AttorneyId == attorney1.Id && r.IsActive)
            .FirstAsync();
        newRate.HourlyRate.Should().Be(375.00m);
    }

    [Fact]
    public async Task UpdateBillingRate_AsLegalProfessional_ReturnsForbidden()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, rate1, rate2) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);
        
        var updateRateRequest = new UpdateBillingRateRequest
        {
            AttorneyId = attorney1.Id,
            NewHourlyRate = 375.00m,
            EffectiveDate = DateTime.UtcNow.Date.AddDays(1)
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/v1/billing/rates", updateRateRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetBillingRateHistory_ReturnsChronologicalHistory()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, rate1, rate2) = await SeedTestDataAsync();
        
        // Create additional rate history
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
            
            var historicalRate = new BillingRate
            {
                AttorneyId = attorney1.Id,
                HourlyRate = 325.00m,
                EffectiveDate = DateTime.UtcNow.AddDays(-60),
                IsActive = false,
                CreatedAt = DateTime.UtcNow.AddDays(-60)
            };

            context.BillingRates.Add(historicalRate);
            await context.SaveChangesAsync();
        }

        var client = CreateAuthenticatedClient("Admin");

        // Act
        var response = await client.GetAsync($"/api/v1/billing/rates/{attorney1.Id}/history");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<List<BillingRateHistoryResponse>>(_jsonOptions);
        result.Should().NotBeNull();
        result!.Count.Should().Be(2);
        
        // Should be ordered by effective date descending
        result.Should().BeInDescendingOrder(r => r.EffectiveDate);
        result[0].HourlyRate.Should().Be(350.00m); // Current rate
        result[0].IsActive.Should().BeTrue();
        result[1].HourlyRate.Should().Be(325.00m); // Historical rate
        result[1].IsActive.Should().BeFalse();
    }

    #endregion

    #region Concurrent Session Prevention Tests

    [Fact]
    public async Task StartTimer_WithConcurrentRequests_PreventsMultipleActiveSessions()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, rate1, rate2) = await SeedTestDataAsync();
        var client1Http = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);
        var client2Http = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);
        
        var startTimerRequest1 = new StartTimerRequest
        {
            ClientId = client1.Id,
            Description = "First concurrent timer"
        };
        
        var startTimerRequest2 = new StartTimerRequest
        {
            ClientId = client2.Id,
            Description = "Second concurrent timer"
        };

        // Act - Start timers concurrently
        var task1 = client1Http.PostAsJsonAsync("/api/v1/time-tracking/start", startTimerRequest1, _jsonOptions);
        var task2 = client2Http.PostAsJsonAsync("/api/v1/time-tracking/start", startTimerRequest2, _jsonOptions);
        
        var responses = await Task.WhenAll(task1, task2);

        // Assert - Only one should succeed
        var successCount = responses.Count(r => r.StatusCode == HttpStatusCode.OK);
        var conflictCount = responses.Count(r => r.StatusCode == HttpStatusCode.Conflict);
        
        successCount.Should().Be(1);
        conflictCount.Should().Be(1);
    }

    [Fact]
    public async Task GetActiveTimer_ReturnsCurrentActiveTimer()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, rate1, rate2) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);
        
        // Start timer
        var startTimerRequest = new StartTimerRequest
        {
            ClientId = client1.Id,
            Description = "Active timer test"
        };
        await client.PostAsJsonAsync("/api/v1/time-tracking/start", startTimerRequest, _jsonOptions);

        // Act
        var response = await client.GetAsync("/api/v1/time-tracking/active");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<TimerResponse>(_jsonOptions);
        result.Should().NotBeNull();
        result!.IsActive.Should().BeTrue();
        result.ClientId.Should().Be(client1.Id);
        result.Description.Should().Be("Active timer test");
    }

    [Fact]
    public async Task GetActiveTimer_WithNoActiveTimer_ReturnsNotFound()
    {
        // Arrange
        var (attorney1, attorney2, client1, client2, rate1, rate2) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient("LegalProfessional", attorney1.Id);

        // Act
        var response = await client.GetAsync("/api/v1/time-tracking/active");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion
}

// Request/Response models for testing
public class StartTimerRequest
{
    public int ClientId { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class StopTimerRequest
{
    public string Notes { get; set; } = string.Empty;
}

public class CreateTimeEntryRequest
{
    public int ClientId { get; set; }
    public decimal Duration { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public DateTime Date { get; set; }
}

public class UpdateTimeEntryRequest
{
    public decimal Duration { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
}

public class UpdateBillingRateRequest
{
    public int AttorneyId { get; set; }
    public decimal NewHourlyRate { get; set; }
    public DateTime EffectiveDate { get; set; }
}

public class TimerResponse
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public int AttorneyId { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public bool IsActive { get; set; }
}

public class TimeEntryResponse
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public int AttorneyId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public decimal Duration { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public decimal HourlyRate { get; set; }
    public decimal BillableAmount { get; set; }
    public bool IsBilled { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AttorneyBillingSummaryResponse
{
    public int AttorneyId { get; set; }
    public string AttorneyName { get; set; } = string.Empty;
    public decimal TotalHours { get; set; }
    public decimal TotalBillableAmount { get; set; }
    public int TotalEntries { get; set; }
    public decimal AverageHourlyRate { get; set; }
}

public class DetailedBillingResponse
{
    public int AttorneyId { get; set; }
    public string AttorneyName { get; set; } = string.Empty;
    public List<TimeEntryResponse> TimeEntries { get; set; } = new();
    public decimal TotalHours { get; set; }
    public decimal TotalBillableAmount { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

public class BillingRateHistoryResponse
{
    public int Id { get; set; }
    public decimal HourlyRate { get; set; }
    public DateTime EffectiveDate { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}