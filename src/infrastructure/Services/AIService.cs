using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Interfaces;
using L4H.Infrastructure.Services.Interview;
using L4H.Shared.Models;
using Microsoft.Extensions.Logging;

namespace L4H.Infrastructure.Services;

public class AIService : IAIService
{
    private readonly ILogger<AIService> _logger;
    private readonly L4HDbContext _context;

    public AIService(ILogger<AIService> logger, L4HDbContext context)
    {
        _logger = logger;
        _context = context;
    }

    public async Task<InterviewQuestion?> GetNextAIQuestionAsync(
        InterviewSession session,
        List<InterviewQA> answers,
        List<VisaType> remainingVisas)
    {
        _logger.LogInformation("AI determining next question for session {SessionId}. Remaining visas: {Count}", session.Id, remainingVisas.Count);
        
        // Simulate AI latency for the 'loading' experience mentioned by user
        await Task.Delay(800); 

        // If no answers yet, start with the 'Denise Fork' classification
        if (answers.Count == 0)
        {
            return new InterviewQuestion
            {
                Key = "intent_type",
                Text = "Welcome to Law4Hire. To provide you with the most accurate legal guidance, we must first determine your primary objective. Are you seeking to move to the United States permanently (Immigrant), or are you planning a temporary stay (Non-Immigrant)?",
                Category = "ai_agent",
                InputType = "select",
                IsRequired = true,
                Options = new List<QuestionOption>
                {
                    new() { Value = "immigrant", Label = "Immigrant - Permanent Residency / Green Card" },
                    new() { Value = "nonimmigrant", Label = "Non-Immigrant - Temporary Stay (Work, Study, Visit)" },
                    new() { Value = "citizenship", Label = "Citizenship, Adoption & Naturalization - Become a U.S. citizen or complete an adoption" },
                    new() { Value = "refugee", Label = "Refugee & Removal Defense - Asylum, refugee status, or fighting deportation" },
                    new() { Value = "investor", Label = "Investor - Investment-based visa or business immigration" }
                }
            };
        }

        var answersDict = answers.ToDictionary(qa => qa.QuestionKey, qa => qa.AnswerValue, StringComparer.OrdinalIgnoreCase);

        // MANDATORY BRANCHING GUARD: AI must not intercept until ALL rules-engine mandatory fields
        // are satisfied. Using a raw answer count (< 4) is wrong because:
        //   - It fires at count=4 which is BEFORE educational_goals (step 3.1b) is asked
        //   - It lets the AI skip the "category" question entirely, which is what sets purpose
        // The correct gate is: hand back to rules engine until category (and subcategory if
        // required) have been answered. This ensures the evaluator always has a purpose signal.
        bool allMandatoryFieldsPresent =
            answersDict.ContainsKey("location") &&
            answersDict.ContainsKey("education_level") &&
            answersDict.ContainsKey("category");

        // Also enforce the nonimmigrant discerning-question requirement
        if (answersDict.TryGetValue("intent_type", out var intentCheck) &&
            intentCheck.Equals("nonimmigrant", StringComparison.OrdinalIgnoreCase))
        {
            allMandatoryFieldsPresent =
                allMandatoryFieldsPresent &&
                answersDict.ContainsKey("employment_status") &&
                answersDict.ContainsKey("educational_goals");
        }

        if (!allMandatoryFieldsPresent)
        {
            return null; // Handover to rules engine to complete mandatory flow
        }

        if (remainingVisas.Count > 1)
        {
            // If the user already confirmed a visa, the interview can proceed to completion
            if (answersDict.Any(kvp =>
                    kvp.Key.StartsWith("ai_agent_refine_", StringComparison.OrdinalIgnoreCase) &&
                    kvp.Value.Equals("yes", StringComparison.OrdinalIgnoreCase)))
            {
                return null;
            }

            // Collect visa codes that have already been presented as a refine question
            var alreadyRefined = answersDict.Keys
                .Where(k => k.StartsWith("ai_agent_refine_", StringComparison.OrdinalIgnoreCase))
                .Select(k => k["ai_agent_refine_".Length..])
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            // Prefer the user's explicitly chosen subcategory if not yet asked;
            // remainingVisas is already ranked by eligibility + score from EvaluateAllVisasAsync
            VisaType? topCandidate = null;
            if (answersDict.TryGetValue("subcategory", out var subcategoryCode) &&
                !string.IsNullOrEmpty(subcategoryCode) &&
                !alreadyRefined.Contains(subcategoryCode))
            {
                topCandidate = remainingVisas.FirstOrDefault(v =>
                    v.Code.Equals(subcategoryCode, StringComparison.OrdinalIgnoreCase));
            }

            // Fallback: first remaining visa not yet asked about
            topCandidate ??= remainingVisas.FirstOrDefault(v => !alreadyRefined.Contains(v.Code));

            // All remaining visas have been presented — let the interview complete
            if (topCandidate == null)
            {
                return null;
            }

            return new InterviewQuestion
            {
                Key = $"ai_agent_refine_{topCandidate.Code.ToLower()}",
                Text = $"Based on our analysis, the {topCandidate.Name} ({topCandidate.Code}) looks like a strong match for your objectives. Does this align with what you are looking for?",
                Category = "ai_agent",
                InputType = "select",
                IsRequired = true,
                Options = new List<QuestionOption>
                {
                    new() { Value = "yes", Label = "Yes, this matches my situation" },
                    new() { Value = "no", Label = "No, I'd like to explore other options" },
                    new() { Value = "maybe", Label = "I'm not sure, I'd like more details" }
                }
            };
        }
        
        // Handover to rules-based engine only when we are down to a single visa or conclusive state
        return null; 
    }

    public async Task<List<VisaEvaluationResult>> AnalyzeEligibilityAsync(List<InterviewQA> answers)
    {
        _logger.LogInformation("AI performing eligibility analysis for {AnswerCount} answers", answers.Count);
        
        await Task.Delay(1200); // AI 'Thinking' time
        
        // Return results - in a real implementation this would call an LLM
        return new List<VisaEvaluationResult>();
    }
}
