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
            .Include(t => t.Messages.OrderByDescending(m => m.SentAt));

        if (isAdmin)
        {
            query = query.Where(t => t.RecipientUserId == null || t.RecipientUserId == userId);
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
        var threadType = request.TryGetProperty("threadType", out var typeProp) ? typeProp.GetString() ?? "general" : "general";

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
            if (caseEntity == null) return BadRequest("Case not found");
        }

        var thread = new MessageThread
        {
            CaseId = caseId,
            Subject = title,
            ThreadType = threadType,
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
        return Ok(new { threadId = thread.Id.ToString(), title = thread.Subject });
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
        var query = _context.MessageThreads
            .Include(t => t.Case)
            .Include(t => t.Messages.OrderByDescending(m => m.SentAt))
            .Where(t => t.ThreadType == channel);

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
        return Ok(message);
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

        return Ok(messages.Select(m => new {
            id = m.Id,
            body = m.Body,
            senderName = m.Sender?.FirstName ?? "System",
            sentAt = m.SentAt,
            isMine = m.SenderUserId == userId
        }));
    }

    [HttpGet("recipients")]
    public async Task<IActionResult> GetRecipients()
    {
        var userId = GetCurrentUserId();
        var isAdmin = IsAdmin();
        var query = _context.Users.AsNoTracking().Where(u => u.Id != userId);
        
        if (!isAdmin) query = query.Where(u => u.IsAdmin || u.IsStaff);

        var users = await query.ToListAsync();
        var result = users.Select(u => new { 
            id = u.Id.Value.ToString(), 
            label = string.IsNullOrEmpty(u.FirstName) ? u.Email : $"{u.FirstName} {u.LastName}",
            role = u.IsAdmin ? "Admin" : (u.IsStaff ? "Legal" : "Client")
        }).ToList();

        if (!isAdmin) result.Insert(0, new { id = "null", label = "General / All Admins", role = "Admin" });
        return Ok(result);
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
                participantName = t.Case?.User != null ? $"{t.Case.User.FirstName} {t.Case.User.LastName}" : "General Support",
                lastMessageSnippet = lastMsg?.Body ?? "No messages",
                lastMessageTime = t.LastMessageAt.ToString("O"),
                unreadCount = t.Messages.Count(m => !IsMessageRead(m, userId))
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
    private bool IsStaff() => IsAdmin() || User.IsInRole("LegalProfessional") || User.HasClaim("is_legal_professional", "true");
}
