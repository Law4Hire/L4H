using FluentAssertions;
using L4H.Api.Models;
using L4H.Api.Services;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Text;
using Xunit;

namespace L4H.Api.Tests.Services;

public sealed class AntivirusScanServiceTests : IDisposable
{
    private readonly string _tempBasePath;
    private readonly UploadOptions _uploadOptions;
    private readonly DbContextOptions<L4HDbContext> _dbOptions;
    private readonly Mock<IServiceScopeFactory> _scopeFactoryMock;
    private readonly Mock<IServiceScope> _scopeMock;
    private readonly Mock<IServiceProvider> _serviceProviderMock;
    private readonly Mock<ILogger<AntivirusScanService>> _loggerMock;

    public AntivirusScanServiceTests()
    {
        _tempBasePath = Path.Combine(Path.GetTempPath(), "antivirus-tests", Guid.NewGuid().ToString());
        Directory.CreateDirectory(_tempBasePath);

        _uploadOptions = new UploadOptions
        {
            BasePath = _tempBasePath,
            QuarantineSubdir = "quarantine",
            CleanSubdir = "clean"
        };

        // Setup in-memory database
        _dbOptions = new DbContextOptionsBuilder<L4HDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // Setup mocks
        _scopeFactoryMock = new Mock<IServiceScopeFactory>();
        _scopeMock = new Mock<IServiceScope>();
        _serviceProviderMock = new Mock<IServiceProvider>();
        _loggerMock = new Mock<ILogger<AntivirusScanService>>();

        _scopeFactoryMock.Setup(f => f.CreateScope()).Returns(_scopeMock.Object);
        _scopeMock.Setup(s => s.ServiceProvider).Returns(_serviceProviderMock.Object);
    }

    [Fact]
    public async Task ProcessUpload_WithCleanFile_ShouldMoveToCleanDirectory()
    {
        // Arrange
        using var context = new L4HDbContext(_dbOptions);
        await context.Database.EnsureCreatedAsync();

        var caseId = new CaseId(Guid.NewGuid());
        var token = Guid.NewGuid().ToString();
        var filename = "clean-file.txt";
        var upload = new Upload
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            OriginalName = filename,
            Key = $"{token}/{filename}",
            Status = "pending",
            Mime = "text/plain",
            SizeBytes = 100
        };

        context.Uploads.Add(upload);
        await context.SaveChangesAsync();

        // Create test file in quarantine
        var quarantineDir = Path.Combine(_tempBasePath, "quarantine", token);
        Directory.CreateDirectory(quarantineDir);
        var quarantineFile = Path.Combine(quarantineDir, filename);
        await File.WriteAllTextAsync(quarantineFile, "This is a clean test file");

        _serviceProviderMock.Setup(sp => sp.GetService(typeof(L4HDbContext)))
            .Returns(context);

        var service = new AntivirusScanService(
            _scopeFactoryMock.Object,
            _loggerMock.Object,
            Options.Create(_uploadOptions));

        // Act
        await InvokeProcessPendingScans(service, CancellationToken.None);

        // Assert
        var updatedUpload = await context.Uploads.FindAsync(upload.Id);
        updatedUpload!.Status.Should().Be("clean");
        updatedUpload.VerdictAt.Should().NotBeNull();
        updatedUpload.StorageUrl.Should().NotBeNullOrEmpty();

        // File should be moved to clean directory
        File.Exists(quarantineFile).Should().BeFalse();
        var cleanFiles = Directory.GetFiles(Path.Combine(_tempBasePath, "clean"), filename, SearchOption.AllDirectories);
        cleanFiles.Should().HaveCount(1);
        
        var cleanContent = await File.ReadAllTextAsync(cleanFiles[0]);
        cleanContent.Should().Be("This is a clean test file");

        // Quarantine directory should be cleaned up
        Directory.Exists(quarantineDir).Should().BeFalse();
    }

    [Fact]
    public async Task ProcessUpload_WithEicarFile_ShouldMarkAsInfectedAndDelete()
    {
        // Arrange
        using var context = new L4HDbContext(_dbOptions);
        await context.Database.EnsureCreatedAsync();

        var caseId = new CaseId(Guid.NewGuid());
        var token = Guid.NewGuid().ToString();
        var filename = "eicar.txt";
        var upload = new Upload
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            OriginalName = filename,
            Key = $"{token}/{filename}",
            Status = "pending",
            Mime = "text/plain",
            SizeBytes = 100
        };

        context.Uploads.Add(upload);
        await context.SaveChangesAsync();

        // Create EICAR test file in quarantine
        var quarantineDir = Path.Combine(_tempBasePath, "quarantine", token);
        Directory.CreateDirectory(quarantineDir);
        var quarantineFile = Path.Combine(quarantineDir, filename);
        await File.WriteAllTextAsync(quarantineFile, "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*");

        _serviceProviderMock.Setup(sp => sp.GetService(typeof(L4HDbContext)))
            .Returns(context);

        var service = new AntivirusScanService(
            _scopeFactoryMock.Object,
            _loggerMock.Object,
            Options.Create(_uploadOptions));

        // Act
        await InvokeProcessPendingScans(service, CancellationToken.None);

        // Assert
        var updatedUpload = await context.Uploads.FindAsync(upload.Id);
        updatedUpload!.Status.Should().Be("infected");
        updatedUpload.VerdictAt.Should().NotBeNull();

        // File and directory should be deleted
        File.Exists(quarantineFile).Should().BeFalse();
        Directory.Exists(quarantineDir).Should().BeFalse();

        // No clean files should exist
        var cleanDir = Path.Combine(_tempBasePath, "clean");
        if (Directory.Exists(cleanDir))
        {
            Directory.GetFiles(cleanDir, "*", SearchOption.AllDirectories).Should().BeEmpty();
        }
    }

    [Fact]
    public async Task ProcessUpload_WithMissingFile_ShouldMarkAsRejected()
    {
        // Arrange
        using var context = new L4HDbContext(_dbOptions);
        await context.Database.EnsureCreatedAsync();

        var caseId = new CaseId(Guid.NewGuid());
        var token = Guid.NewGuid().ToString();
        var filename = "missing-file.txt";
        var upload = new Upload
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            OriginalName = filename,
            Key = $"{token}/{filename}",
            Status = "pending",
            Mime = "text/plain",
            SizeBytes = 100
        };

        context.Uploads.Add(upload);
        await context.SaveChangesAsync();

        // Note: NOT creating the file - it should be missing

        _serviceProviderMock.Setup(sp => sp.GetService(typeof(L4HDbContext)))
            .Returns(context);

        var service = new AntivirusScanService(
            _scopeFactoryMock.Object,
            _loggerMock.Object,
            Options.Create(_uploadOptions));

        // Act
        await InvokeProcessPendingScans(service, CancellationToken.None);

        // Assert
        var updatedUpload = await context.Uploads.FindAsync(upload.Id);
        updatedUpload!.Status.Should().Be("rejected");
        updatedUpload.VerdictAt.Should().NotBeNull();
    }

    [Fact]
    public async Task ProcessUpload_WithHeicFile_ShouldLogHeicDetection()
    {
        // Arrange
        using var context = new L4HDbContext(_dbOptions);
        await context.Database.EnsureCreatedAsync();

        var caseId = new CaseId(Guid.NewGuid());
        var token = Guid.NewGuid().ToString();
        var filename = "photo.heic";
        var upload = new Upload
        {
            Id = Guid.NewGuid(),
            CaseId = caseId,
            OriginalName = filename,
            Key = $"{token}/{filename}",
            Status = "pending",
            Mime = "image/heic",
            SizeBytes = 100
        };

        context.Uploads.Add(upload);
        await context.SaveChangesAsync();

        // Create test HEIC file in quarantine
        var quarantineDir = Path.Combine(_tempBasePath, "quarantine", token);
        Directory.CreateDirectory(quarantineDir);
        var quarantineFile = Path.Combine(quarantineDir, filename);
        await File.WriteAllTextAsync(quarantineFile, "fake heic content");

        _serviceProviderMock.Setup(sp => sp.GetService(typeof(L4HDbContext)))
            .Returns(context);

        var service = new AntivirusScanService(
            _scopeFactoryMock.Object,
            _loggerMock.Object,
            Options.Create(_uploadOptions));

        // Act
        await InvokeProcessPendingScans(service, CancellationToken.None);

        // Assert
        var updatedUpload = await context.Uploads.FindAsync(upload.Id);
        updatedUpload!.Status.Should().Be("clean"); // Should still be processed as clean

        // Verify HEIC detection was logged
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("HEIC file detected")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    // Helper method to access private method via reflection
    private static async Task InvokeProcessPendingScans(AntivirusScanService service, CancellationToken cancellationToken)
    {
        var method = typeof(AntivirusScanService).GetMethod("ProcessPendingScans", 
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        
        var task = (Task)method!.Invoke(service, new object[] { cancellationToken })!;
        await task;
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
            if (Directory.Exists(_tempBasePath))
            {
                Directory.Delete(_tempBasePath, true);
            }
        }
    }
}