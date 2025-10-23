using System.Text.Json.Serialization;
using L4H.Shared.Models;

namespace L4H.Api.Json;

/// <summary>
/// JSON serializer context for .NET 10 source generation.
/// This provides improved performance, reduced memory usage, and Native AOT compatibility.
/// </summary>
[JsonSourceGenerationOptions(
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    GenerationMode = JsonSourceGenerationMode.Default)]
// Auth DTOs
[JsonSerializable(typeof(SignupRequest))]
[JsonSerializable(typeof(LoginRequest))]
[JsonSerializable(typeof(ForgotPasswordRequest))]
[JsonSerializable(typeof(ResetPasswordRequest))]
[JsonSerializable(typeof(AuthResponse))]
[JsonSerializable(typeof(MessageResponse))]
[JsonSerializable(typeof(UpdateProfileRequest))]
// Common types
[JsonSerializable(typeof(UserId))]
[JsonSerializable(typeof(CaseId))]
[JsonSerializable(typeof(Result<string>))]
[JsonSerializable(typeof(Result<AuthResponse>))]
[JsonSerializable(typeof(Result<MessageResponse>))]
// Workflow DTOs
[JsonSerializable(typeof(CreateWorkflowRequest))]
[JsonSerializable(typeof(CreateWorkflowStepRequest))]
[JsonSerializable(typeof(CreateWorkflowDoctorRequest))]
[JsonSerializable(typeof(WorkflowCreateResponse))]
// Approved Doctor DTOs
[JsonSerializable(typeof(CreateApprovedDoctorRequest))]
[JsonSerializable(typeof(ApprovedDoctorResponse))]
[JsonSerializable(typeof(List<ApprovedDoctorResponse>))]
// Interview DTOs
[JsonSerializable(typeof(InterviewStartRequest))]
[JsonSerializable(typeof(InterviewStartResponse))]
[JsonSerializable(typeof(InterviewAnswerRequest))]
[JsonSerializable(typeof(InterviewAnswerResponse))]
[JsonSerializable(typeof(InterviewCompleteRequest))]
[JsonSerializable(typeof(InterviewCompleteResponse))]
[JsonSerializable(typeof(InterviewRerunRequest))]
[JsonSerializable(typeof(InterviewResetRequest))]
[JsonSerializable(typeof(InterviewLockRequest))]
[JsonSerializable(typeof(InterviewSessionSummary))]
[JsonSerializable(typeof(VisaRecommendationSummary))]
[JsonSerializable(typeof(InterviewNextQuestionRequest))]
[JsonSerializable(typeof(InterviewNextQuestionResponse))]
[JsonSerializable(typeof(InterviewQuestionDto))]
[JsonSerializable(typeof(InterviewOptionDto))]
[JsonSerializable(typeof(InterviewRecommendation))]
[JsonSerializable(typeof(List<InterviewSessionSummary>))]
[JsonSerializable(typeof(List<InterviewQuestionDto>))]
[JsonSerializable(typeof(List<InterviewOptionDto>))]
// Collections
[JsonSerializable(typeof(List<string>))]
[JsonSerializable(typeof(Dictionary<string, string>))]
[JsonSerializable(typeof(Dictionary<string, object>))]
// API responses
[JsonSerializable(typeof(ErrorResponse))]
[JsonSerializable(typeof(ValidationErrorResponse))]
public partial class ApiJsonContext : JsonSerializerContext
{
}

/// <summary>
/// Standard error response for API endpoints.
/// </summary>
public record ErrorResponse
{
    public string Error { get; init; } = string.Empty;
    public string? Details { get; init; }
    public int StatusCode { get; init; }
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
}

/// <summary>
/// Validation error response with field-level errors.
/// </summary>
public record ValidationErrorResponse
{
    public string Error { get; init; } = "Validation failed";
    public Dictionary<string, string[]> Errors { get; init; } = new();
    public int StatusCode { get; init; } = 400;
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
}
