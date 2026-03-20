using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;

namespace L4H.Infrastructure.Services.Interview;

/// <summary>
/// Manages interview session lifecycle including creation, retrieval, and conversion
/// </summary>
public class SessionManager : ISessionManager
{
    private readonly L4HDbContext _context;

    public SessionManager(L4HDbContext context)
    {
        _context = context;
    }

    public async Task<InterviewSession> CreateAnonymousSessionAsync()
    {
        var session = new InterviewSession
        {
            Id = Guid.NewGuid(),
            AnonymousToken = Guid.NewGuid(),
            Status = "active",
            StartedAt = DateTime.UtcNow
        };

        _context.InterviewSessions.Add(session);
        await _context.SaveChangesAsync();

        return session;
    }

    public async Task<InterviewSession> CreateAuthenticatedSessionAsync(CaseId caseId, UserId userId)
    {
        var session = new InterviewSession
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            UserId = userId,
            Status = "active",
            StartedAt = DateTime.UtcNow
        };

        _context.InterviewSessions.Add(session);
        await _context.SaveChangesAsync();

        return session;
    }

    public async Task<InterviewSession?> GetSessionByTokenAsync(Guid anonymousToken)
    {
        return await _context.InterviewSessions
            .Include(s => s.QAs)
            .Include(s => s.VisaEvaluations)
                .ThenInclude(ve => ve.VisaType)
            .FirstOrDefaultAsync(s =>
                (s.AnonymousToken == anonymousToken ||
                 (s.AnonymousToken == null && s.Id == anonymousToken)) &&
                s.Status != "abandoned");
    }

    public async Task<InterviewSession?> GetSessionByIdAsync(Guid sessionId)
    {
        return await _context.InterviewSessions
            .Include(s => s.QAs)
            .Include(s => s.VisaEvaluations)
                .ThenInclude(ve => ve.VisaType)
            .FirstOrDefaultAsync(s => s.Id == sessionId);
    }

    public async Task<InterviewSession> ConvertToAuthenticatedSessionAsync(
        Guid anonymousToken,
        UserId userId,
        CaseId caseId)
    {
        var session = await GetSessionByTokenAsync(anonymousToken);
        if (session == null)
        {
            throw new InvalidOperationException($"Session with token {anonymousToken} not found");
        }

        session.UserId = userId;
        session.CaseId = caseId;
        session.AnonymousToken = null; // Clear anonymous token after conversion
        session.User = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (session.User == null)
        {
            throw new InvalidOperationException(
                $"Interview session conversion failed because user {userId.Value} could not be loaded after signup.");
        }

        session.Case = await _context.Cases.FirstOrDefaultAsync(c => c.Id == caseId);
        if (session.Case == null)
        {
            throw new InvalidOperationException(
                $"Interview session conversion failed because case {caseId.Value} could not be loaded after signup.");
        }

        await _context.SaveChangesAsync();

        return session;
    }

    public async Task<InterviewQA> SaveAnswerAsync(
        Guid sessionId,
        string questionKey,
        string answer)
    {
        // Check if answer already exists for this question
        var existingQA = await _context.InterviewQAs
            .FirstOrDefaultAsync(qa =>
                qa.SessionId == sessionId &&
                qa.QuestionKey == questionKey);

        if (existingQA != null)
        {
            // Update existing answer
            existingQA.AnswerValue = answer;
            existingQA.AnsweredAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return existingQA;
        }

        // Get next step number
        var maxStep = await _context.InterviewQAs
            .Where(qa => qa.SessionId == sessionId)
            .MaxAsync(qa => (int?)qa.StepNumber) ?? 0;

        // Create new answer
        var qa = new InterviewQA
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            StepNumber = maxStep + 1,
            QuestionKey = questionKey,
            AnswerValue = answer,
            AnsweredAt = DateTime.UtcNow
        };

        _context.InterviewQAs.Add(qa);
        await _context.SaveChangesAsync();

        return qa;
    }

    public async Task<List<InterviewQA>> GetSessionAnswersAsync(Guid sessionId)
    {
        return await _context.InterviewQAs
            .Where(qa => qa.SessionId == sessionId)
            .OrderBy(qa => qa.AnsweredAt)
            .ToListAsync();
    }

    public async Task CompleteSessionAsync(
        Guid sessionId,
        List<VisaEvaluation> evaluations)
    {
        var session = await GetSessionByIdAsync(sessionId);
        if (session == null)
        {
            throw new InvalidOperationException($"Session {sessionId} not found");
        }

        // Update session status
        session.Status = "completed";
        session.FinishedAt = DateTime.UtcNow;

        // Remove any existing evaluations (in case of re-evaluation)
        var existingEvaluations = await _context.VisaEvaluations
            .Where(ve => ve.SessionId == sessionId)
            .ToListAsync();

        if (existingEvaluations.Count > 0)
        {
            _context.VisaEvaluations.RemoveRange(existingEvaluations);
        }

        // Add new evaluations
        foreach (var evaluation in evaluations)
        {
            evaluation.SessionId = sessionId;
            evaluation.CreatedAt = DateTime.UtcNow;
            _context.VisaEvaluations.Add(evaluation);
        }

        await _context.SaveChangesAsync();
    }

    public async Task SelectVisaAsync(Guid sessionId, int visaTypeId)
    {
        var evaluation = await _context.VisaEvaluations
            .FirstOrDefaultAsync(ve =>
                ve.SessionId == sessionId &&
                ve.VisaTypeId == visaTypeId);

        if (evaluation == null)
        {
            throw new InvalidOperationException(
                $"Visa evaluation not found for session {sessionId} and visa {visaTypeId}");
        }

        // Clear all other selections for this session
        var otherEvaluations = await _context.VisaEvaluations
            .Where(ve => ve.SessionId == sessionId && ve.VisaTypeId != visaTypeId)
            .ToListAsync();

        foreach (var other in otherEvaluations)
        {
            other.IsUserSelected = false;
            other.UserSelectedAt = null;
        }

        // Mark this visa as selected
        evaluation.IsUserSelected = true;
        evaluation.UserSelectedAt = DateTime.UtcNow;
        evaluation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    public async Task LockVisaAsync(
        Guid sessionId,
        int visaTypeId,
        UserId lockedByUserId,
        string reason)
    {
        var evaluation = await _context.VisaEvaluations
            .FirstOrDefaultAsync(ve =>
                ve.SessionId == sessionId &&
                ve.VisaTypeId == visaTypeId);

        if (evaluation == null)
        {
            throw new InvalidOperationException(
                $"Visa evaluation not found for session {sessionId} and visa {visaTypeId}");
        }

        if (evaluation.IsAttorneyLocked)
        {
            throw new InvalidOperationException(
                $"Visa {visaTypeId} is already locked for session {sessionId}");
        }

        evaluation.IsAttorneyLocked = true;
        evaluation.LockedByUserId = lockedByUserId;
        evaluation.LockedAt = DateTime.UtcNow;
        evaluation.LockReason = reason;
        evaluation.UpdatedAt = DateTime.UtcNow;

        // Auto-select the locked visa if not already selected
        if (!evaluation.IsUserSelected)
        {
            // Clear other selections
            var otherEvaluations = await _context.VisaEvaluations
                .Where(ve => ve.SessionId == sessionId && ve.VisaTypeId != visaTypeId)
                .ToListAsync();

            foreach (var other in otherEvaluations)
            {
                other.IsUserSelected = false;
                other.UserSelectedAt = null;
            }

            evaluation.IsUserSelected = true;
            evaluation.UserSelectedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    public async Task UnlockVisaAsync(
        Guid sessionId,
        int visaTypeId,
        string reason)
    {
        var evaluation = await _context.VisaEvaluations
            .FirstOrDefaultAsync(ve =>
                ve.SessionId == sessionId &&
                ve.VisaTypeId == visaTypeId);

        if (evaluation == null)
        {
            throw new InvalidOperationException(
                $"Visa evaluation not found for session {sessionId} and visa {visaTypeId}");
        }

        if (!evaluation.IsAttorneyLocked)
        {
            throw new InvalidOperationException(
                $"Visa {visaTypeId} is not locked for session {sessionId}");
        }

        evaluation.IsAttorneyLocked = false;
        evaluation.UnlockedAt = DateTime.UtcNow;
        evaluation.UnlockReason = reason;
        evaluation.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    public async Task CleanupAbandonedSessionsAsync(int hoursOld = 24)
    {
        var cutoffTime = DateTime.UtcNow.AddHours(-hoursOld);

        // Find anonymous sessions that are old and incomplete
        var abandonedSessions = await _context.InterviewSessions
            .Where(s =>
                s.AnonymousToken != null && // Only anonymous sessions
                s.Status == "active" &&
                s.StartedAt < cutoffTime)
            .ToListAsync();

        foreach (var session in abandonedSessions)
        {
            session.Status = "abandoned";
        }

        if (abandonedSessions.Count > 0)
        {
            await _context.SaveChangesAsync();
        }

        // Optionally, could delete very old abandoned sessions (e.g., 30+ days)
        var veryOldCutoff = DateTime.UtcNow.AddDays(-30);
        var sessionsToDelete = await _context.InterviewSessions
            .Where(s =>
                s.Status == "abandoned" &&
                s.StartedAt < veryOldCutoff)
            .ToListAsync();

        if (sessionsToDelete.Count > 0)
        {
            _context.InterviewSessions.RemoveRange(sessionsToDelete);
            await _context.SaveChangesAsync();
        }
    }
}
