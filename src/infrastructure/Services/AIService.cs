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
                    new() { Value = "nonimmigrant", Label = "Non-Immigrant - Temporary Stay (Work, Study, Visit)" }
                }
            };
        }

        // After the initial intent_type question, hand off to the rules-based engine.
        // The visa type cannot be determined from the immigrant/non-immigrant answer alone —
        // that single answer leaves all visas as Potential candidates, so picking a "top candidate"
        // here only ever selects an arbitrary visa (the first one by database ID) rather than
        // one informed by the user's actual situation.
        return null; 
    }

    public async Task<List<VisaEvaluationResult>> AnalyzeEligibilityAsync(List<InterviewQA> answers)
    {
        _logger.LogInformation("AI performing eligibility analysis for {AnswerCount} answers", answers.Count);
        
        await Task.Delay(1200); // AI 'Thinking' time
        
        // Return results - in a real implementation this would call an LLM
        // For now, it will return an empty list which triggers the rules-based fallback in AgentOrchestrator
        return new List<VisaEvaluationResult>();
    }
}
