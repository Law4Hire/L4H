// This file is used to configure code analysis suppressions for the L4H.UI.E2E.Tests project.

using System.Diagnostics.CodeAnalysis;

// CA1822: Mark members as static
// Test helper methods don't need to be static for readability and maintainability
[assembly: SuppressMessage("Performance", "CA1822:Mark members as static",
    Justification = "Test helper methods kept as instance methods for flexibility and readability")]
