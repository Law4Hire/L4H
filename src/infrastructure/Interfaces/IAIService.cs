using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Services.Interview;
using L4H.Shared.Models;

namespace L4H.Infrastructure.Interfaces;

/// <summary>
/// Service for AI-driven interview analysis and orchestration
/// </summary>
public interface IAIService
{
    /// <summary>
    /// Analyzes user answers and determines the next best question using AI
    /// </summary>
    Task<InterviewQuestion?> GetNextAIQuestionAsync(
        InterviewSession session,
        List<InterviewQA> answers,
        List<VisaType> remainingVisas);

    /// <summary>
    /// Performs deep analysis of interview results using LLM
    /// </summary>
    Task<List<VisaEvaluationResult>> AnalyzeEligibilityAsync(
        List<InterviewQA> answers);
}
