using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace L4H.Infrastructure.Services;

public class RetentionService
{
    private readonly L4HDbContext _context;
    private readonly ILogger<RetentionService> _logger;
    private readonly IOptionsMonitor<RetentionSettings> _retentionOptions;

    public RetentionService(
        L4HDbContext context,
        ILogger<RetentionService> logger,
        IOptionsMonitor<RetentionSettings> retentionOptions)
    {
        _context = context;
        _logger = logger;
        _retentionOptions = retentionOptions;
    }

    public async Task ProcessRetentionQueueAsync(DateTime? currentTime = null)
    {
        var processingTime = currentTime ?? DateTime.UtcNow;
        var settings = _retentionOptions.CurrentValue;

        _logger.LogInformation("Starting retention processing at {ProcessingTime}", processingTime);

        var itemsProcessed = 0;

        // Process messages older than PII retention period
        await ProcessExpiredMessages(processingTime, settings.PiiDays).ConfigureAwait(false);
        itemsProcessed += await QueueExpiredItems<MessageThread>(
            "messages", 
            processingTime.AddDays(-settings.PiiDays),
            RetentionAction.Delete).ConfigureAwait(false);

        // Process recordings older than recordings retention period
        itemsProcessed += await QueueExpiredItems<InterviewSession>(
            "recordings",
            processingTime.AddDays(-settings.RecordingsDays),
            RetentionAction.Delete,
            session => session.FinishedAt.HasValue).ConfigureAwait(false);

        // Process medical documents (mask based on MIME type or name patterns)
        itemsProcessed += await QueueExpiredUploads(
            "medical",
            processingTime.AddDays(-settings.MedicalDays),
            RetentionAction.Mask,
            upload => IsMedicalDocument(upload)).ConfigureAwait(false);

        // Process high-sensitivity documents (delete completely)
        itemsProcessed += await QueueExpiredUploads(
            "high-sensitivity",
            processingTime.AddDays(-settings.HighSensitivityDays),
            RetentionAction.Delete,
            upload => IsHighSensitivityDocument(upload)).ConfigureAwait(false);

        _logger.LogInformation("Retention processing completed. {ItemCount} items processed", itemsProcessed);
    }

    public async Task ExecuteQueuedRetentionActionsAsync()
    {
        var queuedItems = await _context.RetentionQueues
            .Where(q => q.ProcessedAt == null)
            .OrderBy(q => q.EnqueuedAt)
            .ToListAsync().ConfigureAwait(false);

        foreach (var item in queuedItems)
        {
            try
            {
                await ExecuteRetentionAction(item).ConfigureAwait(false);
                item.ProcessedAt = DateTime.UtcNow;
                
                _logger.LogInformation("Retention action executed: {Action} on {TargetId}", 
                    item.Action, item.TargetId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to execute retention action {Action} on {TargetId}", 
                    item.Action, item.TargetId);
            }
        }

        await _context.SaveChangesAsync().ConfigureAwait(false);
    }

    private async Task ProcessExpiredMessages(DateTime processingTime, int piiDays)
    {
        var cutoffDate = processingTime.AddDays(-piiDays);
        
        var expiredMessages = await _context.MessageThreads
            .Where(m => m.CreatedAt < cutoffDate)
            .Select(m => m.Id)
            .ToListAsync().ConfigureAwait(false);

        foreach (var messageId in expiredMessages)
        {
            await QueueRetentionAction("messages", messageId.ToString(), RetentionAction.Delete).ConfigureAwait(false);
        }
    }

    private async Task<int> QueueExpiredItems<T>(
        string category, 
        DateTime cutoffDate, 
        RetentionAction action,
        Func<T, bool>? predicate = null) where T : class
    {
        var query = _context.Set<T>().AsQueryable();
        
        // Apply date filter based on entity type
        if (typeof(T) == typeof(MessageThread))
        {
            query = query.Where(e => EF.Property<DateTime>(e, "CreatedAt") < cutoffDate);
        }
        else if (typeof(T) == typeof(InterviewSession))
        {
            query = query.Where(e => EF.Property<DateTime?>(e, "FinishedAt") < cutoffDate);
        }

        var items = await query.ToListAsync().ConfigureAwait(false);
        
        if (predicate != null)
        {
            items = items.Where(predicate).ToList();
        }

        var count = 0;
        foreach (var item in items)
        {
            var id = GetEntityId(item);
            if (id != null && !await IsAlreadyQueued(category, id).ConfigureAwait(false))
            {
                await QueueRetentionAction(category, id, action).ConfigureAwait(false);
                count++;
            }
        }

        return count;
    }

    private async Task<int> QueueExpiredUploads(
        string category,
        DateTime cutoffDate,
        RetentionAction action,
        Func<Upload, bool> predicate)
    {
        var expiredUploads = await _context.Uploads
            .Where(u => u.CreatedAt < cutoffDate)
            .ToListAsync().ConfigureAwait(false);
            
        expiredUploads = expiredUploads.Where(predicate).ToList();

        var count = 0;
        foreach (var upload in expiredUploads)
        {
            if (!await IsAlreadyQueued(category, upload.Id.ToString()).ConfigureAwait(false))
            {
                await QueueRetentionAction(category, upload.Id.ToString(), action).ConfigureAwait(false);
                count++;
            }
        }

        return count;
    }

    private async Task<bool> IsAlreadyQueued(string category, string targetId)
    {
        return await _context.RetentionQueues
            .AnyAsync(q => q.Category == category && q.TargetId == targetId && q.ProcessedAt == null).ConfigureAwait(false);
    }

    private async Task QueueRetentionAction(string category, string targetId, RetentionAction action)
    {
        var queueItem = new RetentionQueue
        {
            Id = Guid.NewGuid(),
            Category = category,
            TargetId = targetId,
            Action = action,
            EnqueuedAt = DateTime.UtcNow,
            ProcessedAt = null
        };

        _context.RetentionQueues.Add(queueItem);
        await _context.SaveChangesAsync().ConfigureAwait(false);
    }

    private async Task ExecuteRetentionAction(RetentionQueue queueItem)
    {
        switch (queueItem.Category)
        {
            case "messages":
                await ExecuteMessageAction(queueItem).ConfigureAwait(false);
                break;
            case "recordings":
                await ExecuteRecordingAction(queueItem).ConfigureAwait(false);
                break;
            case "medical":
            case "high-sensitivity":
                await ExecuteUploadAction(queueItem).ConfigureAwait(false);
                break;
        }
    }

    private async Task ExecuteMessageAction(RetentionQueue queueItem)
    {
        if (Guid.TryParse(queueItem.TargetId, out var messageId))
        {
            var message = await _context.MessageThreads.FindAsync(messageId).ConfigureAwait(false);
            if (message != null && queueItem.Action == RetentionAction.Delete)
            {
                _context.MessageThreads.Remove(message);
                await _context.SaveChangesAsync().ConfigureAwait(false);
            }
        }
    }

    private async Task ExecuteRecordingAction(RetentionQueue queueItem)
    {
        if (Guid.TryParse(queueItem.TargetId, out var sessionId))
        {
            var session = await _context.InterviewSessions.FindAsync(sessionId).ConfigureAwait(false);
            if (session != null && queueItem.Action == RetentionAction.Delete)
            {
                // In a real implementation, you'd also delete the physical file
                _context.InterviewSessions.Remove(session);
                await _context.SaveChangesAsync().ConfigureAwait(false);
            }
        }
    }

    private async Task ExecuteUploadAction(RetentionQueue queueItem)
    {
        if (Guid.TryParse(queueItem.TargetId, out var uploadId))
        {
            var upload = await _context.Uploads.FindAsync(uploadId).ConfigureAwait(false);
            if (upload != null)
            {
                if (queueItem.Action == RetentionAction.Delete)
                {
                    // In a real implementation, you'd also delete the physical file
                    _context.Uploads.Remove(upload);
                }
                else if (queueItem.Action == RetentionAction.Mask)
                {
                    upload.OriginalName = "[REDACTED]";
                    upload.Key = "[REDACTED]";
                    upload.StorageUrl = null;
                }
                await _context.SaveChangesAsync().ConfigureAwait(false);
            }
        }
    }

    private static string? GetEntityId<T>(T entity)
    {
        return entity switch
        {
            MessageThread message => message.Id.ToString(),
            InterviewSession session => session.Id.ToString(),
            Upload upload => upload.Id.ToString(),
            _ => null
        };
    }
    
    private static bool IsMedicalDocument(Upload upload)
    {
        var medicalKeywords = new[] { "medical", "health", "doctor", "hospital", "prescription" };
        return medicalKeywords.Any(keyword => 
            upload.OriginalName.ToLowerInvariant().Contains(keyword));
    }
    
    private static bool IsHighSensitivityDocument(Upload upload)
    {
        var sensitiveKeywords = new[] { "ssn", "social", "passport", "license", "birth" };
        return sensitiveKeywords.Any(keyword => 
            upload.OriginalName.ToLowerInvariant().Contains(keyword));
    }
}