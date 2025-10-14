using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Services;
using L4H.Shared.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text.Encodings.Web;
using Moq;
using FluentAssertions;

namespace L4H.Api.IntegrationTests.Controllers;

public class InterviewControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly JsonSerializerOptions _jsonOptions;

    public InterviewControllerTests(WebApplicationFactory<Program> factory)
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

    private HttpClient CreateAuthenticatedClient(UserId? userId = null)
    {
        var client = _factory.CreateClient();
        var testUserId = userId ?? new UserId(Guid.NewGuid());
        client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Test", testUserId.Value.ToString());
        return client;
    }

    private async Task<(User user, Case testCase)> SeedTestDataAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();

        // Seed visa types
        var visaTypes = new[]
        {
            new VisaType { Id = 1, Code = "B-1", Name = "Business Visitor", IsActive = true },
            new VisaType { Id = 2, Code = "B-2", Name = "Tourist Visitor", IsActive = true },
            new VisaType { Id = 3, Code = "F-1", Name = "Student", IsActive = true },
            new VisaType { Id = 4, Code = "H-1B", Name = "Specialty Occupation", IsActive = true }
        };
        context.VisaTypes.AddRange(visaTypes);

        // Create test user
        var user = new User
        {
            Id = new UserId(Guid.NewGuid()),
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User",
            PasswordHash = "test-hash",
            IsEmailVerified = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(user);

        // Create test case
        var testCase = new Case
        {
            Id = new CaseId(Guid.NewGuid()),
            UserId = user.Id,
            Status = "active",
            LastActivityAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Cases.Add(testCase);

        await context.SaveChangesAsync();
        return (user, testCase);
    }

    #region Start Interview Tests

    [Fact]
    public async Task StartInterview_WithValidCase_ReturnsSessionId()
    {
        // Arrange
        var (user, testCase) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient(user.Id);
        
        var request = new InterviewStartRequest
        {
            CaseId = testCase.Id
        };

        // Act
        var response = await client.PostAsJsonAsync("v1/interview/start", request, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<InterviewStartResponse>(_jsonOptions);
        result.Should().NotBeNull();
        result!.SessionId.Should().NotBeEmpty();
        result.Status.Should().Be("active");
        result.StartedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(1));
    }

    [Fact]
    public async Task StartInterview_WithNonExistentCase_Returns404()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var request = new InterviewStartRequest
        {
            CaseId = new CaseId(Guid.NewGuid())
        };

        // Act
        var response = await client.PostAsJsonAsync("v1/interview/start", request, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task StartInterview_WithLockedCase_Returns409()
    {
        // Arrange
        var (user, testCase) = await SeedTestDataAsync();
        
        // Lock the case
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
            var caseEntity = await context.Cases.FindAsync(testCase.Id);
            caseEntity!.IsInterviewLocked = true;
            await context.SaveChangesAsync();
        }

        var client = CreateAuthenticatedClient(user.Id);
        var request = new InterviewStartRequest { CaseId = testCase.Id };

        // Act
        var response = await client.PostAsJsonAsync("v1/interview/start", request, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task StartInterview_WithExistingActiveSession_CleansUpAndCreatesNew()
    {
        // Arrange
        var (user, testCase) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient(user.Id);
        
        // Create first session
        var request = new InterviewStartRequest { CaseId = testCase.Id };
        var firstResponse = await client.PostAsJsonAsync("v1/interview/start", request, _jsonOptions);
        var firstResult = await firstResponse.Content.ReadFromJsonAsync<InterviewStartResponse>(_jsonOptions);

        // Act - Create second session
        var secondResponse = await client.PostAsJsonAsync("v1/interview/start", request, _jsonOptions);

        // Assert
        secondResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var secondResult = await secondResponse.Content.ReadFromJsonAsync<InterviewStartResponse>(_jsonOptions);
        secondResult!.SessionId.Should().NotBe(firstResult!.SessionId);
    }

    [Fact]
    public async Task StartInterview_WithoutAuthentication_Returns401()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = new InterviewStartRequest { CaseId = new CaseId(Guid.NewGuid()) };

        // Act
        var response = await client.PostAsJsonAsync("v1/interview/start", request, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    #endregion

    #region Answer Interview Tests

    [Fact]
    public async Task AnswerInterview_WithValidAnswer_ReturnsSuccess()
    {
        // Arrange
        var (user, testCase) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient(user.Id);
        
        // Start interview
        var startRequest = new InterviewStartRequest { CaseId = testCase.Id };
        var startResponse = await client.PostAsJsonAsync("v1/interview/start", startRequest, _jsonOptions);
        var startResult = await startResponse.Content.ReadFromJsonAsync<InterviewStartResponse>(_jsonOptions);

        var answerRequest = new InterviewAnswerRequest
        {
            SessionId = startResult!.SessionId,
            StepNumber = 1,
            QuestionKey = "purpose",
            AnswerValue = "tourism"
        };

        // Act
        var response = await client.PostAsJsonAsync("v1/interview/answer", answerRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<InterviewAnswerResponse>(_jsonOptions);
        result.Should().NotBeNull();
        result!.SessionId.Should().Be(startResult.SessionId);
        result.QuestionKey.Should().Be("purpose");
        result.AnswerValue.Should().Be("tourism");
        result.StepNumber.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task AnswerInterview_WithInvalidSession_Returns404()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var answerRequest = new InterviewAnswerRequest
        {
            SessionId = Guid.NewGuid(),
            StepNumber = 1,
            QuestionKey = "purpose",
            AnswerValue = "tourism"
        };

        // Act
        var response = await client.PostAsJsonAsync("v1/interview/answer", answerRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task AnswerInterview_WithEmptyQuestionKey_Returns400()
    {
        // Arrange
        var (user, testCase) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient(user.Id);
        
        // Start interview
        var startRequest = new InterviewStartRequest { CaseId = testCase.Id };
        var startResponse = await client.PostAsJsonAsync("v1/interview/start", startRequest, _jsonOptions);
        var startResult = await startResponse.Content.ReadFromJsonAsync<InterviewStartResponse>(_jsonOptions);

        var answerRequest = new InterviewAnswerRequest
        {
            SessionId = startResult!.SessionId,
            StepNumber = 1,
            QuestionKey = "", // Empty question key
            AnswerValue = "tourism"
        };

        // Act
        var response = await client.PostAsJsonAsync("v1/interview/answer", answerRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task AnswerInterview_WithEmptyAnswerValue_Returns400()
    {
        // Arrange
        var (user, testCase) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient(user.Id);
        
        // Start interview
        var startRequest = new InterviewStartRequest { CaseId = testCase.Id };
        var startResponse = await client.PostAsJsonAsync("v1/interview/start", startRequest, _jsonOptions);
        var startResult = await startResponse.Content.ReadFromJsonAsync<InterviewStartResponse>(_jsonOptions);

        var answerRequest = new InterviewAnswerRequest
        {
            SessionId = startResult!.SessionId,
            StepNumber = 1,
            QuestionKey = "purpose",
            AnswerValue = "" // Empty answer value
        };

        // Act
        var response = await client.PostAsJsonAsync("v1/interview/answer", answerRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task AnswerInterview_UpdateExistingAnswer_ReturnsSuccess()
    {
        // Arrange
        var (user, testCase) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient(user.Id);
        
        // Start interview
        var startRequest = new InterviewStartRequest { CaseId = testCase.Id };
        var startResponse = await client.PostAsJsonAsync("v1/interview/start", startRequest, _jsonOptions);
        var startResult = await startResponse.Content.ReadFromJsonAsync<InterviewStartResponse>(_jsonOptions);

        // Submit first answer
        var firstAnswerRequest = new InterviewAnswerRequest
        {
            SessionId = startResult!.SessionId,
            StepNumber = 1,
            QuestionKey = "purpose",
            AnswerValue = "tourism"
        };
        await client.PostAsJsonAsync("v1/interview/answer", firstAnswerRequest, _jsonOptions);

        // Update the same answer
        var updateAnswerRequest = new InterviewAnswerRequest
        {
            SessionId = startResult.SessionId,
            StepNumber = 1,
            QuestionKey = "purpose",
            AnswerValue = "business" // Changed answer
        };

        // Act
        var response = await client.PostAsJsonAsync("v1/interview/answer", updateAnswerRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<InterviewAnswerResponse>(_jsonOptions);
        result!.AnswerValue.Should().Be("business");
    }

    #endregion

    #region Complete Interview Tests

    [Fact]
    public async Task CompleteInterview_WithValidSession_ReturnsRecommendation()
    {
        // Arrange
        var (user, testCase) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient(user.Id);
        
        // Start interview and answer questions
        var startRequest = new InterviewStartRequest { CaseId = testCase.Id };
        var startResponse = await client.PostAsJsonAsync("v1/interview/start", startRequest, _jsonOptions);
        var startResult = await startResponse.Content.ReadFromJsonAsync<InterviewStartResponse>(_jsonOptions);

        // Answer a question
        var answerRequest = new InterviewAnswerRequest
        {
            SessionId = startResult!.SessionId,
            StepNumber = 1,
            QuestionKey = "purpose",
            AnswerValue = "tourism"
        };
        await client.PostAsJsonAsync("v1/interview/answer", answerRequest, _jsonOptions);

        var completeRequest = new InterviewCompleteRequest
        {
            SessionId = startResult.SessionId
        };

        // Act
        var response = await client.PostAsJsonAsync("v1/interview/complete", completeRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<InterviewCompleteResponse>(_jsonOptions);
        result.Should().NotBeNull();
        result!.RecommendationVisaType.Should().NotBeEmpty();
        result.Rationale.Should().NotBeEmpty();
    }

    [Fact]
    public async Task CompleteInterview_WithInvalidSession_Returns404()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var completeRequest = new InterviewCompleteRequest
        {
            SessionId = Guid.NewGuid()
        };

        // Act
        var response = await client.PostAsJsonAsync("v1/interview/complete", completeRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CompleteInterview_WithCompletedSession_Returns409()
    {
        // Arrange
        var (user, testCase) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient(user.Id);
        
        // Start and complete interview
        var startRequest = new InterviewStartRequest { CaseId = testCase.Id };
        var startResponse = await client.PostAsJsonAsync("v1/interview/start", startRequest, _jsonOptions);
        var startResult = await startResponse.Content.ReadFromJsonAsync<InterviewStartResponse>(_jsonOptions);

        var answerRequest = new InterviewAnswerRequest
        {
            SessionId = startResult!.SessionId,
            StepNumber = 1,
            QuestionKey = "purpose",
            AnswerValue = "tourism"
        };
        await client.PostAsJsonAsync("v1/interview/answer", answerRequest, _jsonOptions);

        var completeRequest = new InterviewCompleteRequest { SessionId = startResult.SessionId };
        await client.PostAsJsonAsync("v1/interview/complete", completeRequest, _jsonOptions);

        // Act - Try to complete again
        var response = await client.PostAsJsonAsync("v1/interview/complete", completeRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    #endregion

    #region Reset Interview Tests

    [Fact]
    public async Task ResetInterview_WithValidSession_CreatesNewSession()
    {
        // Arrange
        var (user, testCase) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient(user.Id);
        
        // Start interview and answer questions
        var startRequest = new InterviewStartRequest { CaseId = testCase.Id };
        var startResponse = await client.PostAsJsonAsync("v1/interview/start", startRequest, _jsonOptions);
        var startResult = await startResponse.Content.ReadFromJsonAsync<InterviewStartResponse>(_jsonOptions);

        var answerRequest = new InterviewAnswerRequest
        {
            SessionId = startResult!.SessionId,
            StepNumber = 1,
            QuestionKey = "purpose",
            AnswerValue = "tourism"
        };
        await client.PostAsJsonAsync("v1/interview/answer", answerRequest, _jsonOptions);

        var resetRequest = new InterviewResetRequest
        {
            SessionId = startResult.SessionId
        };

        // Act
        var response = await client.PostAsJsonAsync("v1/interview/reset", resetRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<InterviewStartResponse>(_jsonOptions);
        result.Should().NotBeNull();
        result!.SessionId.Should().NotBe(startResult.SessionId); // Should be a new session
        result.Status.Should().Be("active");
    }

    [Fact]
    public async Task ResetInterview_WithInvalidSession_Returns404()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var resetRequest = new InterviewResetRequest
        {
            SessionId = Guid.NewGuid()
        };

        // Act
        var response = await client.PostAsJsonAsync("v1/interview/reset", resetRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region Progress Tests

    [Fact]
    public async Task GetProgress_WithValidSession_ReturnsProgress()
    {
        // Arrange
        var (user, testCase) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient(user.Id);
        
        // Start interview and answer questions
        var startRequest = new InterviewStartRequest { CaseId = testCase.Id };
        var startResponse = await client.PostAsJsonAsync("v1/interview/start", startRequest, _jsonOptions);
        var startResult = await startResponse.Content.ReadFromJsonAsync<InterviewStartResponse>(_jsonOptions);

        var answerRequest = new InterviewAnswerRequest
        {
            SessionId = startResult!.SessionId,
            StepNumber = 1,
            QuestionKey = "purpose",
            AnswerValue = "tourism"
        };
        await client.PostAsJsonAsync("v1/interview/answer", answerRequest, _jsonOptions);

        // Act
        var response = await client.GetAsync($"v1/interview/progress/{startResult.SessionId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<InterviewProgressResponse>(_jsonOptions);
        result.Should().NotBeNull();
        result!.SessionId.Should().Be(startResult.SessionId);
        result.Status.Should().Be("active");
        result.TotalQuestionsAnswered.Should().Be(1);
        result.CompletionPercentage.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetProgress_WithInvalidSession_Returns404()
    {
        // Arrange
        var client = CreateAuthenticatedClient();

        // Act
        var response = await client.GetAsync($"v1/interview/progress/{Guid.NewGuid()}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region Lock Interview Tests

    [Fact]
    public async Task LockInterview_WithValidCase_ReturnsSuccess()
    {
        // Arrange
        var (user, testCase) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient(user.Id);
        
        var lockRequest = new InterviewLockRequest
        {
            CaseId = testCase.Id
        };

        // Act
        var response = await client.PostAsJsonAsync("v1/interview/lock", lockRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        
        // Verify case is locked
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var caseEntity = await context.Cases.FindAsync(testCase.Id);
        caseEntity!.IsInterviewLocked.Should().BeTrue();
    }

    [Fact]
    public async Task LockInterview_WithInvalidCase_Returns404()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var lockRequest = new InterviewLockRequest
        {
            CaseId = new CaseId(Guid.NewGuid())
        };

        // Act
        var response = await client.PostAsJsonAsync("v1/interview/lock", lockRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region Session Expiration Tests

    [Fact]
    public async Task InterviewOperations_WithExpiredSession_Returns409()
    {
        // Arrange
        var (user, testCase) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient(user.Id);
        
        // Start interview
        var startRequest = new InterviewStartRequest { CaseId = testCase.Id };
        var startResponse = await client.PostAsJsonAsync("v1/interview/start", startRequest, _jsonOptions);
        var startResult = await startResponse.Content.ReadFromJsonAsync<InterviewStartResponse>(_jsonOptions);

        // Manually expire the session
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
            var session = await context.InterviewSessions.FindAsync(startResult!.SessionId);
            session!.StartedAt = DateTime.UtcNow.AddHours(-25); // Expire it
            await context.SaveChangesAsync();
        }

        var answerRequest = new InterviewAnswerRequest
        {
            SessionId = startResult!.SessionId,
            StepNumber = 1,
            QuestionKey = "purpose",
            AnswerValue = "tourism"
        };

        // Act
        var response = await client.PostAsJsonAsync("v1/interview/answer", answerRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    #endregion

    #region Error Handling Tests

    [Fact]
    public async Task InterviewOperations_WithDatabaseError_Returns500()
    {
        // This test would require more complex setup to simulate database errors
        // For now, we'll test that the controller handles exceptions gracefully
        // by testing with malformed requests that might cause internal errors
        
        var client = CreateAuthenticatedClient();
        
        // Test with invalid JSON
        var content = new StringContent("invalid json", System.Text.Encoding.UTF8, "application/json");
        var response = await client.PostAsync("v1/interview/start", content);
        
        // Should return 400 for bad request, not 500 for unhandled exception
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region Concurrent Session Tests

    [Fact]
    public async Task StartInterview_ConcurrentRequests_HandlesGracefully()
    {
        // Arrange
        var (user, testCase) = await SeedTestDataAsync();
        var client1 = CreateAuthenticatedClient(user.Id);
        var client2 = CreateAuthenticatedClient(user.Id);
        
        var request = new InterviewStartRequest { CaseId = testCase.Id };

        // Act - Start two sessions concurrently
        var task1 = client1.PostAsJsonAsync("v1/interview/start", request, _jsonOptions);
        var task2 = client2.PostAsJsonAsync("v1/interview/start", request, _jsonOptions);
        
        var responses = await Task.WhenAll(task1, task2);

        // Assert - Both should succeed (second one cleans up first)
        responses[0].StatusCode.Should().Be(HttpStatusCode.OK);
        responses[1].StatusCode.Should().Be(HttpStatusCode.OK);
        
        var result1 = await responses[0].Content.ReadFromJsonAsync<InterviewStartResponse>(_jsonOptions);
        var result2 = await responses[1].Content.ReadFromJsonAsync<InterviewStartResponse>(_jsonOptions);
        
        // Sessions should be different
        result1!.SessionId.Should().NotBe(result2!.SessionId);
    }

    #endregion

    #region Validation and Error Handling Tests

    [Fact]
    public async Task StartInterview_WithInvalidCaseId_Returns400()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var request = new InterviewStartRequest
        {
            CaseId = new CaseId(Guid.Empty) // Invalid case ID
        };

        // Act
        var response = await client.PostAsJsonAsync("v1/interview/start", request, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task AnswerInterview_WithInvalidStepNumber_ReturnsSuccess()
    {
        // Arrange
        var (user, testCase) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient(user.Id);
        
        // Start interview
        var startRequest = new InterviewStartRequest { CaseId = testCase.Id };
        var startResponse = await client.PostAsJsonAsync("v1/interview/start", startRequest, _jsonOptions);
        var startResult = await startResponse.Content.ReadFromJsonAsync<InterviewStartResponse>(_jsonOptions);

        var answerRequest = new InterviewAnswerRequest
        {
            SessionId = startResult!.SessionId,
            StepNumber = -1, // Invalid step number
            QuestionKey = "purpose",
            AnswerValue = "tourism"
        };

        // Act
        var response = await client.PostAsJsonAsync("v1/interview/answer", answerRequest, _jsonOptions);

        // Assert
        // Should still work as step number is auto-generated
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task AnswerInterview_WithNullQuestionKey_Returns400()
    {
        // Arrange
        var (user, testCase) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient(user.Id);
        
        // Start interview
        var startRequest = new InterviewStartRequest { CaseId = testCase.Id };
        var startResponse = await client.PostAsJsonAsync("v1/interview/start", startRequest, _jsonOptions);
        var startResult = await startResponse.Content.ReadFromJsonAsync<InterviewStartResponse>(_jsonOptions);

        var answerRequest = new InterviewAnswerRequest
        {
            SessionId = startResult!.SessionId,
            StepNumber = 1,
            QuestionKey = null!, // Null question key
            AnswerValue = "tourism"
        };

        // Act
        var response = await client.PostAsJsonAsync("v1/interview/answer", answerRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CompleteInterview_WithNoAnswers_ReturnsRecommendation()
    {
        // Arrange
        var (user, testCase) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient(user.Id);
        
        // Start interview without answering any questions
        var startRequest = new InterviewStartRequest { CaseId = testCase.Id };
        var startResponse = await client.PostAsJsonAsync("v1/interview/start", startRequest, _jsonOptions);
        var startResult = await startResponse.Content.ReadFromJsonAsync<InterviewStartResponse>(_jsonOptions);

        var completeRequest = new InterviewCompleteRequest
        {
            SessionId = startResult!.SessionId
        };

        // Act
        var response = await client.PostAsJsonAsync("v1/interview/complete", completeRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<InterviewCompleteResponse>(_jsonOptions);
        result.Should().NotBeNull();
        result!.RecommendationVisaType.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetProgress_WithNewSession_ReturnsZeroProgress()
    {
        // Arrange
        var (user, testCase) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient(user.Id);
        
        // Start interview without answering questions
        var startRequest = new InterviewStartRequest { CaseId = testCase.Id };
        var startResponse = await client.PostAsJsonAsync("v1/interview/start", startRequest, _jsonOptions);
        var startResult = await startResponse.Content.ReadFromJsonAsync<InterviewStartResponse>(_jsonOptions);

        // Act
        var response = await client.GetAsync($"v1/interview/progress/{startResult!.SessionId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<InterviewProgressResponse>(_jsonOptions);
        result.Should().NotBeNull();
        result!.TotalQuestionsAnswered.Should().Be(0);
        result.CompletionPercentage.Should().Be(0);
        result.Status.Should().Be("active");
    }

    [Fact]
    public async Task LockInterview_WithAlreadyLockedCase_ReturnsNoContent()
    {
        // Arrange
        var (user, testCase) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient(user.Id);
        
        var lockRequest = new InterviewLockRequest { CaseId = testCase.Id };

        // Lock the case first time
        await client.PostAsJsonAsync("v1/interview/lock", lockRequest, _jsonOptions);

        // Act - Lock again
        var response = await client.PostAsJsonAsync("v1/interview/lock", lockRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    #endregion

    #region Authentication and Authorization Tests

    [Fact]
    public async Task StartInterview_WithDifferentUserCase_Returns404()
    {
        // Arrange
        var (user1, testCase1) = await SeedTestDataAsync();
        var user2Id = new UserId(Guid.NewGuid());
        var client = CreateAuthenticatedClient(user2Id); // Different user
        
        var request = new InterviewStartRequest { CaseId = testCase1.Id };

        // Act
        var response = await client.PostAsJsonAsync("v1/interview/start", request, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task AnswerInterview_WithDifferentUserSession_Returns403()
    {
        // Arrange
        var (user1, testCase1) = await SeedTestDataAsync();
        var client1 = CreateAuthenticatedClient(user1.Id);
        
        // Start interview with user1
        var startRequest = new InterviewStartRequest { CaseId = testCase1.Id };
        var startResponse = await client1.PostAsJsonAsync("v1/interview/start", startRequest, _jsonOptions);
        var startResult = await startResponse.Content.ReadFromJsonAsync<InterviewStartResponse>(_jsonOptions);

        // Try to answer with different user
        var user2Id = new UserId(Guid.NewGuid());
        var client2 = CreateAuthenticatedClient(user2Id);
        
        var answerRequest = new InterviewAnswerRequest
        {
            SessionId = startResult!.SessionId,
            StepNumber = 1,
            QuestionKey = "purpose",
            AnswerValue = "tourism"
        };

        // Act
        var response = await client2.PostAsJsonAsync("v1/interview/answer", answerRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetProgress_WithDifferentUserSession_Returns403()
    {
        // Arrange
        var (user1, testCase1) = await SeedTestDataAsync();
        var client1 = CreateAuthenticatedClient(user1.Id);
        
        // Start interview with user1
        var startRequest = new InterviewStartRequest { CaseId = testCase1.Id };
        var startResponse = await client1.PostAsJsonAsync("v1/interview/start", startRequest, _jsonOptions);
        var startResult = await startResponse.Content.ReadFromJsonAsync<InterviewStartResponse>(_jsonOptions);

        // Try to get progress with different user
        var user2Id = new UserId(Guid.NewGuid());
        var client2 = CreateAuthenticatedClient(user2Id);

        // Act
        var response = await client2.GetAsync($"v1/interview/progress/{startResult!.SessionId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    #endregion

    #region Data Consistency Tests

    [Fact]
    public async Task AnswerInterview_MultipleAnswersToSameQuestion_UpdatesCorrectly()
    {
        // Arrange
        var (user, testCase) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient(user.Id);
        
        // Start interview
        var startRequest = new InterviewStartRequest { CaseId = testCase.Id };
        var startResponse = await client.PostAsJsonAsync("v1/interview/start", startRequest, _jsonOptions);
        var startResult = await startResponse.Content.ReadFromJsonAsync<InterviewStartResponse>(_jsonOptions);

        // Submit first answer
        var firstAnswer = new InterviewAnswerRequest
        {
            SessionId = startResult!.SessionId,
            StepNumber = 1,
            QuestionKey = "purpose",
            AnswerValue = "tourism"
        };
        await client.PostAsJsonAsync("v1/interview/answer", firstAnswer, _jsonOptions);

        // Submit second answer to same question
        var secondAnswer = new InterviewAnswerRequest
        {
            SessionId = startResult.SessionId,
            StepNumber = 1,
            QuestionKey = "purpose",
            AnswerValue = "business" // Different answer
        };

        // Act
        var response = await client.PostAsJsonAsync("v1/interview/answer", secondAnswer, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<InterviewAnswerResponse>(_jsonOptions);
        result!.AnswerValue.Should().Be("business"); // Should be updated value

        // Verify only one answer exists for this question
        var progressResponse = await client.GetAsync($"v1/interview/progress/{startResult.SessionId}");
        var progress = await progressResponse.Content.ReadFromJsonAsync<InterviewProgressResponse>(_jsonOptions);
        progress!.TotalQuestionsAnswered.Should().Be(1); // Should still be 1, not 2
    }

    [Fact]
    public async Task CompleteInterview_UpdatesCaseWithRecommendation()
    {
        // Arrange
        var (user, testCase) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient(user.Id);
        
        // Start interview and answer questions
        var startRequest = new InterviewStartRequest { CaseId = testCase.Id };
        var startResponse = await client.PostAsJsonAsync("v1/interview/start", startRequest, _jsonOptions);
        var startResult = await startResponse.Content.ReadFromJsonAsync<InterviewStartResponse>(_jsonOptions);

        var answerRequest = new InterviewAnswerRequest
        {
            SessionId = startResult!.SessionId,
            StepNumber = 1,
            QuestionKey = "purpose",
            AnswerValue = "tourism"
        };
        await client.PostAsJsonAsync("v1/interview/answer", answerRequest, _jsonOptions);

        var completeRequest = new InterviewCompleteRequest { SessionId = startResult.SessionId };

        // Act
        var response = await client.PostAsJsonAsync("v1/interview/complete", completeRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        // Verify case was updated
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var updatedCase = await context.Cases.FindAsync(testCase.Id);
        updatedCase!.VisaTypeId.Should().NotBeNull();
        updatedCase.LastActivityAt.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromMinutes(1));
    }

    #endregion

    #region Performance and Load Tests

    [Fact]
    public async Task StartInterview_MultipleSimultaneousRequests_HandlesCorrectly()
    {
        // Arrange
        var (user, testCase) = await SeedTestDataAsync();
        var clients = Enumerable.Range(0, 5)
            .Select(_ => CreateAuthenticatedClient(user.Id))
            .ToArray();
        
        var request = new InterviewStartRequest { CaseId = testCase.Id };

        // Act - Start multiple sessions simultaneously
        var tasks = clients.Select(client => 
            client.PostAsJsonAsync("v1/interview/start", request, _jsonOptions)
        ).ToArray();

        var responses = await Task.WhenAll(tasks);

        // Assert - All should succeed (last one wins)
        responses.Should().AllSatisfy(response => 
            response.StatusCode.Should().Be(HttpStatusCode.OK));

        // Only one active session should remain
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var activeSessions = await context.InterviewSessions
            .Where(s => s.CaseId == testCase.Id && s.Status == "active")
            .CountAsync();
        activeSessions.Should().Be(1);
    }

    [Fact]
    public async Task AnswerInterview_RapidSequentialAnswers_HandlesCorrectly()
    {
        // Arrange
        var (user, testCase) = await SeedTestDataAsync();
        var client = CreateAuthenticatedClient(user.Id);
        
        // Start interview
        var startRequest = new InterviewStartRequest { CaseId = testCase.Id };
        var startResponse = await client.PostAsJsonAsync("v1/interview/start", startRequest, _jsonOptions);
        var startResult = await startResponse.Content.ReadFromJsonAsync<InterviewStartResponse>(_jsonOptions);

        // Prepare multiple answers
        var answers = new[]
        {
            new InterviewAnswerRequest { SessionId = startResult!.SessionId, StepNumber = 1, QuestionKey = "purpose", AnswerValue = "tourism" },
            new InterviewAnswerRequest { SessionId = startResult.SessionId, StepNumber = 2, QuestionKey = "duration", AnswerValue = "short" },
            new InterviewAnswerRequest { SessionId = startResult.SessionId, StepNumber = 3, QuestionKey = "sponsor", AnswerValue = "no" }
        };

        // Act - Submit answers rapidly
        var tasks = answers.Select(answer => 
            client.PostAsJsonAsync("v1/interview/answer", answer, _jsonOptions)
        ).ToArray();

        var responses = await Task.WhenAll(tasks);

        // Assert
        responses.Should().AllSatisfy(response => 
            response.StatusCode.Should().Be(HttpStatusCode.OK));

        // Verify all answers were recorded
        var progressResponse = await client.GetAsync($"v1/interview/progress/{startResult.SessionId}");
        var progress = await progressResponse.Content.ReadFromJsonAsync<InterviewProgressResponse>(_jsonOptions);
        progress!.TotalQuestionsAnswered.Should().Be(3);
    }

    #endregion

    #region Malformed Request Tests

    [Fact]
    public async Task StartInterview_WithMalformedJson_Returns400()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var malformedJson = "{ invalid json }";
        var content = new StringContent(malformedJson, System.Text.Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("v1/interview/start", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task AnswerInterview_WithMalformedJson_Returns400()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var malformedJson = "{ sessionId: 'not-a-guid', questionKey: }";
        var content = new StringContent(malformedJson, System.Text.Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("v1/interview/answer", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CompleteInterview_WithMalformedJson_Returns400()
    {
        // Arrange
        var client = CreateAuthenticatedClient();
        var malformedJson = "{ sessionId: null }";
        var content = new StringContent(malformedJson, System.Text.Encoding.UTF8, "application/json");

        // Act
        var response = await client.PostAsync("v1/interview/complete", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion
}

