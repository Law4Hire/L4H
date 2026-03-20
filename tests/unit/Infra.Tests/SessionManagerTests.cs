using FluentAssertions;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Services.Interview;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace L4H.Infra.Tests;

public class SessionManagerTests
{
    private static L4HDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<L4HDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new L4HDbContext(options);
    }

    [Fact]
    public async Task GetSessionByTokenAsync_FindsAuthenticatedSessionBySessionId()
    {
        await using var context = CreateContext();

        var user = new User
        {
            Id = UserId.New(),
            Email = "session@test.com",
            PasswordHash = "hash",
            EmailVerified = true
        };
        var @case = new Case
        {
            Id = CaseId.New(),
            UserId = user.Id,
            Status = "active"
        };
        var session = new InterviewSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            CaseId = @case.Id,
            Status = "active"
        };

        context.Users.Add(user);
        context.Cases.Add(@case);
        context.InterviewSessions.Add(session);
        await context.SaveChangesAsync();

        var manager = new SessionManager(context);

        var result = await manager.GetSessionByTokenAsync(session.Id);

        result.Should().NotBeNull();
        result!.Id.Should().Be(session.Id);
    }
}
