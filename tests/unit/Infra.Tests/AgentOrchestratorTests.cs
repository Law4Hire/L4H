using Xunit;
using Moq;
using L4H.Infrastructure.Services.Interview;
using L4H.Infrastructure.Services;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using FluentAssertions;

namespace L4H.Infra.Tests;

public class AgentOrchestratorTests
{
    private readonly DbContextOptions<L4HDbContext> _dbOptions;

    public AgentOrchestratorTests()
    {
        _dbOptions = new DbContextOptionsBuilder<L4HDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
    }

    private L4HDbContext CreateContext() => new L4HDbContext(_dbOptions);

    [Fact]
    public async Task GetSessionLockStatusAsync_WhenCaseIsLocked_ReturnsLockedStatus()
    {
        // Arrange
        await using var context = CreateContext();

        var userId = UserId.New();
        var caseId = CaseId.New();
        var sessionId = Guid.NewGuid();
        var visaTypeId = 1;

        var user = new User { Id = userId, Email = "test@test.com" };
        var visaType = new VisaType { Id = visaTypeId, Code = "H1B", Name = "H-1B Visa" };
        var caseEntity = new Case
        {
            Id = caseId,
            UserId = userId,
            IsVisaLockedByAttorney = true,
            AttorneySelectedVisaTypeId = visaTypeId,
            AttorneySelectedVisaType = visaType,
            VisaLockedAt = DateTime.UtcNow,
            VisaLockedByStaffId = Guid.NewGuid()
        };
        var session = new InterviewSession
        {
            Id = sessionId,
            CaseId = caseId,
            Case = caseEntity,
            UserId = userId,
            User = user
        };

        context.Users.Add(user);
        context.VisaTypes.Add(visaType);
        context.Cases.Add(caseEntity);
        context.InterviewSessions.Add(session);
        await context.SaveChangesAsync();

        var orchestrator = new AgentOrchestrator(
            new Mock<ISessionManager>().Object,
            new Mock<IQuestionEngine>().Object,
            new Mock<IVisaEvaluationEngine>().Object,
            new Mock<IPasswordHasher>().Object,
            context);

        // Act
        var result = await orchestrator.GetSessionLockStatusAsync(sessionId);

        // Assert
        result.Should().NotBeNull();
        result.IsLocked.Should().BeTrue();
        result.LockedVisaTypeId.Should().Be(visaTypeId);
        result.LockedVisaName.Should().Be("H-1B Visa");
        result.LockedByStaffId.Should().Be(caseEntity.VisaLockedByStaffId);
    }

    [Fact]
    public async Task GetSessionLockStatusAsync_WhenCaseIsNotLocked_ReturnsUnlockedStatus()
    {
        // Arrange
        await using var context = CreateContext();

        var userId = UserId.New();
        var caseId = CaseId.New();
        var sessionId = Guid.NewGuid();

        var user = new User { Id = userId, Email = "test@test.com" };
        var caseEntity = new Case
        {
            Id = caseId,
            UserId = userId,
            IsVisaLockedByAttorney = false,
        };
        var session = new InterviewSession
        {
            Id = sessionId,
            CaseId = caseId,
            Case = caseEntity,
            UserId = userId,
            User = user
        };

        context.Users.Add(user);
        context.Cases.Add(caseEntity);
        context.InterviewSessions.Add(session);
        await context.SaveChangesAsync();

        var orchestrator = new AgentOrchestrator(
            new Mock<ISessionManager>().Object,
            new Mock<IQuestionEngine>().Object,
            new Mock<IVisaEvaluationEngine>().Object,
            new Mock<IPasswordHasher>().Object,
            context);

        // Act
        var result = await orchestrator.GetSessionLockStatusAsync(sessionId);

        // Assert
        result.Should().NotBeNull();
        result.IsLocked.Should().BeFalse();
        result.LockedVisaTypeId.Should().BeNull();
        result.LockedVisaName.Should().BeNull();
    }
}
