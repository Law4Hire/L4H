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
[Tags("Messages")]
public class MessagingController : ControllerBase
{
    private readonly L4HDbContext _context;
    private readonly ILogger<MessagingController> _logger;

    public MessagingController(
        L4HDbContext context,
        ILogger<MessagingController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Create a new message thread for a case
    /// </summary>
    /// <param name="request">Thread creation request</param>
    /// <returns>Created thread details</returns>
    [HttpPost("threads")]
    [ProducesResponseType<MessageThreadResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateThread([FromBody] JsonElement request)
    {
        var userId = GetCurrentUserId();

        // Parse optional caseId
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

        // Parse optional recipientUserId
        UserId? recipientUserId = null;
        if (request.TryGetProperty("recipientUserId", out var recipientProp) && recipientProp.ValueKind == JsonValueKind.String)
        {
            var recipientStr = recipientProp.GetString();
            if (!string.IsNullOrEmpty(recipientStr) && Guid.TryParse(recipientStr, out var recipientGuid))
            {
                recipientUserId = new UserId(recipientGuid);
            }
        }

        // If no caseId, but recipient is a client, try to find their case
        if (caseId == null && recipientUserId != null)
        {
            var recipientCase = await _context.Cases
                .Where(c => c.UserId == recipientUserId)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => c.Id)
                .FirstOrDefaultAsync().ConfigureAwait(false);
            
            if (recipientCase.Value != Guid.Empty)
            {
                caseId = recipientCase;
            }
        }

        // If STILL no caseId, we might need a default/fallback case or allow caseless threads.
        // For now, let's allow it to be linked to the SENDER'S first case if they have one.
        if (caseId == null)
        {
            var senderCase = await _context.Cases
                .Where(c => c.UserId == userId)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => c.Id)
                .FirstOrDefaultAsync().ConfigureAwait(false);
            
            if (senderCase.Value != Guid.Empty)
            {
                caseId = senderCase;
            }
        }

        /* 
        if (caseId == null)
        {
            return BadRequest(new ProblemDetails { Title = "Case Required", Detail = "A case must be associated with the thread." });
        }
        */

        // Fetch case entity to update last activity if present
        Case? caseEntity = null;
        if (caseId != null)
        {
            caseEntity = await _context.Cases.FindAsync(caseId.Value).ConfigureAwait(false);
            if (caseEntity == null)
            {
                return BadRequest(new ProblemDetails { Title = "Case Not Found", Detail = "The associated case could not be found." });
            }
        }

        var thread = new MessageThread
        {
            CaseId = caseId,
            Subject = title,
            RecipientUserId = recipientUserId,
            CreatedAt = DateTime.UtcNow,
            LastMessageAt = DateTime.UtcNow
        };

        _context.MessageThreads.Add(thread);

        // Create the initial message if provided
        Message? initialMessageEntity = null;
        if (!string.IsNullOrWhiteSpace(initialMessage))
        {
            initialMessageEntity = new Message
            {
                ThreadId = thread.Id,
                SenderUserId = userId,
                Body = initialMessage,
                Channel = "in_app",
                SentAt = DateTime.UtcNow,
                ReadByJson = JsonSerializer.Serialize(new Dictionary<string, DateTime>
                {
                    [userId.Value.ToString()] = DateTime.UtcNow // Sender auto-reads
                })
            };
            _context.Messages.Add(initialMessageEntity);
        }

        // Update case activity if present
        if (caseEntity != null)
        {
            caseEntity.LastActivityAt = DateTimeOffset.UtcNow;
        }

        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Log audit event
        LogAudit("messages", "create_thread", "MessageThread", thread.Id.ToString(),
            new { caseId = caseId?.Value, subject = title, hasInitialMessage = initialMessageEntity != null });

        // Return a JSON object that matches test expectations
        var response = new
        {
            threadId = thread.Id.ToString(),
            title = thread.Subject,
            messageCount = initialMessageEntity != null ? 1 : 0,
            status = "open"
        };

        return Ok(response);
    }

    /// <summary>
    /// Get message threads for a case
    /// </summary>
    /// <param name="caseId">Case ID to get threads for</param>
    /// <returns>List of message threads</returns>
    [HttpGet("cases/{caseId}/threads")]
    [ProducesResponseType<MessageThreadListResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCaseThreads(Guid caseId)
    {
        var userId = GetCurrentUserId();
        var caseIdTyped = new CaseId(caseId);

        // Verify case exists and user has access
        var caseEntity = await _context.Cases
            .FirstOrDefaultAsync(c => c.Id == caseIdTyped).ConfigureAwait(false);

        if (caseEntity == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Case Not Found",
                Detail = "Case not found."
            });
        }

        // Verify case ownership or staff access
        if (caseEntity.UserId != userId && !IsStaff())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = "Access denied to this message thread."
            });
        }

        // Filter threads based on visibility:
        // - Case owner sees all threads for their case
        // - Admins see "General" threads (RecipientUserId IS NULL) for all cases
        // - Specific staff see threads directed to them (RecipientUserId matches their ID)
        var isAdminClaim = User.FindFirst("is_admin")?.Value;
        var isAdmin = User.IsInRole("Admin") || (!string.IsNullOrEmpty(isAdminClaim) && bool.TryParse(isAdminClaim, out var isAdminBool) && isAdminBool);

        var threadsQuery = _context.MessageThreads
            .Where(t => t.CaseId == caseIdTyped);

        // If not the case owner and not staff, only see your own threads
        if (caseEntity.UserId != userId)
        {
            if (isAdmin)
            {
                // Admins see "General" threads (no specific recipient) or threads directed to them
                threadsQuery = threadsQuery.Where(t => t.RecipientUserId == null || t.RecipientUserId == userId);
            }
            else if (IsStaff())
            {
                // Staff sees threads directed specifically to them, or threads for cases they are assigned to
                var attorneyId = (await _context.Users.FindAsync(userId))?.AttorneyProfileId;
                threadsQuery = threadsQuery.Where(t => 
                    t.RecipientUserId == userId || 
                    (attorneyId.HasValue && t.Case.AssignedStaffId == attorneyId.Value) ||
                    t.Messages.Any(m => m.SenderUserId == userId)
                );
            }
            else
            {
                // Not authorized to see any threads for this case
                return StatusCode(403, new ProblemDetails
                {
                    Title = "Forbidden",
                    Detail = "Access denied to this message thread."
                });
            }
        }
        // Case owner sees all threads for their case (no filter needed)

        var threads = await threadsQuery
            .Select(t => new MessageThreadResponse
            {
                Id = t.Id,
                CaseId = t.CaseId,
                Subject = t.Subject!,
                CreatedAt = t.CreatedAt,
                LastMessageAt = t.LastMessageAt,
                MessageCount = t.Messages.Count()
            })
            .OrderByDescending(t => t.LastMessageAt)
            .ToListAsync().ConfigureAwait(false);

        var response = new
        {
            threads = threads.Select(t => new
            {
                threadId = t.Id.ToString(),
                title = t.Subject,
                messageCount = t.MessageCount
            })
        };

        return Ok(response);
    }

    /// <summary>
    /// Get recent message previews for the dashboard
    /// </summary>
    [HttpGet("previews")]
    [Authorize(Roles = "Attorney,LegalProfessional,Admin")]
    public async Task<ActionResult<List<object>>> GetMessagePreviews()
    {
        var userId = GetCurrentUserId();
        
        var threads = await _context.MessageThreads
            .Include(t => t.Case)
            .ThenInclude(c => c.User)
            .Include(t => t.Messages.OrderByDescending(m => m.SentAt))
            .Where(t => t.RecipientUserId == null || t.RecipientUserId == userId)
            .OrderByDescending(t => t.LastMessageAt)
            .Take(5)
            .ToListAsync().ConfigureAwait(false);

        return Ok(threads.Select(t => new {
            id = t.Id,
            sender = t.Case?.User != null ? $"{t.Case.User.FirstName} {t.Case.User.LastName}" : "General Support",
            subject = t.Subject,
            snippet = t.Messages.FirstOrDefault()?.Body ?? "No messages",
            time = t.LastMessageAt.ToString("O")
        }));
    }

    /// <summary>
    /// Get messages for a specific thread
    /// </summary>
    /// <param name="threadId">Thread ID</param>
    /// <returns>Thread messages</returns>
    [HttpGet("threads/{threadId}/messages")]
    [ProducesResponseType<MessageListResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetThreadMessages(Guid threadId)
    {
        var userId = GetCurrentUserId();

        // Get thread with case for access checking
        var thread = await _context.MessageThreads
            .Include(t => t.Case)
            .Include(t => t.Messages.OrderBy(m => m.SentAt))
            .ThenInclude(m => m.Sender)
            .FirstOrDefaultAsync(t => t.Id == threadId).ConfigureAwait(false);

        if (thread == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Thread Not Found",
                Detail = "Message thread not found."
            });
        }

        // Verify case ownership or staff access
        // If thread is not linked to a case, visibility is determined by sender/recipient or staff role
        if (thread.Case != null)
        {
            if (thread.Case.UserId != userId && !IsStaff())
            {
                return StatusCode(403, new ProblemDetails
                {
                    Title = "Forbidden",
                    Detail = "Access denied to this message thread."
                });
            }
        }
        else
        {
            // Caseless thread: Sender, Recipient, or Staff can see it
            var isSender = thread.Messages.Any(m => m.SenderUserId == userId);
            var isRecipient = thread.RecipientUserId == userId;
            if (!isSender && !isRecipient && !IsStaff())
            {
                return StatusCode(403, new ProblemDetails
                {
                    Title = "Forbidden",
                    Detail = "Access denied to this message thread."
                });
            }
        }

        var messages = thread.Messages.Select(m =>
        {
            var readBy = new Dictionary<string, DateTime>();
            if (!string.IsNullOrEmpty(m.ReadByJson))
            {
                try
                {
                    readBy = JsonSerializer.Deserialize<Dictionary<string, DateTime>>(m.ReadByJson) 
                        ?? new Dictionary<string, DateTime>();
                }
                catch (JsonException)
                {
                    _logger.LogWarning("Failed to deserialize ReadByJson for message {MessageId}", m.Id);
                }
            }

            return new ChatMessageResponse
            {
                Id = m.Id,
                ThreadId = m.ThreadId,
                SenderUserId = m.SenderUserId,
                SenderName = m.Sender?.Email ?? "Unknown User",
                Body = m.Body,
                Channel = m.Channel,
                SentAt = m.SentAt,
                IsRead = readBy.ContainsKey(userId.Value.ToString())
            };
        }).ToList();

        var response = new
        {
            messages = messages.Select(m => new
            {
                id = m.Id.ToString(), // Added ID here
                content = m.Body,
                sender = m.SenderName,
                timestamp = m.SentAt.ToString("O")
            })
        };

        return Ok(response);
    }

    /// <summary>
    /// Get a specific thread with its messages
    /// </summary>
    /// <param name="threadId">Thread ID</param>
    /// <returns>Thread details with messages</returns>
    [HttpGet("{threadId}")]
    [ProducesResponseType<MessageThreadDetailResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetThread(Guid threadId)
    {
        var userId = GetCurrentUserId();

        // Get thread with case for access checking
        var thread = await _context.MessageThreads
            .Include(t => t.Case)
            .Include(t => t.Messages.OrderBy(m => m.SentAt))
            .ThenInclude(m => m.Sender)
            .FirstOrDefaultAsync(t => t.Id == threadId).ConfigureAwait(false);

        if (thread == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Thread Not Found",
                Detail = "Message thread not found."
            });
        }

        // Verify case ownership or staff access
        // If thread is not linked to a case, visibility is determined by sender/recipient or staff role
        if (thread.Case != null)
        {
            if (thread.Case.UserId != userId && !IsStaff())
            {
                return StatusCode(403, new ProblemDetails
                {
                    Title = "Forbidden",
                    Detail = "Access denied to this message thread."
                });
            }
        }
        else
        {
            // Caseless thread: Sender, Recipient, or Staff can see it
            var isSender = thread.Messages.Any(m => m.SenderUserId == userId);
            var isRecipient = thread.RecipientUserId == userId;
            if (!isSender && !isRecipient && !IsStaff())
            {
                return StatusCode(403, new ProblemDetails
                {
                    Title = "Forbidden",
                    Detail = "Access denied to this message thread."
                });
            }
        }

        var messages = thread.Messages.Select(m =>
        {
            var readBy = new Dictionary<string, DateTime>();
            if (!string.IsNullOrEmpty(m.ReadByJson))
            {
                try
                {
                    readBy = JsonSerializer.Deserialize<Dictionary<string, DateTime>>(m.ReadByJson) 
                        ?? new Dictionary<string, DateTime>();
                }
                catch (JsonException)
                {
                    _logger.LogWarning("Failed to deserialize ReadByJson for message {MessageId}", m.Id);
                }
            }

            return new ChatMessageResponse
            {
                Id = m.Id,
                ThreadId = m.ThreadId,
                SenderUserId = m.SenderUserId,
                SenderName = m.Sender?.Email ?? "Unknown User",
                Body = m.Body,
                Channel = m.Channel,
                SentAt = m.SentAt,
                IsRead = readBy.ContainsKey(userId.Value.ToString())
            };
        }).ToList();

        var response = new MessageThreadDetailResponse
        {
            Id = thread.Id,
            CaseId = thread.CaseId,
            Subject = thread.Subject!,
            CreatedAt = thread.CreatedAt,
            LastMessageAt = thread.LastMessageAt,
            Messages = messages
        };

        return Ok(response);
    }

    /// <summary>
    /// Send a message to a thread
    /// </summary>
    /// <param name="request">Message send request</param>
    /// <returns>Created message details</returns>
    [HttpPost("threads/{threadId}/messages")]
    [ProducesResponseType<ChatMessageResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PostMessage(Guid threadId, [FromBody] JsonElement request)
    {
        var userId = GetCurrentUserId();
        var content = request.GetProperty("content").GetString() ?? "";

        // Verify thread exists and user has access
        var thread = await _context.MessageThreads
            .Include(t => t.Case)
            .Include(t => t.Messages)
            .FirstOrDefaultAsync(t => t.Id == threadId).ConfigureAwait(false);

        if (thread == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Thread Not Found",
                Detail = "Message thread not found."
            });
        }

        // Verify case ownership or staff access
        // If thread is not linked to a case, visibility is determined by sender/recipient or staff role
        if (thread.Case != null)
        {
            if (thread.Case.UserId != userId && !IsStaff())
            {
                return StatusCode(403, new ProblemDetails
                {
                    Title = "Forbidden",
                    Detail = "Access denied to this message thread."
                });
            }
        }
        else
        {
            // Caseless thread: Sender, Recipient, or Staff can see it
            var isSender = thread.Messages.Any(m => m.SenderUserId == userId);
            var isRecipient = thread.RecipientUserId == userId;
            if (!isSender && !isRecipient && !IsStaff())
            {
                return StatusCode(403, new ProblemDetails
                {
                    Title = "Forbidden",
                    Detail = "Access denied to this message thread."
                });
            }
        }

        var message = new Message
        {
            ThreadId = threadId,
            SenderUserId = userId,
            Body = content,
            Channel = "in_app",
            SentAt = DateTime.UtcNow,
            ReadByJson = JsonSerializer.Serialize(new Dictionary<string, DateTime>
            {
                [userId.Value.ToString()] = DateTime.UtcNow // Sender auto-reads
            })
        };

        _context.Messages.Add(message);

        // Update thread last message time
        thread.LastMessageAt = DateTime.UtcNow;

        // Update case activity if present
        if (thread.Case != null)
        {
            thread.Case.LastActivityAt = DateTimeOffset.UtcNow;
        }

        // Queue for daily digest (exclude sender from receiving their own message)
        // If thread is linked to a case, notify the client. Otherwise, notify the explicit recipient or admins.
        UserId? digestRecipient = null;
        if (thread.Case != null)
        {
            digestRecipient = thread.Case.UserId.Equals(userId) ? null : thread.Case.UserId;
        }
        else if (thread.RecipientUserId != null)
        {
            digestRecipient = thread.RecipientUserId.Equals(userId) ? null : thread.RecipientUserId;
        }

        await QueueForDigest(digestRecipient, message).ConfigureAwait(false);

        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Log audit event
        LogAudit("messages", "send", "Message", message.Id.ToString(),
            new { threadId = threadId, caseId = thread.CaseId?.Value, channel = message.Channel });

        var response = new
        {
            messageId = message.Id.ToString(),
            content = message.Body,
            sender = "user",
            timestamp = message.SentAt.ToString("O")
        };

        return Ok(response);
    }

    /// <summary>
    /// Mark all messages in a thread as read
    /// </summary>
    /// <param name="threadId">Thread ID</param>
    /// <returns>Read confirmation with count</returns>
    [HttpPost("threads/{threadId}/mark-read")]
    [HttpPut("threads/{threadId}/mark-read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkThreadMessagesAsRead(Guid threadId)
    {
        var userId = GetCurrentUserId();

        // Get thread with messages and verify access
        var thread = await _context.MessageThreads
            .Include(t => t.Case)
            .Include(t => t.Messages)
            .FirstOrDefaultAsync(t => t.Id == threadId).ConfigureAwait(false);

        if (thread == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Thread Not Found",
                Detail = "Message thread not found."
            });
        }

        // Verify case ownership or staff access
        // If thread is not linked to a case, visibility is determined by sender/recipient or staff role
        if (thread.Case != null)
        {
            if (thread.Case.UserId != userId && !IsStaff())
            {
                return StatusCode(403, new ProblemDetails
                {
                    Title = "Forbidden",
                    Detail = "Access denied to this message thread."
                });
            }
        }
        else
        {
            // Caseless thread: Sender, Recipient, or Staff can see it
            var isSender = thread.Messages.Any(m => m.SenderUserId == userId);
            var isRecipient = thread.RecipientUserId == userId;
            if (!isSender && !isRecipient && !IsStaff())
            {
                return StatusCode(403, new ProblemDetails
                {
                    Title = "Forbidden",
                    Detail = "Access denied to this message thread."
                });
            }
        }

        var readAt = DateTime.UtcNow;
        var markedCount = 0;

        foreach (var message in thread.Messages)
        {
            var readBy = new Dictionary<string, DateTime>();
            if (!string.IsNullOrEmpty(message.ReadByJson))
            {
                try
                {
                    readBy = JsonSerializer.Deserialize<Dictionary<string, DateTime>>(message.ReadByJson)
                        ?? new Dictionary<string, DateTime>();
                }
                catch (JsonException)
                {
                    _logger.LogWarning("Failed to deserialize ReadByJson for message {MessageId}", message.Id);
                }
            }

            // Mark as read if not already read by this user
            if (!readBy.ContainsKey(userId.Value.ToString()))
            {
                readBy[userId.Value.ToString()] = readAt;
                message.ReadByJson = JsonSerializer.Serialize(readBy);
                markedCount++;
            }
        }

        if (markedCount > 0)
        {
            await _context.SaveChangesAsync().ConfigureAwait(false);

            // Log audit event
            LogAudit("messages", "mark_thread_read", "MessageThread", threadId.ToString(),
                new { threadId, markedCount });
        }

        return Ok(new { success = true, markedCount, readAt });
    }

    /// <summary>
    /// Mark a specific message as read
    /// </summary>
    /// <param name="messageId">Message ID</param>
    /// <returns>Read confirmation</returns>
    [HttpPost("messages/{messageId}/read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkMessageAsRead(Guid messageId)
    {
        var userId = GetCurrentUserId();

        // Get message and verify access
        var message = await _context.Messages
            .Include(m => m.Thread)
            .ThenInclude(t => t.Case)
            .FirstOrDefaultAsync(m => m.Id == messageId).ConfigureAwait(false);

        if (message == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Message Not Found",
                Detail = "Message not found"
            });
        }

        // Verify user has access to the message thread
        if (message.Thread.Case != null)
        {
            if (message.Thread.Case.UserId != userId && !IsStaff())
            {
                return StatusCode(403, new ProblemDetails { Title = "Forbidden", Detail = "Access denied" });
            }
        }
        else
        {
            var isSender = message.SenderUserId == userId;
            var isRecipient = message.Thread.RecipientUserId == userId;
            if (!isSender && !isRecipient && !IsStaff())
            {
                return StatusCode(403, new ProblemDetails { Title = "Forbidden", Detail = "Access denied" });
            }
        }

        var readBy = new Dictionary<string, DateTime>();
        if (!string.IsNullOrEmpty(message.ReadByJson))
        {
            try
            {
                readBy = JsonSerializer.Deserialize<Dictionary<string, DateTime>>(message.ReadByJson) 
                    ?? new Dictionary<string, DateTime>();
            }
            catch (JsonException)
            {
                _logger.LogWarning("Failed to deserialize ReadByJson for message {MessageId}", message.Id);
            }
        }

        // Mark as read if not already read by this user
        if (!readBy.ContainsKey(userId.Value.ToString()))
        {
            readBy[userId.Value.ToString()] = DateTime.UtcNow;
            message.ReadByJson = JsonSerializer.Serialize(readBy);
            await _context.SaveChangesAsync().ConfigureAwait(false);
        }

        return Ok();
    }

    /// <summary>
    /// Get unread message counts for a case
    /// </summary>
    /// <param name="caseId">Case ID</param>
    /// <returns>Unread counts</returns>
    [HttpGet("cases/{caseId}/unread")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUnreadCounts(Guid caseId)
    {
        var userId = GetCurrentUserId();
        var caseIdTyped = new CaseId(caseId);

        // Verify case exists and user has access
        var caseEntity = await _context.Cases
            .FirstOrDefaultAsync(c => c.Id == caseIdTyped).ConfigureAwait(false);

        if (caseEntity == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Case Not Found",
                Detail = "Case not found"
            });
        }

        // Verify case ownership or staff access
        if (caseEntity.UserId != userId && !IsStaff())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = "Access denied"
            });
        }

        // Get threads and their unread message counts
        var threadCounts = new Dictionary<string, int>();
        var totalUnread = 0;

        var threads = await _context.MessageThreads
            .Where(t => t.CaseId == caseIdTyped)
            .Include(t => t.Messages)
            .ToListAsync().ConfigureAwait(false);

        foreach (var thread in threads)
        {
            var unreadCount = 0;
            foreach (var message in thread.Messages)
            {
                if (!string.IsNullOrEmpty(message.ReadByJson))
                {
                    try
                    {
                        var readBy = JsonSerializer.Deserialize<Dictionary<string, DateTime>>(message.ReadByJson)
                            ?? new Dictionary<string, DateTime>();
                        if (!readBy.ContainsKey(userId.Value.ToString()))
                        {
                            unreadCount++;
                        }
                    }
                    catch (JsonException)
                    {
                        // Treat as unread if we can't parse
                        unreadCount++;
                    }
                }
                else
                {
                    // No read data means unread
                    unreadCount++;
                }
            }
            
            threadCounts[thread.Id.ToString()] = unreadCount;
            totalUnread += unreadCount;
        }

        var response = new
        {
            totalUnread = totalUnread,
            threadCounts = threadCounts
        };

        return Ok(response);
    }

    /// <summary>
    /// Mark messages as read
    /// </summary>
    /// <param name="request">Messages read request</param>
    /// <returns>Read confirmation</returns>
    [HttpPost("read")]
    [ProducesResponseType<MessageReadResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkMessagesRead([FromBody] MessageReadRequest request)
    {
        var userId = GetCurrentUserId();

        // Get messages and verify access
        var messages = await _context.Messages
            .Include(m => m.Thread)
            .ThenInclude(t => t.Case)
            .Where(m => request.MessageIds.Contains(m.Id))
            .ToListAsync().ConfigureAwait(false);

        if (!messages.Any())
        {
            return NotFound(new ProblemDetails
            {
                Title = "Messages Not Found",
                Detail = "Message not found."
            });
        }

        // Verify user has access to all message threads
        var unauthorizedMessages = messages.Where(m => 
        {
            if (m.Thread.Case != null)
            {
                return m.Thread.Case.UserId != userId && !IsStaff();
            }
            else
            {
                var isSender = m.SenderUserId == userId;
                var isRecipient = m.Thread.RecipientUserId == userId;
                return !isSender && !isRecipient && !IsStaff();
            }
        });

        if (unauthorizedMessages.Any())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = "Access denied to this message thread."
            });
        }

        var readAt = DateTime.UtcNow;
        var markedCount = 0;

        foreach (var message in messages)
        {
            var readBy = new Dictionary<string, DateTime>();
            if (!string.IsNullOrEmpty(message.ReadByJson))
            {
                try
                {
                    readBy = JsonSerializer.Deserialize<Dictionary<string, DateTime>>(message.ReadByJson) 
                        ?? new Dictionary<string, DateTime>();
                }
                catch (JsonException)
                {
                    _logger.LogWarning("Failed to deserialize ReadByJson for message {MessageId}", message.Id);
                }
            }

            // Mark as read if not already read by this user
            if (!readBy.ContainsKey(userId.Value.ToString()))
            {
                readBy[userId.Value.ToString()] = readAt;
                message.ReadByJson = JsonSerializer.Serialize(readBy);
                markedCount++;
            }
        }

        if (markedCount > 0)
        {
            await _context.SaveChangesAsync().ConfigureAwait(false);

            // Log audit event
            LogAudit("messages", "mark_read", "Message", "multiple",
                new { messageIds = request.MessageIds, markedCount });
        }

        var response = new MessageReadResponse
        {
            MarkedCount = markedCount,
            ReadAt = readAt
        };

        return Ok(response);
    }

    /// <summary>
    /// Delete a message thread
    /// </summary>
    /// <param name="threadId">Thread ID to delete</param>
    /// <returns>Delete confirmation</returns>
    [HttpDelete("threads/{threadId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteThread(Guid threadId)
    {
        var userId = GetCurrentUserId();

        // Get thread with case for access checking
        var thread = await _context.MessageThreads
            .Include(t => t.Case)
            .Include(t => t.Messages)
            .FirstOrDefaultAsync(t => t.Id == threadId).ConfigureAwait(false);

        if (thread == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Thread Not Found",
                Detail = "Message thread not found."
            });
        }

        // Only case owner or admin can delete threads
        var isAdminClaim = User.FindFirst("is_admin")?.Value;
        var isAdmin = User.IsInRole("Admin") || (!string.IsNullOrEmpty(isAdminClaim) && bool.TryParse(isAdminClaim, out var isAdminBool) && isAdminBool);
        if (thread.Case.UserId != userId && !isAdmin)
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = "Access denied to this message thread."
            });
        }

        var messageCount = thread.Messages.Count;

        // Delete all messages in the thread first
        _context.Messages.RemoveRange(thread.Messages);

        // Delete the thread
        _context.MessageThreads.Remove(thread);

        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Log audit event
        LogAudit("messages", "delete_thread", "MessageThread", threadId.ToString(),
            new { caseId = thread.CaseId?.Value, messageCount });

        return Ok(new { success = true, deletedMessageCount = messageCount });
    }

    /// <summary>
    /// Forward a message to create a new thread
    /// </summary>
    /// <param name="messageId">Message ID to forward</param>
    /// <param name="request">Forward request with new thread details</param>
    /// <returns>New thread details</returns>
    [HttpPost("messages/{messageId}/forward")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ForwardMessage(Guid messageId, [FromBody] JsonElement request)
    {
        var userId = GetCurrentUserId();

        // Get original message
        var originalMessage = await _context.Messages
            .Include(m => m.Thread)
            .ThenInclude(t => t.Case)
            .Include(m => m.Sender)
            .FirstOrDefaultAsync(m => m.Id == messageId).ConfigureAwait(false);

        if (originalMessage == null)
        {
            return NotFound(new ProblemDetails
            {
                Title = "Message Not Found",
                Detail = "Message not found"
            });
        }

        // Verify user has access to the message
        if (originalMessage.Thread.Case.UserId != userId && !IsStaff())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = "Access denied"
            });
        }

        // Parse request
        var title = request.GetProperty("title").GetString() ?? "Forwarded: " + originalMessage.Thread.Subject;
        var caseId = new CaseId(request.GetProperty("caseId").GetGuid());

        // Parse optional recipientUserId
        UserId? recipientUserId = null;
        if (request.TryGetProperty("recipientUserId", out var recipientProp) && recipientProp.ValueKind == JsonValueKind.String)
        {
            var recipientStr = recipientProp.GetString();
            if (!string.IsNullOrEmpty(recipientStr) && Guid.TryParse(recipientStr, out var recipientGuid))
            {
                recipientUserId = new UserId(recipientGuid);
            }
        }

        // Verify target case exists and user has access
        var targetCase = await _context.Cases
            .FirstOrDefaultAsync(c => c.Id == caseId).ConfigureAwait(false);

        if (targetCase == null)
        {
            return BadRequest(new ProblemDetails
            {
                Title = "Case Not Found",
                Detail = "Target case not found"
            });
        }

        if (targetCase.UserId != userId && !IsStaff())
        {
            return StatusCode(403, new ProblemDetails
            {
                Title = "Forbidden",
                Detail = "Cannot forward to this case"
            });
        }

        // Create new thread
        var newThread = new MessageThread
        {
            CaseId = caseId,
            Subject = title,
            RecipientUserId = recipientUserId,
            CreatedAt = DateTime.UtcNow,
            LastMessageAt = DateTime.UtcNow
        };

        _context.MessageThreads.Add(newThread);

        // Create forwarded message with original content
        var senderName = originalMessage.Sender?.Email ?? "Unknown";
        var forwardedBody = $"[Forwarded from {originalMessage.Thread.Subject} - Originally sent by {senderName}]\n\n{originalMessage.Body}";
        var forwardedMessage = new Message
        {
            ThreadId = newThread.Id,
            SenderUserId = userId,
            Body = forwardedBody,
            Channel = "in_app",
            SentAt = DateTime.UtcNow,
            ReadByJson = JsonSerializer.Serialize(new Dictionary<string, DateTime>
            {
                [userId.Value.ToString()] = DateTime.UtcNow
            })
        };

        _context.Messages.Add(forwardedMessage);

        // Update case activity
        targetCase.LastActivityAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync().ConfigureAwait(false);

        // Log audit event
        LogAudit("messages", "forward", "MessageThread", newThread.Id.ToString(),
            new { originalMessageId = messageId, targetCaseId = caseId.Value, newThreadId = newThread.Id });

        return Ok(new
        {
            threadId = newThread.Id.ToString(),
            title = newThread.Subject,
            messageCount = 1
        });
    }

    /// <summary>
    /// Preview daily digest for current user
    /// </summary>
    /// <returns>Daily digest preview</returns>
    [HttpGet("digest/preview")]
    [ProducesResponseType<DailyDigestPreviewResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> PreviewDailyDigest()
    {
        var userId = GetCurrentUserId();

        // Get digest queue entry for user
        var digestQueue = await _context.DailyDigestQueues
            .FirstOrDefaultAsync(d => d.UserId == userId).ConfigureAwait(false);

        if (digestQueue == null)
        {
            return Ok(new DailyDigestPreviewResponse
            {
                HasItems = false,
                ItemsJson = "[]",
                LastSentAt = null
            });
        }

        var response = new DailyDigestPreviewResponse
        {
            HasItems = !string.IsNullOrEmpty(digestQueue.ItemsJson) && digestQueue.ItemsJson != "[]",
            ItemsJson = digestQueue.ItemsJson ?? "[]",
            LastSentAt = digestQueue.LastSentAt
        };

        return Ok(response);
    }

    private async Task QueueForDigest(UserId? recipientUserId, Message message)
    {
        if (recipientUserId == null) return;

        var digestQueue = await _context.DailyDigestQueues
            .FirstOrDefaultAsync(d => d.UserId == recipientUserId).ConfigureAwait(false);

        var digestItem = new
        {
            messageId = message.Id,
            threadId = message.ThreadId,
            caseId = message.Thread?.CaseId?.Value,
            senderName = "New message", // Will be populated by digest service
            body = message.Body.Length > 100 ? message.Body.Substring(0, 100) + "..." : message.Body,
            sentAt = message.SentAt,
            channel = message.Channel
        };

        if (digestQueue == null)
        {
            digestQueue = new DailyDigestQueue
            {
                UserId = recipientUserId.Value,
                ItemsJson = JsonSerializer.Serialize(new[] { digestItem })
            };
            _context.DailyDigestQueues.Add(digestQueue);
        }
        else
        {
            var items = new List<object>();
            if (!string.IsNullOrEmpty(digestQueue.ItemsJson))
            {
                try
                {
                    var existingItems = JsonSerializer.Deserialize<List<object>>(digestQueue.ItemsJson);
                    if (existingItems != null)
                        items.AddRange(existingItems);
                }
                catch (JsonException)
                {
                    _logger.LogWarning("Failed to deserialize ItemsJson for digest queue {UserId}", recipientUserId.Value);
                }
            }

            items.Add(digestItem);
            digestQueue.ItemsJson = JsonSerializer.Serialize(items);
        }
    }

    /// <summary>
    /// Get all message threads available to the current user (Unified Inbox)
    /// </summary>
    /// <returns>List of threads</returns>
    [HttpGet("threads")]
    [ProducesResponseType<IEnumerable<object>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetThreads()
    {
        var userId = GetCurrentUserId();
        var isStaff = IsStaff();
        var isAdmin = User.HasClaim("is_admin", "true") || User.HasClaim("is_admin", "True") || User.IsInRole("Admin");

        var query = _context.MessageThreads
            .Include(t => t.Case)
            .ThenInclude(c => c.User)
            .Include(t => t.Messages.OrderByDescending(m => m.SentAt))
            .AsQueryable();

        if (isAdmin)
        {
            // Admins see "General" threads (no specific recipient) or threads directed specifically to them.
            // Requirement 1: Admins must see all messages not assigned to a specific professional + the General Mailbox.
            query = query.Where(t => t.RecipientUserId == null || t.RecipientUserId == userId);
        }
        else if (isStaff)
        {
            // Requirement 3: Legal Professionals see threads directed to them, 
            // and we also allow them to see threads for cases they are assigned to.
            // If they sent a message to "General", they should also see that thread.
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
            // Regular users see only threads for their own cases
            query = query.Where(t => t.Case.UserId == userId);
        }

        var threads = await query
            .OrderByDescending(t => t.LastMessageAt)
            .ToListAsync().ConfigureAwait(false);

        var response = threads.Select(t => {
            var lastMsg = t.Messages.FirstOrDefault();
            return new {
                threadId = t.Id.ToString(),
                caseId = t.CaseId?.Value,
                title = t.Subject,
                participantName = t.Case?.User != null ? $"{t.Case.User.FirstName} {t.Case.User.LastName}" : "General Support",
                lastMessageSnippet = lastMsg?.Body ?? "No messages",
                lastMessageTime = t.LastMessageAt.ToString("O"),
                messageCount = t.Messages.Count(),
                unreadCount = t.Messages.Count(m => !IsMessageRead(m, userId))
            };
        });

        return Ok(response);
    }

    /// <summary>
    /// Get valid message recipients based on the user's role
    /// </summary>
    /// <returns>List of recipients</returns>
    [HttpGet("recipients")]
    public async Task<IActionResult> GetRecipients()
    {
        var userId = GetCurrentUserId();
        var isStaff = IsStaff();
        var isAdmin = User.HasClaim("is_admin", "true") || User.HasClaim("is_admin", "True") || User.IsInRole("Admin");

        IQueryable<User> query = _context.Users.AsNoTracking().Where(u => u.Id != userId);

        if (isAdmin)
        {
            // Admins see all users
        }
        else if (isStaff)
        {
            var currentUser = await _context.Users.FindAsync(userId);
            var attorneyId = currentUser?.AttorneyProfileId;

            // Legal Pros see assigned clients and all admins/staff
            // If they are an attorney with assigned cases, include those clients
            if (attorneyId.HasValue)
            {
                // Materialize the list first to avoid LINQ translation issues with strongly-typed IDs
                var assignedClientIds = await _context.Cases
                    .Where(c => c.AssignedStaffId == attorneyId.Value)
                    .Select(c => c.UserId)
                    .ToListAsync().ConfigureAwait(false);

                query = query.Where(u => u.IsAdmin || u.IsStaff || assignedClientIds.Contains(u.Id));
            }
            else
            {
                // Staff without attorney ID see other staff/admins
                query = query.Where(u => u.IsAdmin || u.IsStaff);
            }
        }
        else
        {
            // Regular users see admins and the specific staff assigned to their case
            var myCaseStaffIds = await _context.Cases
                .Where(c => c.UserId == userId && c.AssignedStaffId.HasValue)
                .Select(c => c.AssignedStaffId!.Value)
                .ToListAsync().ConfigureAwait(false);

            if (myCaseStaffIds.Any())
            {
                var staffEmails = await _context.Attorneys
                    .Where(a => myCaseStaffIds.Contains(a.Id))
                    .Select(a => a.Email)
                    .ToListAsync().ConfigureAwait(false);
                
                query = query.Where(u => u.IsAdmin || staffEmails.Contains(u.Email));
            }
            else
            {
                query = query.Where(u => u.IsAdmin);
            }
        }

        // Project only necessary fields to avoid over-fetching and potential translation issues
        var users = await query
            .Select(u => new 
            { 
                u.Id, 
                u.FirstName, 
                u.LastName, 
                u.Email, 
                u.IsAdmin, 
                u.IsStaff 
            })
            .OrderBy(u => u.Email)
            .ToListAsync().ConfigureAwait(false);

        // Perform formatting in memory
        var result = users
            .Select(u => new 
            { 
                id = u.Id.Value.ToString(), 
                label = string.IsNullOrEmpty(u.FirstName) ? u.Email : $"{u.FirstName} {u.LastName}",
                description = u.IsAdmin ? "Administrator" : (u.IsStaff ? "Legal Professional" : "Client")
            })
            .ToList();

        // Add "General / All Admins" option for non-admin staff and clients
        if (!isAdmin)
        {
            result.Insert(0, new 
            { 
                id = "null", 
                label = "General / All Admins",
                description = "General Mailbox"
            });
        }

        return Ok(result.OrderBy(u => u.label == "General / All Admins" ? 0 : 1).ThenBy(u => u.label));
    }

    private bool IsMessageRead(Message m, UserId userId)
    {
        if (string.IsNullOrEmpty(m.ReadByJson)) return false;
        try 
        {
            var readBy = JsonSerializer.Deserialize<Dictionary<string, DateTime>>(m.ReadByJson);
            return readBy?.ContainsKey(userId.Value.ToString()) ?? false;
        }
        catch { return false; }
    }

    private UserId GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user ID in token");
        }
        return new UserId(userId);
    }

    private bool IsStaff()
    {
        // Check for admin claims (both casings used in JWT)
        var isAdmin = User.HasClaim("is_admin", "true") ||
                      User.HasClaim("is_admin", "True") ||
                      User.IsInRole("Admin");

        // Check for staff/legal professional claims
        var isStaffClaim = User.HasClaim("is_staff", "true") ||
                           User.HasClaim("is_staff", "True") ||
                           User.HasClaim("is_legal_professional", "true") ||
                           User.HasClaim("is_legal_professional", "True") ||
                           User.IsInRole("Staff") ||
                           User.IsInRole("LegalProfessional") ||
                           User.IsInRole("Attorney");

        return isAdmin || isStaffClaim;
    }

    private void LogAudit(string category, string action, string targetType, string targetId, object details)
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
        // Note: SaveChangesAsync will be called by the calling method
    }
}
