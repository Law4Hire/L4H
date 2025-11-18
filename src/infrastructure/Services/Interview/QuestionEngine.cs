using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;

namespace L4H.Infrastructure.Services.Interview;

/// <summary>
/// Determines the next question to ask based on current answers and remaining visas.
/// Implements adaptive questioning that narrows down visa options efficiently.
/// </summary>
public class QuestionEngine : IQuestionEngine
{
    private readonly L4HDbContext _context;
    private readonly IVisaEvaluationEngine _evaluationEngine;

    public QuestionEngine(L4HDbContext context, IVisaEvaluationEngine evaluationEngine)
    {
        _context = context;
        _evaluationEngine = evaluationEngine;
    }

    public async Task<InterviewQuestion?> GetNextQuestionAsync(
        InterviewSession session,
        List<InterviewQA> answeredQuestions)
    {
        var answeredKeys = answeredQuestions.Select(qa => qa.QuestionKey).ToHashSet();

        // Get remaining visas to determine which questions are most relevant
        var remainingVisas = await _evaluationEngine.GetRemainingVisasAsync(answeredQuestions);

        // Check if we should complete
        if (await IsCompleteAsync(remainingVisas, answeredQuestions.Count))
        {
            return null;
        }

        // Get all available questions
        var allQuestions = GetAllQuestions();

        // Priority 1: Critical questions (always ask these first)
        var criticalQuestions = allQuestions
            .Where(q => q.Category == "critical" && !answeredKeys.Contains(q.Key))
            .OrderBy(q => q.Order)
            .ToList();

        if (criticalQuestions.Any())
        {
            return criticalQuestions.First();
        }

        // Priority 2: Visa-specific discriminating questions
        var discriminatingQuestion = GetMostDiscriminatingQuestion(
            allQuestions,
            answeredKeys,
            remainingVisas);

        if (discriminatingQuestion != null)
        {
            return discriminatingQuestion;
        }

        // Priority 3: Refinement questions for remaining visas
        var refinementQuestion = GetRefinementQuestion(
            allQuestions,
            answeredKeys,
            remainingVisas);

        return refinementQuestion;
    }

    public async Task<bool> IsCompleteAsync(
        List<VisaType> remainingVisas,
        int questionsAnswered)
    {
        // Never complete if we haven't asked any questions yet
        if (questionsAnswered == 0)
        {
            return false;
        }

        // Complete if we've narrowed down to 3 or fewer visas with pricing
        var commercialVisas = remainingVisas
            .Where(v => v.PricingRules.Any())
            .ToList();

        if (commercialVisas.Count <= 3 && commercialVisas.Count > 0)
        {
            return true;
        }

        // Complete if we've asked 8 or more questions (diminishing returns)
        if (questionsAnswered >= 8)
        {
            return true;
        }

        // Complete if no commercially available visas remain (but only after asking some questions)
        if (!commercialVisas.Any() && questionsAnswered >= 3)
        {
            return true;
        }

        return false;
    }

    /// <summary>
    /// Finds the question that will best discriminate between remaining visas
    /// </summary>
    private InterviewQuestion? GetMostDiscriminatingQuestion(
        List<InterviewQuestion> allQuestions,
        HashSet<string> answeredKeys,
        List<VisaType> remainingVisas)
    {
        var unansweredQuestions = allQuestions
            .Where(q => q.Category != "critical" && !answeredKeys.Contains(q.Key))
            .ToList();

        if (!unansweredQuestions.Any() || !remainingVisas.Any())
        {
            return null;
        }

        // Questions that help differentiate between visa categories
        var discriminators = new Dictionary<string, HashSet<string>>
        {
            // Work visas
            ["employer_sponsor"] = new HashSet<string> { "H-1B", "L-1", "O-1", "E-2", "TN" },
            ["investment_capital"] = new HashSet<string> { "EB-5", "E-2" },
            ["extraordinary_ability"] = new HashSet<string> { "O-1", "EB-1" },

            // Family visas
            ["us_citizen_relative"] = new HashSet<string> { "IR-1", "CR-1", "IR-2", "F-1", "F-2A", "F-2B", "F-3", "F-4" },
            ["spouse_type"] = new HashSet<string> { "IR-1", "CR-1", "K-1" },
            ["parent_of_us_citizen"] = new HashSet<string> { "IR-5" },

            // Student visas
            ["education_purpose"] = new HashSet<string> { "F-1", "M-1", "J-1" },
            ["university_acceptance"] = new HashSet<string> { "F-1", "M-1" },

            // Tourism/temporary
            ["tourism_purpose"] = new HashSet<string> { "B-2" },
            ["business_meetings"] = new HashSet<string> { "B-1" },

            // Citizenship
            ["us_permanent_resident"] = new HashSet<string> { "N-400" },
            ["us_citizen_parent"] = new HashSet<string> { "N-600" },

            // Adoption
            ["adoption_process"] = new HashSet<string> { "IR-3", "IR-4", "IH-3", "IH-4" }
        };

        var remainingVisaCodes = remainingVisas.Select(v => v.Code).ToHashSet();

        // Find question that best splits the remaining visas
        InterviewQuestion? bestQuestion = null;
        double bestScore = 0;

        foreach (var question in unansweredQuestions)
        {
            if (!discriminators.TryGetValue(question.Key, out var relatedVisas))
            {
                continue;
            }

            var matchingCount = relatedVisas.Intersect(remainingVisaCodes).Count();
            var nonMatchingCount = remainingVisaCodes.Except(relatedVisas).Count();

            // Best questions split the visa set evenly
            var balanceScore = 1.0 - Math.Abs(matchingCount - nonMatchingCount) / (double)remainingVisaCodes.Count;

            // Prefer questions that are relevant to more remaining visas
            var relevanceScore = matchingCount / (double)remainingVisaCodes.Count;

            var totalScore = (balanceScore * 0.6) + (relevanceScore * 0.4);

            if (totalScore > bestScore)
            {
                bestScore = totalScore;
                bestQuestion = question;
            }
        }

        return bestQuestion ?? unansweredQuestions.OrderBy(q => q.Order).FirstOrDefault();
    }

    /// <summary>
    /// Gets refinement questions for the remaining visas
    /// </summary>
    private InterviewQuestion? GetRefinementQuestion(
        List<InterviewQuestion> allQuestions,
        HashSet<string> answeredKeys,
        List<VisaType> remainingVisas)
    {
        var refinementQuestions = allQuestions
            .Where(q => q.Category == "refinement" && !answeredKeys.Contains(q.Key))
            .OrderBy(q => q.Order)
            .ToList();

        return refinementQuestions.FirstOrDefault();
    }

    /// <summary>
    /// Defines all available interview questions
    /// </summary>
    private List<InterviewQuestion> GetAllQuestions()
    {
        return new List<InterviewQuestion>
        {
            // CRITICAL QUESTIONS (Always ask first)
            new InterviewQuestion
            {
                Key = "purpose",
                Text = "What is your primary reason for seeking a US visa?",
                Category = "critical",
                InputType = "select",
                Order = 1,
                Options = new List<QuestionOption>
                {
                    new() { Value = "work", Label = "Work/Employment" },
                    new() { Value = "family", Label = "Join family members" },
                    new() { Value = "study", Label = "Study/Education" },
                    new() { Value = "tourism", Label = "Tourism/Visit" },
                    new() { Value = "business", Label = "Business activities" },
                    new() { Value = "investment", Label = "Investment/Start business" },
                    new() { Value = "citizenship", Label = "Citizenship/Naturalization" },
                    new() { Value = "adoption", Label = "Adoption" },
                    new() { Value = "other", Label = "Other" }
                }
            },

            new InterviewQuestion
            {
                Key = "current_status",
                Text = "What is your current immigration status?",
                Category = "critical",
                InputType = "select",
                Order = 2,
                Options = new List<QuestionOption>
                {
                    new() { Value = "outside_us", Label = "Outside the US" },
                    new() { Value = "tourist", Label = "Tourist/Visitor (B-1/B-2)" },
                    new() { Value = "student", Label = "Student (F-1/M-1)" },
                    new() { Value = "work_visa", Label = "Work visa (H-1B, L-1, etc.)" },
                    new() { Value = "green_card", Label = "Permanent Resident (Green Card)" },
                    new() { Value = "expired", Label = "Expired visa/status" },
                    new() { Value = "other", Label = "Other" }
                }
            },

            // WORK-RELATED QUESTIONS
            new InterviewQuestion
            {
                Key = "employer_sponsor",
                Text = "Do you have a US employer willing to sponsor you?",
                Category = "work",
                InputType = "radio",
                Order = 3,
                Options = new List<QuestionOption>
                {
                    new() { Value = "yes", Label = "Yes" },
                    new() { Value = "no", Label = "No" },
                    new() { Value = "uncertain", Label = "Not sure" }
                }
            },

            new InterviewQuestion
            {
                Key = "education_level",
                Text = "What is your highest level of education?",
                Category = "work",
                InputType = "select",
                Order = 4,
                Options = new List<QuestionOption>
                {
                    new() { Value = "high_school", Label = "High school" },
                    new() { Value = "associate", Label = "Associate degree" },
                    new() { Value = "bachelor", Label = "Bachelor's degree" },
                    new() { Value = "master", Label = "Master's degree" },
                    new() { Value = "phd", Label = "PhD/Doctorate" },
                    new() { Value = "none", Label = "No formal education" }
                }
            },

            new InterviewQuestion
            {
                Key = "extraordinary_ability",
                Text = "Have you achieved extraordinary ability or acclaim in your field (arts, sciences, business, athletics, education)?",
                Category = "work",
                InputType = "radio",
                Order = 5,
                Options = new List<QuestionOption>
                {
                    new() { Value = "yes", Label = "Yes, with national/international recognition" },
                    new() { Value = "no", Label = "No" },
                    new() { Value = "uncertain", Label = "Not sure" }
                }
            },

            new InterviewQuestion
            {
                Key = "investment_capital",
                Text = "Do you have capital to invest in a US business?",
                Category = "work",
                InputType = "select",
                Order = 6,
                Options = new List<QuestionOption>
                {
                    new() { Value = "800k_plus", Label = "$800,000 or more" },
                    new() { Value = "100k_800k", Label = "$100,000 - $800,000" },
                    new() { Value = "under_100k", Label = "Under $100,000" },
                    new() { Value = "none", Label = "No investment capital" }
                }
            },

            // FAMILY-RELATED QUESTIONS
            new InterviewQuestion
            {
                Key = "us_citizen_relative",
                Text = "Do you have a US citizen family member who can sponsor you?",
                Category = "family",
                InputType = "select",
                Order = 7,
                Options = new List<QuestionOption>
                {
                    new() { Value = "spouse", Label = "Spouse" },
                    new() { Value = "parent", Label = "Parent" },
                    new() { Value = "child", Label = "Child (21+)" },
                    new() { Value = "sibling", Label = "Sibling" },
                    new() { Value = "none", Label = "No US citizen relatives" }
                }
            },

            new InterviewQuestion
            {
                Key = "spouse_type",
                Text = "What is your marital status with your US citizen spouse?",
                Category = "family",
                InputType = "select",
                Order = 8,
                Options = new List<QuestionOption>
                {
                    new() { Value = "married_2plus", Label = "Married 2+ years" },
                    new() { Value = "married_under2", Label = "Married less than 2 years" },
                    new() { Value = "engaged", Label = "Engaged/planning to marry" },
                    new() { Value = "not_applicable", Label = "Not applicable" }
                }
            },

            new InterviewQuestion
            {
                Key = "parent_of_us_citizen",
                Text = "Are you the parent of a US citizen who is 21 years or older?",
                Category = "family",
                InputType = "radio",
                Order = 9,
                Options = new List<QuestionOption>
                {
                    new() { Value = "yes", Label = "Yes" },
                    new() { Value = "no", Label = "No" }
                }
            },

            // EDUCATION-RELATED QUESTIONS
            new InterviewQuestion
            {
                Key = "education_purpose",
                Text = "Are you planning to study in the United States?",
                Category = "education",
                InputType = "radio",
                Order = 10,
                Options = new List<QuestionOption>
                {
                    new() { Value = "yes", Label = "Yes" },
                    new() { Value = "no", Label = "No" }
                }
            },

            new InterviewQuestion
            {
                Key = "university_acceptance",
                Text = "Have you been accepted to a US educational institution?",
                Category = "education",
                InputType = "radio",
                Order = 11,
                Options = new List<QuestionOption>
                {
                    new() { Value = "yes", Label = "Yes, accepted" },
                    new() { Value = "applying", Label = "Currently applying" },
                    new() { Value = "no", Label = "Not yet" }
                }
            },

            // TOURISM/BUSINESS QUESTIONS
            new InterviewQuestion
            {
                Key = "tourism_purpose",
                Text = "Is your visit primarily for tourism or leisure?",
                Category = "tourism",
                InputType = "radio",
                Order = 12,
                Options = new List<QuestionOption>
                {
                    new() { Value = "yes", Label = "Yes" },
                    new() { Value = "no", Label = "No" }
                }
            },

            new InterviewQuestion
            {
                Key = "business_meetings",
                Text = "Will you attend business meetings, conferences, or consultations?",
                Category = "business",
                InputType = "radio",
                Order = 13,
                Options = new List<QuestionOption>
                {
                    new() { Value = "yes", Label = "Yes" },
                    new() { Value = "no", Label = "No" }
                }
            },

            // CITIZENSHIP QUESTIONS
            new InterviewQuestion
            {
                Key = "us_permanent_resident",
                Text = "Are you a US permanent resident (green card holder)?",
                Category = "citizenship",
                InputType = "radio",
                Order = 14,
                Options = new List<QuestionOption>
                {
                    new() { Value = "yes_5plus", Label = "Yes, for 5+ years" },
                    new() { Value = "yes_3plus_married", Label = "Yes, 3+ years (married to US citizen)" },
                    new() { Value = "yes_under3", Label = "Yes, less than 3 years" },
                    new() { Value = "no", Label = "No" }
                }
            },

            new InterviewQuestion
            {
                Key = "us_citizen_parent",
                Text = "Were you born to a US citizen parent?",
                Category = "citizenship",
                InputType = "radio",
                Order = 15,
                Options = new List<QuestionOption>
                {
                    new() { Value = "yes", Label = "Yes" },
                    new() { Value = "no", Label = "No" }
                }
            },

            // ADOPTION QUESTIONS
            new InterviewQuestion
            {
                Key = "adoption_process",
                Text = "Are you adopting or have adopted a child from outside the US?",
                Category = "adoption",
                InputType = "select",
                Order = 16,
                Options = new List<QuestionOption>
                {
                    new() { Value = "completed_abroad", Label = "Adoption completed abroad" },
                    new() { Value = "to_complete_us", Label = "Will complete adoption in US" },
                    new() { Value = "hague_country", Label = "From Hague Convention country" },
                    new() { Value = "no", Label = "Not applicable" }
                }
            },

            // REFINEMENT QUESTIONS
            new InterviewQuestion
            {
                Key = "timeline",
                Text = "When do you need to travel to or remain in the US?",
                Category = "refinement",
                InputType = "select",
                Order = 17,
                Options = new List<QuestionOption>
                {
                    new() { Value = "immediate", Label = "Within 3 months" },
                    new() { Value = "6months", Label = "3-6 months" },
                    new() { Value = "year", Label = "6-12 months" },
                    new() { Value = "flexible", Label = "Flexible timeline" }
                }
            },

            new InterviewQuestion
            {
                Key = "age",
                Text = "What is your age?",
                Category = "refinement",
                InputType = "select",
                Order = 18,
                Options = new List<QuestionOption>
                {
                    new() { Value = "under_18", Label = "Under 18" },
                    new() { Value = "18_30", Label = "18-30" },
                    new() { Value = "31_50", Label = "31-50" },
                    new() { Value = "51_plus", Label = "51 or older" }
                }
            },

            new InterviewQuestion
            {
                Key = "criminal_history",
                Text = "Do you have any criminal convictions?",
                Category = "refinement",
                InputType = "radio",
                Order = 19,
                Options = new List<QuestionOption>
                {
                    new() { Value = "yes", Label = "Yes" },
                    new() { Value = "no", Label = "No" }
                }
            },

            new InterviewQuestion
            {
                Key = "previous_visa_denial",
                Text = "Have you ever been denied a US visa?",
                Category = "refinement",
                InputType = "radio",
                Order = 20,
                Options = new List<QuestionOption>
                {
                    new() { Value = "yes", Label = "Yes" },
                    new() { Value = "no", Label = "No" }
                }
            }
        };
    }
}
