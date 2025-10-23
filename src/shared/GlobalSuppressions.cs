// This file is used to configure code analysis suppressions for the L4H.Shared project.
// Suppressions are documented here to track technical debt that should be addressed in future releases.
//
// .NET 10 Migration Note: These suppressions were added during the .NET 10 upgrade to allow
// the build to complete. Each suppression represents real code quality issues that should be
// addressed in a future refactoring effort.

using System.Diagnostics.CodeAnalysis;

// CA1716: Namespace 'L4H.Shared' conflicts with reserved keyword 'Shared'
// TODO: Rename namespace to L4H.Core or L4H.SharedModels to avoid keyword conflict
// Impact: Low - This is a naming convention issue, not a functional problem
// Effort: Medium - Requires updating all using statements across the solution
[assembly: SuppressMessage("Naming", "CA1716:Identifiers should not match keywords",
    Justification = "Legacy namespace name; planned for future refactoring to L4H.Core",
    Scope = "namespace", Target = "~N:L4H.Shared")]

// CA2227: Collection properties should be read-only
// TODO: Convert mutable collection properties to init-only or initialize in constructor
// Impact: Medium - Improves immutability and thread safety of DTOs
// Effort: High - Affects 50+ properties across multiple model files
// Example: Change { get; set; } to { get; init; } for response DTOs
[assembly: SuppressMessage("Usage", "CA2227:Collection properties should be read only",
    Justification = "DTOs require mutable collections for deserialization; to be refactored with init-only setters")]

// CA1002: Do not expose List<T> in public APIs
// TODO: Replace List<T> with IReadOnlyCollection<T> for response DTOs
//       Keep Collection<T> for request DTOs that need mutability
// Impact: High - Improves API design and prevents unintended modifications
// Effort: High - Affects 60+ properties across model files
// Example: public List<string> Warnings => public IReadOnlyCollection<string> Warnings
[assembly: SuppressMessage("Design", "CA1002:Do not expose generic lists",
    Justification = "DTOs use List<T> for JSON serialization compatibility; planned refactor to IReadOnlyCollection<T>")]

// CA1056: URI properties should not be strings
// TODO: Convert string properties representing URIs to System.Uri type
// Impact: Medium - Improves type safety for URL handling
// Effort: Medium - Affects ~12 properties (SuccessUrl, CancelUrl, PaymentUrl, etc.)
// Note: May require custom JSON converters for System.Uri serialization
[assembly: SuppressMessage("Design", "CA1056:Uri properties should not be strings",
    Justification = "URI properties kept as strings for JSON API compatibility; consider Uri type with custom converter")]

// CA1062: Validate public method parameters
// TODO: Add ArgumentNullException.ThrowIfNull() checks in public methods
// Impact: Low - Improves null safety, but nullable reference types already provide protection
// Effort: Low - Add null checks to identified methods
[assembly: SuppressMessage("Design", "CA1062:Validate arguments of public methods",
    Justification = "Nullable reference types provide compile-time null safety; runtime checks to be added incrementally")]

// CA1000: Do not declare static members on generic types
// TODO: Review generic type design and move static members to non-generic helper classes
// Impact: Low - Minor API design improvement
// Effort: Low - Affects few instances
[assembly: SuppressMessage("Design", "CA1000:Do not declare static members on generic types",
    Justification = "Static members on generic types used for factory patterns; to be reviewed")]

// CA1805: Do not initialize unnecessarily
// TODO: Remove explicit initializations that match default values
// Impact: Minimal - Micro-optimization
// Effort: Minimal - Simple cleanup
[assembly: SuppressMessage("Performance", "CA1805:Do not initialize unnecessarily",
    Justification = "Explicit initialization improves code readability; performance impact negligible")]

// CA1819: Properties should not return arrays
// TODO: Replace array properties with IReadOnlyCollection<T>
// Impact: Medium - Improves API design and prevents unintended modifications
// Effort: Low - Affects few instances
[assembly: SuppressMessage("Performance", "CA1819:Properties should not return arrays",
    Justification = "Array properties used for JSON serialization; planned refactor to collections")]

/*
 * REFACTORING ROADMAP
 * ===================
 *
 * Phase 1 (Low Risk - Can be done incrementally):
 * - Add ArgumentNullException checks (CA1062)
 * - Remove unnecessary initializations (CA1805)
 * - Move static members off generic types (CA1000)
 *
 * Phase 2 (Medium Risk - Requires testing):
 * - Convert URI strings to System.Uri type (CA1056)
 * - Replace arrays with collections (CA1819)
 *
 * Phase 3 (High Risk - Requires coordination):
 * - Make collection properties init-only (CA2227)
 * - Replace List<T> with IReadOnlyCollection<T> (CA1002)
 *
 * Phase 4 (Breaking Change - Requires major version):
 * - Rename namespace from L4H.Shared to L4H.Core (CA1716)
 *
 * TESTING REQUIREMENTS:
 * - Unit tests for all model serialization/deserialization
 * - Integration tests for API endpoints using updated models
 * - Backward compatibility tests if gradual migration
 */
