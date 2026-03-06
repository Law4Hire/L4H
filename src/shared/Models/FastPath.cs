using System;
using System.Collections.Generic;

namespace L4H.Shared.Models;

public class FastPathQuizSubmission
{
    public Dictionary<string, string> Answers { get; set; } = new();
}

public class FastPathResult
{
    public double MatchConfidence { get; set; } // 0.0 to 1.0
    public string Summary { get; set; } = string.Empty;
    public List<FastPathVisaMatch> TopMatches { get; set; } = new();
    public string Recommendation { get; set; } = string.Empty;
}

public class FastPathVisaMatch
{
    public string VisaCode { get; set; } = string.Empty;
    public string VisaName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // Potential, Likely, Eligible
    public double Score { get; set; }
}

public class QuizAnswerSubmission
{
    public Guid SessionId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}
