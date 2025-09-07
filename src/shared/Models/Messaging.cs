namespace L4H.Shared.Models;

// Message Thread DTOs
public class MessageThreadCreateRequest
{
    public CaseId CaseId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string? InitialMessage { get; set; }
}

public class MessageThreadResponse
{
    public Guid Id { get; set; }
    public CaseId CaseId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime LastMessageAt { get; set; }
    public int MessageCount { get; set; }
}

public class MessageThreadListResponse
{
    public List<MessageThreadResponse> Threads { get; set; } = new List<MessageThreadResponse>();
}

// Message DTOs  
public class MessageSendRequest
{
    public Guid ThreadId { get; set; }
    public string Body { get; set; } = string.Empty;
    public string? Channel { get; set; }
}

public class ChatMessageResponse
{
    public Guid Id { get; set; }
    public Guid ThreadId { get; set; }
    public UserId SenderUserId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
    public string Channel { get; set; } = string.Empty;
    public bool IsRead { get; set; }
}

public class MessageListResponse
{
    public List<ChatMessageResponse> Messages { get; set; } = new List<ChatMessageResponse>();
    public bool HasMore { get; set; }
    public int TotalCount { get; set; }
}

public class MessageSummary
{
    public Guid Id { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
    public bool IsRead { get; set; }
}

// Thread Detail Response
public class MessageThreadDetailResponse
{
    public Guid Id { get; set; }
    public CaseId CaseId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime LastMessageAt { get; set; }
    public List<ChatMessageResponse> Messages { get; set; } = new List<ChatMessageResponse>();
}

// Read Receipt DTOs
public class MessageReadRequest
{
    public List<Guid> MessageIds { get; set; } = new List<Guid>();
}

public class MessageReadResponse
{
    public int MarkedCount { get; set; }
    public DateTime ReadAt { get; set; }
}

// Daily Digest DTOs
public class DailyDigestPreviewResponse
{
    public bool HasItems { get; set; }
    public string ItemsJson { get; set; } = string.Empty;
    public DateTime? LastSentAt { get; set; }
}