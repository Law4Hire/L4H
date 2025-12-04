using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

/// <summary>
/// Database entity for storing interview questions.
/// Previously hardcoded in QuestionEngine.cs, now stored in database for dynamic management.
/// </summary>
public class InterviewQuestionEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Unique identifier key for the question (e.g., "purpose", "employer_sponsor")
    /// Used for answer mapping and logic
    /// </summary>
    public string Key { get; set; } = string.Empty;

    /// <summary>
    /// The actual question text shown to the user
    /// </summary>
    public string Text { get; set; } = string.Empty;

    /// <summary>
    /// Category for grouping and flow logic
    /// Examples: "critical", "work", "family", "education", "refinement"
    /// </summary>
    public string Category { get; set; } = string.Empty;

    /// <summary>
    /// Input type for rendering
    /// Values: "select", "radio", "text", "checkbox", "textarea"
    /// </summary>
    public string InputType { get; set; } = "select";

    /// <summary>
    /// Display order within the question set (lower numbers appear first)
    /// </summary>
    public int DisplayOrder { get; set; }

    /// <summary>
    /// Whether this question is required (must be answered)
    /// </summary>
    public bool IsRequired { get; set; } = true;

    /// <summary>
    /// Whether this question is active (visible in interviews)
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Optional description or help text for admins
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Comma-separated list of visa codes this question helps discriminate
    /// Example: "H-1B,L-1,O-1,E-2,TN"
    /// Used by question selection algorithm
    /// </summary>
    public string? DiscriminatesVisaCodes { get; set; }

    /// <summary>
    /// Weight/importance for question selection algorithm (0-100)
    /// Higher values = more likely to be selected
    /// </summary>
    public int SelectionWeight { get; set; } = 50;

    /// <summary>
    /// Parent question ID for hierarchical questions (null for top-level questions)
    /// Child questions inherit discrimination codes from their parent
    /// </summary>
    public Guid? ParentId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public UserId? CreatedByUserId { get; set; }
    public UserId? UpdatedByUserId { get; set; }

    // Navigation properties
    public User? CreatedByUser { get; set; }
    public User? UpdatedByUser { get; set; }
    public ICollection<QuestionOptionEntity> Options { get; set; } = new List<QuestionOptionEntity>();

    // Hierarchy navigation properties
    public InterviewQuestionEntity? Parent { get; set; }
    public ICollection<InterviewQuestionEntity> Children { get; set; } = new List<InterviewQuestionEntity>();
}
