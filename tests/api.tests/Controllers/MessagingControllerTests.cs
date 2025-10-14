using FluentAssertions;
using L4H.Api.Models;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Xunit;

namespace L4H.Api.Tests.Controllers;

public sealed class MessagingControllerTests : IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly string _databaseName;

    public MessagingControllerTests()
    {
        // Generate unique database name for each test instance
        _databaseName = GetType().Name + "_" + Guid.NewGuid().ToString("N")[..8];
        
        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
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

                    var connectionString = $"Server=localhost,14333;Database={_databaseName};User Id=sa;Password=SecureTest123!;TrustServerCertificate=True;";
                    services.AddDbContext<L4HDbContext>(options =>
                    {
                        options.UseSqlServer(connectionString);
                        options.EnableSensitiveDataLogging();
                    });

                    // Register test services (but keep SQL Server database)
                    TestServiceRegistration.RegisterTestServices(services);
                });
            });

        _client = _factory.CreateClient();
        
        // Ensure database is created and seeded
        EnsureDatabaseCreated();
    }

    [Fact]
    public async Task CreateThread_WithValidRequest_ShouldCreateThread()
    {
        // Arrange
        await SetupTestData();
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new
        {
            caseId = TestData.TestCaseId.Value,
            title = "Immigration Document Question",
            initialMessage = "I have questions about the I-485 form requirements."
        };

        // Act
        var response = await _client.PostAsync("/v1/messaging/threads", 
            new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json"));

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(content);
        
        result.GetProperty("threadId").GetString().Should().NotBeNullOrEmpty();
        result.GetProperty("title").GetString().Should().Be("Immigration Document Question");
        result.GetProperty("messageCount").GetInt32().Should().Be(1);
        result.GetProperty("status").GetString().Should().Be("open");

        // Verify thread was created in database
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var threads = await context.MessageThreads
            .Where(t => t.CaseId == TestData.TestCaseId)
            .ToListAsync();
        threads.Should().HaveCount(1);
        
        var thread = threads.First();
        thread.Subject.Should().Be("Immigration Document Question");
        
        // Verify initial message was created
        var messages = await context.Messages
            .Where(m => m.ThreadId == thread.Id)
            .ToListAsync();
        messages.Should().HaveCount(1);
        messages.First().Body.Should().Be("I have questions about the I-485 form requirements.");
    }

    [Fact]
    public async Task CreateThread_WithInvalidCaseId_ShouldReturnBadRequest()
    {
        // Arrange
        await SetupTestData();
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var invalidCaseId = Guid.NewGuid();
        var request = new
        {
            caseId = invalidCaseId,
            title = "Test Thread",
            initialMessage = "Test message"
        };

        // Act
        var response = await _client.PostAsync("/v1/messaging/threads", 
            new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Case not found");
    }

    [Fact]
    public async Task PostMessage_WithValidRequest_ShouldCreateMessage()
    {
        // Arrange
        await SetupTestDataWithThread();
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new
        {
            content = "Thank you for your help with the I-485 form. I have one more question about the supporting documents."
        };

        // Act
        var response = await _client.PostAsync($"/v1/messaging/threads/{TestData.TestThreadId}/messages", 
            new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json"));

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(content);
        
        result.GetProperty("messageId").GetString().Should().NotBeNullOrEmpty();
        result.GetProperty("content").GetString().Should().Be("Thank you for your help with the I-485 form. I have one more question about the supporting documents.");
        result.GetProperty("sender").GetString().Should().Be("user");
        result.GetProperty("timestamp").GetString().Should().NotBeNullOrEmpty();

        // Verify message was created in database
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var messages = await context.Messages
            .Where(m => m.ThreadId == TestData.TestThreadId)
            .OrderBy(m => m.SentAt)
            .ToListAsync();
        
        messages.Should().HaveCount(2); // Initial message + new message
        var newMessage = messages.Last();
        newMessage.Body.Should().Be("Thank you for your help with the I-485 form. I have one more question about the supporting documents.");
        newMessage.SenderUserId.Should().Be(TestData.TestUserId);
    }

    [Fact]
    public async Task PostMessage_WithInvalidThreadId_ShouldReturnNotFound()
    {
        // Arrange
        await SetupTestData();
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var invalidThreadId = Guid.NewGuid();
        var request = new { content = "Test message" };

        // Act
        var response = await _client.PostAsync($"/v1/messaging/threads/{invalidThreadId}/messages", 
            new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetThreadMessages_WithValidThread_ShouldReturnMessages()
    {
        // Arrange
        await SetupTestDataWithMessages();
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync($"/v1/messaging/threads/{TestData.TestThreadId}/messages");

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(content);
        
        var messages = result.GetProperty("messages");
        messages.GetArrayLength().Should().BeGreaterThan(0);
        
        var firstMessage = messages[0];
        firstMessage.GetProperty("content").GetString().Should().NotBeNullOrEmpty();
        firstMessage.GetProperty("sender").GetString().Should().NotBeNullOrEmpty();
        firstMessage.GetProperty("timestamp").GetString().Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task GetCaseThreads_WithValidCase_ShouldReturnThreads()
    {
        // Arrange
        await SetupTestDataWithThread();
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync($"/v1/messaging/cases/{TestData.TestCaseId.Value}/threads");

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(content);
        
        var threads = result.GetProperty("threads");
        threads.GetArrayLength().Should().Be(1);
        
        var thread = threads[0];
        thread.GetProperty("threadId").GetString().Should().NotBeNullOrEmpty();
        thread.GetProperty("title").GetString().Should().Be("Test Thread");
        thread.GetProperty("messageCount").GetInt32().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task MarkMessageAsRead_WithValidMessage_ShouldUpdateReadStatus()
    {
        // Arrange
        await SetupTestDataWithMessages();
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Get a message ID first
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var message = await context.Messages
            .FirstAsync(m => m.ThreadId == TestData.TestThreadId);

        // Act
        var response = await _client.PostAsync($"/v1/messaging/messages/{message.Id}/read", 
            new StringContent("", Encoding.UTF8, "application/json"));

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();
        
        // Verify read receipt was updated in message JSON
        await context.Entry(message).ReloadAsync();
        message.ReadByJson.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task GetUnreadCounts_WithValidCase_ShouldReturnCounts()
    {
        // Arrange
        await SetupTestDataWithMessages();
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync($"/v1/messaging/cases/{TestData.TestCaseId.Value}/unread");

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(content);
        
        result.GetProperty("totalUnread").GetInt32().Should().BeGreaterThanOrEqualTo(0);
        var threadCounts = result.GetProperty("threadCounts");
        threadCounts.ValueKind.Should().Be(JsonValueKind.Object);
    }

    private async Task<string> GetAuthTokenAsync()
    {
        // Create a test user and get auth token
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        
        var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Id == TestData.TestUserId);
        if (existingUser == null)
        {
            var user = new User
            {
                Id = TestData.TestUserId,
                Email = "messagingtest@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(user);
            await context.SaveChangesAsync();
        }

        return "mock-jwt-token-for-testing";
    }

    private async Task CleanupTestData()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();

        // Clean up Messages
        var messagesToDelete = await context.Messages
            .Where(m => m.ThreadId == TestData.TestThreadId || 
                       m.SenderUserId == TestData.TestUserId ||
                       m.SenderUserId == TestData.ProfessionalUserId)
            .ToListAsync();
        context.Messages.RemoveRange(messagesToDelete);

        // Clean up MessageThreads
        var threadsToDelete = await context.MessageThreads
            .Where(t => t.CaseId == TestData.TestCaseId)
            .ToListAsync();
        context.MessageThreads.RemoveRange(threadsToDelete);

        // Clean up Appointments that reference the test users
        var appointmentsToDelete = await context.Appointments
            .Where(a => a.StaffUserId == TestData.TestUserId || 
                       a.StaffUserId == TestData.ProfessionalUserId)
            .ToListAsync();
        context.Appointments.RemoveRange(appointmentsToDelete);

        // Clean up Cases
        var casesToDelete = await context.Cases
            .Where(c => c.Id == TestData.TestCaseId)
            .ToListAsync();
        context.Cases.RemoveRange(casesToDelete);

        // Clean up Users
        var usersToDelete = await context.Users
            .Where(u => u.Id == TestData.TestUserId || u.Id == TestData.ProfessionalUserId)
            .ToListAsync();
        context.Users.RemoveRange(usersToDelete);

        await context.SaveChangesAsync();
    }

    private async Task SetupTestData()
    {
        await CleanupTestData();
        
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();

        // Check if user already exists
        var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Id == TestData.TestUserId);
        if (existingUser == null)
        {
            var user = new User
            {
                Id = TestData.TestUserId,
                Email = "messagingtest@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(user);
        }

        // Check if professional user already exists
        var existingProfessional = await context.Users.FirstOrDefaultAsync(u => u.Id == TestData.ProfessionalUserId);
        if (existingProfessional == null)
        {
            var professionalUser = new User
            {
                Id = TestData.ProfessionalUserId,
                Email = "messagingprofessional@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(professionalUser);
        }

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

        await context.SaveChangesAsync();
    }

    private async Task SetupTestDataWithThread()
    {
        await SetupTestData();
        
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();

        // Check if thread already exists
        var existingThread = await context.MessageThreads.FirstOrDefaultAsync(t => t.Id == TestData.TestThreadId);
        if (existingThread == null)
        {
            var thread = new MessageThread
            {
                Id = TestData.TestThreadId,
                CaseId = TestData.TestCaseId,
                Subject = "Test Thread",
                CreatedAt = DateTime.UtcNow,
                LastMessageAt = DateTime.UtcNow
            };

            var initialMessage = new Message
            {
                Id = Guid.NewGuid(),
                ThreadId = TestData.TestThreadId,
                SenderUserId = TestData.TestUserId,
                Body = "Initial test message",
                SentAt = DateTime.UtcNow
            };

            context.MessageThreads.Add(thread);
            context.Messages.Add(initialMessage);
            await context.SaveChangesAsync();
        }
    }

    private async Task SetupTestDataWithMessages()
    {
        await SetupTestDataWithThread();
        
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();

        var additionalMessages = new[]
        {
            new Message
            {
                Id = Guid.NewGuid(),
                ThreadId = TestData.TestThreadId,
                SenderUserId = TestData.TestUserId,
                Body = "Second test message from user",
                SentAt = DateTime.UtcNow.AddMinutes(1)
            },
            new Message
            {
                Id = Guid.NewGuid(),
                ThreadId = TestData.TestThreadId,
                SenderUserId = TestData.ProfessionalUserId, // Professional message
                Body = "Response from legal professional",
                SentAt = DateTime.UtcNow.AddMinutes(2)
            }
        };

        context.Messages.AddRange(additionalMessages);
        await context.SaveChangesAsync();
    }

    private void EnsureDatabaseCreated()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        
        // Apply migrations to create the database with the latest schema
        context.Database.Migrate();
        
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
            _factory?.Dispose();
        }
    }

    private static class TestData
    {
        public static readonly UserId TestUserId = new UserId(Guid.Parse("C0000000-1234-1234-1234-123456789012")); // C prefix for MessagingController
        public static readonly UserId ProfessionalUserId = new UserId(Guid.Parse("C9999999-9999-9999-9999-999999999999"));
        public static readonly CaseId TestCaseId = new CaseId(Guid.Parse("C7654321-4321-4321-4321-210987654321"));
        public static readonly Guid TestThreadId = Guid.Parse("C1111111-1111-1111-1111-111111111111");
    }
}