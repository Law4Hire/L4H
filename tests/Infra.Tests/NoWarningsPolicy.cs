using FluentAssertions;
using Xunit;

namespace L4H.Infra.Tests;

public class NoWarningsPolicy
{
    [Fact]
    public void DirectoryBuildProps_ShouldExist()
    {
        // Arrange
        var buildPropsPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Directory.Build.props");

        // Act & Assert
        File.Exists(buildPropsPath).Should().BeTrue("Directory.Build.props should exist in the repository root");
    }

    [Fact]
    public void DirectoryBuildProps_ShouldHaveTreatWarningsAsErrors()
    {
        // Arrange
        var buildPropsPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Directory.Build.props");
        var buildPropsContent = File.ReadAllText(buildPropsPath);

        // Act & Assert
        buildPropsContent.Should().Contain("<TreatWarningsAsErrors>$(CI)</TreatWarningsAsErrors>", 
            "TreatWarningsAsErrors should be set to $(CI) to fail on warnings in CI");
    }

    [Fact]
    public void DirectoryBuildProps_ShouldHaveNullableEnabled()
    {
        // Arrange
        var buildPropsPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Directory.Build.props");
        var buildPropsContent = File.ReadAllText(buildPropsPath);

        // Act & Assert
        buildPropsContent.Should().Contain("<Nullable>enable</Nullable>", 
            "Nullable should be enabled for better null safety");
    }

    [Fact]
    public void DirectoryBuildProps_ShouldHaveAnalysisLevel()
    {
        // Arrange
        var buildPropsPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Directory.Build.props");
        var buildPropsContent = File.ReadAllText(buildPropsPath);

        // Act & Assert
        buildPropsContent.Should().Contain("<AnalysisLevel>latest</AnalysisLevel>", 
            "Analysis level should be set to latest for the most up-to-date analyzers");
    }

    [Fact]
    public void DirectoryBuildProps_ShouldHaveWarningsNotAsErrors()
    {
        // Arrange
        var buildPropsPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Directory.Build.props");
        var buildPropsContent = File.ReadAllText(buildPropsPath);

        // Act & Assert
        buildPropsContent.Should().Contain("<WarningsNotAsErrors>CS1591;CA1707</WarningsNotAsErrors>", 
            "Documentation and identifier naming warnings should not be treated as errors");
    }

    [Fact]
    public void EditorConfig_ShouldExist()
    {
        // Arrange
        // Find the repository root by looking for the solution file
        var currentDir = AppDomain.CurrentDomain.BaseDirectory;
        var solutionDir = currentDir;
        while (!File.Exists(Path.Combine(solutionDir, "L4H.sln")))
        {
            var parent = Directory.GetParent(solutionDir);
            if (parent == null) break;
            solutionDir = parent.FullName;
        }
        var editorConfigPath = Path.Combine(solutionDir, ".editorconfig");

        // Act & Assert
        File.Exists(editorConfigPath).Should().BeTrue("EditorConfig should exist in the repository root");
    }

    [Fact]
    public void EditorConfig_ShouldHaveKeyAnalyzersAsErrors()
    {
        // Arrange
        // Find the repository root by looking for the solution file
        var currentDir = AppDomain.CurrentDomain.BaseDirectory;
        var solutionDir = currentDir;
        while (!File.Exists(Path.Combine(solutionDir, "L4H.sln")))
        {
            var parent = Directory.GetParent(solutionDir);
            if (parent == null) break;
            solutionDir = parent.FullName;
        }
        var editorConfigPath = Path.Combine(solutionDir, ".editorconfig");
        var editorConfigContent = File.ReadAllText(editorConfigPath);

        // Act & Assert
        editorConfigContent.Should().Contain("dotnet_diagnostic.CA1305.severity = error", 
            "Culture-aware formatting should be an error");
        editorConfigContent.Should().Contain("dotnet_diagnostic.CA2007.severity = error", 
            "Dispose patterns should be an error");
        editorConfigContent.Should().Contain("dotnet_diagnostic.CA2016.severity = error", 
            "Cancellation token flow should be an error");
    }

    [Fact]
    public void EditorConfig_ShouldHaveSecurityAnalyzersAsErrors()
    {
        // Arrange
        // Find the repository root by looking for the solution file
        var currentDir = AppDomain.CurrentDomain.BaseDirectory;
        var solutionDir = currentDir;
        while (!File.Exists(Path.Combine(solutionDir, "L4H.sln")))
        {
            var parent = Directory.GetParent(solutionDir);
            if (parent == null) break;
            solutionDir = parent.FullName;
        }
        var editorConfigPath = Path.Combine(solutionDir, ".editorconfig");
        var editorConfigContent = File.ReadAllText(editorConfigPath);

        // Act & Assert
        editorConfigContent.Should().Contain("dotnet_diagnostic.CA5350.severity = error", 
            "Security analyzer CA5350 should be an error");
        editorConfigContent.Should().Contain("dotnet_diagnostic.CA5351.severity = error", 
            "Security analyzer CA5351 should be an error");
    }

    [Fact]
    public void EditorConfig_ShouldHavePerformanceAnalyzersAsErrors()
    {
        // Arrange
        // Find the repository root by looking for the solution file
        var currentDir = AppDomain.CurrentDomain.BaseDirectory;
        var solutionDir = currentDir;
        while (!File.Exists(Path.Combine(solutionDir, "L4H.sln")))
        {
            var parent = Directory.GetParent(solutionDir);
            if (parent == null) break;
            solutionDir = parent.FullName;
        }
        var editorConfigPath = Path.Combine(solutionDir, ".editorconfig");
        var editorConfigContent = File.ReadAllText(editorConfigPath);

        // Act & Assert
        editorConfigContent.Should().Contain("dotnet_diagnostic.CA1822.severity = error", 
            "Performance analyzer CA1822 should be an error");
        editorConfigContent.Should().Contain("dotnet_diagnostic.CA1829.severity = error", 
            "Performance analyzer CA1829 should be an error");
    }
}
