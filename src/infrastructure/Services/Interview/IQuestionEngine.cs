using L4H.Infrastructure.Entities;

namespace L4H.Infrastructure.Services.Interview;

/// <summary>
/// Determines the next question to ask based on current answers and remaining visas
/// </summary>
public interface IQuestionEngine
{
    /// <summary>
    /// Gets the next question to ask in the interview
    /// </summary>
    /// <returns>Next question, or null if interview is complete</returns>
    Task<InterviewQuestion?> GetNextQuestionAsync(
        InterviewSession session,
        List<InterviewQA> answeredQuestions);

    /// <summary>
    /// Checks if the interview can be completed
    /// </summary>
    Task<bool> IsCompleteAsync(
        List<VisaType> remainingVisas,
        int questionsAnswered,
        List<InterviewQA> answeredQuestions);
}

/// <summary>
/// Interview question with options
/// </summary>
public class InterviewQuestion
{
    public string Key { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string InputType { get; set; } = "text"; // text, select, radio, checkbox
    public List<QuestionOption> Options { get; set; } = new();
    public bool IsRequired { get; set; } = true;
    public int Order { get; set; }
    public Guid? ParentId { get; set; }
    public string? ParentOptionValue { get; set; }
    public string? DiscriminatesVisaCodes { get; set; }
}

public class QuestionOption
{
    public string Value { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string? ActionType { get; set; }
    public Guid? TargetQuestionId { get; set; }
    public string? TargetPagePath { get; set; }
    public string? QualifiedVisaCodes { get; set; }
}
