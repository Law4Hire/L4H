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
        _logger.LogInformation("AI determining next question for session {SessionId}", session.Id);
        
        // This is a placeholder for actual LLM integration (OpenAI/Azure/Vertex)
        // For now, it delegates to the existing rules or returns null to signal completion
        await Task.Delay(100); // Simulate AI latency
        
        return null; // Let the caller fallback to QuestionEngine if AI is inconclusive
    }

    public async Task<List<VisaEvaluationResult>> AnalyzeEligibilityAsync(List<InterviewQA> answers)
    {
        _logger.LogInformation("AI performing eligibility analysis for {AnswerCount} answers", answers.Count);
        
        // Placeholder for AI-driven match scoring and explanation generation
        await Task.Delay(500); 
        
        return new List<VisaEvaluationResult>();
    }
}
