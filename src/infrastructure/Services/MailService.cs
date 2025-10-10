
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Mail;
using System.Threading.Tasks;

namespace L4H.Infrastructure.Services
{
    public interface IMailService
    {
        Task SendEmailAsync(string to, string subject, string body);
    }

    public class MailService : IMailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<MailService> _logger;

        public MailService(IConfiguration configuration, ILogger<MailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            var from = _configuration["Email:From"];
            var host = _configuration["Email:Host"];
            var port = int.Parse(_configuration["Email:Port"], System.Globalization.CultureInfo.InvariantCulture);
            var username = _configuration["Email:Username"];
            var password = _configuration["Email:Password"];

            using var client = new SmtpClient(host, port)
            {
                Credentials = new System.Net.NetworkCredential(username, password),
                EnableSsl = true,
            };

            var mailMessage = new MailMessage(from, to, subject, body)
            {
                IsBodyHtml = true,
            };

            try
            {
                await client.SendMailAsync(mailMessage).ConfigureAwait(false);
                _logger.LogInformation("Email sent to {To}", to);
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {To}", to);
                throw;
            }
        }
    }
}
