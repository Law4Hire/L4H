namespace L4H.Infrastructure.Services.Graph;

public class SendMailRequest
{
    public required string To { get; set; }
    public string? Subject { get; set; }
    public string? HtmlBody { get; set; }
    public string? TextBody { get; set; }
    public string FromAlias { get; set; } = "system";
}

public class SendMailResponse
{
    public required string MessageId { get; set; }
    public bool Success { get; set; }
}

public interface IMailProvider
{
    Task<SendMailResponse> SendMailAsync(SendMailRequest request, CancellationToken cancellationToken = default);
    Task<TestMailResult> SendTestMailAsync(string to, string subject, string body, CancellationToken cancellationToken = default);
}

public class TestMailResult
{
    public bool Success { get; set; }
    public string? MessageId { get; set; }
    public string? ErrorMessage { get; set; }
}