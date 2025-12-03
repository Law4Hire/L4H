namespace L4H.Infrastructure.Entities;

/// <summary>
/// Database entity for storing answer options for interview questions.
/// Each question can have multiple options (for select/radio/checkbox types).
/// </summary>
public class QuestionOptionEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Foreign key to InterviewQuestionEntity
    /// </summary>
    public Guid QuestionId { get; set; }

    /// <summary>
    /// The value stored when this option is selected
    /// Example: "yes", "no", "work", "h1b_sponsorship"
    /// </summary>
    public string Value { get; set; } = string.Empty;

    /// <summary>
    /// The display label shown to the user
    /// Example: "Yes", "No", "Work/Employment", "I have an H-1B sponsor"
    /// </summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>
    /// Display order within the options list (lower numbers appear first)
    /// </summary>
    public int DisplayOrder { get; set; }

    /// <summary>
    /// Whether this option is active/visible
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Optional icon or emoji to display with this option
    /// </summary>
    public string? Icon { get; set; }

    /// <summary>
    /// Optional description or help text for this option
    /// </summary>
    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public InterviewQuestionEntity Question { get; set; } = null!;
}
