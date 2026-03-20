using FluentAssertions;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Services.Interview;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace L4H.Infra.Tests;

public class DecisionTreeQuestionEngineV2Tests
{
    private static L4HDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<L4HDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new L4HDbContext(options);
    }

    [Fact]
    public async Task GetNextQuestionAsync_AdoptionFlow_CollectsChildSpecificDataBeforeDocumentPrefill()
    {
        await using var context = CreateContext();
        var engine = new DecisionTreeQuestionEngineV2(
            context,
            new Mock<IVisaEvaluationEngine>().Object);

        var session = new InterviewSession
        {
            Id = Guid.NewGuid(),
            Status = "active"
        };

        var answers = new List<InterviewQA>
        {
            new() { SessionId = session.Id, QuestionKey = "intent_type", AnswerValue = "citizenship" },
            new() { SessionId = session.Id, QuestionKey = "location", AnswerValue = "outside" },
            new() { SessionId = session.Id, QuestionKey = "education_level", AnswerValue = "bachelor" },
            new() { SessionId = session.Id, QuestionKey = "category", AnswerValue = "adoption" }
        };

        var nextQuestion = await engine.GetNextQuestionAsync(session, answers);

        nextQuestion.Should().NotBeNull();
        nextQuestion!.Key.Should().Be("adoption_subject_role");
    }
}
