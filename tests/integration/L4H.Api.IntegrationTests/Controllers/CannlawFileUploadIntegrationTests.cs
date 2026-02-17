using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text.Encodings.Web;
using FluentAssertions;
using Xunit;

namespace L4H.Api.IntegrationTests.Controllers;

public class CannlawFileUploadIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly JsonSerializerOptions _jsonOptions;

    public CannlawFileUploadIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Remove existing DbContext
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<L4HDbContext>));
                if (descriptor != null) services.Remove(descriptor);

                // Use in-memory database for testing
                services.AddDbContext<L4HDbContext>(options =>
                {
                    options.UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString());
                });

                // Add test authentication
                services.AddAuthentication("Test")
                    .AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>("Test", options => { });
            });
        });

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }

    private HttpClient CreateAuthenticatedClient(string role = "LegalProfessional", int? attorneyId = null)
    {
        var client = _factory.CreateClient();
        var userId = Guid.NewGuid().ToString();
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Role, role)
        };
        
        if (attorneyId.HasValue)
        {
            claims.Add(new("AttorneyId", attorneyId.Value.ToString()));
        }

        var claimsString = string.Join(",", claims.Select(c => $"{c.Type}:{c.Value}"));
        client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Test", claimsString);
        return client;
    }

    private async Task<(Attorney attorney, Client client)> SeedTestDataAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();

        var attorney = new Attorney
        {
            Id = 1,
            FirstName = "John",
            LastName = "Smith",
            Email = "john.smith@cannlaw.com",
            Phone = "555-0101",
            Bio = "Immigration attorney",
            PracticeAreas = "Immigration, Visa Applications",
            Credentials = "JD, Bar Certified",
            DefaultHourlyRate = 350.00m,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var client = new Client
        {
            Id = 1,
            FirstName = "Maria",
            LastName = "Garcia",
            Email = "maria.garcia@email.com",
            Phone = "555-1001",
            Address = "123 Main St, City, State 12345",
            DateOfBirth = new DateTime(1985, 5, 15),
            CountryOfOrigin = "Mexico",
            AssignedAttorneyId = attorney.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = "System",
            UpdatedBy = "System"
        };

        context.Attorneys.Add(attorney);
        context.Clients.Add(client);
        await context.SaveChangesAsync();

        return (attorney, client);
    }

    private static byte[] CreateTestImageBytes()
    {
        // Create a simple test image (1x1 pixel PNG)
        return new byte[]
        {
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
            0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
            0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
            0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x37, 0x6E, 0xF9, 0x24, 0x00, 0x00,
            0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        };
    }

    private static byte[] CreateTestPdfBytes()
    {
        // Create a minimal PDF file
        var pdfContent = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n174\n%%EOF";
        return System.Text.Encoding.UTF8.GetBytes(pdfContent);
    }

    #region Attorney Photo Upload Tests

    [Fact]
    public async Task UploadAttorneyPhoto_WithValidImage_ReturnsSuccess()
    {
        // Arrange
        var (attorney, client) = await SeedTestDataAsync();
        var httpClient = CreateAuthenticatedClient("Admin");
        
        var imageBytes = CreateTestImageBytes();
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(imageBytes);
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/png");
        content.Add(fileContent, "photo", "attorney-photo.png");

        // Act
        var response = await httpClient.PostAsync($"v1/attorneys/{attorney.Id}/photo", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<AttorneyPhotoUploadResponse>(_jsonOptions);
        result.Should().NotBeNull();
        result!.PhotoUrl.Should().NotBeNullOrEmpty();
        result.PhotoUrl.Should().Contain("attorney-photo");
        
        // Verify database update
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var updatedAttorney = await context.Attorneys.FindAsync(attorney.Id);
        updatedAttorney!.PhotoUrl.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task UploadAttorneyPhoto_WithInvalidFileType_ReturnsBadRequest()
    {
        // Arrange
        var (attorney, client) = await SeedTestDataAsync();
        var httpClient = CreateAuthenticatedClient("Admin");
        
        var textBytes = System.Text.Encoding.UTF8.GetBytes("This is not an image");
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(textBytes);
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("text/plain");
        content.Add(fileContent, "photo", "not-an-image.txt");

        // Act
        var response = await httpClient.PostAsync($"v1/attorneys/{attorney.Id}/photo", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UploadAttorneyPhoto_WithOversizedFile_ReturnsBadRequest()
    {
        // Arrange
        var (attorney, client) = await SeedTestDataAsync();
        var httpClient = CreateAuthenticatedClient("Admin");
        
        // Create a large file (simulate 10MB)
        var largeImageBytes = new byte[10 * 1024 * 1024];
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(largeImageBytes);
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/png");
        content.Add(fileContent, "photo", "large-image.png");

        // Act
        var response = await httpClient.PostAsync($"v1/attorneys/{attorney.Id}/photo", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UploadAttorneyPhoto_AsLegalProfessional_ReturnsForbidden()
    {
        // Arrange
        var (attorney, client) = await SeedTestDataAsync();
        var httpClient = CreateAuthenticatedClient("LegalProfessional", attorney.Id);
        
        var imageBytes = CreateTestImageBytes();
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(imageBytes);
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/png");
        content.Add(fileContent, "photo", "attorney-photo.png");

        // Act
        var response = await httpClient.PostAsync($"v1/attorneys/{attorney.Id}/photo", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task DeleteAttorneyPhoto_WithExistingPhoto_ReturnsSuccess()
    {
        // Arrange
        var (attorney, client) = await SeedTestDataAsync();
        
        // Set existing photo URL
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
            var attorneyEntity = await context.Attorneys.FindAsync(attorney.Id);
            attorneyEntity!.PhotoUrl = "/images/attorneys/existing-photo.jpg";
            await context.SaveChangesAsync();
        }

        var httpClient = CreateAuthenticatedClient("Admin");

        // Act
        var response = await httpClient.DeleteAsync($"v1/attorneys/{attorney.Id}/photo");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        
        // Verify photo URL is cleared
        using var scope2 = _factory.Services.CreateScope();
        var context2 = scope2.ServiceProvider.GetRequiredService<L4HDbContext>();
        var updatedAttorney = await context2.Attorneys.FindAsync(attorney.Id);
        updatedAttorney!.PhotoUrl.Should().BeNullOrEmpty();
    }

    #endregion

    #region Client Document Upload Tests

    [Fact]
    public async Task UploadClientDocument_WithValidPdf_ReturnsSuccess()
    {
        // Arrange
        var (attorney, client) = await SeedTestDataAsync();
        var httpClient = CreateAuthenticatedClient("LegalProfessional", attorney.Id);
        
        var pdfBytes = CreateTestPdfBytes();
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(pdfBytes);
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");
        content.Add(fileContent, "document", "passport.pdf");
        content.Add(new StringContent("PersonalDocuments"), "category");
        content.Add(new StringContent("Client's passport copy"), "description");

        // Act
        var response = await httpClient.PostAsync($"v1/clients/{client.Id}/documents", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var result = await response.Content.ReadFromJsonAsync<DocumentUploadResponse>(_jsonOptions);
        result.Should().NotBeNull();
        result!.FileName.Should().Be("passport.pdf");
        result.Category.Should().Be(DocumentCategory.PersonalDocuments);
        result.Description.Should().Be("Client's passport copy");
        result.FileUrl.Should().NotBeNullOrEmpty();
        
        // Verify database entry
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
        var document = await context.Documents.FirstOrDefaultAsync(d => d.ClientId == client.Id);
        document.Should().NotBeNull();
        document!.OriginalFileName.Should().Be("passport.pdf");
        document.ContentType.Should().Be("application/pdf");
    }

    [Fact]
    public async Task UploadClientDocument_WithValidImage_ReturnsSuccess()
    {
        // Arrange
        var (attorney, client) = await SeedTestDataAsync();
        var httpClient = CreateAuthenticatedClient("LegalProfessional", attorney.Id);
        
        var imageBytes = CreateTestImageBytes();
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(imageBytes);
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/png");
        content.Add(fileContent, "document", "id-card.png");
        content.Add(new StringContent("PersonalDocuments"), "category");
        content.Add(new StringContent("ID card scan"), "description");

        // Act
        var response = await httpClient.PostAsync($"v1/clients/{client.Id}/documents", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var result = await response.Content.ReadFromJsonAsync<DocumentUploadResponse>(_jsonOptions);
        result.Should().NotBeNull();
        result!.FileName.Should().Be("id-card.png");
        result.ContentType.Should().Be("image/png");
    }

    [Fact]
    public async Task UploadClientDocument_ForUnassignedClient_ReturnsForbidden()
    {
        // Arrange
        var (attorney, client) = await SeedTestDataAsync();
        
        // Create another attorney and client
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
            
            var attorney2 = new Attorney
            {
                Id = 2,
                FirstName = "Jane",
                LastName = "Doe",
                Email = "jane.doe@cannlaw.com",
                Phone = "555-0202",
                Bio = "Another attorney",
                PracticeAreas = "Immigration",
                Credentials = "JD",
                DefaultHourlyRate = 300.00m,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var client2 = new Client
            {
                Id = 2,
                FirstName = "John",
                LastName = "Doe",
                Email = "john.doe@email.com",
                Phone = "555-1002",
                Address = "456 Oak St, City, State 12345",
                DateOfBirth = new DateTime(1990, 1, 1),
                CountryOfOrigin = "Canada",
                AssignedAttorneyId = attorney2.Id, // Assigned to attorney2, not attorney1
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                CreatedBy = "System",
                UpdatedBy = "System"
            };

            context.Attorneys.Add(attorney2);
            context.Clients.Add(client2);
            await context.SaveChangesAsync();
        }

        var httpClient = CreateAuthenticatedClient("LegalProfessional", attorney.Id); // attorney1
        
        var pdfBytes = CreateTestPdfBytes();
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(pdfBytes);
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");
        content.Add(fileContent, "document", "unauthorized.pdf");
        content.Add(new StringContent("PersonalDocuments"), "category");

        // Act - Try to upload to client2 (assigned to attorney2)
        var response = await httpClient.PostAsync("v1/clients/2/documents", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task UploadClientDocument_WithInvalidFileType_ReturnsBadRequest()
    {
        // Arrange
        var (attorney, client) = await SeedTestDataAsync();
        var httpClient = CreateAuthenticatedClient("LegalProfessional", attorney.Id);
        
        var executableBytes = new byte[] { 0x4D, 0x5A }; // MZ header (executable)
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(executableBytes);
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/octet-stream");
        content.Add(fileContent, "document", "malicious.exe");
        content.Add(new StringContent("PersonalDocuments"), "category");

        // Act
        var response = await httpClient.PostAsync($"v1/clients/{client.Id}/documents", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetClientDocuments_ReturnsDocumentsList()
    {
        // Arrange
        var (attorney, client) = await SeedTestDataAsync();
        
        // Create test documents
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
            
            var documents = new[]
            {
                new Document
                {
                    Id = 1,
                    ClientId = client.Id,
                    FileName = "doc1.pdf",
                    OriginalFileName = "passport.pdf",
                    FileUrl = "/documents/client1/doc1.pdf",
                    ContentType = "application/pdf",
                    FileSize = 1024,
                    Category = DocumentCategory.PersonalDocuments,
                    Description = "Passport copy",
                    UploadDate = DateTime.UtcNow,
                    UploadedBy = "Attorney"
                },
                new Document
                {
                    Id = 2,
                    ClientId = client.Id,
                    FileName = "doc2.png",
                    OriginalFileName = "id-card.png",
                    FileUrl = "/documents/client1/doc2.png",
                    ContentType = "image/png",
                    FileSize = 2048,
                    Category = DocumentCategory.PersonalDocuments,
                    Description = "ID card scan",
                    UploadDate = DateTime.UtcNow,
                    UploadedBy = "Attorney"
                }
            };

            context.Documents.AddRange(documents);
            await context.SaveChangesAsync();
        }

        var httpClient = CreateAuthenticatedClient("LegalProfessional", attorney.Id);

        // Act
        var response = await httpClient.GetAsync($"v1/clients/{client.Id}/documents");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<List<DocumentResponse>>(_jsonOptions);
        result.Should().NotBeNull();
        result!.Count.Should().Be(2);
        result.Should().Contain(d => d.OriginalFileName == "passport.pdf");
        result.Should().Contain(d => d.OriginalFileName == "id-card.png");
    }

    [Fact]
    public async Task GetClientDocuments_WithCategoryFilter_ReturnsFilteredResults()
    {
        // Arrange
        var (attorney, client) = await SeedTestDataAsync();
        
        // Create test documents with different categories
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
            
            var documents = new[]
            {
                new Document
                {
                    ClientId = client.Id,
                    FileName = "passport.pdf",
                    OriginalFileName = "passport.pdf",
                    FileUrl = "/documents/client1/passport.pdf",
                    ContentType = "application/pdf",
                    FileSize = 1024,
                    Category = DocumentCategory.PersonalDocuments,
                    Description = "Passport copy",
                    UploadDate = DateTime.UtcNow,
                    UploadedBy = "Attorney"
                },
                new Document
                {
                    ClientId = client.Id,
                    FileName = "form.pdf",
                    OriginalFileName = "i-130.pdf",
                    FileUrl = "/documents/client1/form.pdf",
                    ContentType = "application/pdf",
                    FileSize = 2048,
                    Category = DocumentCategory.GovernmentForms,
                    Description = "I-130 form",
                    UploadDate = DateTime.UtcNow,
                    UploadedBy = "Attorney"
                }
            };

            context.Documents.AddRange(documents);
            await context.SaveChangesAsync();
        }

        var httpClient = CreateAuthenticatedClient("LegalProfessional", attorney.Id);

        // Act
        var response = await httpClient.GetAsync($"v1/clients/{client.Id}/documents?category=PersonalDocuments");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<List<DocumentResponse>>(_jsonOptions);
        result.Should().NotBeNull();
        result!.Count.Should().Be(1);
        result[0].Category.Should().Be(DocumentCategory.PersonalDocuments);
    }

    [Fact]
    public async Task DownloadDocument_WithValidId_ReturnsFile()
    {
        // Arrange
        var (attorney, client) = await SeedTestDataAsync();
        
        // Create test document
        int documentId;
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
            
            var document = new Document
            {
                ClientId = client.Id,
                FileName = "test.pdf",
                OriginalFileName = "test-document.pdf",
                FileUrl = "/documents/client1/test.pdf",
                ContentType = "application/pdf",
                FileSize = 1024,
                Category = DocumentCategory.PersonalDocuments,
                Description = "Test document",
                UploadDate = DateTime.UtcNow,
                UploadedBy = "Attorney"
            };

            context.Documents.Add(document);
            await context.SaveChangesAsync();
            documentId = document.Id;
        }

        var httpClient = CreateAuthenticatedClient("LegalProfessional", attorney.Id);

        // Act
        var response = await httpClient.GetAsync($"v1/documents/{documentId}/download");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/pdf");
        response.Content.Headers.ContentDisposition?.DispositionType.Should().Be("attachment");
        response.Content.Headers.ContentDisposition?.FileName.Should().Be("\"test-document.pdf\"");
    }

    [Fact]
    public async Task DeleteDocument_WithValidId_ReturnsSuccess()
    {
        // Arrange
        var (attorney, client) = await SeedTestDataAsync();
        
        // Create test document
        int documentId;
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
            
            var document = new Document
            {
                ClientId = client.Id,
                FileName = "to-delete.pdf",
                OriginalFileName = "document-to-delete.pdf",
                FileUrl = "/documents/client1/to-delete.pdf",
                ContentType = "application/pdf",
                FileSize = 1024,
                Category = DocumentCategory.PersonalDocuments,
                Description = "Document to delete",
                UploadDate = DateTime.UtcNow,
                UploadedBy = "Attorney"
            };

            context.Documents.Add(document);
            await context.SaveChangesAsync();
            documentId = document.Id;
        }

        var httpClient = CreateAuthenticatedClient("LegalProfessional", attorney.Id);

        // Act
        var response = await httpClient.DeleteAsync($"v1/documents/{documentId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        
        // Verify deletion
        using var scope2 = _factory.Services.CreateScope();
        var context2 = scope2.ServiceProvider.GetRequiredService<L4HDbContext>();
        var deletedDocument = await context2.Documents.FindAsync(documentId);
        deletedDocument.Should().BeNull();
    }

    #endregion

    #region File Security and Validation Tests

    [Fact]
    public async Task UploadDocument_WithMaliciousFileName_SanitizesFileName()
    {
        // Arrange
        var (attorney, client) = await SeedTestDataAsync();
        var httpClient = CreateAuthenticatedClient("LegalProfessional", attorney.Id);
        
        var pdfBytes = CreateTestPdfBytes();
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(pdfBytes);
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");
        content.Add(fileContent, "document", "../../../malicious.pdf"); // Path traversal attempt
        content.Add(new StringContent("PersonalDocuments"), "category");

        // Act
        var response = await httpClient.PostAsync($"v1/clients/{client.Id}/documents", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var result = await response.Content.ReadFromJsonAsync<DocumentUploadResponse>(_jsonOptions);
        result.Should().NotBeNull();
        result!.FileName.Should().NotContain("../");
        result.FileName.Should().NotContain("malicious");
    }

    [Fact]
    public async Task UploadDocument_WithEmptyFile_ReturnsBadRequest()
    {
        // Arrange
        var (attorney, client) = await SeedTestDataAsync();
        var httpClient = CreateAuthenticatedClient("LegalProfessional", attorney.Id);
        
        var emptyBytes = new byte[0];
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(emptyBytes);
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/pdf");
        content.Add(fileContent, "document", "empty.pdf");
        content.Add(new StringContent("PersonalDocuments"), "category");

        // Act
        var response = await httpClient.PostAsync($"v1/clients/{client.Id}/documents", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Theory]
    [InlineData("application/pdf", "document.pdf", true)]
    [InlineData("application/msword", "document.doc", true)]
    [InlineData("application/vnd.openxmlformats-officedocument.wordprocessingml.document", "document.docx", true)]
    [InlineData("image/jpeg", "image.jpg", true)]
    [InlineData("image/png", "image.png", true)]
    [InlineData("image/gif", "image.gif", true)]
    [InlineData("application/x-executable", "malware.exe", false)]
    [InlineData("application/javascript", "script.js", false)]
    [InlineData("text/html", "page.html", false)]
    public async Task UploadDocument_WithVariousFileTypes_ValidatesCorrectly(string contentType, string fileName, bool shouldSucceed)
    {
        // Arrange
        var (attorney, client) = await SeedTestDataAsync();
        var httpClient = CreateAuthenticatedClient("LegalProfessional", attorney.Id);
        
        var testBytes = contentType.StartsWith("image/") ? CreateTestImageBytes() : CreateTestPdfBytes();
        var content = new MultipartFormDataContent();
        var fileContent = new ByteArrayContent(testBytes);
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);
        content.Add(fileContent, "document", fileName);
        content.Add(new StringContent("PersonalDocuments"), "category");

        // Act
        var response = await httpClient.PostAsync($"v1/clients/{client.Id}/documents", content);

        // Assert
        if (shouldSucceed)
        {
            response.StatusCode.Should().Be(HttpStatusCode.Created);
        }
        else
        {
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }
    }

    #endregion

    #region Document Organization Tests

    [Fact]
    public async Task UpdateDocumentCategory_WithValidData_ReturnsSuccess()
    {
        // Arrange
        var (attorney, client) = await SeedTestDataAsync();
        
        // Create test document
        int documentId;
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
            
            var document = new Document
            {
                ClientId = client.Id,
                FileName = "test.pdf",
                OriginalFileName = "test-document.pdf",
                FileUrl = "/documents/client1/test.pdf",
                ContentType = "application/pdf",
                FileSize = 1024,
                Category = DocumentCategory.PersonalDocuments,
                Description = "Test document",
                UploadDate = DateTime.UtcNow,
                UploadedBy = "Attorney"
            };

            context.Documents.Add(document);
            await context.SaveChangesAsync();
            documentId = document.Id;
        }

        var httpClient = CreateAuthenticatedClient("LegalProfessional", attorney.Id);
        
        var updateRequest = new UpdateDocumentRequest
        {
            Category = DocumentCategory.GovernmentForms,
            Description = "Updated description"
        };

        // Act
        var response = await httpClient.PutAsJsonAsync($"v1/documents/{documentId}", updateRequest, _jsonOptions);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<DocumentResponse>(_jsonOptions);
        result.Should().NotBeNull();
        result!.Category.Should().Be(DocumentCategory.GovernmentForms);
        result.Description.Should().Be("Updated description");
    }

    [Fact]
    public async Task GetDocumentsByCategory_ReturnsOrganizedResults()
    {
        // Arrange
        var (attorney, client) = await SeedTestDataAsync();
        
        // Create documents in different categories
        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<L4HDbContext>();
            
            var documents = new[]
            {
                new Document
                {
                    ClientId = client.Id,
                    FileName = "passport.pdf",
                    OriginalFileName = "passport.pdf",
                    FileUrl = "/documents/client1/passport.pdf",
                    ContentType = "application/pdf",
                    FileSize = 1024,
                    Category = DocumentCategory.PersonalDocuments,
                    Description = "Passport",
                    UploadDate = DateTime.UtcNow,
                    UploadedBy = "Attorney"
                },
                new Document
                {
                    ClientId = client.Id,
                    FileName = "form.pdf",
                    OriginalFileName = "i-130.pdf",
                    FileUrl = "/documents/client1/form.pdf",
                    ContentType = "application/pdf",
                    FileSize = 2048,
                    Category = DocumentCategory.GovernmentForms,
                    Description = "I-130 form",
                    UploadDate = DateTime.UtcNow,
                    UploadedBy = "Attorney"
                },
                new Document
                {
                    ClientId = client.Id,
                    FileName = "evidence.pdf",
                    OriginalFileName = "marriage-cert.pdf",
                    FileUrl = "/documents/client1/evidence.pdf",
                    ContentType = "application/pdf",
                    FileSize = 1536,
                    Category = DocumentCategory.SupportingEvidence,
                    Description = "Marriage certificate",
                    UploadDate = DateTime.UtcNow,
                    UploadedBy = "Attorney"
                }
            };

            context.Documents.AddRange(documents);
            await context.SaveChangesAsync();
        }

        var httpClient = CreateAuthenticatedClient("LegalProfessional", attorney.Id);

        // Act
        var response = await httpClient.GetAsync($"v1/clients/{client.Id}/documents/by-category");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<Dictionary<string, List<DocumentResponse>>>(_jsonOptions);
        result.Should().NotBeNull();
        result!.Should().ContainKey("PersonalDocuments");
        result.Should().ContainKey("GovernmentForms");
        result.Should().ContainKey("SupportingEvidence");
        result["PersonalDocuments"].Count.Should().Be(1);
        result["GovernmentForms"].Count.Should().Be(1);
        result["SupportingEvidence"].Count.Should().Be(1);
    }

    #endregion
}

// Request/Response models for testing
public class AttorneyPhotoUploadResponse
{
    public string PhotoUrl { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
}

public class DocumentUploadResponse
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public DocumentCategory Category { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime UploadDate { get; set; }
}

public class DocumentResponse
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public DocumentCategory Category { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime UploadDate { get; set; }
    public string UploadedBy { get; set; } = string.Empty;
}

public class UpdateDocumentRequest
{
    public DocumentCategory Category { get; set; }
    public string Description { get; set; } = string.Empty;
}