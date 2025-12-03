using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;

namespace L4H.Infrastructure.SeedData;

/// <summary>
/// Seeds the database with the default interview questions.
/// These were previously hardcoded in QuestionEngine.cs
/// </summary>
public class InterviewQuestionsSeeder : ISeedTask
{
    public string Name => "Interview Questions";

    private readonly L4HDbContext _context;
    private readonly ILogger<InterviewQuestionsSeeder> _logger;

    public InterviewQuestionsSeeder(L4HDbContext context, ILogger<InterviewQuestionsSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        // Check if questions already exist
        var existingCount = await _context.InterviewQuestions.CountAsync().ConfigureAwait(false);
        if (existingCount > 0)
        {
            _logger.LogDebug("Interview questions already exist in database ({Count} questions), skipping seeding", existingCount);
            return;
        }

        var questions = GetDefaultQuestions();

        foreach (var questionData in questions)
        {
            var question = new InterviewQuestionEntity
            {
                Key = questionData.Key,
                Text = questionData.Text,
                Category = questionData.Category,
                InputType = questionData.InputType,
                DisplayOrder = questionData.Order,
                IsRequired = questionData.IsRequired,
                IsActive = true,
                DiscriminatesVisaCodes = questionData.DiscriminatesVisaCodes,
                SelectionWeight = questionData.SelectionWeight,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.InterviewQuestions.Add(question);

            // Add options
            foreach (var optionData in questionData.Options)
            {
                var option = new QuestionOptionEntity
                {
                    QuestionId = question.Id,
                    Value = optionData.Value,
                    Label = optionData.Label,
                    DisplayOrder = optionData.Order,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.QuestionOptions.Add(option);
            }
        }

        await _context.SaveChangesAsync().ConfigureAwait(false);

        var totalQuestions = await _context.InterviewQuestions.CountAsync().ConfigureAwait(false);
        var totalOptions = await _context.QuestionOptions.CountAsync().ConfigureAwait(false);
        _logger.LogInformation("Seeded {QuestionCount} interview questions with {OptionCount} total options", totalQuestions, totalOptions);
    }

    private List<QuestionData> GetDefaultQuestions()
    {
        return new List<QuestionData>
        {
            // CRITICAL QUESTIONS (always asked first)
            new QuestionData
            {
                Key = "purpose",
                Text = "What is your primary reason for seeking a US visa?",
                Category = "critical",
                InputType = "select",
                Order = 1,
                IsRequired = true,
                SelectionWeight = 100,
                Options = new List<OptionData>
                {
                    new OptionData { Value = "work", Label = "Work/Employment", Order = 0 },
                    new OptionData { Value = "family", Label = "Family Reunification", Order = 1 },
                    new OptionData { Value = "study", Label = "Study/Education", Order = 2 },
                    new OptionData { Value = "tourism", Label = "Tourism/Vacation", Order = 3 },
                    new OptionData { Value = "business", Label = "Business Travel", Order = 4 },
                    new OptionData { Value = "investment", Label = "Investment/Business Ownership", Order = 5 },
                    new OptionData { Value = "citizenship", Label = "Citizenship/Naturalization", Order = 6 },
                    new OptionData { Value = "adoption", Label = "Adoption", Order = 7 },
                    new OptionData { Value = "other", Label = "Other", Order = 8 }
                }
            },
            new QuestionData
            {
                Key = "current_status",
                Text = "What is your current immigration status?",
                Category = "critical",
                InputType = "select",
                Order = 2,
                IsRequired = true,
                SelectionWeight = 100,
                Options = new List<OptionData>
                {
                    new OptionData { Value = "outside_us", Label = "Outside the United States", Order = 0 },
                    new OptionData { Value = "tourist", Label = "Tourist/Visitor (B-1/B-2)", Order = 1 },
                    new OptionData { Value = "student", Label = "Student (F-1/M-1/J-1)", Order = 2 },
                    new OptionData { Value = "work_visa", Label = "Work Visa (H-1B, L-1, etc.)", Order = 3 },
                    new OptionData { Value = "permanent_resident", Label = "Permanent Resident (Green Card)", Order = 4 },
                    new OptionData { Value = "overstayed", Label = "Overstayed Visa", Order = 5 },
                    new OptionData { Value = "other", Label = "Other", Order = 6 }
                }
            },

            // WORK QUESTIONS
            new QuestionData
            {
                Key = "employer_sponsor",
                Text = "Do you have a US employer willing to sponsor you?",
                Category = "work",
                InputType = "select",
                Order = 3,
                IsRequired = true,
                DiscriminatesVisaCodes = "H-1B,L-1,O-1,E-2,TN",
                SelectionWeight = 80,
                Options = new List<OptionData>
                {
                    new OptionData { Value = "yes", Label = "Yes, I have a sponsor", Order = 0 },
                    new OptionData { Value = "no", Label = "No, I do not have a sponsor", Order = 1 },
                    new OptionData { Value = "uncertain", Label = "Uncertain/Looking for options", Order = 2 }
                }
            },
            new QuestionData
            {
                Key = "education_level",
                Text = "What is your highest level of education?",
                Category = "work",
                InputType = "select",
                Order = 4,
                IsRequired = true,
                SelectionWeight = 60,
                Options = new List<OptionData>
                {
                    new OptionData { Value = "high_school", Label = "High School", Order = 0 },
                    new OptionData { Value = "associate", Label = "Associate Degree", Order = 1 },
                    new OptionData { Value = "bachelor", Label = "Bachelor's Degree", Order = 2 },
                    new OptionData { Value = "master", Label = "Master's Degree", Order = 3 },
                    new OptionData { Value = "doctorate", Label = "Doctorate/PhD", Order = 4 },
                    new OptionData { Value = "professional", Label = "Professional Degree (MD, JD, etc.)", Order = 5 }
                }
            },
            new QuestionData
            {
                Key = "extraordinary_ability",
                Text = "Have you achieved extraordinary ability or recognition in your field (arts, sciences, business, athletics, education)?",
                Category = "work",
                InputType = "select",
                Order = 5,
                IsRequired = true,
                DiscriminatesVisaCodes = "O-1,EB-1",
                SelectionWeight = 80,
                Options = new List<OptionData>
                {
                    new OptionData { Value = "yes", Label = "Yes, with awards/recognition", Order = 0 },
                    new OptionData { Value = "no", Label = "No", Order = 1 },
                    new OptionData { Value = "uncertain", Label = "Uncertain", Order = 2 }
                }
            },
            new QuestionData
            {
                Key = "investment_capital",
                Text = "Do you have capital to invest in a US business?",
                Category = "work",
                InputType = "select",
                Order = 6,
                IsRequired = true,
                DiscriminatesVisaCodes = "EB-5,E-2",
                SelectionWeight = 80,
                Options = new List<OptionData>
                {
                    new OptionData { Value = "eb5_level", Label = "Yes, $800,000-$1,050,000+ (EB-5 level)", Order = 0 },
                    new OptionData { Value = "e2_level", Label = "Yes, $100,000-$200,000 (E-2 level)", Order = 1 },
                    new OptionData { Value = "less", Label = "Yes, but less than $100,000", Order = 2 },
                    new OptionData { Value = "no", Label = "No investment capital", Order = 3 }
                }
            },

            // FAMILY QUESTIONS
            new QuestionData
            {
                Key = "us_citizen_relative",
                Text = "Do you have a US citizen family member who can sponsor you?",
                Category = "family",
                InputType = "select",
                Order = 7,
                IsRequired = true,
                DiscriminatesVisaCodes = "IR-1,CR-1,IR-2,CR-2,IR-5,F-1,F-2,F-3,F-4",
                SelectionWeight = 90,
                Options = new List<OptionData>
                {
                    new OptionData { Value = "spouse", Label = "Spouse", Order = 0 },
                    new OptionData { Value = "parent", Label = "Parent", Order = 1 },
                    new OptionData { Value = "child", Label = "Child (21 or older)", Order = 2 },
                    new OptionData { Value = "sibling", Label = "Sibling", Order = 3 },
                    new OptionData { Value = "none", Label = "No US citizen relatives", Order = 4 }
                }
            },
            new QuestionData
            {
                Key = "spouse_type",
                Text = "What is your marital status with your US citizen spouse?",
                Category = "family",
                InputType = "select",
                Order = 8,
                IsRequired = false,
                SelectionWeight = 70,
                Options = new List<OptionData>
                {
                    new OptionData { Value = "married_over_2_years", Label = "Married over 2 years", Order = 0 },
                    new OptionData { Value = "married_under_2_years", Label = "Married under 2 years", Order = 1 },
                    new OptionData { Value = "engaged", Label = "Engaged (K-1 Fiancé Visa)", Order = 2 },
                    new OptionData { Value = "not_applicable", Label = "Not applicable", Order = 3 }
                }
            },
            new QuestionData
            {
                Key = "parent_of_us_citizen",
                Text = "Are you the parent of a US citizen who is 21 years or older?",
                Category = "family",
                InputType = "select",
                Order = 9,
                IsRequired = false,
                SelectionWeight = 70,
                Options = new List<OptionData>
                {
                    new OptionData { Value = "yes", Label = "Yes", Order = 0 },
                    new OptionData { Value = "no", Label = "No", Order = 1 }
                }
            },

            // EDUCATION QUESTIONS
            new QuestionData
            {
                Key = "education_purpose",
                Text = "Are you planning to study in the United States?",
                Category = "education",
                InputType = "select",
                Order = 10,
                IsRequired = false,
                DiscriminatesVisaCodes = "F-1,M-1,J-1",
                SelectionWeight = 90,
                Options = new List<OptionData>
                {
                    new OptionData { Value = "yes", Label = "Yes", Order = 0 },
                    new OptionData { Value = "no", Label = "No", Order = 1 }
                }
            },
            new QuestionData
            {
                Key = "university_acceptance",
                Text = "Have you been accepted to a US educational institution?",
                Category = "education",
                InputType = "select",
                Order = 11,
                IsRequired = false,
                SelectionWeight = 60,
                Options = new List<OptionData>
                {
                    new OptionData { Value = "yes", Label = "Yes, I have an acceptance letter", Order = 0 },
                    new OptionData { Value = "applying", Label = "Currently applying", Order = 1 },
                    new OptionData { Value = "no", Label = "No, not yet", Order = 2 }
                }
            },

            // TOURISM QUESTIONS
            new QuestionData
            {
                Key = "tourism_purpose",
                Text = "Is your visit primarily for tourism or vacation?",
                Category = "tourism",
                InputType = "select",
                Order = 12,
                IsRequired = false,
                DiscriminatesVisaCodes = "B-2",
                SelectionWeight = 80,
                Options = new List<OptionData>
                {
                    new OptionData { Value = "yes", Label = "Yes", Order = 0 },
                    new OptionData { Value = "no", Label = "No", Order = 1 }
                }
            },

            // BUSINESS QUESTIONS
            new QuestionData
            {
                Key = "business_meetings",
                Text = "Will you be attending business meetings, conferences, or negotiations?",
                Category = "business",
                InputType = "select",
                Order = 13,
                IsRequired = false,
                DiscriminatesVisaCodes = "B-1",
                SelectionWeight = 70,
                Options = new List<OptionData>
                {
                    new OptionData { Value = "yes", Label = "Yes", Order = 0 },
                    new OptionData { Value = "no", Label = "No", Order = 1 }
                }
            },

            // CITIZENSHIP QUESTIONS
            new QuestionData
            {
                Key = "us_permanent_resident",
                Text = "Are you a US permanent resident (green card holder)?",
                Category = "citizenship",
                InputType = "select",
                Order = 14,
                IsRequired = false,
                DiscriminatesVisaCodes = "N-400",
                SelectionWeight = 90,
                Options = new List<OptionData>
                {
                    new OptionData { Value = "yes_5_years", Label = "Yes, for 5+ years", Order = 0 },
                    new OptionData { Value = "yes_3_years_married", Label = "Yes, for 3+ years (married to US citizen)", Order = 1 },
                    new OptionData { Value = "yes_less", Label = "Yes, but less than required time", Order = 2 },
                    new OptionData { Value = "no", Label = "No", Order = 3 }
                }
            },
            new QuestionData
            {
                Key = "us_citizen_parent",
                Text = "Were you born to a US citizen parent?",
                Category = "citizenship",
                InputType = "select",
                Order = 15,
                IsRequired = false,
                DiscriminatesVisaCodes = "N-600",
                SelectionWeight = 80,
                Options = new List<OptionData>
                {
                    new OptionData { Value = "yes", Label = "Yes", Order = 0 },
                    new OptionData { Value = "no", Label = "No", Order = 1 }
                }
            },

            // ADOPTION QUESTIONS
            new QuestionData
            {
                Key = "adoption_process",
                Text = "Are you adopting a child from outside the United States?",
                Category = "adoption",
                InputType = "select",
                Order = 16,
                IsRequired = false,
                DiscriminatesVisaCodes = "IR-3,IR-4,IH-3,IH-4",
                SelectionWeight = 90,
                Options = new List<OptionData>
                {
                    new OptionData { Value = "yes_completed", Label = "Yes, adoption completed abroad", Order = 0 },
                    new OptionData { Value = "yes_to_complete", Label = "Yes, adoption to be completed in US", Order = 1 },
                    new OptionData { Value = "hague", Label = "Yes, from a Hague Convention country", Order = 2 },
                    new OptionData { Value = "no", Label = "No", Order = 3 }
                }
            },

            // REFINEMENT QUESTIONS (asked after narrowing down options)
            new QuestionData
            {
                Key = "timeline",
                Text = "When do you need to travel to or remain in the United States?",
                Category = "refinement",
                InputType = "select",
                Order = 17,
                IsRequired = false,
                SelectionWeight = 40,
                Options = new List<OptionData>
                {
                    new OptionData { Value = "immediate", Label = "Immediately (within 3 months)", Order = 0 },
                    new OptionData { Value = "short_term", Label = "Short-term (3-12 months)", Order = 1 },
                    new OptionData { Value = "long_term", Label = "Long-term (1-5 years)", Order = 2 },
                    new OptionData { Value = "permanent", Label = "Permanently", Order = 3 }
                }
            },
            new QuestionData
            {
                Key = "age",
                Text = "What is your age?",
                Category = "refinement",
                InputType = "select",
                Order = 18,
                IsRequired = false,
                SelectionWeight = 30,
                Options = new List<OptionData>
                {
                    new OptionData { Value = "under_18", Label = "Under 18", Order = 0 },
                    new OptionData { Value = "18_to_30", Label = "18-30", Order = 1 },
                    new OptionData { Value = "31_to_50", Label = "31-50", Order = 2 },
                    new OptionData { Value = "over_50", Label = "Over 50", Order = 3 }
                }
            },
            new QuestionData
            {
                Key = "criminal_history",
                Text = "Do you have any criminal convictions or immigration violations?",
                Category = "refinement",
                InputType = "select",
                Order = 19,
                IsRequired = false,
                SelectionWeight = 50,
                Options = new List<OptionData>
                {
                    new OptionData { Value = "yes", Label = "Yes", Order = 0 },
                    new OptionData { Value = "no", Label = "No", Order = 1 }
                }
            },
            new QuestionData
            {
                Key = "previous_visa_denial",
                Text = "Have you ever been denied a US visa or had a visa revoked?",
                Category = "refinement",
                InputType = "select",
                Order = 20,
                IsRequired = false,
                SelectionWeight = 50,
                Options = new List<OptionData>
                {
                    new OptionData { Value = "yes", Label = "Yes", Order = 0 },
                    new OptionData { Value = "no", Label = "No", Order = 1 }
                }
            }
        };
    }

    // Data transfer classes
    private class QuestionData
    {
        public string Key { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string InputType { get; set; } = string.Empty;
        public int Order { get; set; }
        public bool IsRequired { get; set; }
        public string? DiscriminatesVisaCodes { get; set; }
        public int SelectionWeight { get; set; }
        public List<OptionData> Options { get; set; } = new List<OptionData>();
    }

    private class OptionData
    {
        public string Value { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public int Order { get; set; }
    }
}
