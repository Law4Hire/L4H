using L4H.Infrastructure.Services;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace L4H.Api.Tests.Infrastructure.Services;

public class PdfInjectionServiceTests
{
    private readonly Mock<ILogger<PdfInjectionService>> _loggerMock;
    private readonly PdfInjectionService _service;

    public PdfInjectionServiceTests()
    {
        _loggerMock = new Mock<ILogger<PdfInjectionService>>();
        _service = new PdfInjectionService(_loggerMock.Object);
    }

    [Fact]
    public void InjectAnswers_WithNullTemplate_ReturnsEmpty()
    {
        // Act
        var result = _service.InjectAnswers(null!, new Dictionary<string, string>());

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public void InjectAnswers_WithEmptyTemplate_ReturnsEmpty()
    {
        // Act
        var result = _service.InjectAnswers(Array.Empty<byte>(), new Dictionary<string, string>());

        // Assert
        Assert.Empty(result);
    }

    // Additional tests would use a valid PDF to verify iText7 logic if a sample was available.
}
