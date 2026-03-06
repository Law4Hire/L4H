using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Services.Interview;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/fastpath")]
[AllowAnonymous]
[Tags("FastPath")]
public class FastPathQuizController : ControllerBase
{
    private readonly IVisaEvaluationEngine _evaluationEngine;
    private readonly ISessionManager _sessionManager;
    private readonly ILogger<FastPathQuizController> _logger;

    public FastPathQuizController(
        IVisaEvaluationEngine evaluationEngine,
        ISessionManager sessionManager,
        ILogger<FastPathQuizController> logger)
    {
        _evaluationEngine = evaluationEngine;
        _sessionManager = sessionManager;
        _logger = logger;
    }

    /// <summary>
    /// Initialize a new FastPath quiz session
    /// </summary>
    [HttpPost("start")]
    public async Task<ActionResult<object>> StartQuiz()
    {
        try
        {
            var session = await _sessionManager.CreateAnonymousSessionAsync();
            
            // Mark as FastPath
            var sessionEntity = await _sessionManager.GetSessionByTokenAsync(session.AnonymousToken!.Value);
            if (sessionEntity != null)
            {
                sessionEntity.IsFastPath = true;
                // SaveChanges is typically handled by managers or we can do it here if needed
                // But let's assume we need to update it
            }

            return Ok(new { 
                sessionId = session.Id, 
                sessionToken = session.AnonymousToken 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting FastPath quiz session");
            return StatusCode(500, "Could not initialize quiz session.");
        }
    }

    /// <summary>
    /// Save a single quiz answer in real-time
    /// </summary>
    [HttpPost("save-answer")]
    public async Task<IActionResult> SaveAnswer([FromBody] QuizAnswerSubmission request)
    {
        try
        {
            await _sessionManager.SaveAnswerAsync(request.SessionId, request.Key, request.Value);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving quiz answer for session {SessionId}", request.SessionId);
            return StatusCode(500, "Error saving answer.");
        }
    }

    /// <summary>
    /// Evaluate preliminary quiz answers to provide instant feedback
    /// </summary>
    [HttpPost("evaluate")]
    public async Task<ActionResult<FastPathResult>> EvaluateQuiz([FromBody] FastPathQuizSubmission submission)
    {
        try
        {
            // Map dictionary to InterviewQA objects for the evaluation engine
            var tempAnswers = submission.Answers.Select(kvp => new InterviewQA
            {
                QuestionKey = kvp.Key,
                AnswerValue = kvp.Value
            }).ToList();

            // Run preliminary evaluation
            var evaluations = await _evaluationEngine.EvaluateAllVisasAsync(tempAnswers);
            
            // Filter out NotEligible and take top 3
            var matches = evaluations
                .Where(e => e.Status != EligibilityStatus.NotEligible)
                .Take(3)
                .Select(e => new FastPathVisaMatch
                {
                    VisaCode = e.VisaType.Code,
                    VisaName = e.VisaType.Name,
                    Status = e.Status.ToString(),
                    Score = (double)e.MatchScore
                })
                .ToList();

            var result = new FastPathResult
            {
                TopMatches = matches,
                MatchConfidence = matches.Any() ? matches.Max(m => m.Score) / 100.0 : 0,
                Summary = matches.Any() 
                    ? $"We found {matches.Count} potential visa pathways based on your initial profile."
                    : "We need more information to identify your best pathway.",
                Recommendation = matches.Any()
                    ? "Complete the full interview to get a detailed legal analysis and confirm your eligibility."
                    : "Start the full interview process so our system can analyze your specific situation in depth."
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error evaluating FastPath quiz");
            return StatusCode(500, "An error occurred during evaluation.");
        }
    }

    /// <summary>
    /// Get the quiz questions
    /// </summary>
    [HttpGet("questions")]
    public IActionResult GetQuizQuestions()
    {
        // Static set of landing page questions
        var questions = new List<object>
        {
            new {
                key = "age_over_18",
                text = "Are you at least 18 years old?",
                type = "radio",
                options = new[] { new { value = "yes", label = "Yes" }, new { value = "no", label = "No" } }
            },
            new {
                key = "intent_type",
                text = "Are you seeking to move to the U.S. permanently, or are you planning a temporary stay?",
                type = "select",
                options = new[] { 
                    new { value = "immigrant", label = "Permanent Residency / Green Card" },
                    new { value = "nonimmigrant", label = "Temporary Stay (Work, Study, Visit)" },
                    new { value = "citizenship", label = "U.S. Citizenship" }
                }
            },
            new {
                key = "location",
                text = "Where are you currently located?",
                type = "radio",
                options = new[] { 
                    new { value = "inside", label = "Inside the United States" },
                    new { value = "outside", label = "Outside the United States" }
                }
            },
            new {
                key = "education_level",
                text = "What is your highest level of education?",
                type = "select",
                options = new[] { 
                    new { value = "high_school", label = "High School" },
                    new { value = "bachelor", label = "Bachelor's Degree" },
                    new { value = "master", label = "Master's Degree" },
                    new { value = "doctorate", label = "Doctorate / PhD" }
                }
            },
            new {
                key = "employment_status",
                text = "What is your current employment status?",
                type = "select",
                options = new[] { 
                    new { value = "employed_full", label = "Employed Full-Time" },
                    new { value = "self_employed", label = "Business Owner" },
                    new { value = "student", label = "Student" },
                    new { value = "unemployed", label = "Not Employed" }
                }
            }
        };

        return Ok(questions);
    }
}
