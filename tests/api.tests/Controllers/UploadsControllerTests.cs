using FluentAssertions;
using L4H.Api.Models;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Xunit;
using System.Linq;

namespace L4H.Api.Tests.Controllers;

public sealed class UploadsControllerTests : IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly string _tempUploadPath;
    private Guid _testCaseId;

    public UploadsControllerTests()
    {
        _tempUploadPath = Path.Combine(Path.GetTempPath(), "upload-controller-tests", Guid.NewGuid().ToString());
        Directory.CreateDirectory(_tempUploadPath);

        _factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Testing");
                builder.ConfigureServices(services =>
                {
                    // Register test services
                    TestServiceRegistration.RegisterTestServices(services);
                    
                // Remove specific hosted services to prevent background processing during tests
                var caseAgingServiceDescriptors = services.Where(descriptor => 
                    descriptor.ServiceType == typeof(Microsoft.Extensions.Hosting.IHostedService) &&
                    descriptor.ImplementationType == typeof(L4H.Api.Services.CaseAutoAgingService)).ToList();
                foreach (var descriptor in caseAgingServiceDescriptors)
                {
                    services.Remove(descriptor);
                }
                
                var dailyDigestServiceDescriptors = services.Where(descriptor => 
                    descriptor.ServiceType == typeof(Microsoft.Extensions.Hosting.IHostedService) &&
                    descriptor.ImplementationType == typeof(L4H.Api.Services.DailyDigestService)).ToList();
                foreach (var descriptor in dailyDigestServiceDescriptors)
                {
                    services.Remove(descriptor);
                }
                
                var antivirusScanServiceDescriptors = services.Where(descriptor => 
                    descriptor.ServiceType == typeof(Microsoft.Extensions.Hosting.IHostedService) &&
                    descriptor.ImplementationType == typeof(L4H.Api.Services.AntivirusScanService)).ToList();
                foreach (var descriptor in antivirusScanServiceDescriptors)
                {
                    services.Remove(descriptor);
                }
                    
                    // Override upload options for testing
                    services.Configure<UploadOptions>(options =>
                    {
                        options.BasePath = _tempUploadPath;
                        options.QuarantineSubdir = "quarantine";
                        options.CleanSubdir = "clean";
                        options.MaxSizeMB = 1; // Small for testing
                        options.AllowedExtensions = new List<string> { "pdf", "txt", "png" };
                        options.Gateway = new GatewayOptions { PublicBaseUrl = "http://test-gateway:7070" };
                        options.Token = new TokenOptions 
                        { 
                            SigningKey = "test-signing-key-uploads-controller", 
                            TtlMinutes = 30 
                        };
                        options.DisableAntivirusScan = true; // Disable antivirus scanning for tests
                    });
                });
            });

        _client = _factory.CreateClient();
        _testCaseId = L4H.Api.Tests.TestData.GenerateUniqueCaseId();
    }

    [Fact]
    public async Task PresignUpload_WithValidRequest_ShouldReturnPresignedUrl()
    {
        // Arrange
        await SetupTestData();
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new
        {
            caseId = _testCaseId,
            filename = "test-document.pdf",
            contentType = "application/pdf",
            sizeBytes = 1024
        };

        // Act
        var response = await _client.PostAsync("/v1/uploads/presign", 
            new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json"));

        // Assert
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new Exception($"Expected success but got {response.StatusCode}: {errorContent}");
        }
        response.IsSuccessStatusCode.Should().BeTrue();
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(content);
        
        result.GetProperty("url").GetString().Should().StartWith("http://test-gateway:7070/gateway/uploads/");
        result.GetProperty("key").GetString().Should().NotBeNullOrEmpty();
        result.GetProperty("uploadId").GetString().Should().NotBeNullOrEmpty();
        
        var headers = result.GetProperty("headers");
        headers.GetProperty("Content-Type").GetString().Should().Be("application/pdf");
    }

    [Fact]
    public async Task PresignUpload_WithExcessiveSize_ShouldReturnBadRequest()
    {
        // Arrange
        await SetupTestData();
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new
        {
            caseId = _testCaseId,
            filename = "huge-file.pdf",
            contentType = "application/pdf",
            sizeBytes = 2 * 1024 * 1024 // 2MB, but limit is 1MB
        };

        // Act
        var response = await _client.PostAsync("/v1/uploads/presign", 
            new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("File Too Large");
    }

    [Fact]
    public async Task PresignUpload_WithDisallowedExtension_ShouldReturnBadRequest()
    {
        // Arrange
        await SetupTestData();
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new
        {
            caseId = _testCaseId,
            filename = "malware.exe",
            contentType = "application/octet-stream",
            sizeBytes = 1024
        };

        // Act
        var response = await _client.PostAsync("/v1/uploads/presign", 
            new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.BadRequest);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("File Type Not Allowed");
    }

    [Fact]
    public async Task PresignUpload_WithUnpaidCase_ShouldReturnConflict()
    {
        // Arrange
        _testCaseId = L4H.Api.Tests.TestData.GenerateUniqueCaseId();
        await SetupTestDataWithUnpaidCase();
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = new
        {
            caseId = _testCaseId,
            filename = "document.pdf",
            contentType = "application/pdf",
            sizeBytes = 1024
        };

        // Act
        var response = await _client.PostAsync("/v1/uploads/presign", 
            new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Conflict);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Case Not Paid");
    }

    [Fact]
    public async Task ConfirmUpload_WithValidRequest_ShouldReturnAccepted()
    {
        // Arrange - Use a completely unique case ID to avoid conflicts
        _testCaseId = Guid.NewGuid();
        await SetupTestData();
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // First create a presigned upload
        var presignRequest = new
        {
            caseId = _testCaseId,
            filename = "test.pdf",
            contentType = "application/pdf",
            sizeBytes = 1024
        };

        var presignResponse = await _client.PostAsync("/v1/uploads/presign", 
            new StringContent(JsonSerializer.Serialize(presignRequest), Encoding.UTF8, "application/json"));
        var presignContent = await presignResponse.Content.ReadAsStringAsync();
        
        if (!presignResponse.IsSuccessStatusCode)
        {
            throw new Exception($"Presign request failed with {presignResponse.StatusCode}: {presignContent}");
        }
        
        var presignResult = JsonSerializer.Deserialize<JsonElement>(presignContent);
        var key = presignResult.GetProperty("key").GetString();

        // Verify the upload was created
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var upload = await context.Uploads.FirstOrDefaultAsync(u => u.Key == key && u.CaseId == new CaseId(_testCaseId));
        upload.Should().NotBeNull("Upload should be created by presign request");
        
        // Set status to pending for confirmation
        upload!.Status = "pending";
        await context.SaveChangesAsync();

        var confirmRequest = new
        {
            caseId = _testCaseId,
            key = key
        };

        // Act
        var response = await _client.PostAsync("/v1/uploads/confirm", 
            new StringContent(JsonSerializer.Serialize(confirmRequest), Encoding.UTF8, "application/json"));

        // Assert
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new Exception($"Expected Accepted (202) but got {response.StatusCode}: {errorContent}");
        }
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Accepted);
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(content);
        result.GetProperty("status").GetString().Should().Be("pending");
    }

    [Fact]
    public async Task ListUploads_WithValidCaseId_ShouldReturnUploads()
    {
        // Arrange
        _testCaseId = L4H.Api.Tests.TestData.GenerateUniqueCaseId();
        await SetupTestDataWithUploads();
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync($"/v1/uploads/list?caseId={_testCaseId}");

        // Assert
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new Exception($"Expected success but got {response.StatusCode}: {errorContent}");
        }
        response.IsSuccessStatusCode.Should().BeTrue();
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(content);
        
        var uploads = result.GetProperty("uploads");
        uploads.GetArrayLength().Should().BeGreaterThan(0);
        
        var firstUpload = uploads[0];
        firstUpload.GetProperty("originalName").GetString().Should().NotBeNullOrEmpty();
        firstUpload.GetProperty("status").GetString().Should().NotBeNullOrEmpty();
        firstUpload.GetProperty("sizeBytes").GetInt64().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetUploadLimits_ShouldReturnConfiguredLimits()
    {
        // Arrange
        var token = await GetAuthTokenAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/v1/uploads/limits");

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();
        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(content);
        
        result.GetProperty("maxSizeMB").GetInt32().Should().Be(1);
        var extensions = result.GetProperty("allowedExtensions");
        extensions.GetArrayLength().Should().Be(3);
        extensions[0].GetString().Should().Be(".pdf");
        extensions[1].GetString().Should().Be(".txt");
        extensions[2].GetString().Should().Be(".png");
    }

    private static Task<string> GetAuthTokenAsync()
    {
        // For testing, return a mock JWT token (in real tests, you'd generate a proper one)
        // The TestAuthenticationHandler will handle the authentication
        return Task.FromResult("mock-jwt-token-for-testing");
    }

    private async Task SetupTestData()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();

        // Use the hardcoded user ID that TestAuthenticationHandler returns
        var testUserId = new L4H.Shared.Models.UserId(Guid.Parse("C0000000-1234-1234-1234-123456789012"));
        var testCaseId = new L4H.Shared.Models.CaseId(_testCaseId);

        // Check if user already exists
        var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Id == testUserId);
        if (existingUser == null)
        {
            var user = new User
            {
                Id = testUserId,
                Email = "uploadstest@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(user);
        }

        // Check if test case already exists
        var existingCase = await context.Cases.FirstOrDefaultAsync(c => c.Id == testCaseId);
        if (existingCase == null)
        {
            var testCase = new Case
            {
                Id = testCaseId,
                UserId = testUserId,
                Status = "active", // Paid case
                CreatedAt = DateTime.UtcNow,
                LastActivityAt = DateTimeOffset.UtcNow
            };
            context.Cases.Add(testCase);
        }
        else
        {
            // Update existing case to have correct UserId
            existingCase.UserId = testUserId;
            existingCase.Status = "active";
        }

        await context.SaveChangesAsync();
    }

    private async Task SetupTestDataWithUnpaidCase()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();

        // Use the hardcoded user ID that TestAuthenticationHandler returns
        var testUserId = new L4H.Shared.Models.UserId(Guid.Parse("C0000000-1234-1234-1234-123456789012"));
        var unpaidCaseId = new L4H.Shared.Models.CaseId(_testCaseId);

        // Check if user already exists
        var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Id == testUserId);
        if (existingUser == null)
        {
            var user = new User
            {
                Id = testUserId,
                Email = "uploadstest@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(user);
        }

        // Check if unpaid case already exists
        var existingCase = await context.Cases.FirstOrDefaultAsync(c => c.Id == unpaidCaseId);
        if (existingCase == null)
        {
            var unpaidCase = new Case
            {
                Id = unpaidCaseId,
                UserId = testUserId,
                Status = "pending", // Unpaid case
                CreatedAt = DateTime.UtcNow,
                LastActivityAt = DateTimeOffset.UtcNow
            };
            context.Cases.Add(unpaidCase);
        }
        else
        {
            // Update existing case to have correct UserId
            existingCase.UserId = testUserId;
            existingCase.Status = "pending";
        }

        await context.SaveChangesAsync();
    }

    private async Task SetupTestDataWithUploads()
    {
        await SetupTestData();
        
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();

        // Get the user that was created in SetupTestData
        var testUserId = new L4H.Shared.Models.UserId(Guid.Parse("C0000000-1234-1234-1234-123456789012"));
        var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Id == testUserId);
        if (existingUser == null)
        {
            throw new InvalidOperationException("User should have been created in SetupTestData");
        }

        // Create the case that the upload will reference (if it doesn't already exist)
        var existingCase = await context.Cases.FirstOrDefaultAsync(c => c.Id == new L4H.Shared.Models.CaseId(_testCaseId));
        if (existingCase == null)
        {
            var testCase = new Case
            {
                Id = new L4H.Shared.Models.CaseId(_testCaseId),
                UserId = existingUser.Id,
                Status = "active", // Paid case
                CreatedAt = DateTime.UtcNow,
                LastActivityAt = DateTimeOffset.UtcNow
            };
            context.Cases.Add(testCase);
        }

        var upload = new Upload
        {
            CaseId = new L4H.Shared.Models.CaseId(_testCaseId),
            OriginalName = "test-document.pdf",
            Mime = "application/pdf",
            SizeBytes = 1024,
            Key = "test-token/test-document.pdf",
            Status = "clean",
            VerdictAt = DateTime.UtcNow,
            StorageUrl = "/clean/path/test-document.pdf"
        };

        context.Uploads.Add(upload);
        await context.SaveChangesAsync();
    }


    private static class TestData
    {
        public static readonly UserId TestUserId = new UserId(Guid.Parse("C0000000-1234-1234-1234-123456789012")); // Match TestAuthenticationHandler
        public static readonly CaseId TestCaseId = new CaseId(Guid.Parse("A7654321-4321-4321-4321-210987654321"));
        public static readonly CaseId UnpaidCaseId = new CaseId(Guid.Parse("A1111111-1111-1111-1111-111111111111"));
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    private void Dispose(bool disposing)
    {
        if (disposing)
        {
            _client?.Dispose();
            _factory?.Dispose();
            
            // Clean up temp directory
            if (Directory.Exists(_tempUploadPath))
            {
                Directory.Delete(_tempUploadPath, true);
            }
        }
    }
}
