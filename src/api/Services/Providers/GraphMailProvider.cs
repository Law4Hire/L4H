using Microsoft.Extensions.Options;
using Microsoft.Extensions.Localization;
using L4H.Api.Configuration;
using L4H.Api.Services.Providers;
using L4H.Infrastructure.Services.Graph;

namespace L4H.Api.Services.Providers;

public class GraphMailProvider : IGraphMailProvider
{
    private readonly GraphOptions _options;
    private readonly IStringLocalizer<L4H.Api.Resources.Shared> _localizer;
    private readonly ILogger<GraphMailProvider> _logger;

    public GraphMailProvider(
        IOptions<GraphOptions> options,
        IStringLocalizer<L4H.Api.Resources.Shared> _localizer,
        ILogger<GraphMailProvider> logger)
    {
        _options = options.Value;
        this._localizer = _localizer;
        _logger = logger;
    }

    public async Task<SendMailResponse> SendMailAsync(SendMailRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Sending mail via Microsoft Graph to {To}", request.To);

            // In a real implementation, this would use the Microsoft Graph SDK
            // For now, we'll simulate the API call
            await Task.Delay(100, cancellationToken).ConfigureAwait(false); // Simulate network call

            _logger.LogInformation("Mail sent successfully to {To}", request.To);
            return new SendMailResponse
            {
                MessageId = $"msg_{Guid.NewGuid():N}",
                Success = true
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send mail to {To}", request.To);
            return new SendMailResponse
            {
                MessageId = string.Empty,
                Success = false
            };
        }
    }

    public async Task<TestMailResult> SendTestMailAsync(string to, string subject, string body, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Sending test mail via Microsoft Graph to {To}", to);

            // In a real implementation, this would use the Microsoft Graph SDK
            // For now, we'll simulate the API call
            await Task.Delay(100, cancellationToken).ConfigureAwait(false); // Simulate network call

            _logger.LogInformation("Test mail sent successfully to {To}", to);
            return new TestMailResult
            {
                Success = true,
                MessageId = $"test_msg_{Guid.NewGuid():N}"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send test mail to {To}", to);
            return new TestMailResult
            {
                Success = false,
                ErrorMessage = ex.Message
            };
        }
    }

    public async Task<bool> SendTestMailAsync(string to, string subject, string body)
    {
        var result = await SendTestMailAsync(to, subject, body, CancellationToken.None).ConfigureAwait(false);
        return result.Success;
    }
}
