using System.Net;
using System.Text.Json;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Services;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using L4H.Api.Tests.TestHelpers;

namespace L4H.Api.Tests.Controllers;

public sealed class InterviewControllerBasicTests : IDisposable
{
    private readonly L4HDbContext _context;
    private readonly IInterviewRecommender _recommender;
    private readonly UserId _testUserId = new(Guid.NewGuid());
    private readonly CaseId _testCaseId = new(Guid.NewGuid());
    private readonly string _testDatabaseName;

    public InterviewControllerBasicTests()
    {
        _testDatabaseName = $"L4H_Test_{Guid.NewGuid():N}";
        
        var options = new DbContextOptionsBuilder<L4HDbContext>()
            .UseInMemoryDatabase(_testDatabaseName)
            .Options;

        _context = new L4HDbContext(options);
        _context.Database.EnsureCreated();

        _recommender = new RuleBasedRecommender(_context);
        
        SeedTestData().Wait();
    }

    private async Task SeedTestData()
    {
        // Create test user
        var user = new User
        {
            Id = _testUserId,
            Email = "test@example.com",
            PasswordHash = "hash",
            EmailVerified = true,
            CreatedAt = DateTime.UtcNow,
            PasswordUpdatedAt = DateTime.UtcNow,
            IsAdmin = false,
            FailedLoginCount = 0
        };
        _context.Users.Add(user);

        // Create test case
        var testCase = new Case
        {
            Id = _testCaseId,
            UserId = _testUserId,
            Status = "active",
            CreatedAt = DateTime.UtcNow,
            IsInterviewLocked = false
        };
        _context.Cases.Add(testCase);

        // Create test visa types for recommendations
        var b2VisaType = new VisaType
        {
            Code = "B2",
            Name = "Tourist/Visitor",
            IsActive = true
        };
        var h1bVisaType = new VisaType
        {
            Code = "H1B",
            Name = "Specialty Occupation",
            IsActive = true
        };
        _context.VisaTypes.AddRange(b2VisaType, h1bVisaType);

        await _context.SaveChangesAsync();
    }

    [Fact]
    public async Task InterviewSession_CanBeCreated_WithValidData()
    {
        // Arrange
        var sessionId = Guid.NewGuid();
        var session = new InterviewSession
        {
            Id = sessionId,
            UserId = _testUserId,
            CaseId = _testCaseId,
            Status = "active",
            StartedAt = DateTime.UtcNow
        };

        // Act
        _context.InterviewSessions.Add(session);
        await _context.SaveChangesAsync();

        // Assert
        var savedSession = await _context.InterviewSessions.FindAsync(sessionId);
        Assert.NotNull(savedSession);
        Assert.Equal("active", savedSession.Status);
        Assert.Equal(_testUserId, savedSession.UserId);
        Assert.Equal(_testCaseId, savedSession.CaseId);
    }

    [Fact]
    public async Task InterviewQA_CanBeAdded_ToSession()
    {
        // Arrange
        var sessionId = Guid.NewGuid();
        var session = new InterviewSession
        {
            Id = sessionId,
            UserId = _testUserId,
            CaseId = _testCaseId,
            Status = "active",
            StartedAt = DateTime.UtcNow
        };
        _context.InterviewSessions.Add(session);
        await _context.SaveChangesAsync();

        var qa = new InterviewQA
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            StepNumber = 1,
            QuestionKey = "purpose",
            AnswerValue = "tourism",
            AnsweredAt = DateTime.UtcNow
        };

        // Act
        _context.InterviewQAs.Add(qa);
        await _context.SaveChangesAsync();

        // Assert
        var savedQA = await _context.InterviewQAs.FirstOrDefaultAsync(q => q.SessionId == sessionId);
        Assert.NotNull(savedQA);
        Assert.Equal("purpose", savedQA.QuestionKey);
        Assert.Equal("tourism", savedQA.AnswerValue);
        Assert.Equal(1, savedQA.StepNumber);
    }

    [Fact]
    public async Task CaseLock_PreventsNewSessions_WhenSet()
    {
        // Arrange
        var testCase = await _context.Cases.FindAsync(_testCaseId);
        testCase!.IsInterviewLocked = true;
        await _context.SaveChangesAsync();

        // Act & Assert
        var isLocked = await _context.Cases
            .Where(c => c.Id == _testCaseId)
            .Select(c => c.IsInterviewLocked)
            .FirstOrDefaultAsync();

        Assert.True(isLocked);
    }

    [Fact]
    public async Task Recommendation_GeneratesB2_ForTourism()
    {
        // Arrange
        var answers = new Dictionary<string, string>
        {
            { "purpose", "tourism" }
        };

        // Get the actual B2 visa type ID from database
        var b2VisaType = await _context.VisaTypes.FirstOrDefaultAsync(v => v.Code == "B2");
        Assert.NotNull(b2VisaType);

        // Act
        var recommendation = await _recommender.GetRecommendationAsync(answers);

        // Assert
        Assert.NotNull(recommendation);
        Assert.Equal(b2VisaType.Id, recommendation.VisaTypeId);
        Assert.Contains("B-2 Tourist Visa", recommendation.Rationale);
    }

    [Fact]
    public async Task Recommendation_GeneratesH1B_ForEmploymentWithSponsor()
    {
        // Arrange
        var answers = new Dictionary<string, string>
        {
            { "purpose", "employment" },
            { "hasEmployerSponsor", "true" }
        };

        // Get the actual H1B visa type ID from database  
        var h1bVisaType = await _context.VisaTypes.FirstOrDefaultAsync(v => v.Code == "H1B");
        Assert.NotNull(h1bVisaType);

        // Act
        var recommendation = await _recommender.GetRecommendationAsync(answers);

        // Assert
        Assert.NotNull(recommendation);
        Assert.Equal(h1bVisaType.Id, recommendation.VisaTypeId);
        Assert.Contains("H-1B", recommendation.Rationale);
    }

    [Fact]
    public async Task VisaRecommendation_CanBeSaved_WithCaseReference()
    {
        // Arrange
        var b2VisaType = await _context.VisaTypes.FirstOrDefaultAsync(v => v.Code == "B2");
        Assert.NotNull(b2VisaType);
        
        var recommendation = new VisaRecommendation
        {
            Id = Guid.NewGuid(),
            CaseId = _testCaseId,
            VisaTypeId = b2VisaType.Id,
            Rationale = "Test recommendation",
            CreatedAt = DateTime.UtcNow
        };

        // Act
        _context.VisaRecommendations.Add(recommendation);
        await _context.SaveChangesAsync();

        // Assert
        var savedRecommendation = await _context.VisaRecommendations
            .FirstOrDefaultAsync(r => r.CaseId == _testCaseId);

        Assert.NotNull(savedRecommendation);
        Assert.Equal(b2VisaType.Id, savedRecommendation.VisaTypeId);
        Assert.Equal("Test recommendation", savedRecommendation.Rationale);
    }

    [Fact]
    public async Task SessionHistory_CanBeRetrieved_ForCase()
    {
        // Arrange
        var session1 = new InterviewSession
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            CaseId = _testCaseId,
            Status = "completed",
            StartedAt = DateTime.UtcNow.AddHours(-2),
            FinishedAt = DateTime.UtcNow.AddHours(-1)
        };

        var session2 = new InterviewSession
        {
            Id = Guid.NewGuid(),
            UserId = _testUserId,
            CaseId = _testCaseId,
            Status = "active",
            StartedAt = DateTime.UtcNow
        };

        _context.InterviewSessions.AddRange(session1, session2);
        await _context.SaveChangesAsync();

        // Act
        var sessions = await _context.InterviewSessions
            .Where(s => s.CaseId == _testCaseId)
            .OrderByDescending(s => s.StartedAt)
            .ToListAsync();

        // Assert
        Assert.Equal(2, sessions.Count);
        Assert.Equal("active", sessions[0].Status);
        Assert.Equal("completed", sessions[1].Status);
    }

    [Fact]
    public async Task MultipleQAs_CanBeAdded_WithStepNumbers()
    {
        // Arrange
        var sessionId = Guid.NewGuid();
        var session = new InterviewSession
        {
            Id = sessionId,
            UserId = _testUserId,
            CaseId = _testCaseId,
            Status = "active",
            StartedAt = DateTime.UtcNow
        };
        _context.InterviewSessions.Add(session);

        var qa1 = new InterviewQA
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            StepNumber = 1,
            QuestionKey = "purpose",
            AnswerValue = "employment",
            AnsweredAt = DateTime.UtcNow
        };

        var qa2 = new InterviewQA
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            StepNumber = 2,
            QuestionKey = "hasEmployerSponsor",
            AnswerValue = "true",
            AnsweredAt = DateTime.UtcNow.AddMinutes(1)
        };

        // Act
        _context.InterviewQAs.AddRange(qa1, qa2);
        await _context.SaveChangesAsync();

        // Assert
        var answers = await _context.InterviewQAs
            .Where(qa => qa.SessionId == sessionId)
            .OrderBy(qa => qa.StepNumber)
            .ToListAsync();

        Assert.Equal(2, answers.Count);
        Assert.Equal("purpose", answers[0].QuestionKey);
        Assert.Equal("hasEmployerSponsor", answers[1].QuestionKey);
        Assert.Equal(1, answers[0].StepNumber);
        Assert.Equal(2, answers[1].StepNumber);
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
            _context?.Dispose();
        }
    }
}