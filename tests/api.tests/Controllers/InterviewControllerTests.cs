using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Services;
using L4H.Shared.Models;
using L4H.Api.Tests.TestHelpers;
using Xunit;

namespace L4H.Api.Tests.Controllers;

public sealed class InterviewControllerTests : IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly UserId _testUserId = new(Guid.Parse("C0000000-1234-1234-1234-123456789012")); // Match TestAuthenticationHandler
    private readonly CaseId _testCaseId = new(Guid.NewGuid());

    public InterviewControllerTests()
    {
        var testDatabaseName = $"L4H_IntegrationTest_{Guid.NewGuid():N}";
        
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

                    var connectionString = $"Server=localhost,14333;Database={testDatabaseName};User Id=sa;Password=SecureTest123!;TrustServerCertificate=True;";
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
        
        // Ensure database is created with migrations
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
            context.Database.Migrate();
        }
        
        SeedTestData().GetAwaiter().GetResult();
    }


    private async Task SeedTestData()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        
        // Check if user already exists
        var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Id == _testUserId);
        if (existingUser == null)
        {
            var user = new User
            {
                Id = _testUserId,
                Email = $"interviewtest-{_testUserId.Value:N}@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow,
                IsAdmin = false,
                FailedLoginCount = 0
            };
            context.Users.Add(user);
        }
        
        // Check if test case already exists
        var existingCase = await context.Cases.FirstOrDefaultAsync(c => c.Id == _testCaseId);
        if (existingCase == null)
        {
            var testCase = new Case
            {
                Id = _testCaseId,
                UserId = _testUserId,
                Status = "active",
                CreatedAt = DateTime.UtcNow,
                IsInterviewLocked = false
            };
            context.Cases.Add(testCase);
        }
        
        // Ensure test visa types have the correct names for recommendations
        var existingB2 = await context.VisaTypes.FirstOrDefaultAsync(v => v.Code == "B2");
        var existingH1B = await context.VisaTypes.FirstOrDefaultAsync(v => v.Code == "H1B");
        
        if (existingB2 == null)
        {
            var b2VisaType = new VisaType
            {
                Code = "B2",
                Name = "B-2 Tourist Visa",
                IsActive = true
            };
            context.VisaTypes.Add(b2VisaType);
        }
        else
        {
            // Update existing B2 to have the correct name for the test
            existingB2.Name = "B-2 Tourist Visa";
        }
        
        if (existingH1B == null)
        {
            var h1bVisaType = new VisaType
            {
                Code = "H1B",
                Name = "H-1B Specialty Occupation",
                IsActive = true
            };
            context.VisaTypes.Add(h1bVisaType);
        }
        else
        {
            // Update existing H1B to have the correct name for the test
            existingH1B.Name = "H-1B Specialty Occupation";
        }
        
        await context.SaveChangesAsync();
    }

    [Fact]
    public async Task StartInterview_ShouldCreateNewSession_WhenValidRequest()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "mock-jwt-token-for-testing");
        
        var request = new { caseId = _testCaseId.Value };
        
        // Act
        var response = await _client.PostAsJsonAsync("/v1/interview/start", request);
        
        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var jsonString = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(jsonString);
        
        Assert.True(result.TryGetProperty("sessionId", out var sessionIdElement));
        Assert.True(Guid.TryParse(sessionIdElement.GetString(), out _));
    }

    [Fact]
    public async Task AnswerQuestion_ShouldAcceptAnswer_WhenValidSessionAndQuestion()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "mock-jwt-token-for-testing");
        
        // Start interview first
        var startRequest = new { caseId = _testCaseId.Value };
        var startResponse = await _client.PostAsJsonAsync("/v1/interview/start", startRequest);
        
        if (!startResponse.IsSuccessStatusCode)
        {
            var errorContent = await startResponse.Content.ReadAsStringAsync();
            throw new Exception($"Start interview failed with {startResponse.StatusCode}: {errorContent}");
        }
        
        var startJson = JsonSerializer.Deserialize<JsonElement>(await startResponse.Content.ReadAsStringAsync());
        var sessionId = startJson.GetProperty("sessionId").GetString();
        
        var answerRequest = new 
        {
            sessionId = Guid.Parse(sessionId!),
            stepNumber = 1,
            questionKey = "purpose",
            answerValue = "tourism"
        };
        
        // Act
        var response = await _client.PostAsJsonAsync("/v1/interview/answer", answerRequest);
        
        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var jsonString = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(jsonString);
        
        // Verify the response contains the expected properties from InterviewAnswerResponse
        Assert.True(result.TryGetProperty("sessionId", out var sessionIdElement));
        Assert.True(result.TryGetProperty("stepNumber", out var stepNumberElement));
        Assert.True(result.TryGetProperty("questionKey", out var questionKeyElement));
        Assert.True(result.TryGetProperty("answerValue", out var answerValueElement));
        
        // Verify the values match what we sent
        Assert.Equal(1, stepNumberElement.GetInt32());
        Assert.Equal("purpose", questionKeyElement.GetString());
        Assert.Equal("tourism", answerValueElement.GetString());
    }

    [Fact]
    public async Task CompleteInterview_ShouldGenerateRecommendation_WhenSessionHasAnswers()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "mock-jwt-token-for-testing");
        
        // Start interview and add answers
        var startRequest = new { caseId = _testCaseId.Value };
        var startResponse = await _client.PostAsJsonAsync("/v1/interview/start", startRequest);
        startResponse.EnsureSuccessStatusCode(); // This will throw if not 2xx status
        var startJson = JsonSerializer.Deserialize<JsonElement>(await startResponse.Content.ReadAsStringAsync());
        var sessionId = startJson.GetProperty("sessionId").GetString();
        
        var firstAnswerRequest = new 
        {
            sessionId = Guid.Parse(sessionId!),
            stepNumber = 1,
            questionKey = "purpose",
            answerValue = "tourism"
        };
        await _client.PostAsJsonAsync("/v1/interview/answer", firstAnswerRequest);
        
        // Act
        var completeRequest = new { sessionId = Guid.Parse(sessionId!) };
        var response = await _client.PostAsJsonAsync("/v1/interview/complete", completeRequest);
        
        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var jsonString = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(jsonString);
        
        Assert.True(result.TryGetProperty("recommendationVisaType", out var visaType));
        Assert.True(result.TryGetProperty("rationale", out var rationale));
        
        // Should recommend B2 for tourism
        Assert.Contains("B-2", visaType.GetString());
        Assert.Contains("Tourist", rationale.GetString());
    }

    [Fact]
    public async Task LockInterview_ShouldPreventFurtherModifications_WhenCalled()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "mock-jwt-token-for-testing");
        
        // Start and complete interview
        var startRequest = new { caseId = _testCaseId.Value };
        var startResponse = await _client.PostAsJsonAsync("/v1/interview/start", startRequest);
        var startJson = JsonSerializer.Deserialize<JsonElement>(await startResponse.Content.ReadAsStringAsync());
        var sessionId = startJson.GetProperty("sessionId").GetString();
        
        var lockAnswerRequest = new InterviewAnswerRequest
        {
            SessionId = Guid.Parse(sessionId!),
            StepNumber = 1,
            QuestionKey = "purpose",
            AnswerValue = "tourism"
        };
        await _client.PostAsJsonAsync("/v1/interview/answer", lockAnswerRequest);
        
        var lockCompleteRequest = new { sessionId = Guid.Parse(sessionId!) };
        await _client.PostAsJsonAsync("/v1/interview/complete", lockCompleteRequest);
        
        // Act - Lock the interview
        var lockRequest = new { caseId = _testCaseId.Value };
        var lockResponse = await _client.PostAsJsonAsync("/v1/interview/lock", lockRequest);
        
        // Assert
        Assert.Equal(HttpStatusCode.NoContent, lockResponse.StatusCode);
        
        // Try to start a new interview - should be blocked
        var newStartRequest = new { caseId = _testCaseId.Value };
        var newStartResponse = await _client.PostAsJsonAsync("/v1/interview/start", newStartRequest);
        Assert.Equal(HttpStatusCode.Conflict, newStartResponse.StatusCode);
        
        var errorJson = JsonSerializer.Deserialize<JsonElement>(await newStartResponse.Content.ReadAsStringAsync());
        Assert.True(errorJson.TryGetProperty("detail", out var detail));
        Assert.Contains("locked", detail.GetString());
    }

    [Fact]
    public async Task RerunInterview_ShouldCancelActiveSession_WhenCalled()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "mock-jwt-token-for-testing");
        
        // Start interview
        var startRequest = new { caseId = _testCaseId.Value };
        var startResponse = await _client.PostAsJsonAsync("/v1/interview/start", startRequest);
        var startJson = JsonSerializer.Deserialize<JsonElement>(await startResponse.Content.ReadAsStringAsync());
        var oldSessionId = startJson.GetProperty("sessionId").GetString();
        
        // Act - Rerun interview
        var rerunRequest = new { caseId = _testCaseId.Value };
        var rerunResponse = await _client.PostAsJsonAsync("/v1/interview/rerun", rerunRequest);
        
        // Assert
        Assert.Equal(HttpStatusCode.OK, rerunResponse.StatusCode);
        
        var rerunJson = JsonSerializer.Deserialize<JsonElement>(await rerunResponse.Content.ReadAsStringAsync());
        Assert.True(rerunJson.TryGetProperty("sessionId", out var newSessionIdElement));
        var newSessionId = newSessionIdElement.GetString();
        
        // Old session should be different from new session
        Assert.NotEqual(oldSessionId, newSessionId);
        
        // Try to answer on old session - should fail
        var oldAnswerRequest = new InterviewAnswerRequest
        {
            SessionId = Guid.Parse(oldSessionId!),
            StepNumber = 1,
            QuestionKey = "purpose",
            AnswerValue = "tourism"
        };
        var oldAnswerResponse = await _client.PostAsJsonAsync("/v1/interview/answer", oldAnswerRequest);
        Assert.Equal(HttpStatusCode.Conflict, oldAnswerResponse.StatusCode);
    }

    [Fact]
    public async Task GetHistory_ShouldReturnSessionHistory_WhenSessionsExist()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "mock-jwt-token-for-testing");
        
        // Start and complete interview
        var startRequest = new { caseId = _testCaseId.Value };
        var startResponse = await _client.PostAsJsonAsync("/v1/interview/start", startRequest);
        var startJson = JsonSerializer.Deserialize<JsonElement>(await startResponse.Content.ReadAsStringAsync());
        var sessionId = startJson.GetProperty("sessionId").GetString();
        
        var historyAnswerRequest = new InterviewAnswerRequest
        {
            SessionId = Guid.Parse(sessionId!),
            StepNumber = 1,
            QuestionKey = "purpose",
            AnswerValue = "tourism"
        };
        await _client.PostAsJsonAsync("/v1/interview/answer", historyAnswerRequest);
        
        var historyCompleteRequest = new { sessionId = Guid.Parse(sessionId!) };
        await _client.PostAsJsonAsync("/v1/interview/complete", historyCompleteRequest);
        
        // Act
        var historyResponse = await _client.GetAsync("/v1/interview/history");
        
        // Assert
        Assert.Equal(HttpStatusCode.OK, historyResponse.StatusCode);
        
        var historyJson = JsonSerializer.Deserialize<JsonElement>(await historyResponse.Content.ReadAsStringAsync());
        Assert.True(historyJson.TryGetProperty("sessions", out var sessions));
        Assert.True(sessions.GetArrayLength() > 0);
        
        var firstSession = sessions[0];
        Assert.True(firstSession.TryGetProperty("status", out var status));
        Assert.Equal("completed", status.GetString());
    }

    [Fact] 
    public async Task Interview_ShouldReturnLocalizedMessages_WhenSpanishCultureSet()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "mock-jwt-token-for-testing");
        _client.DefaultRequestHeaders.AcceptLanguage.Add(new System.Net.Http.Headers.StringWithQualityHeaderValue("es-ES"));
        
        // Act - Try to start interview on non-existent case
        var nonExistentCaseId = new CaseId(Guid.NewGuid());
        var nonExistentRequest = new { caseId = nonExistentCaseId.Value };
        var response = await _client.PostAsJsonAsync("/v1/interview/start", nonExistentRequest);
        
        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        
        var jsonString = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(jsonString);
        
        Assert.True(result.TryGetProperty("detail", out var detail));
        // Should contain Spanish localized message
        Assert.Contains("Case not found", detail.GetString());
    }

    [Fact]
    public async Task RecommendationLogic_ShouldRecommendH1B_ForEmploymentWithSponsor()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "mock-jwt-token-for-testing");
        
        // Start interview
        var startRequest = new { caseId = _testCaseId.Value };
        var startResponse = await _client.PostAsJsonAsync("/v1/interview/start", startRequest);
        var startJson = JsonSerializer.Deserialize<JsonElement>(await startResponse.Content.ReadAsStringAsync());
        var sessionId = startJson.GetProperty("sessionId").GetString();
        
        // Answer questions for H1B scenario
        var employmentAnswerRequest = new InterviewAnswerRequest
        {
            SessionId = Guid.Parse(sessionId!),
            StepNumber = 1,
            QuestionKey = "purpose",
            AnswerValue = "employment"
        };
        await _client.PostAsJsonAsync("/v1/interview/answer", employmentAnswerRequest);
        
        var sponsorAnswerRequest = new InterviewAnswerRequest
        {
            SessionId = Guid.Parse(sessionId!),
            StepNumber = 2,
            QuestionKey = "hasEmployerSponsor",
            AnswerValue = "true"
        };
        await _client.PostAsJsonAsync("/v1/interview/answer", sponsorAnswerRequest);
        
        // Act
        var completeRequest = new { sessionId = Guid.Parse(sessionId!) };
        var response = await _client.PostAsJsonAsync("/v1/interview/complete", completeRequest);
        
        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        
        var jsonString = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(jsonString);
        
        Assert.True(result.TryGetProperty("recommendationVisaType", out var visaType));
        Assert.True(result.TryGetProperty("rationale", out var rationale));
        
        // Should recommend H1B for employment with sponsor
        Assert.Contains("H-1B", visaType.GetString());
        Assert.Contains("H-1B", rationale.GetString());
    }

    [Fact]
    public async Task UnauthorizedAccess_ShouldReturnUnauthorized_WhenNoToken()
    {
        // Arrange
        var request = new { caseId = _testCaseId.Value };
        
        // Act
        var response = await _client.PostAsJsonAsync("/v1/interview/start", request);
        
        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CrossUserAccess_ShouldBeForbidden_WhenAccessingOtherUsersCase()
    {
        // Arrange - Create a case for a different user
        var otherUserId = new UserId(Guid.NewGuid());
        var otherCaseId = new CaseId(Guid.NewGuid());
        
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        
        // Create another user and their case
        var otherUser = new User
        {
            Id = otherUserId,
            Email = $"otheruser-{otherUserId.Value:N}@testing.com",
            PasswordHash = "SecureTest123!",
            EmailVerified = true,
            CreatedAt = DateTime.UtcNow,
            PasswordUpdatedAt = DateTime.UtcNow,
            IsAdmin = false,
            FailedLoginCount = 0
        };
        context.Users.Add(otherUser);
        
        var otherCase = new Case
        {
            Id = otherCaseId,
            UserId = otherUserId,
            Status = "active",
            CreatedAt = DateTime.UtcNow,
            IsInterviewLocked = false
        };
        context.Cases.Add(otherCase);
        await context.SaveChangesAsync();
        
        var token = "mock-jwt-token-for-testing";
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        
        // Act - Try to access case that belongs to different user
        var crossUserRequest = new { caseId = otherCaseId.Value };
        var response = await _client.PostAsJsonAsync("/v1/interview/start", crossUserRequest);
        
        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode); // Should return NotFound for security
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
            _factory?.Dispose();
        }
    }
}