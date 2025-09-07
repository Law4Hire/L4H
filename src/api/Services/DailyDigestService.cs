using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace L4H.Api.Services;

public class DailyDigestService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DailyDigestService> _logger;
    private readonly TimeSpan _processInterval = TimeSpan.FromMinutes(30); // Check every 30 minutes
    private readonly TimeSpan _digestInterval = TimeSpan.FromHours(24); // Send daily

    public DailyDigestService(
        IServiceScopeFactory scopeFactory,
        ILogger<DailyDigestService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Daily digest service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessDigestQueues(stoppingToken).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in daily digest service");
            }

            await Task.Delay(_processInterval, stoppingToken).ConfigureAwait(false);
        }

        _logger.LogInformation("Daily digest service stopped");
    }

    public async Task ProcessDailyDigests(CancellationToken cancellationToken = default)
    {
        await ProcessDigestQueues(cancellationToken).ConfigureAwait(false);
    }

    public async Task CreateDigestQueuesFromRecentMessages(CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = (L4HDbContext)scope.ServiceProvider.GetService(typeof(L4HDbContext))!;
        await CreateDigestQueuesFromMessages(context, cancellationToken).ConfigureAwait(false);
    }

    private async Task ProcessDigestQueues(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = (L4HDbContext)scope.ServiceProvider.GetService(typeof(L4HDbContext))!;

        // First, create digest queues from recent messages if they don't exist
        await CreateDigestQueuesFromMessages(context, cancellationToken).ConfigureAwait(false);

        // Get digest queues that need processing
        var cutoffTime = DateTime.UtcNow.Subtract(_digestInterval);
        
        var pendingDigests = await context.DailyDigestQueues
            .Include(d => d.User)
            .Where(d => !string.IsNullOrEmpty(d.ItemsJson) && 
                       d.ItemsJson != "[]" &&
                       (d.LastSentAt == null || d.LastSentAt < cutoffTime))
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        _logger.LogInformation("Found {Count} digest queues to process", pendingDigests.Count);

        foreach (var digestQueue in pendingDigests)
        {
            if (cancellationToken.IsCancellationRequested)
                break;

            try
            {
                await ProcessDigestQueue(digestQueue, context).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process digest queue for user {UserId}", digestQueue.UserId.Value);
            }
        }

        if (pendingDigests.Any())
        {
            await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }
    }

    private async Task CreateDigestQueuesFromMessages(L4HDbContext context, CancellationToken cancellationToken)
    {
        // Find messages from yesterday that haven't been processed into digest queues
        var yesterday = DateTime.UtcNow.Date.AddDays(-1);
        var today = DateTime.UtcNow.Date;
        
        var recentMessages = await context.Messages
            .Include(m => m.Thread)
                .ThenInclude(t => t.Case)
            .Include(m => m.Sender)
            .Where(m => m.SentAt >= yesterday && m.SentAt < today)
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        if (!recentMessages.Any())
        {
            _logger.LogDebug("No recent messages found for digest creation");
            return;
        }

        // Group messages by recipient (users who should receive digests)
        var messagesByRecipient = new Dictionary<Guid, List<Message>>();
        
        foreach (var message in recentMessages)
        {
            if (message.Thread?.CaseId == null) continue;
            
            // Get all users associated with this case (excluding the sender)
            var caseUsers = await context.Cases
                .Where(c => c.Id == message.Thread.CaseId)
                .Select(c => c.UserId.Value)
                .Distinct()
                .ToListAsync(cancellationToken).ConfigureAwait(false);

            foreach (var userId in caseUsers)
            {
                if (userId != message.SenderUserId.Value) // Don't send digest to sender
                {
                    if (!messagesByRecipient.ContainsKey(userId))
                        messagesByRecipient[userId] = new List<Message>();
                    
                    messagesByRecipient[userId].Add(message);
                }
            }
        }

        // Create digest queues for each recipient
        foreach (var (userId, messages) in messagesByRecipient)
        {
            // Check if digest queue already exists
            var existingQueue = await context.DailyDigestQueues
                .FirstOrDefaultAsync(d => d.UserId == new UserId(userId), cancellationToken).ConfigureAwait(false);

            if (existingQueue != null && !string.IsNullOrEmpty(existingQueue.ItemsJson) && existingQueue.ItemsJson != "[]")
            {
                continue; // Already has pending digest items
            }

            // Create digest items from messages
            var digestItems = messages.Select(m => new
            {
                messageId = m.Id,
                threadId = m.ThreadId,
                caseId = m.Thread?.CaseId.Value,
                threadSubject = m.Thread?.Subject ?? "Unknown Thread",
                senderName = m.Sender?.Email ?? "System",
                body = m.Body.Length > 100 ? m.Body.Substring(0, 100) + "..." : m.Body,
                sentAt = m.SentAt,
                channel = m.Channel
            }).ToList();

            if (existingQueue == null)
            {
                existingQueue = new DailyDigestQueue
                {
                    UserId = new UserId(userId),
                    ItemsJson = JsonSerializer.Serialize(digestItems)
                };
                context.DailyDigestQueues.Add(existingQueue);
            }
            else
            {
                existingQueue.ItemsJson = JsonSerializer.Serialize(digestItems);
            }

            _logger.LogInformation("Created digest queue for user {UserId} with {Count} messages", userId, digestItems.Count);
        }

        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private async Task ProcessDigestQueue(DailyDigestQueue digestQueue, L4HDbContext context)
    {
        _logger.LogInformation("Processing daily digest for user {UserId}", digestQueue.UserId.Value);

        // Parse digest items
        List<DigestItem> items = new();
        if (!string.IsNullOrEmpty(digestQueue.ItemsJson))
        {
            try
            {
                var rawItems = JsonSerializer.Deserialize<List<JsonElement>>(digestQueue.ItemsJson);
                if (rawItems != null)
                {
                    foreach (var rawItem in rawItems)
                    {
                        items.Add(new DigestItem
                        {
                            MessageId = rawItem.GetProperty("messageId").GetGuid(),
                            ThreadId = rawItem.GetProperty("threadId").GetGuid(),
                            CaseId = rawItem.GetProperty("caseId").GetGuid(),
                            SenderName = rawItem.TryGetProperty("senderName", out var sender) ? sender.GetString() ?? "Unknown" : "Unknown",
                            Body = rawItem.TryGetProperty("body", out var body) ? body.GetString() ?? "" : "",
                            SentAt = rawItem.TryGetProperty("sentAt", out var sentAt) ? sentAt.GetDateTime() : DateTime.UtcNow,
                            Channel = rawItem.TryGetProperty("channel", out var channel) ? channel.GetString() ?? "in_app" : "in_app"
                        });
                    }
                }
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Failed to parse digest items for user {UserId}", digestQueue.UserId.Value);
                return;
            }
        }

        if (!items.Any())
        {
            _logger.LogDebug("No digest items found for user {UserId}", digestQueue.UserId.Value);
            return;
        }

        // Group items by case for better organization
        var itemsByCase = items.GroupBy(i => i.CaseId).ToList();
        
        // Enrich with actual sender names from database
        var messageIds = items.Select(i => i.MessageId).ToList();
        var messages = await context.Messages
            .Include(m => m.Sender)
            .Where(m => messageIds.Contains(m.Id))
            .ToDictionaryAsync(m => m.Id, m => m).ConfigureAwait(false);

        foreach (var item in items)
        {
            if (messages.TryGetValue(item.MessageId, out var message))
            {
                item.SenderName = message.Sender?.Email ?? "System";
            }
        }

        // Generate digest content
        var digestContent = GenerateDigestContent(digestQueue.User, itemsByCase.ToList(), items);

        // TODO: Send email digest (stubbed for now)
        await SendDigestEmail(digestQueue.User, digestContent, items.Count).ConfigureAwait(false);

        // Log audit event
        LogDigestAudit(context, digestQueue.UserId, items.Count, itemsByCase.Count);

        // Update digest queue
        digestQueue.ItemsJson = "[]"; // Clear processed items
        digestQueue.LastSentAt = DateTime.UtcNow;

        _logger.LogInformation("Processed daily digest for user {UserId}: {ItemCount} items from {CaseCount} cases",
            digestQueue.UserId.Value, items.Count, itemsByCase.Count);
    }

    private static string GenerateDigestContent(User user, List<IGrouping<Guid, DigestItem>> itemsByCase, List<DigestItem> allItems)
    {
        var content = $"Daily Legal Case Updates for {user.Email}\n\n";
        content += $"You have {allItems.Count} new messages from {itemsByCase.Count} case(s).\n\n";

        foreach (var caseGroup in itemsByCase)
        {
            content += $"Case {caseGroup.Key}:\n";
            
            foreach (var item in caseGroup.OrderBy(i => i.SentAt))
            {
                content += $"  • {item.SenderName} ({item.SentAt:MMM dd, HH:mm}): {item.Body}\n";
            }
            
            content += "\n";
        }

        content += "Log in to your account to view full messages and respond.\n";
        content += "https://law4hire.com/cases\n\n";
        content += "---\nThis is an automated daily digest. To unsubscribe, visit your account settings.";

        return content;
    }

    private async Task SendDigestEmail(User user, string content, int itemCount)
    {
        // TODO: Implement actual email sending
        // For now, just log what would be sent
        _logger.LogInformation("STUB: Would send daily digest email to {Email} with {ItemCount} items", 
            user.Email, itemCount);
        
        _logger.LogDebug("STUB: Email content would be:\n{Content}", content);

        // Simulate email sending delay
        await Task.Delay(100).ConfigureAwait(false);
    }

    private static void LogDigestAudit(L4HDbContext context, UserId userId, int itemCount, int caseCount)
    {
        var auditLog = new AuditLog
        {
            Category = "messages",
            ActorUserId = null, // System action
            Action = "daily_digest_sent",
            TargetType = "DailyDigestQueue",
            TargetId = userId.Value.ToString(),
            DetailsJson = JsonSerializer.Serialize(new 
            { 
                userId = userId.Value, 
                itemCount, 
                caseCount, 
                sentAt = DateTime.UtcNow 
            }),
            CreatedAt = DateTime.UtcNow
        };

        context.AuditLogs.Add(auditLog);
    }

    private class DigestItem
    {
        public Guid MessageId { get; set; }
        public Guid ThreadId { get; set; }
        public Guid CaseId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public DateTime SentAt { get; set; }
        public string Channel { get; set; } = string.Empty;
    }
}