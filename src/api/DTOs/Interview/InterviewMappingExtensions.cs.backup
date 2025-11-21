using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Services.Interview;

namespace L4H.Api.DTOs.Interview;

/// <summary>
/// Extension methods for mapping between domain models and DTOs
/// </summary>
public static class InterviewMappingExtensions
{
    public static QuestionDTO ToDTO(this InterviewQuestion question)
    {
        return new QuestionDTO
        {
            Key = question.Key,
            Text = question.Text,
            Category = question.Category,
            InputType = question.InputType,
            Options = question.Options.Select(o => o.ToDTO()).ToList(),
            IsRequired = question.IsRequired,
            Order = question.Order
        };
    }

    public static QuestionOptionDTO ToDTO(this QuestionOption option)
    {
        return new QuestionOptionDTO
        {
            Value = option.Value,
            Label = option.Label
        };
    }

    public static AnswerDTO ToDTO(this InterviewQA qa)
    {
        return new AnswerDTO
        {
            Question = qa.QuestionKey,
            Answer = qa.AnswerValue,
            AnsweredAt = qa.AnsweredAt
        };
    }

    public static VisaEvaluationDTO ToDTO(this VisaEvaluationResult result)
    {
        return new VisaEvaluationDTO
        {
            VisaTypeId = result.VisaType.Id,
            VisaCode = result.VisaType.Code,
            VisaName = result.VisaType.Name,
            Status = result.Status.ToString(),
            MatchScore = result.MatchScore,
            Rank = result.Rank,
            Explanation = result.Explanation,
            MissingInformation = result.MissingInformation,
            RequiredDocuments = result.RequiredDocuments,
            KeyBenefits = result.KeyBenefits,
            IsUserSelected = false,
            IsAttorneyLocked = false
        };
    }

    public static VisaEvaluationDTO ToDTO(this VisaEvaluation entity)
    {
        return new VisaEvaluationDTO
        {
            VisaTypeId = entity.VisaTypeId,
            VisaCode = entity.VisaType?.Code ?? string.Empty,
            VisaName = entity.VisaType?.Name ?? string.Empty,
            Status = entity.Status.ToString(),
            MatchScore = entity.MatchScore,
            Rank = entity.Rank,
            Explanation = entity.Explanation,
            MissingInformation = string.IsNullOrEmpty(entity.MissingInformation)
                ? new List<string>()
                : entity.MissingInformation.Split("; ", StringSplitOptions.RemoveEmptyEntries).ToList(),
            RequiredDocuments = entity.RequiredDocuments,
            KeyBenefits = new List<string>(),
            IsUserSelected = entity.IsUserSelected,
            IsAttorneyLocked = entity.IsAttorneyLocked,
            LockReason = entity.LockReason
        };
    }

    public static StartInterviewResponse ToStartResponse(this InterviewStartResult result)
    {
        return new StartInterviewResponse
        {
            SessionToken = result.SessionToken,
            SessionId = result.SessionId,
            FirstQuestion = result.FirstQuestion.ToDTO()
        };
    }

    public static ResumeInterviewResponse ToResumeResponse(this InterviewResumeResult result)
    {
        return new ResumeInterviewResponse
        {
            SessionId = result.SessionId,
            PreviousAnswers = result.PreviousAnswers.Select(a => a.ToDTO()).ToList(),
            NextQuestion = result.NextQuestion?.ToDTO(),
            IsComplete = result.IsComplete,
            Evaluations = result.Evaluations?.Select(e => e.ToDTO()).ToList()
        };
    }

    public static SubmitAnswerResponse ToSubmitResponse(this InterviewProgressResult result)
    {
        return new SubmitAnswerResponse
        {
            IsComplete = result.IsComplete,
            NextQuestion = result.NextQuestion?.ToDTO(),
            TotalAnswers = result.TotalAnswers,
            IsChecklistComplete = false,
            ChecklistProgress = null,
            ChecklistTotal = null,
            Evaluation = null
        };
    }

    public static ChecklistAnswersDTO ToChecklistAnswersDTO(
        string visaType,
        List<(string id, string text)> checklistDefinition,
        Dictionary<string, string> answers)
    {
        var questions = new List<ChecklistQuestionDTO>();
        for (int i = 0; i < checklistDefinition.Count; i++)
        {
            var (id, text) = checklistDefinition[i];
            var checklistKey = $"checklist_{id}";
            questions.Add(new ChecklistQuestionDTO
            {
                Id = id,
                Text = text,
                Answer = answers.ContainsKey(checklistKey) ? answers[checklistKey] : string.Empty,
                Order = i + 1
            });
        }

        var answeredCount = questions.Count(q => !string.IsNullOrEmpty(q.Answer));
        return new ChecklistAnswersDTO
        {
            VisaType = visaType,
            Questions = questions,
            TotalQuestions = questions.Count,
            AnsweredQuestions = answeredCount,
            IsComplete = answeredCount == questions.Count
        };
    }

    public static EvaluationSummaryDTO ToEvaluationSummaryDTO(this VisaEvaluationResult result)
    {
        return new EvaluationSummaryDTO
        {
            VisaType = result.VisaType.Code,
            VisaName = result.VisaType.Name,
            Status = result.Status.ToString(),
            MatchScore = result.MatchScore,
            Explanation = result.Explanation,
            Strengths = new List<string>(),
            Concerns = result.MissingInformation,
            NextSteps = new List<string> { "Complete contact information to proceed with your application" },
            ShowContactForm = true
        };
    }

    public static CompleteInterviewResponse ToCompleteResponse(this InterviewCompletionResult result)
    {
        return new CompleteInterviewResponse
        {
            SessionId = result.SessionId,
            Evaluations = result.Evaluations.Select(e => e.ToDTO()).ToList(),
            TotalQuestionsAnswered = result.TotalQuestionsAnswered
        };
    }
}
