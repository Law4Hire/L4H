namespace L4H.Infrastructure.Entities;

public class InterviewQA
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SessionId { get; set; }
    public int StepNumber { get; set; }
    public string QuestionKey { get; set; } = string.Empty;
    public string AnswerValue { get; set; } = string.Empty;
    public DateTime AnsweredAt { get; set; }

    // Navigation properties
    public virtual InterviewSession Session { get; set; } = null!;
}