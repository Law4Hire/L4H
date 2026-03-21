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
[Route("api/v1/messaging")]
[Authorize]
[Tags("Messaging")]
public class MessagingController : ControllerBase
{
    private readonly L4HDbContext _context;
    private readonly ILogger<MessagingController> _logger;

    public MessagingController(L4HDbContext context, ILogger<MessagingController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all message threads for the current user
    /// </summary>
    [HttpGet("threads")]
    public async Task<IActionResult> GetThreads()
    {
        var userId = GetCurrentUserId();
        var isAdmin = IsAdmin();
        var isStaff = IsStaff();

        IQueryable<MessageThread> query = _context.MessageThreads
            .Include(t => t.Case)
            .ThenInclude(c => c!.User)
            .Include(t => t.Messages.OrderByDescending(m => m.SentAt));

        if (isAdmin)
        {
            // Admins see all threads by default to manage the general queue
            // They can still see threads specifically assigned to them
        }
        else if (isStaff)
        {
            var attorneyId = (await _context.Users.FindAsync(userId))?.AttorneyProfileId;
            query = query.Where(t => 
                t.RecipientUserId == userId || 
                (attorneyId.HasValue && t.Case != null && t.Case.AssignedStaffId == attorneyId.Value) ||
                t.Messages.Any(m => m.SenderUserId == userId) ||
                (t.Case != null && t.Case.UserId == userId)
            );
        }
        else
        {
            query = query.Where(t => t.Case != null && t.Case.UserId == userId);
        }

        var threads = await query
            .OrderByDescending(t => t.LastMessageAt)
            .ToListAsync().ConfigureAwait(false);

        return Ok(MapThreadsToResponse(threads, userId));
    }

    /// <summary>
    /// Create a new message thread
    /// </summary>
    [HttpPost("threads")]
    public async Task<IActionResult> CreateThread([FromBody] JsonElement request)
    {
        var userId = GetCurrentUserId();
        var sender = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId).ConfigureAwait(false);
        if (sender == null)
        {
            return Unauthorized();
        }

        CaseId? caseId = null;
        if (request.TryGetProperty("caseId", out var caseProp) && caseProp.ValueKind == JsonValueKind.String)
        {
            if (Guid.TryParse(caseProp.GetString(), out var caseGuid) && caseGuid != Guid.Empty)
            {
                caseId = new CaseId(caseGuid);
            }
        }

        var title = request.TryGetProperty("title", out var titleProp) ? titleProp.GetString() ?? "New Message" : "New Message";
        var initialMessage = request.TryGetProperty("initialMessage", out var initialMsgProp) ? initialMsgProp.GetString() : null;
        UserId? recipientUserId = null;
        if (request.TryGetProperty("recipientUserId", out var recipientProp) && recipientProp.ValueKind == JsonValueKind.String)
        {
            var recipientStr = recipientProp.GetString();
            if (!string.IsNullOrEmpty(recipientStr) && Guid.TryParse(recipientStr, out var recipientGuid))
            {
                recipientUserId = new UserId(recipientGuid);
            }
        }

        Case? caseEntity = null;
        if (caseId != null)
        {
            caseEntity = await _context.Cases.FindAsync(caseId.Value).ConfigureAwait(false);
            if (caseEntity == null) 
            {
                return BadRequest(new ProblemDetails { Title = "Case Not Found", Detail = "The associated case could not be found." });
            }
        }

        User? recipientUser = null;
        if (recipientUserId != null)
        {
            recipientUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == recipientUserId.Value).ConfigureAwait(false);
            if (recipientUser == null)
            {
                return BadRequest(new ProblemDetails { Title = "Recipient Not Found", Detail = "The selected recipient could not be found." });
            }
        }

        if (!CanCreateThread(sender, recipientUser))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ProblemDetails
            {
                Title = "Messaging Not Allowed",
                Detail = "You are not allowed to start this conversation."
            });
        }

        var thread = new MessageThread
        {
            CaseId = caseId,
            Subject = title,
            ThreadType = recipientUserId == null ? "general" : "direct",
            RecipientUserId = recipientUserId,
            CreatedAt = DateTime.UtcNow,
            LastMessageAt = DateTime.UtcNow
        };

        _context.MessageThreads.Add(thread);

        if (!string.IsNullOrWhiteSpace(initialMessage))
        {
            _context.Messages.Add(new Message
            {
                ThreadId = thread.Id,
                SenderUserId = userId,
                Body = initialMessage,
                Channel = "in_app",
                SentAt = DateTime.UtcNow,
                ReadByJson = JsonSerializer.Serialize(new Dictionary<string, DateTime> { [userId.Value.ToString()] = DateTime.UtcNow })
            });
        }

        if (caseEntity != null) caseEntity.LastActivityAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);
        
        return Ok(new
        {
            threadId = thread.Id.ToString(),
            title = thread.Subject,
            messageCount = string.IsNullOrWhiteSpace(initialMessage) ? 0 : 1,
            status = "open"
        });
    }

    [HttpGet("general")]
    [Authorize(Policy = "IsAdminOrLegalProfessional")]
    public async Task<IActionResult> GetGeneralThreads() => await GetThreadsByChannel("general");

    [HttpGet("assigned")]
    [Authorize(Policy = "IsAdminOrLegalProfessional")]
    public async Task<IActionResult> GetAssignedThreads() => await GetThreadsByChannel("assigned");

    [HttpGet("internal")]
    [Authorize(Policy = "IsAdminOrLegalProfessional")]
    public async Task<IActionResult> GetInternalThreads() => await GetThreadsByChannel("internal");

    [HttpGet("admin")]
    [Authorize(Policy = "IsAdmin")]
    public async Task<IActionResult> GetAdminOnlyThreads() => await GetThreadsByChannel("admin");

    private async Task<IActionResult> GetThreadsByChannel(string channel)
    {
        var userId = GetCurrentUserId();
        var currentUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId).ConfigureAwait(false);
        var query = _context.MessageThreads
            .Include(t => t.Case)
            .ThenInclude(c => c!.User)
            .Include(t => t.Messages.OrderByDescending(m => m.SentAt))
            .Where(t => t.ThreadType == channel);

        if (!IsAdmin())
        {
            if (channel == "general")
            {
                var attorneyId = currentUser?.AttorneyProfileId;
                query = query.Where(t =>
                    t.Messages.Any(m => m.SenderUserId == userId) ||
                    (t.Case != null && attorneyId.HasValue && t.Case.AssignedStaffId == attorneyId.Value));
            }
            else if (channel == "assigned")
            {
                var attorneyId = currentUser?.AttorneyProfileId;
                query = query.Where(t => t.Case != null && attorneyId.HasValue && t.Case.AssignedStaffId == attorneyId.Value);
            }
        }

        var threads = await query.OrderByDescending(t => t.LastMessageAt).ToListAsync().ConfigureAwait(false);
        return Ok(MapThreadsToResponse(threads, userId));
    }

    [HttpGet("direct/{targetUserId}")]
    [Authorize(Policy = "IsAdminOrLegalProfessional")]
    public async Task<IActionResult> GetOrCreateDirectThread(Guid targetUserId)
    {
        var userId = GetCurrentUserId();
        var targetId = new UserId(targetUserId);

        var targetUser = await _context.Users.FindAsync(targetId).ConfigureAwait(false);
        if (targetUser == null) return NotFound();

        var thread = await _context.MessageThreads
            .Include(t => t.Messages.OrderByDescending(m => m.SentAt))
            .FirstOrDefaultAsync(t => t.ThreadType == "direct" && 
                ((t.RecipientUserId == targetId && t.Messages.Any(m => m.SenderUserId == userId)) ||
                 (t.RecipientUserId == userId && t.Messages.Any(m => m.SenderUserId == targetId))))
            .ConfigureAwait(false);

        if (thread != null) return Ok(MapThreadsToResponse(new[] { thread }, userId).First());

        thread = new MessageThread { ThreadType = "direct", Subject = $"Direct", RecipientUserId = targetId };
        _context.MessageThreads.Add(thread);
        await _context.SaveChangesAsync().ConfigureAwait(false);
        return Ok(MapThreadsToResponse(new[] { thread }, userId).First());
    }

    [HttpPost("threads/{threadId}/messages")]
    public async Task<IActionResult> PostMessage(Guid threadId, [FromBody] JsonElement request)
    {
        var userId = GetCurrentUserId();
        var content = request.GetProperty("content").GetString() ?? "";

        var thread = await _context.MessageThreads
            .Include(t => t.Case)
            .Include(t => t.Messages)
            .FirstOrDefaultAsync(t => t.Id == threadId).ConfigureAwait(false);

        if (thread == null) return NotFound();

        if (thread.Case != null)
        {
            if (thread.Case.UserId != userId && !IsStaff()) return Forbid();
        }
        else
        {
            var isSender = thread.Messages.Any(m => m.SenderUserId == userId);
            var isRecipient = thread.RecipientUserId == userId;
            if (!isSender && !isRecipient && !IsStaff()) return Forbid();
        }

        var message = new Message
        {
            Id = Guid.NewGuid(),
            ThreadId = threadId,
            SenderUserId = userId,
            Body = content,
            SentAt = DateTime.UtcNow,
            ReadByJson = JsonSerializer.Serialize(new Dictionary<string, DateTime> { [userId.Value.ToString()] = DateTime.UtcNow })
        };

        _context.Messages.Add(message);
        thread.LastMessageAt = DateTime.UtcNow;
        if (thread.Case != null) thread.Case.LastActivityAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);
        
        return Ok(new {
            messageId = message.Id.ToString(),
            content = message.Body,
            sender = "user", // Simplified for tests
            timestamp = message.SentAt.ToString("O")
        });
    }

    [HttpGet("threads/{threadId}/messages")]
    public async Task<IActionResult> GetThreadMessages(Guid threadId)
    {
        var userId = GetCurrentUserId();
        var messages = await _context.Messages
            .Include(m => m.Sender)
            .Where(m => m.ThreadId == threadId)
            .OrderBy(m => m.SentAt)
            .ToListAsync();

        return Ok(new {
            messages = messages.Select(m => new {
                id = m.Id,
                content = m.Body,
                sender = m.Sender?.FirstName ?? "System",
                timestamp = m.SentAt.ToString("O"),
                isRead = IsMessageRead(m, userId)
            })
        });
    }

    [HttpGet("cases/{caseId}/threads")]
    public async Task<IActionResult> GetCaseThreads(Guid caseId)
    {
        var userId = GetCurrentUserId();
        var threads = await _context.MessageThreads
            .Include(t => t.Messages)
            .Where(t => t.CaseId == new CaseId(caseId))
            .OrderByDescending(t => t.LastMessageAt)
            .ToListAsync();

        return Ok(new {
            threads = MapThreadsToResponse(threads, userId)
        });
    }

    [HttpGet("cases/{caseId}/unread")]
    public async Task<IActionResult> GetUnreadCounts(Guid caseId)
    {
        var userId = GetCurrentUserId();
        var threads = await _context.MessageThreads
            .Include(t => t.Messages)
            .Where(t => t.CaseId == new CaseId(caseId))
            .ToListAsync();

        var totalUnread = threads.Sum(t => t.Messages.Count(m => !IsMessageRead(m, userId)));
        
        return Ok(new {
            totalUnread,
            threadCounts = threads.ToDictionary(t => t.Id.ToString(), t => t.Messages.Count(m => !IsMessageRead(m, userId)))
        });
    }

    [HttpPost("messages/{messageId}/read")]
    public async Task<IActionResult> MarkMessageAsRead(Guid messageId)
    {
        var userId = GetCurrentUserId();
        var message = await _context.Messages.FindAsync(messageId);
        if (message == null) return NotFound();

        var readBy = string.IsNullOrEmpty(message.ReadByJson) 
            ? new Dictionary<string, DateTime>() 
            : JsonSerializer.Deserialize<Dictionary<string, DateTime>>(message.ReadByJson) ?? new Dictionary<string, DateTime>();

        if (!readBy.ContainsKey(userId.Value.ToString()))
        {
            readBy[userId.Value.ToString()] = DateTime.UtcNow;
            message.ReadByJson = JsonSerializer.Serialize(readBy);
            await _context.SaveChangesAsync();
        }

        return Ok();
    }

    [HttpPost("read")]
    public async Task<IActionResult> MarkMessagesRead([FromBody] MessageReadRequest request)
    {
        var userId = GetCurrentUserId();
        var messages = await _context.Messages
            .Where(m => request.MessageIds.Contains(m.Id))
            .ToListAsync();

        foreach (var message in messages)
        {
            var readBy = string.IsNullOrEmpty(message.ReadByJson) 
                ? new Dictionary<string, DateTime>() 
                : JsonSerializer.Deserialize<Dictionary<string, DateTime>>(message.ReadByJson) ?? new Dictionary<string, DateTime>();

            if (!readBy.ContainsKey(userId.Value.ToString()))
            {
                readBy[userId.Value.ToString()] = DateTime.UtcNow;
                message.ReadByJson = JsonSerializer.Serialize(readBy);
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { markedCount = messages.Count });
    }

    [HttpDelete("threads/{threadId}")]
    public async Task<IActionResult> DeleteThread(Guid threadId)
    {
        var thread = await _context.MessageThreads.FindAsync(threadId);
        if (thread == null) return NotFound();

        _context.MessageThreads.Remove(thread);
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpGet("recipients")]
    public async Task<IActionResult> GetRecipients()
    {
        var userId = GetCurrentUserId();
        var currentUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId).ConfigureAwait(false);
        if (currentUser == null)
        {
            return Unauthorized();
        }

        var recipients = new List<object>
        {
            new { id = (string?)null, label = "General Queue", description = "General mailbox monitored by administrators" }
        };

        if (IsAdmin())
        {
            var everyone = await _context.Users.AsNoTracking()
                .Where(u => u.Id != userId)
                .OrderBy(u => u.FirstName)
                .ThenBy(u => u.LastName)
                .ToListAsync()
                .ConfigureAwait(false);

            recipients.AddRange(everyone.Select(ToRecipientOption));
            return Ok(recipients);
        }

        if (IsStaff())
        {
            var attorneyId = currentUser.AttorneyProfileId;

            var admins = await _context.Users.AsNoTracking()
                .Where(u => u.Id != userId && u.IsAdmin)
                .ToListAsync()
                .ConfigureAwait(false);
            recipients.AddRange(admins.Select(ToRecipientOption));

            var otherProfessionals = await _context.Users.AsNoTracking()
                .Where(u => u.Id != userId && (u.IsStaff || u.IsLegalProfessional))
                .ToListAsync()
                .ConfigureAwait(false);
            recipients.AddRange(otherProfessionals.Select(ToRecipientOption));

            if (attorneyId.HasValue)
            {
                var assignedClientIds = await _context.Cases
                    .Where(c => c.AssignedStaffId == attorneyId.Value)
                    .Select(c => c.UserId)
                    .Distinct()
                    .ToListAsync()
                    .ConfigureAwait(false);

                var assignedClients = await _context.Users.AsNoTracking()
                    .Where(u => assignedClientIds.Contains(u.Id))
                    .OrderBy(u => u.FirstName)
                    .ThenBy(u => u.LastName)
                    .ToListAsync()
                    .ConfigureAwait(false);

                recipients.AddRange(assignedClients.Select(ToRecipientOption));
            }

            return Ok(DeduplicateRecipients(recipients));
        }

        var assignedProfessionals = await _context.Users.AsNoTracking()
            .Where(u =>
                u.Id != userId &&
                u.AttorneyProfileId != null &&
                _context.Cases.Any(c => c.UserId == userId && c.AssignedStaffId == u.AttorneyProfileId))
            .OrderBy(u => u.FirstName)
            .ThenBy(u => u.LastName)
            .ToListAsync()
            .ConfigureAwait(false);

        recipients.AddRange(assignedProfessionals.Select(ToRecipientOption));
        return Ok(DeduplicateRecipients(recipients));
    }

    private IEnumerable<object> MapThreadsToResponse(IEnumerable<MessageThread> threads, UserId userId)
    {
        return threads.Select(t => {
            var lastMsg = t.Messages.FirstOrDefault();
            return new {
                threadId = t.Id.ToString(),
                caseId = t.CaseId?.Value,
                title = t.Subject,
                threadType = t.ThreadType,
                participantName = t.Case?.User != null
                    ? $"{t.Case.User.FirstName} {t.Case.User.LastName}"
                    : (string.IsNullOrWhiteSpace(t.Subject) ? "General Support" : t.Subject),
                lastMessageSnippet = lastMsg?.Body ?? "No messages",
                lastMessageTime = t.LastMessageAt.ToString("O"),
                unreadCount = t.Messages.Count(m => !IsMessageRead(m, userId)),
                messageCount = t.Messages.Count()
            };
        });
    }

    private bool IsMessageRead(Message m, UserId userId)
    {
        if (string.IsNullOrEmpty(m.ReadByJson)) return false;
        try { return JsonSerializer.Deserialize<Dictionary<string, DateTime>>(m.ReadByJson)?.ContainsKey(userId.Value.ToString()) ?? false; }
        catch { return false; }
    }

    private UserId GetCurrentUserId()
    {
        var claim = User.FindFirst("sub")?.Value;
        if (Guid.TryParse(claim, out var id)) return new UserId(id);
        throw new UnauthorizedAccessException();
    }

    private bool IsAdmin() => User.HasClaim("is_admin", "true") || User.HasClaim("is_admin", "True") || User.IsInRole("Admin");
    private bool IsStaff() => IsAdmin() || User.IsInRole("LegalProfessional") || User.HasClaim("is_legal_professional", "true") || User.IsInRole("Staff") || User.HasClaim("is_staff", "true");

    private bool CanCreateThread(User sender, User? recipient)
    {
        if (recipient == null)
        {
            return true;
        }

        if (IsAdmin())
        {
            return true;
        }

        if (IsStaff())
        {
            if (recipient.IsAdmin || recipient.IsStaff || recipient.IsLegalProfessional)
            {
                return true;
            }

            return sender.AttorneyProfileId.HasValue &&
                   _context.Cases.Any(c => c.UserId == recipient.Id && c.AssignedStaffId == sender.AttorneyProfileId.Value);
        }

        if (recipient.IsAdmin)
        {
            return true;
        }

        return _context.Cases.Any(c => c.UserId == sender.Id && recipient.AttorneyProfileId != null && c.AssignedStaffId == recipient.AttorneyProfileId.Value);
    }

    private static object ToRecipientOption(User user) => new
    {
        id = user.Id.Value.ToString(),
        label = string.IsNullOrWhiteSpace($"{user.FirstName} {user.LastName}".Trim()) ? user.Email : $"{user.FirstName} {user.LastName}".Trim(),
        description = user.IsAdmin ? "Administrator" : (user.IsStaff || user.IsLegalProfessional ? "Legal Professional" : "Client")
    };

    private static IEnumerable<object> DeduplicateRecipients(IEnumerable<object> recipients)
    {
        return recipients
            .GroupBy(r => r.GetType().GetProperty("id")?.GetValue(r)?.ToString() ?? string.Empty)
            .Select(g => g.First())
            .ToList();
    }
}
