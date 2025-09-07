namespace L4H.Shared.Models;

public enum PaymentStatus
{
    Pending,
    Succeeded,
    Failed,
    Canceled,
    RequiresAction,
    RequiresConfirmation,
    Processing,
    PartiallyRefunded,
    Refunded
}

public enum WebhookProvider
{
    Stripe,
    PayPal,
    Square
}

public enum WebhookEventStatus
{
    Pending,
    Processing,
    Processed,
    Succeeded,
    Failed,
    Retry
}

public enum PriceDeltaDirection
{
    Increase,
    Decrease,
    Refund
}

public enum PriceDeltaStatus
{
    Pending,
    Approved,
    Rejected,
    Applied,
    ApprovedAdmin
}

public enum RefundStatus
{
    Pending,
    Succeeded,
    Failed,
    Canceled
}