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

        // Fix: Persist AI-generated questions until 'Single Visa Assigned' state is reached
        // This prevents reversion to static questions from QuestionEngine
        if (remainingVisas.Count > 1)
        {
            // Simple logic to pick the top candidate and ask a targeted question
            var topCandidate = remainingVisas.OrderBy(v => v.Id).First();
            
            return new InterviewQuestion
            {
                Key = $"ai_agent_refine_{topCandidate.Code.ToLower()}",
                Text = $"Based on our analysis, the {topCandidate.Name} ({topCandidate.Code}) looks like a strong match. Is this the primary pathway you'd like to explore?",
                Category = "ai_agent",
                InputType = "select",
                IsRequired = true,
                Options = new List<QuestionOption>
                {
                    new() { Value = "yes", Label = "Yes, this matches my situation" },
                    new() { Value = "no", Label = "No, I'd like to see other options" },
                    new() { Value = "maybe", Label = "I'm not sure, tell me more" }
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
        // For now, it will return an empty list which triggers the rules-based fallback in AgentOrchestrator
        return new List<VisaEvaluationResult>();
    }
}
