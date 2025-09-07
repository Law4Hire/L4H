namespace L4H.Infrastructure.Services.Graph;

public class SentMailRecord
{
    public required string To { get; set; }
    public string? Subject { get; set; }
    public string? HtmlBody { get; set; }
    public string? TextBody { get; set; }
    public required string FromAlias { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public required string MessageId { get; set; }
}

public class FakeGraphMailProvider : IMailProvider
{
    private readonly List<SentMailRecord> _sentMails = new();
    public bool SimulateFailure { get; set; } = false;

    public Task<SendMailResponse> SendMailAsync(SendMailRequest request, CancellationToken cancellationToken = default)
    {
        if (SimulateFailure)
        {
            throw new InvalidOperationException("Fake Graph mail provider simulated failure");
        }

        var messageId = $"fake-msg-{Guid.NewGuid()}";
        
        var record = new SentMailRecord
        {
            To = request.To,
            Subject = request.Subject ?? "Test Email",
            HtmlBody = request.HtmlBody ?? "<p>Test email body</p>",
            TextBody = request.TextBody,
            FromAlias = request.FromAlias,
            MessageId = messageId
        };

        _sentMails.Add(record);

        return Task.FromResult(new SendMailResponse
        {
            MessageId = messageId,
            Success = true
        });
    }

    public Task<TestMailResult> SendTestMailAsync(string to, string subject, string body, CancellationToken cancellationToken = default)
    {
        if (SimulateFailure)
        {
            return Task.FromResult(new TestMailResult
            {
                Success = false,
                ErrorMessage = "Fake Graph mail provider simulated failure"
            });
        }

        var messageId = $"fake-test-msg-{Guid.NewGuid()}";
        
        var record = new SentMailRecord
        {
            To = to,
            Subject = subject,
            HtmlBody = body,
            TextBody = body,
            FromAlias = "admin",
            MessageId = messageId
        };

        _sentMails.Add(record);

        return Task.FromResult(new TestMailResult
        {
            Success = true,
            MessageId = messageId
        });
    }

    public List<SentMailRecord> GetSentMails() => _sentMails.ToList();
    public void ClearSentMails() => _sentMails.Clear();
}