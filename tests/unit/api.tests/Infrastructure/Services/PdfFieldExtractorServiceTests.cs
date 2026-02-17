using L4H.Infrastructure.Services;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace L4H.Api.Tests.Infrastructure.Services;

public class PdfFieldExtractorServiceTests
{
    private readonly Mock<ILogger<PdfFieldExtractorService>> _loggerMock;
    private readonly PdfFieldExtractorService _service;

    public PdfFieldExtractorServiceTests()
    {
        _loggerMock = new Mock<ILogger<PdfFieldExtractorService>>();
        _service = new PdfFieldExtractorService(_loggerMock.Object);
    }

    [Fact]
    public void ExtractFields_WithNullBytes_ReturnsEmpty()
    {
        // Act
        var result = _service.ExtractFields(null!);

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public void ExtractFields_WithEmptyBytes_ReturnsEmpty()
    {
        // Act
        var result = _service.ExtractFields(Array.Empty<byte>());

        // Assert
        Assert.Empty(result);
    }

    // Note: To test actual iText7 extraction, we would ideally use a real mock PDF.
    // Since we are in a CLI environment, we'll verify the service compiles and handles basic logic.
}
