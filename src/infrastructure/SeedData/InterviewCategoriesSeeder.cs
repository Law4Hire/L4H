using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;

namespace L4H.Infrastructure.SeedData;

/// <summary>
/// Seeds the database with default interview question categories.
/// Prevents categories from being wiped out when database is rebuilt.
/// </summary>
public class InterviewCategoriesSeeder : ISeedTask
{
    public string Name => "Interview Question Categories";

    private readonly L4HDbContext _context;
    private readonly ILogger<InterviewCategoriesSeeder> _logger;

    public InterviewCategoriesSeeder(L4HDbContext context, ILogger<InterviewCategoriesSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        // Check if categories already exist
        var existingCount = await _context.InterviewQuestionCategories.CountAsync().ConfigureAwait(false);
        if (existingCount > 0)
        {
            _logger.LogDebug("Interview question categories already exist in database ({Count} categories), skipping seeding", existingCount);
            return;
        }

        var categories = new List<InterviewQuestionCategory>
        {
            new InterviewQuestionCategory
            {
                Id = Guid.NewGuid(),
                Value = "critical",
                Label = "Critical Questions",
                DisplayOrder = 0,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new InterviewQuestionCategory
            {
                Id = Guid.NewGuid(),
                Value = "work",
                Label = "Work & Employment",
                DisplayOrder = 1,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new InterviewQuestionCategory
            {
                Id = Guid.NewGuid(),
                Value = "family",
                Label = "Family Immigration",
                DisplayOrder = 2,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new InterviewQuestionCategory
            {
                Id = Guid.NewGuid(),
                Value = "education",
                Label = "Education & Study",
                DisplayOrder = 3,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new InterviewQuestionCategory
            {
                Id = Guid.NewGuid(),
                Value = "tourism",
                Label = "Tourism & Vacation",
                DisplayOrder = 4,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new InterviewQuestionCategory
            {
                Id = Guid.NewGuid(),
                Value = "business",
                Label = "Business Travel",
                DisplayOrder = 5,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new InterviewQuestionCategory
            {
                Id = Guid.NewGuid(),
                Value = "citizenship",
                Label = "Citizenship & Naturalization",
                DisplayOrder = 6,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new InterviewQuestionCategory
            {
                Id = Guid.NewGuid(),
                Value = "adoption",
                Label = "Adoption",
                DisplayOrder = 7,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new InterviewQuestionCategory
            {
                Id = Guid.NewGuid(),
                Value = "refinement",
                Label = "Additional Details",
                DisplayOrder = 8,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        _context.InterviewQuestionCategories.AddRange(categories);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        var totalCategories = await _context.InterviewQuestionCategories.CountAsync().ConfigureAwait(false);
        _logger.LogInformation("Seeded {CategoryCount} interview question categories", totalCategories);
    }
}
