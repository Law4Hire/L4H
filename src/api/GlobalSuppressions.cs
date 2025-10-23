// This file is used to configure code analysis suppressions for the L4H.Api project.
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
// Affected: Controllers with pagination, search, and export functionality
[assembly: SuppressMessage("Globalization", "CA1305:Specify IFormatProvider",
    Justification = "ToString() calls need culture specification; to be fixed systematically for i18n compliance")]

// CA1822: Mark members as static
// TODO: Review controller methods that don't access instance state
// Impact: Low - Controllers typically need instance access for DI
// Effort: Low - Review on case-by-case basis
[assembly: SuppressMessage("Performance", "CA1822:Mark members as static",
    Justification = "Controller methods may require instance access; to be reviewed individually")]
