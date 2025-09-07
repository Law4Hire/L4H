using L4H.Shared.Models;

namespace L4H.Infrastructure.Entities;

public class WebhookEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string StripeEventId { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public WebhookProvider Provider { get; set; } = WebhookProvider.Stripe;
    public string EventId 
    { 
        get => StripeEventId; 
        set => StripeEventId = value; 
    }
    public string Type 
    { 
        get => EventType; 
        set => EventType = value; 
    }
    public WebhookEventStatus Status { get; set; } = WebhookEventStatus.Pending;
    public string? Hash { get; set; }
    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;
    public string? ProcessingError { get; set; }
    public DateTimeOffset? ProcessedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}