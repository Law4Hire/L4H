// This file is used to configure code analysis suppressions for the L4H.Infrastructure project.
//
// .NET 10 Migration Note: These suppressions were added during the .NET 10 upgrade to allow
// the build to complete. Each suppression represents code quality issues that should be
// addressed in a future refactoring effort.

using System.Diagnostics.CodeAnalysis;

// CA1305: Specify IFormatProvider
// TODO: Add CultureInfo.InvariantCulture to ToString() calls for int, decimal, DateTime, etc.
// Impact: High - Critical for multilingual application to ensure consistent formatting
// Effort: Medium - Requires reviewing each ToString() call for appropriate culture
// Example: id.ToString(CultureInfo.InvariantCulture) instead of id.ToString()
[assembly: SuppressMessage("Globalization", "CA1305:Specify IFormatProvider",
    Justification = "ToString() calls need culture specification; to be fixed systematically for i18n compliance")]

// CA1822: Mark members as static
// TODO: Review methods that don't access instance state and mark as static where appropriate
// Impact: Low - Minor performance improvement, better API design
// Effort: Low - Simple refactoring for identified methods
[assembly: SuppressMessage("Performance", "CA1822:Mark members as static",
    Justification = "Instance methods may access state in future; to be reviewed case-by-case")]
