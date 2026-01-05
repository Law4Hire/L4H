using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using System.Security.Claims;
using System.Text.Json;

namespace L4H.Api.Controllers;

[ApiController]
[Route("api/v1/admin/interview-questions")]
[Authorize(Policy = "IsAdmin")]
[Tags("Admin")]
public class AdminInterviewQuestionsController : ControllerBase
{
    private readonly L4HDbContext _context;

    public AdminInterviewQuestionsController(L4HDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get all interview questions with their options
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(InterviewQuestionResponse[]), StatusCodes.Status200OK)]
    public async Task<ActionResult<InterviewQuestionResponse[]>> GetAllQuestions()
    {
        var questions = await _context.InterviewQuestions
            .Include(q => q.Options.OrderBy(o => o.DisplayOrder))
            .Include(q => q.CreatedByUser)
            .Include(q => q.UpdatedByUser)
            .OrderBy(q => q.DisplayOrder)
            .ToListAsync().ConfigureAwait(false);

        var response = questions.Select(q => MapToResponse(q)).ToArray();

        await LogAuditAsync("admin", "interview_questions_view", "InterviewQuestion", "multiple",
            new { questionCount = questions.Count }).ConfigureAwait(false);

        return Ok(response);
    }

    /// <summary>
    /// Get a single interview question by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(InterviewQuestionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InterviewQuestionResponse>> GetQuestion(Guid id)
    {
        var question = await _context.InterviewQuestions
            .Include(q => q.Options.OrderBy(o => o.DisplayOrder))
            .Include(q => q.CreatedByUser)
            .Include(q => q.UpdatedByUser)
            .FirstOrDefaultAsync(q => q.Id == id).ConfigureAwait(false);

        if (question == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Question not found",
                Detail = $"Interview question with ID {id} was not found",
                Status = StatusCodes.Status404NotFound
            });
        }

        return Ok(MapToResponse(question));
    }

    /// <summary>
    /// Create a new interview question
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(InterviewQuestionResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<InterviewQuestionResponse>> CreateQuestion([FromBody] CreateQuestionRequest request)
    {
        var userId = GetCurrentUserId();

        // Check if key already exists
        var exists = await _context.InterviewQuestions
            .AnyAsync(q => q.Key == request.Key).ConfigureAwait(false);

        if (exists)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Duplicate question key",
                Detail = $"A question with key '{request.Key}' already exists",
                Status = StatusCodes.Status400BadRequest
            });
        }

        var question = new InterviewQuestionEntity
        {
            Key = request.Key,
            Text = request.Text,
            Category = request.Category,
            InputType = request.InputType,
            DisplayOrder = request.DisplayOrder,
            IsRequired = request.IsRequired,
            IsActive = request.IsActive,
            Description = request.Description,
            DiscriminatesVisaCodes = request.DiscriminatesVisaCodes,
            SelectionWeight = request.SelectionWeight,
            PageConfig = request.PageConfig,
            ParentId = request.ParentId,
            ParentOptionValue = request.ParentOptionValue,
            CreatedByUserId = userId,
            UpdatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.InterviewQuestions.Add(question);

        // Add options
        if (request.Options != null)
        {
            foreach (var optionRequest in request.Options)
            {
                var option = new QuestionOptionEntity
                {
                    QuestionId = question.Id,
                    Value = optionRequest.Value,
                    Label = optionRequest.Label,
                    DisplayOrder = optionRequest.DisplayOrder,
                    IsActive = optionRequest.IsActive,
                    Icon = optionRequest.Icon,
                    Description = optionRequest.Description,
                    ActionType = optionRequest.ActionType,
                    TargetQuestionId = optionRequest.TargetQuestionId,
                    TargetPagePath = optionRequest.TargetPagePath,
                    QualifiedVisaCodes = optionRequest.QualifiedVisaCodes,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.QuestionOptions.Add(option);
            }
        }

        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Reload with relationships
        await _context.Entry(question)
            .Collection(q => q.Options)
            .LoadAsync().ConfigureAwait(false);
        await _context.Entry(question)
            .Reference(q => q.CreatedByUser)
            .LoadAsync().ConfigureAwait(false);

        await LogAuditAsync("admin", "interview_question_create", "InterviewQuestion", question.Id.ToString(),
            new { questionKey = question.Key, questionText = question.Text }).ConfigureAwait(false);

        return CreatedAtAction(nameof(GetQuestion), new { id = question.Id }, MapToResponse(question));
    }

    /// <summary>
    /// Update an existing interview question
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(InterviewQuestionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<InterviewQuestionResponse>> UpdateQuestion(Guid id, [FromBody] UpdateQuestionRequest request)
    {
        var userId = GetCurrentUserId();

        var question = await _context.InterviewQuestions
            .Include(q => q.Options)
            .FirstOrDefaultAsync(q => q.Id == id).ConfigureAwait(false);

        if (question == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Question not found",
                Detail = $"Interview question with ID {id} was not found",
                Status = StatusCodes.Status404NotFound
            });
        }

        // Check if key is being changed and if new key already exists
        if (question.Key != request.Key)
        {
            var keyExists = await _context.InterviewQuestions
                .AnyAsync(q => q.Key == request.Key && q.Id != id).ConfigureAwait(false);

            if (keyExists)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Duplicate question key",
                    Detail = $"A question with key '{request.Key}' already exists",
                    Status = StatusCodes.Status400BadRequest
                });
            }
        }

        // Update properties
        question.Key = request.Key;
        question.Text = request.Text;
        question.Category = request.Category;
        question.InputType = request.InputType;
        question.DisplayOrder = request.DisplayOrder;
        question.IsRequired = request.IsRequired;
        question.IsActive = request.IsActive;
        question.Description = request.Description;
        question.DiscriminatesVisaCodes = request.DiscriminatesVisaCodes;
        question.SelectionWeight = request.SelectionWeight;
        question.PageConfig = request.PageConfig;
        question.ParentId = request.ParentId;
        question.ParentOptionValue = request.ParentOptionValue;
        question.UpdatedByUserId = userId;
        question.UpdatedAt = DateTime.UtcNow;

        // Update options if provided
        if (request.Options != null)
        {
            // Remove old options not in the new list
            var newOptionIds = request.Options
                .Where(o => o.Id.HasValue)
                .Select(o => o.Id!.Value)
                .ToHashSet();

            var optionsToRemove = question.Options
                .Where(o => !newOptionIds.Contains(o.Id))
                .ToList();

            foreach (var optionToRemove in optionsToRemove)
            {
                _context.QuestionOptions.Remove(optionToRemove);
            }

            // Update existing and add new options
            foreach (var optionRequest in request.Options)
            {
                if (optionRequest.Id.HasValue)
                {
                    // Update existing option
                    var existingOption = question.Options.FirstOrDefault(o => o.Id == optionRequest.Id.Value);
                    if (existingOption != null)
                    {
                        existingOption.Value = optionRequest.Value;
                        existingOption.Label = optionRequest.Label;
                        existingOption.DisplayOrder = optionRequest.DisplayOrder;
                        existingOption.IsActive = optionRequest.IsActive;
                        existingOption.Icon = optionRequest.Icon;
                        existingOption.Description = optionRequest.Description;
                        existingOption.ActionType = optionRequest.ActionType;
                        existingOption.TargetQuestionId = optionRequest.TargetQuestionId;
                        existingOption.TargetPagePath = optionRequest.TargetPagePath;
                        existingOption.QualifiedVisaCodes = optionRequest.QualifiedVisaCodes;
                        existingOption.UpdatedAt = DateTime.UtcNow;
                    }
                }
                else
                {
                    // Add new option
                    var newOption = new QuestionOptionEntity
                    {
                        QuestionId = question.Id,
                        Value = optionRequest.Value,
                        Label = optionRequest.Label,
                        DisplayOrder = optionRequest.DisplayOrder,
                        IsActive = optionRequest.IsActive,
                        Icon = optionRequest.Icon,
                        Description = optionRequest.Description,
                        ActionType = optionRequest.ActionType,
                        TargetQuestionId = optionRequest.TargetQuestionId,
                        TargetPagePath = optionRequest.TargetPagePath,
                        QualifiedVisaCodes = optionRequest.QualifiedVisaCodes,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.QuestionOptions.Add(newOption);
                }
            }
        }

        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Reload relationships
        await _context.Entry(question)
            .Collection(q => q.Options)
            .LoadAsync().ConfigureAwait(false);
        await _context.Entry(question)
            .Reference(q => q.UpdatedByUser)
            .LoadAsync().ConfigureAwait(false);

        await LogAuditAsync("admin", "interview_question_update", "InterviewQuestion", id.ToString(),
            new { questionKey = question.Key, changes = request }).ConfigureAwait(false);

        return Ok(MapToResponse(question));
    }

    /// <summary>
    /// Delete an interview question
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MessageResponse>> DeleteQuestion(Guid id)
    {
        var question = await _context.InterviewQuestions
            .FirstOrDefaultAsync(q => q.Id == id).ConfigureAwait(false);

        if (question == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Question not found",
                Detail = $"Interview question with ID {id} was not found",
                Status = StatusCodes.Status404NotFound
            });
        }

        var questionKey = question.Key;
        _context.InterviewQuestions.Remove(question);
        await _context.SaveChangesAsync().ConfigureAwait(false);

        await LogAuditAsync("admin", "interview_question_delete", "InterviewQuestion", id.ToString(),
            new { questionKey }).ConfigureAwait(false);

        return Ok(new MessageResponse
        {
            Message = $"Interview question '{questionKey}' deleted successfully"
        });
    }

    /// <summary>
    /// Reorder interview questions
    /// </summary>
    [HttpPatch("reorder")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MessageResponse>> ReorderQuestions([FromBody] ReorderQuestionsRequest request)
    {
        var userId = GetCurrentUserId();

        var questionIds = request.Questions.Select(q => q.QuestionId).ToArray();
        var questions = await _context.InterviewQuestions
            .Where(q => questionIds.Contains(q.Id))
            .ToListAsync().ConfigureAwait(false);

        if (questions.Count != questionIds.Length)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid question IDs",
                Detail = "One or more question IDs were not found",
                Status = StatusCodes.Status400BadRequest
            });
        }

        foreach (var orderUpdate in request.Questions)
        {
            var question = questions.First(q => q.Id == orderUpdate.QuestionId);
            question.DisplayOrder = orderUpdate.DisplayOrder;
            question.UpdatedByUserId = userId;
            question.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync().ConfigureAwait(false);

        await LogAuditAsync("admin", "interview_questions_reorder", "InterviewQuestion", "multiple",
            new { questionCount = questions.Count, updates = request.Questions }).ConfigureAwait(false);

        return Ok(new MessageResponse
        {
            Message = $"Successfully reordered {questions.Count} questions"
        });
    }

    private InterviewQuestionResponse MapToResponse(InterviewQuestionEntity question)
    {
        return new InterviewQuestionResponse
        {
            Id = question.Id,
            Key = question.Key,
            Text = question.Text,
            Category = question.Category,
            InputType = question.InputType,
            DisplayOrder = question.DisplayOrder,
            IsRequired = question.IsRequired,
            IsActive = question.IsActive,
            Description = question.Description,
            DiscriminatesVisaCodes = question.DiscriminatesVisaCodes,
            SelectionWeight = question.SelectionWeight,
            ParentId = question.ParentId,
            ParentOptionValue = question.ParentOptionValue,
            PageConfig = question.PageConfig,
            CreatedAt = question.CreatedAt,
            UpdatedAt = question.UpdatedAt,
            CreatedByUserEmail = question.CreatedByUser?.Email,
            UpdatedByUserEmail = question.UpdatedByUser?.Email,
            Options = question.Options.Select(o => new QuestionOptionResponse
            {
                Id = o.Id,
                Value = o.Value,
                Label = o.Label,
                DisplayOrder = o.DisplayOrder,
                IsActive = o.IsActive,
                Icon = o.Icon,
                Description = o.Description,
                ActionType = o.ActionType,
                TargetQuestionId = o.TargetQuestionId,
                TargetPagePath = o.TargetPagePath,
                QualifiedVisaCodes = o.QualifiedVisaCodes
            }).ToArray()
        };
    }

    private UserId? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (userIdClaim != null && Guid.TryParse(userIdClaim, out var guid))
        {
            return new UserId(guid);
        }
        return null;
    }

    private async Task LogAuditAsync(string category, string action, string targetType, string targetId, object details)
    {
        var userId = GetCurrentUserId();
        var auditLog = new AuditLog
        {
            Category = category,
            ActorUserId = userId,
            Action = action,
            TargetType = targetType,
            TargetId = targetId,
            DetailsJson = JsonSerializer.Serialize(details),
            CreatedAt = DateTime.UtcNow
        };

        _context.AuditLogs.Add(auditLog);
        await _context.SaveChangesAsync().ConfigureAwait(false);
    }
}

// DTOs
public record InterviewQuestionResponse
{
    public Guid Id { get; init; }
    public string Key { get; init; } = string.Empty;
    public string Text { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public string InputType { get; init; } = string.Empty;
    public int DisplayOrder { get; init; }
    public bool IsRequired { get; init; }
    public bool IsActive { get; init; }
    public string? Description { get; init; }
    public string? DiscriminatesVisaCodes { get; init; }
    public int SelectionWeight { get; init; }
    public Guid? ParentId { get; init; }
    public string? ParentOptionValue { get; init; }
    public string? PageConfig { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
    public string? CreatedByUserEmail { get; init; }
    public string? UpdatedByUserEmail { get; init; }
    public QuestionOptionResponse[] Options { get; init; } = Array.Empty<QuestionOptionResponse>();
}

public record QuestionOptionResponse
{
    public Guid Id { get; init; }
    public string Value { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public int DisplayOrder { get; init; }
    public bool IsActive { get; init; }
    public string? Icon { get; init; }
    public string? Description { get; init; }
    public string? ActionType { get; init; }
    public Guid? TargetQuestionId { get; init; }
    public string? TargetPagePath { get; init; }
    public string? QualifiedVisaCodes { get; init; }
}

public record CreateQuestionRequest
{
    public string Key { get; init; } = string.Empty;
    public string Text { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public string InputType { get; init; } = "select";
    public int DisplayOrder { get; init; }
    public bool IsRequired { get; init; } = true;
    public bool IsActive { get; init; } = true;
    public string? Description { get; init; }
    public string? DiscriminatesVisaCodes { get; init; }
    public int SelectionWeight { get; init; } = 50;
    public string? PageConfig { get; init; }
    public Guid? ParentId { get; init; }
    public string? ParentOptionValue { get; init; }
    public CreateOptionRequest[]? Options { get; init; }
}

public record CreateOptionRequest
{
    public string Value { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public int DisplayOrder { get; init; }
    public bool IsActive { get; init; } = true;
    public string? Icon { get; init; }
    public string? Description { get; init; }
    public string? ActionType { get; init; }
    public Guid? TargetQuestionId { get; init; }
    public string? TargetPagePath { get; init; }
    public string? QualifiedVisaCodes { get; init; }
}

public record UpdateQuestionRequest
{
    public string Key { get; init; } = string.Empty;
    public string Text { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public string InputType { get; init; } = string.Empty;
    public int DisplayOrder { get; init; }
    public bool IsRequired { get; init; }
    public bool IsActive { get; init; }
    public string? Description { get; init; }
    public string? DiscriminatesVisaCodes { get; init; }
    public int SelectionWeight { get; init; }
    public string? PageConfig { get; init; }
    public Guid? ParentId { get; init; }
    public string? ParentOptionValue { get; init; }
    public UpdateOptionRequest[]? Options { get; init; }
}

public record UpdateOptionRequest
{
    public Guid? Id { get; init; } // Null for new options
    public string Value { get; init; } = string.Empty;
    public string Label { get; init; } = string.Empty;
    public int DisplayOrder { get; init; }
    public bool IsActive { get; init; }
    public string? Icon { get; init; }
    public string? Description { get; init; }
    public string? ActionType { get; init; }
    public Guid? TargetQuestionId { get; init; }
    public string? TargetPagePath { get; init; }
    public string? QualifiedVisaCodes { get; init; }
}

public record ReorderQuestionsRequest
{
    public QuestionOrderUpdate[] Questions { get; init; } = Array.Empty<QuestionOrderUpdate>();
}

public record QuestionOrderUpdate
{
    public Guid QuestionId { get; init; }
    public int DisplayOrder { get; init; }
}
