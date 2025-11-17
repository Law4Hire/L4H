using L4H.Infrastructure.Entities;

namespace L4H.Infrastructure.Services.Interview;

/// <summary>
/// Single source of truth for visa eligibility evaluation.
/// Replaces the fragmented logic across AdaptiveInterviewService, InterviewRecommender, and DecisionTreeService.
/// </summary>
public interface IVisaEvaluationEngine
{
    /// <summary>
    /// Evaluates all visa types against user answers and returns ranked results
    /// </summary>
    Task<List<VisaEvaluationResult>> EvaluateAllVisasAsync(
        List<InterviewQA> answers,
        User? user = null);

    /// <summary>
    /// Gets visa types still in contention (for adaptive questioning)
    /// </summary>
    Task<List<VisaType>> GetRemainingVisasAsync(
        List<InterviewQA> answers,
        User? user = null);

    /// <summary>
    /// Checks if we have enough information to complete the interview
    /// </summary>
    Task<bool> HasSufficientInformationAsync(
        List<InterviewQA> answers,
        List<VisaType> remainingVisas);
}

/// <summary>
/// Result of visa evaluation with all details needed for display and storage
/// </summary>
public class VisaEvaluationResult
{
    public VisaType VisaType { get; set; } = null!;
    public EligibilityStatus Status { get; set; }
    public decimal MatchScore { get; set; }
    public int Rank { get; set; }
    public string Explanation { get; set; } = string.Empty;
    public List<string> MissingInformation { get; set; } = new();
    public List<string> RequiredDocuments { get; set; } = new();
    public List<string> KeyBenefits { get; set; } = new();
}
