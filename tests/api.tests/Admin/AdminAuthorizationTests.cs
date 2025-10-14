using FluentAssertions;
using L4H.Api.Tests.TestHelpers;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Hosting;
using System.Net;
using System.Net.Http.Headers;
using Xunit;

namespace L4H.Api.Tests.Admin
{
    public class AdminAuthorizationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;
        private readonly WebApplicationFactory<Program> _factory;

        public AdminAuthorizationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureAppConfiguration((context, conf) =>
                {
                    conf.AddJsonFile("appsettings.Testing.json");
                });

                builder.ConfigureServices(services =>
                {
                    // Here you can override services for tests, e.g., mock database
                });
            });
            _client = _factory.CreateClient();
        }

        private async Task SetAuthToken(bool isAdmin)
        {
            var token = await TestAuthHelper.GenerateToken(isAdmin);
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }

        [Theory]
        // AdminController endpoints
        [InlineData("GET", "/api/v1/admin/pricing/visa-types")]
        [InlineData("PATCH", "/api/v1/admin/pricing/visa-types/1")]
        [InlineData("GET", "/api/v1/admin/pricing/packages")]
        [InlineData("GET", "/api/v1/admin/users")]
        [InlineData("PUT", "/api/v1/admin/users/some-guid/roles")]
        [InlineData("DELETE", "/api/v1/admin/users/some-guid")]
        [InlineData("PUT", "/api/v1/admin/users/some-guid/password")]
        [InlineData("PUT", "/api/v1/admin/users/some-guid/status")]
        [InlineData("GET", "/api/v1/admin/analytics/dashboard")]
        [InlineData("GET", "/api/v1/admin/analytics/financial")]
        [InlineData("GET", "/api/v1/admin/database-stats")]
        [InlineData("GET", "/api/v1/admin/analytics/users")]
        [InlineData("GET", "/api/v1/admin/cases")]
        [InlineData("PATCH", "/api/v1/admin/cases/some-guid/status")]
        [InlineData("POST", "/api/v1/admin/users/some-guid/verification-token")]
        [InlineData("POST", "/api/v1/admin/demo/verification-token")]
        // GraphController endpoint
        [InlineData("POST", "/api/v1/admin/graph/test-mail")]
        // ProvidersController endpoints
        [InlineData("GET", "/api/v1/admin/providers")]
        [InlineData("PATCH", "/api/v1/admin/providers")]
        // WorkflowReviewController endpoints
        [InlineData("GET", "/api/v1/admin/workflows/pending")]
        [InlineData("GET", "/api/v1/admin/workflows/some-guid")]
        [InlineData("GET", "/api/v1/admin/workflows/some-guid/diff")]
        [InlineData("POST", "/api/v1/admin/workflows/some-guid/approve")]
        [InlineData("POST", "/api/v1/admin/workflows/some-guid/reject")]
        public async Task AdminEndpoints_WhenAccessedByNonAdmin_ShouldReturnForbidden(string method, string url)
        {
            // Arrange
            await SetAuthToken(isAdmin: false);
            var request = new HttpRequestMessage(new HttpMethod(method), url);

            // For methods that require a body, add a dummy JSON body
            if (method == "POST" || method == "PUT" || method == "PATCH")
            {
                request.Content = new StringContent("{}", System.Text.Encoding.UTF8, "application/json");
            }

            // Act
            var response = await _client.SendAsync(request);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }
    }
}