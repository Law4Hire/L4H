using System.Collections.Generic;
using System.Threading.Tasks;
using L4H.Infrastructure.Entities;

namespace L4H.Infrastructure.Services
{
    public interface IAdaptiveInterviewService
    {
        Task<InterviewQuestion> GetNextQuestionAsync(Dictionary<string, string>? answers, User? user = null);
        Task<RecommendationResult> GetRecommendationAsync(Dictionary<string, string>? answers, User? user = null);
        Task<bool> IsCompleteAsync(Dictionary<string, string>? answers, User? user = null);
    }

    public class InterviewQuestion
    {
        public string Key { get; set; } = string.Empty;
        public string Question { get; set; } = string.Empty;
        public string Type { get; set; } = "select"; // select, radio, text
        public List<InterviewOption> Options { get; set; } = new();
        public bool Required { get; set; } = true;
        public int RemainingVisaTypes { get; set; }
        public List<string> RemainingVisaCodes { get; set; } = new();
    }

    public class InterviewOption
    {
        public string Value { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}
