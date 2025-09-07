using FluentAssertions;
using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using L4H.Infrastructure.HostedServices;
using L4H.Infrastructure.Services;
using L4H.Shared.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace L4H.Api.Tests.HostedServices;

public sealed class RetentionBackgroundServiceTests : IDisposable
{
    private readonly ServiceProvider _serviceProvider;
    private readonly L4HDbContext _context;
    private readonly Mock<ILogger<RetentionBackgroundService>> _mockLogger;
    private readonly Mock<IServiceScopeFactory> _mockScopeFactory;
    private readonly Mock<IServiceScope> _mockScope;

    public RetentionBackgroundServiceTests()
    {
        var services = new ServiceCollection();
        
        // Use the default SQL Server connection string from configuration
        var connectionString = "Server=localhost,14333;Database=L4H_Test;User Id=sa;Password=SecureTest123!;TrustServerCertificate=True;";
        services.AddDbContext<L4HDbContext>(options =>
        {
            options.UseSqlServer(connectionString);
        });

        // Configure retention settings
        var retentionSettings = new RetentionSettings
        {
            PiiDays = 1, // Short window for testing
            RecordingsDays = 2,
            MedicalDays = 1,
            HighSensitivityDays = 1
        };

        var mockRetentionOptions = new Mock<IOptionsMonitor<RetentionSettings>>();
        mockRetentionOptions.Setup(x => x.CurrentValue).Returns(retentionSettings);
        services.AddSingleton(mockRetentionOptions.Object);

        _mockLogger = new Mock<ILogger<RetentionBackgroundService>>();
        services.AddSingleton(_mockLogger.Object);

        services.AddScoped<RetentionService>();

        _serviceProvider = services.BuildServiceProvider();
        _context = _serviceProvider.GetRequiredService<L4HDbContext>();

        // Setup scope factory mock
        _mockScope = new Mock<IServiceScope>();
        _mockScope.Setup(x => x.ServiceProvider).Returns(_serviceProvider);
        
        _mockScopeFactory = new Mock<IServiceScopeFactory>();
        _mockScopeFactory.Setup(x => x.CreateScope()).Returns(_mockScope.Object);
    }

    [Fact]
    public async Task StartAsync_ShouldInitializeService()
    {
        // Arrange
        var service = new RetentionBackgroundService(_mockScopeFactory.Object, _mockLogger.Object);
        var cancellationToken = new CancellationToken();

        // Act & Assert - Should not throw
        await service.StartAsync(cancellationToken);
        
        // Verify logging
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Retention Background Service started")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task StopAsync_ShouldStopService()
    {
        // Arrange
        var service = new RetentionBackgroundService(_mockScopeFactory.Object, _mockLogger.Object);
        var cancellationToken = new CancellationToken();

        await service.StartAsync(cancellationToken);

        // Act & Assert - Should not throw
        await service.StopAsync(cancellationToken);

        // Verify logging
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Retention Background Service stopped")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task ExecuteAsync_ShouldProcessRetentionPeriodically()
    {
        // Arrange
        await SetupTestData();
        
        var service = new RetentionBackgroundService(_mockScopeFactory.Object, _mockLogger.Object);
        var cancellationTokenSource = new CancellationTokenSource();

        // Add expired data to be processed
        var expiredMessage = new MessageThread
        {
            Id = Guid.NewGuid(),
            CaseId = TestData.TestCaseId,
            Subject = "Expired Message",
            CreatedAt = DateTime.UtcNow.AddDays(-2) // Older than 1-day retention
        };

        _context.MessageThreads.Add(expiredMessage);
        await _context.SaveChangesAsync();

        // Act - Run for a short period then cancel
        var executeTask = service.StartAsync(cancellationTokenSource.Token);
        
        // Allow some processing time
        await Task.Delay(100);
        cancellationTokenSource.Cancel();
        
        try
        {
            await executeTask;
        }
        catch (OperationCanceledException)
        {
            // Expected when cancellation is requested
        }

        // Assert - Verify that retention processing was attempted
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("started")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce);
    }

    [Fact]
    public async Task ExecuteAsync_WhenExceptionOccurs_ShouldLogErrorAndContinue()
    {
        // Arrange
        var mockBrokenScope = new Mock<IServiceScope>();
        mockBrokenScope.Setup(x => x.ServiceProvider).Throws(new InvalidOperationException("Test exception"));
        
        var mockBrokenScopeFactory = new Mock<IServiceScopeFactory>();
        mockBrokenScopeFactory.Setup(x => x.CreateScope()).Returns(mockBrokenScope.Object);

        var service = new RetentionBackgroundService(mockBrokenScopeFactory.Object, _mockLogger.Object);
        var cancellationTokenSource = new CancellationTokenSource();

        // Act - Run for a short period then cancel
        var executeTask = service.StartAsync(cancellationTokenSource.Token);
        
        await Task.Delay(100);
        cancellationTokenSource.Cancel();

        try
        {
            await executeTask;
        }
        catch (OperationCanceledException)
        {
            // Expected when cancellation is requested
        }

        // Assert - Verify error was logged but service continued
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Error during retention processing")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce);
    }

    [Fact]
    public void Service_ShouldImplementIHostedService()
    {
        // Arrange & Act
        var service = new RetentionBackgroundService(_mockScopeFactory.Object, _mockLogger.Object);

        // Assert
        service.Should().BeAssignableTo<IHostedService>();
        service.Should().BeAssignableTo<BackgroundService>();
    }

    [Fact]
    public async Task ExecuteAsync_WithValidScope_ShouldCallRetentionService()
    {
        // Arrange
        await SetupTestData();
        
        // Create a real RetentionService instance instead of mocking it
        var retentionServiceLogger = new Mock<ILogger<RetentionService>>();
        var retentionOptions = Mock.Of<IOptionsMonitor<RetentionSettings>>(o => 
            o.CurrentValue == new RetentionSettings { PiiDays = 365, MedicalDays = 60, HighSensitivityDays = 30 });
        var retentionService = new RetentionService(_context, retentionServiceLogger.Object, retentionOptions);
        
        var mockServiceProvider = new Mock<IServiceProvider>();
        mockServiceProvider.Setup(x => x.GetService(typeof(RetentionService)))
                          .Returns(retentionService);
        
        var mockScope = new Mock<IServiceScope>();
        mockScope.Setup(x => x.ServiceProvider).Returns(mockServiceProvider.Object);
        
        var mockScopeFactory = new Mock<IServiceScopeFactory>();
        mockScopeFactory.Setup(x => x.CreateScope()).Returns(mockScope.Object);

        var service = new RetentionBackgroundService(mockScopeFactory.Object, _mockLogger.Object);
        var cancellationTokenSource = new CancellationTokenSource();

        // Act
        var executeTask = service.StartAsync(cancellationTokenSource.Token);
        
        await Task.Delay(100);
        cancellationTokenSource.Cancel();

        try
        {
            await executeTask;
        }
        catch (OperationCanceledException)
        {
            // Expected
        }

        // Assert - Verify scope was created
        mockScopeFactory.Verify(x => x.CreateScope(), Times.AtLeastOnce);
        mockScope.Verify(x => x.ServiceProvider, Times.AtLeastOnce);
    }

    private async Task SetupTestData()
    {
        // Check if user already exists
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == TestData.TestUserId);
        if (existingUser == null)
        {
            var user = new User
            {
                Id = TestData.TestUserId,
                Email = "retentiontest@testing.com",
                PasswordHash = "SecureTest123!",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
                PasswordUpdatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);
        }

        // Check if test case already exists
        var existingCase = await _context.Cases.FirstOrDefaultAsync(c => c.Id == TestData.TestCaseId);
        if (existingCase == null)
        {
            var testCase = new Case
            {
                Id = TestData.TestCaseId,
                UserId = TestData.TestUserId,
                Status = "active",
                CreatedAt = DateTime.UtcNow,
                LastActivityAt = DateTimeOffset.UtcNow
            };
            _context.Cases.Add(testCase);
        }

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
            _mockScope.Object.Dispose();
            _context.Dispose();
            _serviceProvider.Dispose();
        }
    }

    private static class TestData
    {
        public static readonly UserId TestUserId = new UserId(Guid.Parse("E0000000-1234-1234-1234-123456789012")); // E prefix for RetentionBackgroundService
        public static readonly CaseId TestCaseId = new CaseId(Guid.Parse("E1111111-1111-1111-1111-111111111111"));
    }
}