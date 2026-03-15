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

        // We have completely removed the "guessing game" loop here.
        // CitizenPath Workflow: Do not guess one-by-one and ask "Does this align?".
        // Instead, once all mandatory fields are collected, we immediately hand over to the rules-based 
        // engine to finish document prerequisites and then evaluate the user for a curated list 
        // of ALL visas they are qualified for.

        // Handover to rules-based engine
        return null;
        }

        public async Task<List<VisaEvaluationResult>> AnalyzeEligibilityAsync(List<InterviewQA> answers)    {
        _logger.LogInformation("AI performing eligibility analysis for {AnswerCount} answers", answers.Count);
        
        await Task.Delay(1200); // AI 'Thinking' time
        
        // Return results - in a real implementation this would call an LLM
        return new List<VisaEvaluationResult>();
    }
}
