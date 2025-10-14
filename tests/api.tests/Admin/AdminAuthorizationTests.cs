using FluentAssertions;
using L4H.Api.Tests.TestHelpers;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Headers;
using Xunit;

namespace L4H.Api.Tests.Admin
{
    public class AdminAuthorizationTests : BaseIntegrationTest
    {
        public AdminAuthorizationTests(WebApplicationFactory<Program> factory) : base(factory)
        {
        }

        private async Task SetAuthToken(bool isAdmin)
        {
            var token = await GetAuthTokenAsync(isAdmin);
            Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }

        [Theory]
        // AdminController endpoints
        [InlineData("GET", "v1/admin/pricing/visa-types")]
        [InlineData("PATCH", "v1/admin/pricing/visa-types/1")]
        [InlineData("GET", "v1/admin/pricing/packages")]
        [InlineData("GET", "v1/admin/users")]
        [InlineData("PUT", "v1/admin/users/some-guid/roles")]
        [InlineData("DELETE", "v1/admin/users/some-guid")]
        [InlineData("PUT", "v1/admin/users/some-guid/password")]
        [InlineData("PUT", "v1/admin/users/some-guid/status")]
        [InlineData("GET", "v1/admin/analytics/dashboard")]
        [InlineData("GET", "v1/admin/analytics/financial")]
        [InlineData("GET", "v1/admin/database-stats")]
        [InlineData("GET", "v1/admin/analytics/users")]
        [InlineData("GET", "v1/admin/cases")]
        [InlineData("PATCH", "v1/admin/cases/some-guid/status")]
        [InlineData("POST", "v1/admin/users/some-guid/verification-token")]
        [InlineData("POST", "v1/admin/demo/verification-token")]
        // GraphController endpoint
        [InlineData("POST", "v1/admin/graph/test-mail")]
        // ProvidersController endpoints
        [InlineData("GET", "v1/admin/providers")]
        [InlineData("PATCH", "v1/admin/providers")]
        // WorkflowReviewController endpoints
        [InlineData("GET", "v1/admin/workflows/pending")]
        [InlineData("GET", "v1/admin/workflows/some-guid")]
        [InlineData("GET", "v1/admin/workflows/some-guid/diff")]
        [InlineData("POST", "v1/admin/workflows/some-guid/approve")]
        [InlineData("POST", "v1/admin/workflows/some-guid/reject")]
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
            var response = await Client.SendAsync(request);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        }
    }
}