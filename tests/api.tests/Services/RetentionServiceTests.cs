using FluentAssertions;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Services;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace L4H.Api.Tests.Services;

public sealed class RetentionServiceTests : IDisposable
{
    private readonly ServiceProvider _serviceProvider;
    private readonly L4HDbContext _context;
    private readonly Mock<ILogger<RetentionService>> _mockLogger;
    private readonly IOptionsMonitor<RetentionSettings> _retentionOptions;

    public RetentionServiceTests()
    {
        var services = new ServiceCollection();
        
        services.AddDbContext<L4HDbContext>(options =>
        {
            options.UseInMemoryDatabase($"RetentionServiceTests_{Guid.NewGuid()}");
        });

        _mockLogger = new Mock<ILogger<RetentionService>>();
        services.AddSingleton(_mockLogger.Object);

        // Configure retention settings with test-friendly short windows
        var retentionSettings = new RetentionSettings
        {
            PiiDays = 1, // 1 day for testing instead of 365
            RecordingsDays = 2, // 2 days for testing instead of 730
            MedicalDays = 1, // 1 day for testing instead of 60
            HighSensitivityDays = 1 // 1 day for testing instead of 30
        };

        var mockOptions = new Mock<IOptionsMonitor<RetentionSettings>>();
        mockOptions.Setup(x => x.CurrentValue).Returns(retentionSettings);
        _retentionOptions = mockOptions.Object;
        services.AddSingleton(_retentionOptions);

        services.AddScoped<RetentionService>();

        _serviceProvider = services.BuildServiceProvider();
        _context = _serviceProvider.GetRequiredService<L4HDbContext>();
    }

    [Fact]
    public async Task ProcessRetentionQueue_WithExpiredMessages_ShouldMarkForPurge()
    {
        // Arrange
        await SetupTestData();
        var service = _serviceProvider.GetRequiredService<RetentionService>();
        var testTime = DateTime.UtcNow;

        // Create messages older than retention period (PiiDays = 1)
        var expiredMessage = new MessageThread
        {
            Id = Guid.NewGuid(),
            CaseId = TestData.TestCaseId,
            Subject = "Expired Message",
            CreatedAt = testTime.AddDays(-2) // 2 days old, exceeds 1-day retention
        };

        var recentMessage = new MessageThread
        {
            Id = Guid.NewGuid(),
            CaseId = TestData.TestCaseId,
            Subject = "Recent Message",
            CreatedAt = testTime.AddHours(-12) // 12 hours old, within 1-day retention
        };

        _context.MessageThreads.AddRange(expiredMessage, recentMessage);
        await _context.SaveChangesAsync();

        // Act
        await service.ProcessRetentionQueueAsync(testTime);

        // Assert
        var queueItems = await _context.RetentionQueues
            .Where(q => q.Category == "messages")
            .ToListAsync();

        queueItems.Should().HaveCount(1);
        var queueItem = queueItems.First();
        queueItem.TargetId.Should().Be(expiredMessage.Id.ToString());
        queueItem.Action.Should().Be(RetentionAction.Delete);
        queueItem.EnqueuedAt.Should().BeCloseTo(testTime, TimeSpan.FromSeconds(1));
        queueItem.ProcessedAt.Should().BeNull();
    }

    [Fact]
    public async Task ProcessRetentionQueue_WithExpiredRecordings_ShouldMarkForPurge()
    {
        // Arrange
        await SetupTestData();
        var service = _serviceProvider.GetRequiredService<RetentionService>();
        var testTime = DateTime.UtcNow;

        // Create recordings older than retention period (RecordingsDays = 2)
        var expiredSession = new InterviewSession
        {
            Id = Guid.NewGuid(),
            CaseId = TestData.TestCaseId,
            Status = "completed",
            StartedAt = testTime.AddDays(-3), // 3 days old, exceeds 2-day retention
            FinishedAt = testTime.AddDays(-3)
        };

        var recentSession = new InterviewSession
        {
            Id = Guid.NewGuid(),
            CaseId = TestData.TestCaseId,
            Status = "completed",
            StartedAt = testTime.AddDays(-1), // 1 day old, within 2-day retention
            FinishedAt = testTime.AddDays(-1)
        };

        _context.InterviewSessions.AddRange(expiredSession, recentSession);
        await _context.SaveChangesAsync();

        // Act
        await service.ProcessRetentionQueueAsync(testTime);

        // Assert
        var queueItems = await _context.RetentionQueues
            .Where(q => q.Category == "recordings")
            .ToListAsync();

        queueItems.Should().HaveCount(1);
        var queueItem = queueItems.First();
        queueItem.TargetId.Should().Be(expiredSession.Id.ToString());
        queueItem.Action.Should().Be(RetentionAction.Delete);
    }

    [Fact]
    public async Task ProcessRetentionQueue_WithExpiredMedicalDocuments_ShouldMarkForMasking()
    {
        // Arrange
        await SetupTestData();
        var service = _serviceProvider.GetRequiredService<RetentionService>();
        var testTime = DateTime.UtcNow;

        // Create medical uploads older than retention period (MedicalDays = 1)
        var expiredMedical = new Upload
        {
            Id = Guid.NewGuid(),
            CaseId = TestData.TestCaseId,
            OriginalName = "medical-record.pdf",
            CreatedAt = testTime.AddDays(-2) // 2 days old, exceeds 1-day retention
        };

        var recentMedical = new Upload
        {
            Id = Guid.NewGuid(),
            CaseId = TestData.TestCaseId,
            OriginalName = "recent-medical.pdf",
            CreatedAt = testTime.AddHours(-12) // 12 hours old, within 1-day retention
        };

        _context.Uploads.AddRange(expiredMedical, recentMedical);
        await _context.SaveChangesAsync();

        // Act
        await service.ProcessRetentionQueueAsync(testTime);

        // Assert
        var queueItems = await _context.RetentionQueues
            .Where(q => q.Category == "medical")
            .ToListAsync();

        queueItems.Should().HaveCount(1);
        var queueItem = queueItems.First();
        queueItem.TargetId.Should().Be(expiredMedical.Id.ToString());
        queueItem.Action.Should().Be(RetentionAction.Mask);
    }

    [Fact]
    public async Task ExecuteQueuedRetentionActions_WithPurgeAction_ShouldDeleteEntity()
    {
        // Arrange
        await SetupTestData();
        var service = _serviceProvider.GetRequiredService<RetentionService>();
        
        var messageToDelete = new MessageThread
        {
            Id = Guid.NewGuid(),
            CaseId = TestData.TestCaseId,
            Subject = "Message to Delete",
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };

        _context.MessageThreads.Add(messageToDelete);

        var queueItem = new RetentionQueue
        {
            Id = Guid.NewGuid(),
            Category = "messages",
            TargetId = messageToDelete.Id.ToString(),
            Action = RetentionAction.Delete,
            EnqueuedAt = DateTime.UtcNow.AddMinutes(-5),
            ProcessedAt = null
        };

        _context.RetentionQueues.Add(queueItem);
        await _context.SaveChangesAsync();

        // Act
        await service.ExecuteQueuedRetentionActionsAsync();

        // Assert
        var deletedMessage = await _context.MessageThreads.FindAsync(messageToDelete.Id);
        deletedMessage.Should().BeNull();

        var processedQueueItem = await _context.RetentionQueues.FindAsync(queueItem.Id);
        processedQueueItem.Should().NotBeNull();
        processedQueueItem!.ProcessedAt.Should().NotBeNull();
        processedQueueItem.ProcessedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task ExecuteQueuedRetentionActions_WithMaskAction_ShouldMaskSensitiveData()
    {
        // Arrange
        await SetupTestData();
        var service = _serviceProvider.GetRequiredService<RetentionService>();
        
        var uploadToMask = new Upload
        {
            Id = Guid.NewGuid(),
            CaseId = TestData.TestCaseId,
            OriginalName = "medical-record-with-data.pdf",
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };

        _context.Uploads.Add(uploadToMask);

        var queueItem = new RetentionQueue
        {
            Id = Guid.NewGuid(),
            Category = "medical",
            TargetId = uploadToMask.Id.ToString(),
            Action = RetentionAction.Mask,
            EnqueuedAt = DateTime.UtcNow.AddMinutes(-5),
            ProcessedAt = null
        };

        _context.RetentionQueues.Add(queueItem);
        await _context.SaveChangesAsync();

        // Act
        await service.ExecuteQueuedRetentionActionsAsync();

        // Assert
        var maskedUpload = await _context.Uploads.FindAsync(uploadToMask.Id);
        maskedUpload.Should().NotBeNull();
        maskedUpload!.OriginalName.Should().Be("[REDACTED]");
        maskedUpload.Key.Should().Be("[REDACTED]");

        var processedQueueItem = await _context.RetentionQueues.FindAsync(queueItem.Id);
        processedQueueItem!.ProcessedAt.Should().NotBeNull();
    }

    private async Task SetupTestData()
    {
        var user = new User
        {
            Id = TestData.TestUserId,
            Email = "test@example.com",
            PasswordHash = "hashed-password",
            EmailVerified = true,
            CreatedAt = DateTime.UtcNow,
            PasswordUpdatedAt = DateTime.UtcNow
        };

        var testCase = new Case
        {
            Id = TestData.TestCaseId,
            UserId = TestData.TestUserId,
            Status = "active",
            CreatedAt = DateTime.UtcNow,
            LastActivityAt = DateTimeOffset.UtcNow
        };

        _context.Users.Add(user);
        _context.Cases.Add(testCase);
        await _context.SaveChangesAsync();
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
            _context.Dispose();
            _serviceProvider.Dispose();
        }
    }

    private static class TestData
    {
        public static readonly UserId TestUserId = new UserId(Guid.Parse("C0000000-1234-1234-1234-123456789012")); // Match TestAuthenticationHandler
        public static readonly CaseId TestCaseId = new CaseId(Guid.Parse("11111111-1111-1111-1111-111111111111"));
    }
}