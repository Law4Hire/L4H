using Xunit;
using FluentAssertions;

namespace L4H.Tests.Infrastructure
{
    public class SimpleTest
    {
        [Fact]
        public void SimpleTest_ShouldPass()
        {
            // Arrange
            var expected = 42;
            
            // Act
            var actual = 42;
            
            // Assert
            actual.Should().Be(expected);
        }
    }
}