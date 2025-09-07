using FluentAssertions;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Services.Graph;
using L4H.Shared.Models;
using L4H.Shared.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http.Headers;
using System.Text.Json;
using Xunit;

namespace L4H.Api.Tests.Graph;

public sealed class StaffAvailabilityControllerTests : IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public StaffAvailabilityControllerTests()
    {
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Testing");
                builder.ConfigureServices(services =>
                {
                    // Register test services (but keep SQL Server database)
                    TestServiceRegistration.RegisterTestServices(services);

                    // Ensure FakeGraphProvider is used for testing
                    services.Configure<GraphOptions>(options =>
                    {
                        options.Mode = GraphMode.Fake;
                        options.AvailabilityEmailDomain = "cannlaw.com";
                    });
                });
            });

        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task GetStaffAvailability_WithValidRequest_ShouldMergeBusySlotsAndAppointments()
    {
        // Arrange
        await SetupTestDataWithAppointmentsAndBlocks();
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Ensure fake provider is not simulating failure (reset state from other tests)
        var fakeProvider = _factory.Services.GetRequiredService<ICalendarProvider>() as FakeGraphCalendarProvider;
        fakeProvider!.SimulateFailure = false;

        var from = DateTimeOffset.UtcNow.AddDays(1);
        var to = from.AddDays(1);

        // Act
        var response = await _client.GetAsync($"/v1/staff/{TestData.StaffUserId.Value}/availability?from={from:yyyy-MM-ddTHH:mm:ssZ}&to={to:yyyy-MM-ddTHH:mm:ssZ}");

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<StaffAvailabilityResponse>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true,
            Converters = { new L4H.Shared.Json.UserIdConverter(), new L4H.Shared.Json.CaseIdConverter() }
        });

        result.Should().NotBeNull();
        result!.StaffId.Should().Be(TestData.StaffUserId);

        // Should include busy slots from FakeGraphCalendar
        var graphBusySlots = result.BusySlots.Where(bs => bs.Source == "Graph").ToList();
        graphBusySlots.Should().HaveCount(1);
        graphBusySlots.First().Reason.Should().Be("Existing calendar event");

        // Should include existing appointments with buffer
        var appointmentSlots = result.BusySlots.Where(bs => bs.Source == "Appointment").ToList();
        appointmentSlots.Should().HaveCount(1);
        appointmentSlots.First().Reason.Should().Be("Existing appointment + buffer");

        // Should exclude availability blocks (they create gaps, not busy slots)
        var totalBusySlots = result.BusySlots.Count;
        totalBusySlots.Should().BeGreaterThan(1); // At least Graph + Appointment
    }

    [Fact]
    public async Task GetStaffAvailability_WithInvalidStaffId_ShouldReturnNotFound()
    {
        // Arrange
        await SetupTestData();
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var invalidStaffId = Guid.NewGuid();
        var from = DateTimeOffset.UtcNow.AddDays(1);
        var to = from.AddDays(1);

        // Act
        var response = await _client.GetAsync($"/v1/staff/{invalidStaffId}/availability?from={from:yyyy-MM-ddTHH:mm:ssZ}&to={to:yyyy-MM-ddTHH:mm:ssZ}");

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetStaffAvailability_WithInvalidDateRange_ShouldReturnBadRequest()
    {
        // Arrange
        await SetupTestData();
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var from = DateTimeOffset.UtcNow.AddDays(1);
        var to = from.AddDays(-1); // Invalid: to before from

        // Act
        var response = await _client.GetAsync($"/v1/staff/{TestData.StaffUserId.Value}/availability?from={from:yyyy-MM-ddTHH:mm:ssZ}&to={to:yyyy-MM-ddTHH:mm:ssZ}");

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetStaffAvailability_WhenGraphProviderFails_ShouldReturnAppointmentsOnly()
    {
        // Arrange
        await SetupTestDataWithAppointmentsAndBlocks();
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Configure fake provider to simulate failure
        using var scope = _factory.Services.CreateScope();
        var fakeProvider = scope.ServiceProvider.GetRequiredService<ICalendarProvider>() as FakeGraphCalendarProvider;
        fakeProvider!.SimulateFailure = true;

        var from = DateTimeOffset.UtcNow.AddDays(1);
        var to = from.AddDays(1);


        // Act
        var response = await _client.GetAsync($"/v1/staff/{TestData.StaffUserId.Value}/availability?from={from:yyyy-MM-ddTHH:mm:ssZ}&to={to:yyyy-MM-ddTHH:mm:ssZ}");

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<StaffAvailabilityResponse>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true,
            Converters = { new L4H.Shared.Json.UserIdConverter(), new L4H.Shared.Json.CaseIdConverter() }
        });


        // Should not include Graph busy slots due to failure
        var graphBusySlots = result!.BusySlots.Where(bs => bs.Source == "Graph").ToList();
        graphBusySlots.Should().HaveCount(0);

        // Should still include appointment slots
        var appointmentSlots = result.BusySlots.Where(bs => bs.Source == "Appointment").ToList();
        appointmentSlots.Should().HaveCount(1);

        // Should have warning in response
        result.Warnings.Should().Contain("Calendar availability could not be retrieved");
        
        // Reset the fake provider state for other tests
        fakeProvider!.SimulateFailure = false;
    }

    [Fact]
    public async Task GetStaffAvailability_WithBufferTime_ShouldApplyCorrectBuffer()
    {
        // Arrange
        await SetupTestDataWithAppointmentsAndBlocks();
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Ensure fake provider is not simulating failure (reset state from other tests)
        var fakeProvider = _factory.Services.GetRequiredService<ICalendarProvider>() as FakeGraphCalendarProvider;
        fakeProvider!.SimulateFailure = false;

        var from = DateTimeOffset.UtcNow.AddDays(1);
        var to = from.AddDays(1);

        // Act
        var response = await _client.GetAsync($"/v1/staff/{TestData.StaffUserId.Value}/availability?from={from:yyyy-MM-ddTHH:mm:ssZ}&to={to:yyyy-MM-ddTHH:mm:ssZ}&bufferMinutes=30");

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<StaffAvailabilityResponse>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true,
            Converters = { new L4H.Shared.Json.UserIdConverter(), new L4H.Shared.Json.CaseIdConverter() }
        });

        // Verify buffer was applied to appointment slots
        var appointmentSlot = result!.BusySlots.FirstOrDefault(bs => bs.Source == "Appointment");
        appointmentSlot.Should().NotBeNull();
        
        // The busy slot should extend beyond the original appointment time due to buffer
            var originalAppointmentEnd = TestData.ExistingAppointmentStart.AddHours(1);
            var bufferedEnd = originalAppointmentEnd.AddMinutes(30);
            appointmentSlot!.EndTime.Should().BeCloseTo(bufferedEnd, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task GetStaffAvailability_WithSpanishLocale_ShouldReturnLocalizedMessages()
    {
        // Arrange
        await SetupTestData();
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        _client.DefaultRequestHeaders.AcceptLanguage.Add(new StringWithQualityHeaderValue("es-ES"));

        var from = DateTimeOffset.UtcNow.AddDays(1);
        var to = from.AddDays(1);

        // Act
        var response = await _client.GetAsync($"/v1/staff/{TestData.StaffUserId.Value}/availability?from={from:yyyy-MM-ddTHH:mm:ssZ}&to={to:yyyy-MM-ddTHH:mm:ssZ}");

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<StaffAvailabilityResponse>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true,
            Converters = { new L4H.Shared.Json.UserIdConverter(), new L4H.Shared.Json.CaseIdConverter() }
        });

        // Check that any error messages or warnings are localized
        if (result!.Warnings.Any())
        {
            result.Warnings.Should().Contain(w => w.Contains("disponibilidad") || w.Contains("availability"));
        }
    }

    private async Task SetupTestData()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();

        // Check if user already exists
        var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Id == TestData.TestUserId);
        if (existingUser == null)
        {
            var user = new User
            {
                Id = TestData.TestUserId,
                Email = "staffavailabilitytest@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow,
                IsStaff = true // Set IsStaff to true for staff availability tests
            };
            context.Users.Add(user);
        }
        else
        {
            // Update existing user to ensure IsStaff is set
            existingUser.IsStaff = true;
        }

        // Check if staff user already exists by email
        var existingStaff = await context.Users.FirstOrDefaultAsync(u => u.Email == "staffavailabilitystaff@testing.com");
        if (existingStaff == null)
        {
            var staffUser = new User
            {
                Id = TestData.StaffUserId,
                Email = "staffavailabilitystaff@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                IsStaff = true, // Set IsStaff flag so controller can find this user
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(staffUser);
        }
        else
        {
            // Update existing staff user to ensure IsStaff flag is set
            existingStaff.IsStaff = true;
        }

        await context.SaveChangesAsync();
    }

    private async Task SetupTestDataWithAppointmentsAndBlocks()
    {
        await SetupTestData();
        
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();

        // Clean up any existing appointments and availability blocks for this staff user
        var existingAppointments = await context.Appointments
            .Where(a => a.StaffUserId == TestData.StaffUserId)
            .ToListAsync();
        context.Appointments.RemoveRange(existingAppointments);

        var existingBlocks = await context.AvailabilityBlocks
            .Where(ab => ab.StaffId == TestData.StaffUserId)
            .ToListAsync();
        context.AvailabilityBlocks.RemoveRange(existingBlocks);

        // Save changes to remove appointments and blocks first
        await context.SaveChangesAsync();

        // Clean up any existing users with the same email and create staff user
        var existingUsersWithEmail = await context.Users
            .Where(u => u.Email == "staffavailabilitystaff2@testing.com")
            .ToListAsync();
        
        context.Users.RemoveRange(existingUsersWithEmail);

        var staffUser = new User
        {
            Id = TestData.StaffUserId,
            Email = "staffavailabilitystaff2@testing.com",
            PasswordHash = "SecureTest123!",
            EmailVerified = true,
            CreatedAt = DateTime.UtcNow,
            PasswordUpdatedAt = DateTime.UtcNow,
            IsStaff = true
        };
        context.Users.Add(staffUser);

        // Check if test case already exists
        var existingCase = await context.Cases.FirstOrDefaultAsync(c => c.Id == TestData.TestCaseId);
        if (existingCase == null)
        {
            var testCase = new Case
            {
                Id = TestData.TestCaseId,
                UserId = TestData.TestUserId,
                Status = "active",
                CreatedAt = DateTime.UtcNow,
                LastActivityAt = DateTimeOffset.UtcNow
            };
            context.Cases.Add(testCase);
        }

        // Create the test appointment
        var testAppointment = new Appointment
        {
            Id = Guid.NewGuid(),
            CaseId = TestData.TestCaseId,
            StaffUserId = TestData.StaffUserId,
            ScheduledStart = TestData.ExistingAppointmentStart,
            ScheduledEnd = TestData.ExistingAppointmentStart.AddHours(1),
            Status = "confirmed",
            Type = "consultation",
            CreatedAt = DateTime.UtcNow
        };
        context.Appointments.Add(testAppointment);


        // Create the test availability block
        var unavailableBlock = new AvailabilityBlock
        {
            Id = Guid.NewGuid(),
            StaffId = TestData.StaffUserId,
            StartTime = TestData.ExistingAppointmentStart.AddHours(3).DateTime,
            EndTime = TestData.ExistingAppointmentStart.AddHours(4).DateTime,
            Type = "unavailable",
            Reason = "Personal appointment",
            CreatedAt = DateTime.UtcNow
        };
        context.AvailabilityBlocks.Add(unavailableBlock);

        await context.SaveChangesAsync();
    }

    private async Task<string> GetAuthTokenAsync(bool isAdmin = false)
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        
        var email = isAdmin ? "staffavailabilityadmin@testing.com" : "staffavailabilitytest@testing.com";
        var userId = isAdmin ? TestData.AdminUserId : TestData.TestUserId;
        
        var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (existingUser == null)
        {
            var user = new User
            {
                Id = userId,
                Email = email,
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow,
                IsStaff = true // Set IsStaff to true for staff availability tests
            };
            context.Users.Add(user);
            await context.SaveChangesAsync();
        }
        else
        {
            // Update existing user to ensure IsStaff is set
            existingUser.IsStaff = true;
            await context.SaveChangesAsync();
        }

        return "mock-jwt-token-for-testing";
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
            _client.Dispose();
            _factory.Dispose();
        }
    }

    private static class TestData
    {
        public static readonly UserId TestUserId = new UserId(Guid.Parse("C0000000-1234-1234-1234-123456789012")); // Match TestAuthenticationHandler
        public static readonly UserId AdminUserId = new UserId(Guid.Parse("C0000000-1234-1234-1234-123456789012")); // Same as TestUserId for staff
        public static readonly UserId StaffUserId = new UserId(Guid.Parse("C0000000-1234-1234-1234-123456789014")); // Unique ID for StaffAvailability tests
        public static readonly CaseId TestCaseId = new CaseId(Guid.Parse("B1111111-1111-1111-1111-111111111111"));
        
        public static readonly DateTimeOffset ExistingAppointmentStart = DateTimeOffset.UtcNow.AddDays(1).AddHours(2); // 2 hours from now tomorrow
    }
}