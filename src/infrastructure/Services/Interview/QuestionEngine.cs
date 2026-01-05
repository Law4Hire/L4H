using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;

namespace L4H.Infrastructure.Services.Interview;

/// <summary>
/// Determines the next question to ask based on current answers and remaining visas.
/// Implements adaptive questioning that narrows down visa options efficiently.
/// </summary>
public class QuestionEngine : IQuestionEngine
{
    private readonly L4HDbContext _context;
    private readonly IVisaEvaluationEngine _evaluationEngine;

    public QuestionEngine(L4HDbContext context, IVisaEvaluationEngine evaluationEngine)
    {
        _context = context;
        _evaluationEngine = evaluationEngine;
    }

    public async Task<InterviewQuestion?> GetNextQuestionAsync(
        InterviewSession session,
        List<InterviewQA> answeredQuestions)
    {
        var answeredKeys = answeredQuestions.Select(qa => qa.QuestionKey).ToHashSet();
        var lastAnswer = answeredQuestions.OrderByDescending(qa => qa.StepNumber).FirstOrDefault();

        // Get all available questions FROM DATABASE with their options
        var allQuestionsFromDb = await _context.InterviewQuestions
            .Include(q => q.Options)
            .Where(q => q.IsActive)
            .ToListAsync()
            .ConfigureAwait(false);

        // Priority 0: Hardcoded Target from last answer
        if (lastAnswer != null)
        {
            var lastQuestion = allQuestionsFromDb.FirstOrDefault(q => q.Key == lastAnswer.QuestionKey);
            var selectedOption = lastQuestion?.Options.FirstOrDefault(o => o.Value == lastAnswer.AnswerValue);
            
            if (selectedOption?.TargetQuestionId != null)
            {
                var target = allQuestionsFromDb.FirstOrDefault(q => q.Id == selectedOption.TargetQuestionId);
                if (target != null && !answeredKeys.Contains(target.Key))
                {
                    return MapToModel(target);
                }
            }
        }

        // Filter questions based on Parent/Trigger logic
        var availableQuestions = allQuestionsFromDb.Where(q => !answeredKeys.Contains(q.Key)).ToList();
        var validCandidates = new List<InterviewQuestionEntity>();

        foreach (var q in availableQuestions)
        {
            if (q.ParentId == null)
            {
                // Top-level questions are always candidates
                validCandidates.Add(q);
            }
            else 
            {
                // Child questions need their parent to be answered AND matching the trigger value (if set)
                var parent = allQuestionsFromDb.FirstOrDefault(p => p.Id == q.ParentId);
                if (parent != null)
                {
                    var parentAnswer = answeredQuestions.FirstOrDefault(a => a.QuestionKey == parent.Key);
                    if (parentAnswer != null)
                    {
                        // If trigger value is specified, it must match. If null, any answer triggers it.
                        if (string.IsNullOrEmpty(q.ParentOptionValue) || parentAnswer.AnswerValue == q.ParentOptionValue)
                        {
                            validCandidates.Add(q);
                        }
                    }
                }
            }
        }

        if (!validCandidates.Any()) return null;

        // Priority 1: Critical questions from valid candidates
        var nextCritical = validCandidates
            .Where(q => q.Category == "critical")
            .OrderBy(q => q.DisplayOrder)
            .FirstOrDefault();

        if (nextCritical != null) return MapToModel(nextCritical);

        // Priority 2: Discriminating logic on valid candidates
        // Map entities to models for existing logic
        var candidateModels = validCandidates.Select(MapToModel).ToList();
        var remainingVisas = await _evaluationEngine.GetRemainingVisasAsync(answeredQuestions);

        var discriminating = GetMostDiscriminatingQuestion(
            candidateModels,
            answeredKeys,
            remainingVisas);

        return discriminating;
    }

    private InterviewQuestion MapToModel(InterviewQuestionEntity q)
    {
        return new InterviewQuestion
        {
            Key = q.Key,
            Text = q.Text,
            Category = q.Category,
            InputType = q.InputType,
            Order = q.DisplayOrder,
            IsRequired = q.IsRequired,
            ParentId = q.ParentId,
            ParentOptionValue = q.ParentOptionValue,
            Options = q.Options
                .Where(o => o.IsActive)
                .OrderBy(o => o.DisplayOrder)
                .Select(o => new QuestionOption
                {
                    Value = o.Value,
                    Label = o.Label,
                    ActionType = o.ActionType,
                    TargetQuestionId = o.TargetQuestionId,
                    TargetPagePath = o.TargetPagePath,
                    QualifiedVisaCodes = o.QualifiedVisaCodes
                })
                .ToList()
        };
    }

    public async Task<bool> IsCompleteAsync(
        List<VisaType> remainingVisas,
        int questionsAnswered)
    {
        // MINIMUM 5 questions required before completing (was too early before)
        // This ensures we gather enough information for quality recommendations
        if (questionsAnswered < 5)
        {
            return false;
        }

        // Complete if we've narrowed down to 3 or fewer visas with pricing
        var commercialVisas = remainingVisas
            .Where(v => v.PricingRules.Count > 0)
            .ToList();

        if (commercialVisas.Count <= 3 && commercialVisas.Count > 0)
        {
            return true;
        }

        // Complete if we've asked 10 or more questions (was 8, increased for better accuracy)
        if (questionsAnswered >= 10)
        {
            return true;
        }

        // Complete if no commercially available visas remain
        if (commercialVisas.Count == 0)
        {
            return true;
        }

        return false;
    }

    /// <summary>
    /// Finds the question that will best discriminate between remaining visas
    /// </summary>
    private InterviewQuestion? GetMostDiscriminatingQuestion(
        List<InterviewQuestion> allQuestions,
        HashSet<string> answeredKeys,
        List<VisaType> remainingVisas)
}
