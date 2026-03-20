using FluentAssertions;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Services.Interview;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace L4H.Infra.Tests;

public class VisaEvaluationEngineTests
{
    private static L4HDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<L4HDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new L4HDbContext(options);
    }

    [Fact]
    public async Task EvaluateAllVisasAsync_AdoptionPurpose_DoesNotPromoteNaturalizationVisa()
    {
        await using var context = CreateContext();
        context.VisaTypes.AddRange(
            new VisaType { Id = 1, Code = "ADOP", Name = "Adoption", IsActive = true },
            new VisaType { Id = 2, Code = "N-400", Name = "Naturalization", IsActive = true });
        await context.SaveChangesAsync();

        var engine = new VisaEvaluationEngine(context, NullLogger<VisaEvaluationEngine>.Instance);
        var answers = new List<InterviewQA>
        {
            new() { QuestionKey = "intent_type", AnswerValue = "citizenship" },
            new() { QuestionKey = "category", AnswerValue = "adoption" }
        };

        var results = await engine.EvaluateAllVisasAsync(answers);

        results.Single(r => r.VisaType.Code == "ADOP").Status.Should().NotBe(EligibilityStatus.NotEligible);
        results.Single(r => r.VisaType.Code == "N-400").Status.Should().Be(EligibilityStatus.NotEligible);
    }
}
