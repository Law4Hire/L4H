using L4H.Infrastructure.Entities;
using L4H.Shared.Models;

namespace L4H.Infrastructure.Services.Interview;

/// <summary>
/// Manages interview session lifecycle including creation, retrieval, and conversion
/// </summary>
public interface ISessionManager
{
    /// <summary>
    /// Creates a new anonymous interview session
    /// </summary>
    /// <returns>Session with anonymous token</returns>
    Task<InterviewSession> CreateAnonymousSessionAsync(string? languageCode = null);

    /// <summary>
    /// Gets an active session by anonymous token
    /// </summary>
    Task<InterviewSession?> GetSessionByTokenAsync(Guid anonymousToken);

    /// <summary>
    /// Gets an active session by ID
    /// </summary>
    Task<InterviewSession?> GetSessionByIdAsync(Guid sessionId);

    /// <summary>
    /// Converts an anonymous session to an authenticated session
    /// </summary>
    Task<InterviewSession> ConvertToAuthenticatedSessionAsync(
        Guid anonymousToken,
        UserId userId);

    /// <summary>
    /// Saves user's answer to the current session
    /// </summary>
    Task<InterviewQA> SaveAnswerAsync(
        Guid sessionId,
        string questionKey,
        string answer);

    /// <summary>
    /// Gets all answers for a session
    /// </summary>
    Task<List<InterviewQA>> GetSessionAnswersAsync(Guid sessionId);

    /// <summary>
    /// Completes a session and generates visa evaluations
    /// </summary>
    Task CompleteSessionAsync(
        Guid sessionId,
        List<VisaEvaluation> evaluations);

    /// <summary>
    /// Marks a visa as selected by the user
    /// </summary>
    Task SelectVisaAsync(
        Guid sessionId,
        int visaTypeId);

    /// <summary>
    /// Locks a visa for a session (attorney/professional action)
    /// </summary>
    Task LockVisaAsync(
        Guid sessionId,
        int visaTypeId,
        UserId lockedByUserId,
        string reason);

    /// <summary>
    /// Unlocks a previously locked visa
    /// </summary>
    Task UnlockVisaAsync(
        Guid sessionId,
        int visaTypeId,
        string reason);

    /// <summary>
    /// Cleans up abandoned anonymous sessions older than specified hours
    /// </summary>
    Task CleanupAbandonedSessionsAsync(int hoursOld = 24);
}
