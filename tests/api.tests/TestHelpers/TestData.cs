using System;

namespace L4H.Api.Tests
{
    /// <summary>
    /// Shared test constants for workflow lookup tests.
    /// </summary>
    public static class TestData
    {
        public static readonly int B2VisaTypeId = 2;
        
        // Generate unique IDs for each test run to avoid conflicts
        // These static properties are DEPRECATED and cause foreign key constraint violations
        // Use the GenerateUnique* methods instead
        [Obsolete("Use GenerateUniqueUserId() instead to avoid foreign key conflicts")]
        public static Guid TestUserId => GenerateUniqueUserId();
        
        [Obsolete("Use GenerateUniqueAdminUserId() instead to avoid foreign key conflicts")]
        public static Guid AdminUserId => GenerateUniqueAdminUserId();
        
        [Obsolete("Use GenerateUniqueWorkflowId() instead to avoid foreign key conflicts")]
        public static Guid PendingWorkflowId => GenerateUniqueWorkflowId();
        
        // Helper methods to generate unique IDs for specific test scenarios
        public static Guid GenerateUniqueUserId() => Guid.NewGuid();
        public static Guid GenerateUniqueAdminUserId() => Guid.NewGuid();
        public static Guid GenerateUniqueCaseId() => Guid.NewGuid();
        public static Guid GenerateUniqueWorkflowId() => Guid.NewGuid();
        public static Guid GenerateUniqueMessageId() => Guid.NewGuid();
    }
}
