using L4H.Infrastructure.Services.Graph;

namespace L4H.Api.Services.Providers;

public interface IGraphMailProvider : IMailProvider
{
    Task<bool> SendTestMailAsync(string to, string subject, string body);
}
